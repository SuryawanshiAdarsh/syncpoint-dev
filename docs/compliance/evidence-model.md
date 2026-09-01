# Evidence Model

The complementary document is
[architecture/evidence-data-flow.md](../architecture/evidence-data-flow.md),
which describes the runtime flow. This one focuses on the **data shapes**
and the **product semantics** of evidence: what it is, what it maps to,
and how AI and humans interact with it.

## 1. What "evidence" means in this product

An **evidence artifact** is a single, immutable snapshot of a fact from a
specific source at a specific point in time. Examples:

- A CSV export of AWS IAM users produced by the AWS connector at `T`.
- A PDF of the quarterly access-review sign-off uploaded by a reviewer at `T`.
- The JSON response of GitHub's `/branches/main/protection` for a repository at `T`.

Evidence is always tied to:

- an **organization** (multi-tenant scope),
- a **source type** (`MANUAL_UPLOAD`, `GITHUB`, `AWS`, `JIRA`, `GOOGLE_WORKSPACE`),
- a **collection timestamp**,
- a **content hash** (sha256),
- a **storage location** in MinIO/S3.

Evidence is **not** interpreted at collection time. Interpretation happens
later via AI analysis and/or human review.

## 2. Entities

### `evidence` (parent record)

```
id              UUID          — server-generated
organization_id UUID          — tenant scope
name            VARCHAR(255)  — display name; derived from filename or connector
description     TEXT          — optional user-supplied
source_type     VARCHAR(32)   — MANUAL_UPLOAD | GITHUB | AWS | JIRA | GOOGLE_WORKSPACE
source_system   VARCHAR(64)   — free-form: "manual-upload", "github", etc.
status          VARCHAR(32)   — COLLECTED | UNDER_REVIEW | APPROVED | REJECTED | EXPIRED
collected_at    TIMESTAMPTZ
expires_at      TIMESTAMPTZ NULL
created_by      UUID NULL     — user id if human-uploaded
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

### `evidence_versions` (append-only content history)

```
id                UUID
evidence_id       UUID     — FK
organization_id   UUID     — denormalised for query-time isolation
version           INT      — 1, 2, 3, …
storage_key       VARCHAR  — organizations/{orgId}/evidence/{id}/{versionId}
content_hash      VARCHAR  — sha256 hex, 64 chars
size_bytes        BIGINT
mime_type         VARCHAR
collector_version VARCHAR  — e.g. "github-pat/1"
collected_at      TIMESTAMPTZ
```

Immutability rule: a new collection never overwrites an existing version;
it inserts a new row and puts a new object.

### `evidence_control_mappings`

```
id              UUID
organization_id UUID
evidence_id     UUID     — FK
control_id      UUID     — FK
mapping_type    VARCHAR  — AI_SUGGESTED | HUMAN_CONFIRMED | HUMAN_REJECTED
classification  VARCHAR  — COVERED | PARTIAL | INSUFFICIENT      (nullable)
confidence      NUMERIC(4,3) — 0.000..1.000                      (nullable)
reason          TEXT
created_by      UUID     — user id who confirmed (nullable for AI)
created_at      TIMESTAMPTZ
```

The composite of (`evidence_id`, `control_id`, `mapping_type`) is **not**
unique — a control can accumulate multiple AI suggestions plus multiple
human confirmations over time. The `ControlStatusResolver` treats the row
set as a whole when deriving the display status.

### `evidence_reviews`

```
id              UUID
organization_id UUID
evidence_id     UUID
reviewer_id     UUID
decision        VARCHAR  — APPROVED | REJECTED
comments        TEXT
reviewed_at     TIMESTAMPTZ
```

Reviews are append-only; a re-review inserts a new row and updates the
parent evidence status.

### `ai_analysis`

```
id              UUID
organization_id UUID
evidence_id     UUID
control_id      UUID
provider        VARCHAR   — e.g. "stub", "openai"
model           VARCHAR   — e.g. "stub-1", "gpt-4o-mini"
prompt_version  VARCHAR   — e.g. "evidence-mapping/v1"
classification  VARCHAR   — COVERED | PARTIAL | INSUFFICIENT (nullable)
confidence      NUMERIC(4,3)
reason          TEXT
result          JSONB     — full raw model payload
created_at      TIMESTAMPTZ
```

Every AI classification and every AI-suggested mapping is traceable to this
row: which model made it, on which prompt version, when. Auditors can ask
"which model classified this evidence" and get a stable answer.

## 3. Lifecycle states

```
                 upload  or  collector.collect()
                              │
                              ▼
                        ┌───────────┐
                        │ COLLECTED │
                        └───────────┘
                              │
                    POST /evidence/{id}/review
             (or automatic transition after mapping)
                              │
                     ┌────────┴────────┐
                     ▼                 ▼
              ┌───────────┐     ┌───────────┐
              │ APPROVED  │     │ REJECTED  │
              └───────────┘     └───────────┘

           at any time, expires_at past  →  EXPIRED (computed at read)
```

## 4. Freshness

Freshness is a computed state (not persisted):

- `CURRENT` — `expires_at` is null or > 30 days in the future.
- `EXPIRING` — `expires_at` within the next 30 days.
- `EXPIRED` — `expires_at` in the past.

Rationale: keeping this in code lets us tune the "expiring" window without
a migration and without a nightly job flipping rows.

Defaults set at creation:

- Manual upload: 365 days.
- Collector-produced evidence: 90 days (audit-relevant artifacts change fast).

## 5. Mapping semantics — the "trust ladder"

```
AI_SUGGESTED
      │  (a human decides)
      ├──▶ HUMAN_CONFIRMED   — counts toward the control's COVERED/PARTIAL
      └──▶ HUMAN_REJECTED    — recorded as evidence-against but does not credit
```

The status resolver treats:

- an `AI_SUGGESTED` alone → the control shows as `NEEDS_REVIEW`,
- a `HUMAN_CONFIRMED` with classification `COVERED` (and no rejection) →
  `COVERED`,
- anything else with at least one confirmed → `PARTIAL`,
- nothing at all → `MISSING`.

Rejected mappings are useful evidence trails ("we looked at this and it
didn't apply") — they're recorded, not deleted.

## 6. What evidence a real audit expects (informational)

For internal reference only, this table maps common evidence types to
controls in our demo catalogue. Reviewers still make the final call.

| Evidence type                                | Typical controls |
|----------------------------------------------|------------------|
| IdP MFA configuration + user enrolment list  | CC6.6            |
| Access-review sign-off (quarterly)           | CC6.3            |
| IAM user list + role assignments             | CC6.1, CC6.2     |
| GitHub branch-protection status              | CC8.1, CC8.2     |
| Pull request history with mandatory review   | CC8.1            |
| Encryption-at-rest configuration (KMS, S3)   | CC6.7, C1.1      |
| TLS configuration for public endpoints       | CC6.7            |
| Backup schedule + last successful restore    | A1.2             |
| Incident-response plan + past post-mortems   | CC7.2            |
| Vendor inventory + third-party attestations  | CC9.2            |

## 7. Audit-package export layout

Repeated here from `evidence-data-flow.md` for convenience:

```
soc2-evidence-package.zip
├── README.txt
├── index.csv                        # id, name, source, status, collected_at,
│                                    # mapped_controls (semicolon-separated),
│                                    # sha256
├── controls/
│   ├── CC6.1/
│   │   ├── evidence.json            # mappings, classifications, reasons,
│   │   │                            # confidence for this control
│   │   └── evidence-files/
│   │       └── <evidenceId>.<ext>   # exact bytes from MinIO
│   └── ...
└── audit-log.json
```

No secrets are ever included in an export.
