# Syncpoint Compliance — Product Guide

> A ground-up explanation of what this product is, what SOC 2 is, and how the two fit together.
> Intended for anyone — even someone who has never heard the phrase "compliance audit" before.

## 1. Before we start: what is SOC 2?

SOC 2 is a **report a customer asks a vendor for** before they trust that vendor with their data.

Imagine you run a small business and you're about to sign a contract with a software company that will store your customers' names, emails, and payment history. Before you sign, you want proof that the software company:

- Doesn't let random employees browse your data.
- Knows exactly who has access to what.
- Has backups if the servers catch fire.
- Detects hackers before they get in.
- Has a written plan for what to do when things go wrong.

You could try to inspect all of that yourself — but you're not a security auditor and you don't have time. So instead you say: **"Show me your SOC 2 report."**

A SOC 2 report is a document — usually 40–80 pages — produced by an **independent auditor** (a licensed CPA firm) that answers the question:

> *"For the past 6–12 months, did this company operate the security controls they claim to operate?"*

That's it. It doesn't say the company is "safe." It doesn't say they can't be hacked. It says: *they told us they do these things, we checked, and they were doing them during the period we looked.*

### 1.1 The "controls" you keep hearing about

A **control** is a rule the company follows to reduce risk. Examples:

| Control (plain English) | SOC 2 code |
|---|---|
| Every employee logs in with a password AND a second factor (like a phone code) | CC6.6 |
| Every 3 months we review who has access to production and revoke anyone who doesn't need it | CC6.3 |
| We back up the database every night and test the backup by restoring it every quarter | A1.2 |
| Every code change goes through a peer review before it deploys | CC8.1 |
| We have an incident response playbook and we practice it | CC7.2 |

There are 15 such controls in a typical starter SOC 2 scope. Some frameworks have 60+. To pass the audit, the company must **collect evidence** proving they follow each control.

### 1.2 What "evidence" actually looks like

Evidence is anything that lets the auditor say "yes, they really do this." Real examples:

- A screenshot of the AWS IAM console showing MFA is required for all users
- A CSV export of a quarterly access review, signed by the security lead
- A GitHub repository setting showing branch protection is enabled on the main branch
- An HR onboarding checklist showing new hires' accounts are provisioned within a documented process
- A Jira ticket showing a production change went through a change-approval workflow

The auditor will typically request 3–10 pieces of evidence per control. For a starter SOC 2 scope that's **150–500 artifacts** the company has to gather.

### 1.3 Why this is painful without a product

Traditionally, a company preparing for SOC 2 spends 3–6 months on this. The security lead:

1. Reads the framework, decides which controls apply.
2. Sends Slack messages to engineers: "can you send me a screenshot of the branch protection settings?"
3. Downloads AWS console screenshots into a Google Drive folder.
4. Manually reviews each artifact and writes a paragraph explaining how it maps to a control.
5. Reviews the whole pile monthly to make sure evidence hasn't gone stale.
6. Zips everything into a "SOC 2 evidence package" for the auditor.
7. Discovers 3 weeks before the audit that half the evidence is outdated and starts over.

Every one of those steps is a candidate for automation. **That is what Syncpoint does.**

## 2. What Syncpoint is

Syncpoint is a **multi-tenant SaaS** that automates SOC 2 evidence collection, mapping, review, and audit-package export.

The mental model is a pipeline:

```
CONNECT SYSTEMS    →    COLLECT EVIDENCE    →    MAP EVIDENCE    →    REVIEW    →    EXPORT
   (GitHub,             (auto every day,          (AI suggests           (human      (ZIP file
    AWS, Jira,           versioned,                which control          confirms     ready for
    manual              hashed, stored             each artifact          or           the auditor)
    upload)             immutably)                supports)              rejects)
```

Each stage is described in detail below. Everything in Syncpoint exists to move an artifact one step further down this pipeline.

## 3. The people who use Syncpoint

Syncpoint models three real jobs. Every screen and every permission is designed around them.

