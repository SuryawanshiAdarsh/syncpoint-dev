# Evidence Data Flow

Maps to PROJECT_SPEC §12 (evidence lifecycle), §18 (object storage),
§22–24 (immutability, freshness, upload security), §25 (evidence storage),
§28 (mapping), §33 (audit package).

## 1. Data model

```
organizations
    ▲
    │
    ├── users
    │      ▲
    │      │
    │      └── organization_members (role)
    │
    ├── integrations
    │      ▲
    │      │
    │      └── collection_runs
    │             ▲
    │             │
    │             └── collection_items ──▶ evidence
    │
    ├── evidence  ◀── uploaded manually or created by a collection
    │      │
    │      ├── evidence_versions  (append-only)
    │      │
    │      ├── evidence_control_mappings ──▶ controls
    │      │
    │      └── evidence_reviews
    │
    ├── ai_analysis  ──▶ evidence, controls
    │
    ├── export_jobs
    │
    └── audit_events (append-only)

secret_records          — envelope-encrypted provider credentials
frameworks + controls   — SOC 2 demo seed
```

Every table carrying tenant data has an `organization_id` column with a
foreign key + index. The application `TenantContext` (see
`common/tenant/TenantContext.java`) requires every service call to know
the current org; every repository method used in service code filters by it.

## 2. Evidence lifecycle

```
SOURCE (manual upload OR provider collector)
    │
    ▼
COLLECTION       -> Evidence + first EvidenceVersion (v1)
    │
    ▼
NORMALIZATION    -> collector returns bytes + mime; backend computes sha256
    │
    ▼
STORAGE          -> MinIO put at organizations/{orgId}/evidence/{id}/{versionId}
    │
    ▼
CONTROL MAPPING  -> humans and/or the AI service create rows in
                    evidence_control_mappings
    │
    ▼
AI ANALYSIS      -> POST /evidence/{id}/analyze; result stored in ai_analysis
                    + an AI_SUGGESTED mapping row
    │
    ▼
HUMAN REVIEW     -> POST /evidence/{id}/review — Approved / Rejected
    │
    ▼
APPROVED / REJECTED
    │
    ▼
EXPORT           -> ZIP includes evidence.json + files
```

## 3. Immutability & versioning

Evidence rows themselves are treated as append-only for `name`, `sourceType`,
`sourceSystem`, and content. Mutations that are allowed:

- `status` transitions on review.
- `expires_at` if a scheduled re-collection extends freshness.
- `description` edits (audited).

New content re-collections **never overwrite** the previous bytes:
they append a new `evidence_versions` row and put a new object at a new
storage key. The current API always reads the latest version
(`findFirstByEvidenceIdOrderByVersionDesc`), but full history is queryable.

Each version records:

- `storage_key` (opaque, tenant-scoped),
- `content_hash` (sha256 hex),
- `size_bytes`,
- `mime_type`,
- `collector_version` (e.g. `github-pat/1`, `manual/1`),
- `collected_at`.

This is what makes an audit-package export defensible: every artifact has a
verifiable hash and provenance.

## 4. Freshness

Two columns on evidence: `collected_at` and `expires_at` (nullable).
Manual uploads default to a 365-day window; collector-produced evidence
defaults to 90 days.

The API doesn't persist a "freshness" enum; it computes one at read time:

- `CURRENT` — `expires_at IS NULL` or `expires_at` is > 30 days away.
- `EXPIRING` — `expires_at` is within the next 30 days.
- `EXPIRED` — `expires_at` is in the past.

This lets us adjust the threshold in code without a migration and without
falsely showing stale UI while a nightly job runs.

## 5. Upload security (V2 §24)

Enforced in `EvidenceService.upload`:

- **Max size**: 50 MB per file (Spring `spring.servlet.multipart.max-file-size`).
- **Allowed extensions**: `pdf`, `csv`, `json`, `txt`, `docx`, `xlsx`.
- **MIME allowlist**: matching the above; `application/octet-stream` is
  tolerated and the correct MIME is inferred from the extension.
- **Filename never becomes a path**: storage keys are `organizations/{orgId}/
  evidence/{evidenceId}/{versionId}` — server-generated UUIDs only. The
  user's filename is only stored as evidence display name.
- **No executables**: `.exe`, `.sh`, etc. are rejected via the extension
  allowlist.
- **Malware scanning hook**: not yet implemented; the extension allowlist
  is the current safeguard.

## 6. Mapping semantics

The `evidence_control_mappings` table joins evidence to controls (many-to-many)
and remembers who / what created each mapping:

```
mapping_type ∈ { AI_SUGGESTED, HUMAN_CONFIRMED, HUMAN_REJECTED }
classification ∈ { COVERED, PARTIAL, INSUFFICIENT }  (nullable)
confidence     ∈ [0.0, 1.0]                           (nullable)
```

Note: `classification` uses the AI-service allowlist. It intentionally does
**not** include `COMPLIANT` — the product never says a customer is compliant.

The `ControlStatusResolver` derives the per-org, per-control display status
from mappings at query time (no denormalised column):

- Only `AI_SUGGESTED` mappings → `NEEDS_REVIEW`.
- Any `HUMAN_CONFIRMED` with `classification=COVERED` and no rejected
  mapping → `COVERED`.
- Otherwise, mix of confirmed / partial / rejected → `PARTIAL`.
- No mappings at all → `MISSING`.

## 7. Reviews

`POST /evidence/{id}/review` inserts an `evidence_reviews` row with the
reviewer id, decision (`APPROVED` / `REJECTED`), and comments, and updates
the parent evidence's `status` accordingly. Reviews are append-only —
"changing your mind" creates a new review.

## 8. Object storage layout

Under the single `evidence` bucket:

```
organizations/
    {organizationId}/
        evidence/
            {evidenceId}/
                {versionId1}         # binary payload for version 1
                {versionId2}         # binary payload for version 2
                ...
        exports/
            {exportJobId}.zip
```

Keys are UUIDs, never user input. This is what allows tenant isolation
inside a single object store; a mis-scoped call would fail because the
service always prefixes with `organizations/{orgId}/…` from `TenantContext`.

## 9. Audit-package export layout (V2 §63)

An export job creates the ZIP synchronously inside a `@Async` worker:

```
soc2-evidence-package.zip
├── README.txt                  # what this package is / disclaimer
├── index.csv                   # one row per evidence: id, name, source,
│                               # status, collected_at, mapped controls, hash
├── controls/
│   ├── CC6.1/
│   │   ├── evidence.json       # mappings + classifications for this control
│   │   └── evidence-files/
│   │       ├── <evidenceId>.pdf
│   │       └── <evidenceId>.json
│   └── ...
└── audit-log.json              # placeholder for audit event summary
```

Nothing in the ZIP contains a secret. Evidence file bytes are the same bytes
that MinIO holds; sha256 hashes are included so recipients can verify.

## 10. Retention

MVP does not delete evidence unless the user explicitly hits
`DELETE /api/v1/evidence/{id}`. Deletes cascade: mappings and reviews are
removed by foreign-key `ON DELETE CASCADE`, and the MinIO objects for every
version are best-effort deleted (a failed MinIO delete does not roll back
the DB delete).

Audit events for the delete flow are recorded regardless.