### 3.1 The Owner (usually the CTO, VP Engineering, or Security Lead)

**Who they are**: the person who signed the contract and is on the hook for the audit passing. Usually the most senior technical person in a 20–100-person company.

**What they do in Syncpoint**:
- Sign up and create the organization (they become OWNER automatically).
- Choose the framework (SOC 2 is the MVP scope).
- **Connect integrations**: paste a GitHub token, configure an AWS role, complete a Jira OAuth flow.
- Trigger evidence collection.
- Delegate day-to-day work to Admin or Reviewer users.
- Request the audit-package export when it's time to send everything to the CPA firm.
- Change roles, add or remove members, and — if things go wrong — delete the tenant.

**What they see**: everything. All controls, all evidence, the dashboard, all integrations, all audit events.

### 3.2 The Admin (a delegated engineer or IT lead)

**Who they are**: a trusted lieutenant. Same operational reach as OWNER but no authority over the tenant itself.

**What they do**: exactly what an OWNER does day-to-day (upload evidence, run collections, export audit packages) **except**:

- Cannot change other members' roles.
- Cannot promote another user to OWNER.
- Cannot delete the organization.

**Why the split exists**: in real companies the CTO signs up but delegates operations to a security engineer. The engineer needs to be able to *do* things without being able to *give away the account*.

### 3.3 The Reviewer (the human in the loop)

**Who they are**: the compliance-savvy person who judges whether evidence is genuinely sufficient. Often a fractional CISO, an external security consultant, or an internal auditor.

**What they do**:
- Look at each piece of evidence.
- Look at the AI's suggested classification ("this evidence PARTIALLY covers CC6.1 because it shows current access but no periodic review").
- Look at the retrieved SOC 2 knowledge citations the AI used to reach that conclusion.
- **Confirm** or **reject** the AI's suggestion, with a comment.

**What they cannot do**: upload evidence, connect systems, or export the audit package. This is a *deliberate* separation of duties — the person judging whether evidence is sufficient should not also be the person who produced it. That's how audits work.

### 3.4 The Viewer (planned)

Reserved for a future read-only role — for example, giving a board member or investor a login that can see coverage without any write access. Not fully wired in the MVP.

### 3.5 The AI (not a user, but a participant)

The AI service is not a user. It is a **helpful assistant** that:

- Reads a piece of evidence and a control description.
- Retrieves relevant SOC 2 compliance guidance from a knowledge base.
- Proposes a classification: *COVERED*, *PARTIAL*, or *INSUFFICIENT*.
- Explains its reasoning and cites sources.
- **Never makes final decisions**. Its output is always tagged as `AI_SUGGESTED` and must be approved by a human reviewer.

By design, the AI can never:
- Say "your company is SOC 2 compliant" (guardrail rejects that phrase).
- Say "certified" or "fully compliant."
- Invent evidence.
- Follow instructions hidden inside evidence documents (prompt-injection defense).

## 4. The end-to-end workflow, step by step

This is the whole product, from a company signing up to sending their auditor a ZIP file.

### Step 0 — The starting point

ACME Technologies, a 40-person SaaS company, has a customer asking for their SOC 2 report. They've never done an audit before. Their CTO opens Syncpoint.

### Step 1 — Sign up

The CTO clicks **Register**, enters:
- Their email
- A password
- Their name
- Their organization name ("ACME Technologies")

The backend:
1. Creates a User with a BCrypt-hashed password (cost 12).
2. Creates an Organization with a unique slug.
3. Creates an OrganizationMember linking the two with role `OWNER`.
4. Emits an `USER_CREATED` audit event.
5. Issues an access token (JWT, 15-minute lifetime) + refresh token (7-day lifetime).

The CTO is now logged in as the OWNER of a fresh tenant. Nothing else exists yet.

### Step 2 — Onboarding wizard

The CTO lands on `/onboarding` and steps through:

1. **Framework selection** → SOC 2 is chosen. The system seeds 15 controls for that framework, all with status `MISSING`.
2. **Integration connection** → the CTO connects at least one system:
   - **GitHub**: paste a Personal Access Token (MVP), or in future do the OAuth flow.
   - **AWS**: paste a Role ARN and External ID; the system will assume the role to read.
   - **Jira**: complete the OAuth handshake and pick which project holds change tickets.
   - **Manual upload**: skip integrations entirely if the CTO prefers to upload PDFs.
3. **Test connection** → the system calls the provider's API to confirm the credential works. On success, the integration's status becomes `CONNECTED`.
4. **First collection** → the system runs a collection immediately so the dashboard isn't empty on first login.

Each of these steps is a small screen. Onboarding is one-time; once complete, subsequent logins go straight to `/dashboard`.

### Step 3 — Evidence collection

There are three paths for evidence to enter the system.

#### Path A — Automatic, from an integration

The backend has a plug-in system called `EvidenceCollector`. Each provider (GitHub, AWS, Jira) implements this interface. When a collection is triggered:

1. The `IntegrationService` looks up the integration and its stored (envelope-encrypted) credential.
2. The `CollectorRegistry` finds the matching collector class.
3. The collector runs in a background thread (`@Async` on a bounded thread pool).
4. Each artifact returned is:
   - Given a SHA-256 hash of its content.
   - Written to MinIO/S3 under a tenant-scoped key: `organizations/{orgId}/evidence/{evidenceId}/{versionId}`.
   - Recorded in the `evidence` table with metadata.
   - A new row in `evidence_versions` — because evidence is immutable (see §6.3).
5. Each artifact also produces a `collection_items` row so the run's success/failure per artifact is visible.

Example: the GitHub collector fetches the authenticated user's identity, the repository inventory, and the branch protection settings for each default branch. That produces 3+ evidence artifacts per collection run.

#### Path B — Manual upload

The Owner or Admin drops a PDF, CSV, JSON, or DOCX file into the Evidence page. The `EvidenceService`:

1. Validates the MIME type against an allow-list.
2. Rejects files over 50 MB.
3. Runs a malware scan (M10 will make this real; in MVP it's a no-op).
4. Computes SHA-256.
5. Stores the bytes in MinIO.
6. Creates the same `evidence` + `evidence_versions` records as the automatic path.

Once uploaded, manual evidence is indistinguishable from automatic evidence downstream.

#### Path C — Scheduled collection (M8)

The Owner can set an integration's schedule to `DAILY` or `WEEKLY`. A cron job scans due integrations and dispatches collections through the same `IntegrationService.triggerCollection(...)` path. Evidence collected this way updates the *version* on existing artifacts, so history is preserved (the old version becomes v1, the new one v2).

### Step 4 — Mapping evidence to controls

Now there are 20+ artifacts in the system. Which one supports which control? Two paths.

#### Path A — Human mapping

The Owner opens an evidence artifact, sees "Which control does this support?", picks CC6.3 from a dropdown, clicks Confirm. That creates an `evidence_control_mappings` row with:

- `mapping_type = HUMAN_CONFIRMED`
- `classification = COVERED`
- `created_by = <owner's userId>`

The control's dashboard status immediately updates to reflect the new mapping.

#### Path B — AI-suggested mapping

The Owner clicks "AI analyze" on an artifact. The backend:

1. Reads the evidence bytes from MinIO.
2. Extracts a preview (text or first N bytes).
3. Sends `evidence + control` to the AI service.
4. **AI service runs RAG (M5)**:
   - Builds a retrieval query from the control code, description, evidence name, and preview.
   - Searches Qdrant (or the in-memory fallback) for the top-5 most relevant SOC 2 knowledge chunks.
   - Constructs a strict-format prompt with 4 sections: SYSTEM INSTRUCTIONS / CONTROL / EVIDENCE / RETRIEVED CONTEXT.
   - Calls the LLM (stub in MVP, real OpenAI provider available).
   - Validates the JSON response against a Pydantic schema that rejects phrases like "SOC 2 compliant."
5. Response comes back with `classification` (COVERED / PARTIAL / INSUFFICIENT), `confidence` (0–1), `reason`, `supported_requirements`, `missing_requirements`, `recommended_action`, and `sources` (which knowledge chunks it cited).
6. The backend persists an `ai_analysis` row **and** creates an `evidence_control_mappings` row with `mapping_type = AI_SUGGESTED`.

An AI-suggested mapping is *not* final. It shows up on the dashboard as `NEEDS_REVIEW`.

### Step 5 — Human review

The Reviewer logs in and sees a "Needs Review" queue. For each item they can:

- Read the evidence (download it or preview it).
- Read the control description.
- Read the AI's reasoning.
- Read the retrieved SOC 2 sources the AI cited (transparency).
- **Confirm** the AI's suggestion → the mapping's type flips to `HUMAN_CONFIRMED`, and the control's status updates.
- **Reject** with a comment → the mapping is removed, the control stays MISSING, and the artifact goes back to the "unmapped" pile.

The reviewer also creates an `evidence_reviews` row recording their decision, comments, and timestamp. Every decision emits an `EVIDENCE_REVIEWED` audit event.

### Step 6 — The dashboard

At any point the Owner or Admin opens the dashboard and sees:

```
SOC 2 EVIDENCE READINESS

Coverage
27 %

Controls
  COVERED         4
  NEEDS_REVIEW    4     ← human action needed
  MISSING         7
  PARTIAL         0

Evidence
  9 artifacts collected
  1 GitHub integration connected

Recent activity
  1 hour ago  · Collection run completed (3 artifacts)
  3 days ago  · CC6.3 covered by Q1-2026 Access Review
  5 days ago  · CC6.6 covered by Okta MFA Enforcement Policy
```

The coverage percentage is calculated **deterministically** (not by the LLM):

```
coverage = (covered + 0.5 * partial) / total_controls * 100
```

This is a documented formula, not a black box. An auditor could recompute it by hand.

### Step 7 — The audit-package export

When the CTO is ready to send the auditor the artifacts, they click **Export Audit Package**. The backend:

1. Creates an `export_jobs` row with status `QUEUED`.
2. Returns immediately with a job ID.
3. In the background:
   - Iterates every control.
   - For each control, gathers all approved mappings and their evidence versions.
   - Streams a ZIP file to MinIO with this structure:

```
soc2-evidence-package/
├── README.txt                      # summary + coverage percentage
├── index.csv                       # every artifact indexed by control
├── controls/
│   ├── CC6.1/
│   │   ├── evidence.json           # metadata + AI reasoning + reviewer decisions
│   │   └── evidence-files/         # the raw bytes
│   │       └── ...
│   ├── CC6.3/
│   │   └── ...
│   └── (one folder per control that has evidence)
└── audit-log.json                  # every relevant audit event
```

4. When done, the job status flips to `COMPLETED` and a signed download URL is available for the Owner or Admin.

The auditor unzips the file, reads `README.txt`, and starts sampling controls. Nothing in the package contains Syncpoint credentials, master keys, or any customer-supplied secret — only compliance-relevant artifacts.

### Step 8 — Ongoing maintenance

Compliance is not a one-time event. After the first audit:

- Scheduled collections keep pulling fresh evidence weekly.
- Evidence freshness is tracked: `CURRENT`, `EXPIRING`, `EXPIRED` based on `collected_at` and `expires_at`.
- The dashboard shows expiring evidence in a "attention needed" panel.
- The customer runs another audit in 12 months and re-uses the same tenant.

## 5. Features in depth

### 5.1 Multi-tenant isolation

Every organization is its own world. A user in ACME can never see or modify a user, integration, evidence, or control mapping in another organization.

How it's enforced:

1. Every JWT contains the user's `orgId`, `userId`, and `role`.
2. On every request, a filter validates the JWT and sets a thread-local `TenantContext`.
3. Every service call reads `TenantContext.require().organizationId()` and includes it in the database query.
4. There is no code path anywhere that reads or writes a tenant-owned row without an `organizationId` filter.

Cross-tenant access attempts return `404 NOT_FOUND` (deliberately — 403 would leak the existence of the resource).

### 5.2 Secure credential storage

Integration credentials (GitHub PAT, AWS role config, Jira OAuth token, LLM API key) never live in plaintext. When the Owner pastes a token:

1. It's encrypted with a per-record AES-256-GCM key ("data encryption key" or DEK).
2. The DEK is itself encrypted with a master key held only in memory.
3. The wrapped ciphertext is stored in `secret_records`.
4. The `integrations` table stores only a UUID reference to that secret.

The master key is loaded from `SECRET_STORE_MASTER_KEY` (base64 of 32 random bytes) at startup. In dev, if it's missing, an ephemeral in-memory key is generated with a loud warning — production must set a real one, otherwise stored secrets don't survive a restart.

### 5.3 Immutable, versioned evidence

Evidence is never overwritten. When a new collection produces the same artifact:

- A new row appears in `evidence_versions` with an incremented `version`.
- The old version's `storage_key` is preserved in MinIO.
- The parent `evidence` row's `latest_version` field advances.
- The old version can still be linked in the audit-package export for auditor traceability.

Every version stores a SHA-256 hash so tampering is detectable, and the `collector_version` field records exactly which code produced it (e.g. `github/1`).

### 5.4 Audit log

Fifteen event types are recorded to the `audit_events` table:

```
LOGIN, LOGOUT, USER_CREATED, USER_ROLE_CHANGED,
INTEGRATION_CREATED, INTEGRATION_CONNECTED, INTEGRATION_TESTED, INTEGRATION_DISCONNECTED,
COLLECTION_STARTED, COLLECTION_COMPLETED, COLLECTION_FAILED,
EVIDENCE_CREATED, EVIDENCE_REVIEWED, EVIDENCE_MAPPED,
AI_ANALYSIS_CREATED, EXPORT_CREATED
```

Each event stores:
- The tenant.
- Who did it (`actor_user_id`).
- Which resource it acted on (`entity_type`, `entity_id`).
- Safe metadata (never secrets, never raw evidence).
- A timestamp.

The audit log is what proves to a future auditor that Syncpoint itself operated correctly during the evidence-collection period. It also feeds `audit-log.json` in the exported ZIP.

### 5.5 AI safety guardrails

Because the AI service touches evidence and produces text that reviewers rely on, it's held to specific rules:

- Every response is validated against a Pydantic schema. Extra fields are rejected. Missing fields fail the request with 422.
- Any classification value outside `COVERED / PARTIAL / INSUFFICIENT` is rejected. The AI cannot claim "COMPLIANT" or "CERTIFIED".
- The reason text is scanned for phrases like "SOC 2 compliant" or "fully compliant" — presence of any of them fails the response.
- Retrieved knowledge from Qdrant is inserted into a labeled "RETRIEVED CONTEXT (untrusted)" section of the prompt so the LLM knows not to follow instructions inside it.
- Evidence content is similarly labeled as untrusted; the model is instructed to ignore any commands embedded in documents.
- The prompt has a version tag (`evidence-mapping/v1`) so every stored analysis records exactly which prompt produced it. A future prompt change creates `v2`.

### 5.6 RAG (retrieval-augmented generation)

An LLM alone doesn't know your specific SOC 2 knowledge base. RAG solves this:

1. At startup (M4), the AI service ingests a corpus of SOC 2 guidance documents — split into chunks, embedded, stored in Qdrant.
2. When an analysis is requested, the same embedding model turns the query into a vector.
3. Qdrant returns the top-K most similar chunks with their metadata (document name, section, page).
4. Those chunks feed the LLM as context.
5. The LLM's response includes `sources[]` pointing back at the chunks it used.
6. The Control Detail UI shows those sources so a Reviewer can double-check the AI's reasoning against the actual guidance.

This is what makes the difference between "an AI guessing" and "an AI reasoning from citable sources."

### 5.7 Provider abstraction

Every external dependency has a clean interface:

- `EvidenceCollector` — GitHub, AWS, Jira, (future) Google Workspace.
- `LLMProvider` — Stub, OpenAI, (future) Azure OpenAI / local models.
- `EmbeddingProvider` — Stub, OpenAI, (future) local models.
- `VectorStore` — Qdrant, InMemory (fallback for offline / demo).
- `SecretStore` — Envelope-encrypted local (MVP), (future) AWS KMS.
- `ObjectStorageService` — MinIO (dev), Amazon S3 (production drop-in).
- `MalwareScanner` — No-op (dev), ClamAV or similar (M10).

Swapping any of these is a config change plus a new class. Business logic doesn't move.

## 6. Non-negotiable guarantees

Some things Syncpoint promises to *always* do. If these were violated, the product would lose its value.

### 6.1 Never claim compliance

Syncpoint does not certify anyone. It does not say "you passed" or "you are compliant." The output is always "here is your evidence, here is what our AI thinks, here is the human review." The audit conclusion belongs to the CPA firm — not to us, not to our AI.

### 6.2 Human is always final

Every AI-produced mapping is `AI_SUGGESTED` until a human confirms it. There is no autonomous path from evidence → covered control. This is intentional and irreversible: making the AI final would make the product a liability magnet.

### 6.3 Evidence is immutable

Once collected, evidence bytes are never overwritten or deleted (during normal operation). Deleting evidence requires an explicit user action and is audit-logged. This matters because auditors need to trust that the artifact they see is the artifact that was collected at that timestamp.

### 6.4 Tenant isolation is absolute

There is no code path that reads or modifies tenant data without checking the tenant id. Cross-tenant tests are a required part of every PR.

### 6.5 Secrets never enter the audit package

The export ZIP contains compliance evidence. It does not contain credentials, master keys, tokens, or anything Syncpoint holds on the customer's behalf. Verifying this is part of the E2E test suite.

## 7. What the customer gets — outcomes

Concrete outcomes a customer can point to after using Syncpoint:

| Before Syncpoint | After Syncpoint |
|---|---|
| 3–6 months of manual work | 2–3 weeks to first coverage report |
| Screenshots in a Google Drive folder | Immutable, hashed, versioned evidence in encrypted storage |
| Slack messages asking for evidence | Automated weekly collection from GitHub / AWS / Jira |
| A junior engineer guessing which artifact maps to which control | AI-suggested mappings with cited sources, reviewed by a human |
| "I hope the auditor accepts this" | A ZIP file structured exactly the way auditors expect |
| No visibility into evidence age | Freshness tracking with expiring-soon alerts |
| No audit trail of who did what | Every action recorded in a signed audit log |
| Re-doing everything before the next audit | Continuous evidence collection; the next audit is incremental |

## 8. Where Syncpoint's job ends

Being honest about limits is part of the product.

- Syncpoint does **not** replace the CPA firm. You still hire a licensed auditor. Syncpoint makes their job (and yours) 10× easier.
- Syncpoint does **not** run the audit itself. It gathers and packages evidence; the auditor still samples, verifies, and writes the report.
- Syncpoint does **not** guarantee you'll pass. If your company doesn't actually have MFA on production, no amount of evidence collection will show that you do.
- Syncpoint is **not** yet certified against SOC 2 itself. That is on the roadmap; MVP scope is the customer's audit, not our own.
- The MVP covers **SOC 2** only. ISO 27001, HIPAA, PCI-DSS, and GDPR are future scope. The `Framework` model is designed to support them — the missing piece is the actual control mappings for each.

## 9. Delivery model — how you run Syncpoint

Two shapes for the same product.

### 9.1 The three-image stack

Recommended for pilot deployments and cloud hosting:

```
   ┌──────────┐   ┌──────────┐   ┌──────────┐
   │ frontend │   │ backend  │   │    ai    │
   └─────┬────┘   └─────┬────┘   └─────┬────┘
         │              │              │
         └──── shared network ─────────┘
              (postgres, redis, qdrant, minio)
```

Uses `deploy/docker-compose.hub.yml`. Anyone with Docker Desktop can `docker compose up -d` and be running in 2 minutes.

### 9.2 The all-in-one appliance

Recommended for on-prem, air-gapped, USB-stick delivery, or single-VM pilots:

```
   ┌────────────────────────────────────────────┐
   │  syncpoint-appliance (one container)       │
   │                                            │
   │  s6-overlay supervises:                    │
   │  ├─ postgres                               │
   │  ├─ minio + minio-init                     │
   │  ├─ ai-service                             │
   │  ├─ backend                                │
   │  └─ nginx (only :4200 exposed to host)     │
   │                                            │
   │  volume: /var/lib/syncpoint                │
   └────────────────────────────────────────────┘
```

Uses `Dockerfile.appliance`. A single `docker run` with one volume mount is all that's needed. About 1.45 GB uncompressed; requires ~1 GB of RAM at rest.

## 10. Glossary

- **Artifact / Evidence artifact** — one file or one exported document that supports a control.
- **BCrypt** — password hashing algorithm; Syncpoint uses cost 12.
- **Classification** — the AI's judgement about how well an artifact covers a control: COVERED, PARTIAL, or INSUFFICIENT.
- **Control** — a rule the company follows to reduce risk (e.g. "MFA required for all users").
- **Coverage** — the deterministic percentage: `(covered + 0.5 * partial) / total_controls`.
- **Evidence version** — an immutable snapshot of an artifact at a point in time.
- **Framework** — the compliance standard being followed (e.g. SOC 2, ISO 27001).
- **Integration** — a connection to an external system (GitHub, AWS, Jira) from which evidence is collected.
- **JWT** — the signed token that authenticates a user's request. Access tokens live 15 min; refresh tokens live 7 days.
- **Mapping** — a link between an evidence artifact and a control, tagged as `AI_SUGGESTED` or `HUMAN_CONFIRMED`.
- **MDC** — Mapped Diagnostic Context. Populates logs with `requestId`, `orgId`, `userId` for tracing.
- **MFA** — Multi-Factor Authentication (password + second factor like a phone code).
- **OWNER / ADMIN / REVIEWER / VIEWER** — the four roles. See §3.
- **RAG** — Retrieval-Augmented Generation. Feeds an LLM with relevant chunks retrieved from a vector database.
- **SOC 2** — The audit standard from AICPA covering security, availability, processing integrity, confidentiality, and privacy.
- **Tenant / Organization** — one customer's private space. Every artifact, integration, and user belongs to exactly one tenant.
- **Trust services criteria** — the five categories a SOC 2 audit covers: Security (mandatory), Availability, Processing Integrity, Confidentiality, Privacy.

## 11. What to read next

- [README.md](README.md) — 2-minute quickstart.
- [dev-guide/ARCHITECTURE.md](dev-guide/ARCHITECTURE.md) — how the code is organized.
- [dev-guide/MVP-COMPLETION-PLAN.md](dev-guide/MVP-COMPLETION-PLAN.md) — remaining milestones M1 → M10.
- [PROJECT_SPEC3.md](PROJECT_SPEC3.md) — MVP-completion source of truth.
- [docs/compliance/soc2-controls.md](docs/compliance/soc2-controls.md) — the 15 seeded controls in detail.

---

*This document describes intent as much as current state. Some capabilities described here (real LLM provider, real RAG ingestion, GitHub OAuth, AWS collector, Jira collector, scheduled collection, malware scanning) are on the M1–M10 roadmap. The MVP core — signup, evidence upload, evidence mapping, human review, dashboard, audit-package export, AI-assisted analysis via the stub provider — is fully working today.*
