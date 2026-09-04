# Syncpoint MVP Completion Plan (M1 → M10)

> Source of truth: [PROJECT_SPEC3.md](../PROJECT_SPEC3.md).
> This document tracks the remaining work to turn the existing MVP into the pilot-ready system described in that spec.
> Related: [BUILD-PLAN.md](BUILD-PLAN.md), [STATUS.md](STATUS.md), [FRONTEND-ARCHITECTURE.md](FRONTEND-ARCHITECTURE.md).

---

## 0. Snapshot of what is already done

> Updated 2026-09-04. Also shipped since the table below was first written: **M1 (onboarding
> gate)**, **M8 (scheduled collection)** — both pulled forward out of order, see §1 — plus a
> Platform Admin Console and subscription request/approve/reject/revoke workflow, password
> reset/email verification/invite-by-email, evidence versioning, an audit log viewer, and
> coverage-trend snapshots. None of these are in the original M1–M10 scope except M1/M8.

| Area | State |
|---|---|
| Docker Compose (7 services) | ✅ Complete — postgres, redis, qdrant, minio, backend, ai-service, frontend all healthy |
| Auth + JWT + rate limit | ✅ Complete |
| Password reset + email verification + invite-by-email | ✅ Complete (`auth_tokens` table, V18, local Mailpit) |
| Multi-tenant orgs + RBAC + audit events (15+ types) | ✅ Complete |
| Onboarding gate (persisted flag + route guard) | ✅ Complete — this is **M1**, see §3 |
| Evidence upload + MinIO + SHA-256 + versioning + freshness | ✅ Complete |
| SOC 2 controls + demo seed (15 controls, 60 evidence) | ✅ Complete |
| Evidence → control mapping + human review (Confirm/Reject) | ✅ Complete |
| Audit package export (ZIP with README/index/controls/audit-log) | ✅ Complete |
| Audit log viewer + activity dashboard | ✅ Complete |
| Coverage-trend snapshots + chart | ✅ Complete |
| Scheduled collection (DAILY/WEEKLY sweep) | ✅ Complete — this is **M8**, see §3 |
| Organization Settings page (General/Members/Automation) | ✅ Complete |
| Platform Admin Console (cross-tenant) | ✅ Complete — **not in original spec** |
| Subscription request/approve/reject/revoke workflow | ✅ Complete — **not in original spec** |
| AI service abstraction (`LLMProvider`, `EmbeddingProvider`, `VectorStore`) | ✅ Complete |
| Stub LLM + Stub embeddings + Qdrant with in-memory fallback | ✅ Complete |
| Demo RAG corpus + `/rag/query` with citations | ✅ Complete |
| GitHub PAT collector (real API calls) | ✅ Complete |
| Envelope-encrypted secret store (AES-256-GCM) | ✅ Complete |
| Angular shell + dashboard + evidence + controls + integrations + ask AI + export + onboarding + settings + activity + audit-log + admin UI | ✅ Complete |
| Published to Docker Hub as `adarshs1612/syncpoint-*:0.7.0` | ✅ Complete |

## 1. Gap matrix against PROJECT_SPEC3.md

| # | Requirement | Status | Milestone |
|---|---|---|---|
| P1 | Real LLM provider | 🟡 Partial (skeleton only) | **M2** |
| P2 | Real embeddings | 🟡 Partial | **M3** |
| P3 | Real RAG ingestion (PDF/TXT/DOCX + `/rag/ingest`) | 🔴 Missing | **M4** |
| P4 | RAG connected to evidence analysis | 🔴 Missing | **M5** |
| P5 | GitHub OAuth / App | 🟡 Partial (PAT only) | **M6** |
| P6 | AWS cross-account IAM Role + collector | 🔴 Missing | **M7** |
| P7 | Scheduled collection (DAILY / WEEKLY) | ✅ **Complete** (shipped 2026-09-04, pulled forward) | **M8** |
| P8 | Jira OAuth + collector | 🔴 Missing | **M9** |
| P9 | Customer onboarding state (persistent flag + gate) | ✅ **Complete** (shipped 2026-09-03, pulled forward) | **M1** |
| P10 | Security hardening (malware scanner, secrets audit) | 🟡 Partial — also see BUG-009 (refresh-token revocation), BUG-010 (breached-password check) | **M10** |
| P11 | End-to-end tests | 🔴 Missing | **M10** |
| P12 | Production/pilot readiness | 🟡 Partial | **M10** |
| AI eval (§29) | 30-case classification + 5 injection cases | 🔴 Missing | **M10** |
| RAG eval (§30) | Retrieval relevance test | 🔴 Missing | **M10** |

Google Workspace is deliberately excluded per PROJECT_SPEC3 §16.

Additional scope shipped that has **no P-number in PROJECT_SPEC3** (business decision, not spec
gap-driven): Platform Admin Console, subscription request/approve/reject/revoke workflow,
evidence versioning, audit log viewer, coverage-trend snapshots, activity dashboard. These do not
replace or reduce any M2–M7/M9/M10 item above.

## 2. Milestone order

Ordered for the smallest safe change first and to keep each milestone independently shippable.

```text
M1 Onboarding gate
  ↓
M2 Real LLM provider
  ↓
M3 Real embeddings (+ dim-safe Qdrant)
  ↓
M4 RAG ingestion pipeline
  ↓
M5 RAG-powered evidence analysis   ← spec §8 mandatory
  ↓
M6 GitHub OAuth
  ↓
M7 AWS cross-account IAM Role
  ↓
M8 Scheduled collection
  ↓
M9 Jira OAuth + collector
  ↓
M10 Security + AI/RAG eval + E2E tests + pilot readiness
```

## 3. Milestone specifications

### M1 — Onboarding gate

**Status: ✅ Shipped 2026-09-03**, as Day 1 of the Core Flows Wiring sprint
(see [CORE-FLOWS-WIRING.md](CORE-FLOWS-WIRING.md)). As-built matches this spec, with one
addition: the migration backfilled existing rows as already-passed (`DEFAULT TRUE` at backfill
time, then `ALTER COLUMN SET DEFAULT FALSE`) so pre-existing orgs and the demo seed weren't
retroactively locked out — only orgs created after the migration are gated.

**Goal**: persist "onboarding complete" per organization so the flow does not repeat.

- Migration `V15__organizations_onboarding.sql`
  - `organizations.onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE`
  - `organizations.onboarding_completed_at TIMESTAMPTZ NULL`
- API
  - `GET /api/v1/organizations/current` — returns `{id, name, onboardingCompleted, onboardingCompletedAt}`
  - `POST /api/v1/organizations/current/onboarding/complete` — sets flag, records audit event `ONBOARDING_COMPLETED`
- Frontend
  - `OrganizationService` caches current org
  - Shell auth guard: on first authenticated navigation, if `!onboardingCompleted` and route is not `/onboarding`, redirect to `/onboarding`
  - Onboarding component calls the complete endpoint on final step

**Files touched**: `V15__…sql`, `OrganizationController.java`, `OrganizationService.java`, `Organization.java`, `AuditEvents.java`, `organization.service.ts`, `app.routes.ts`, `onboarding.component.ts`, `shell.component.ts`.

**Verify**: fresh signup lands on `/onboarding`. Completing it once means subsequent logins land on `/dashboard`.

---

### M2 — Real LLM provider (PROJECT_SPEC3 §5)

**Goal**: turn `OpenAILLMProvider` from a `NotImplementedError` skeleton into a working provider.

- Real HTTP call in `ai-service/app/llm.py` using existing `httpx` dependency
  - `POST {OPENAI_BASE_URL}/chat/completions` with `response_format={"type": "json_object"}`
  - `Authorization: Bearer {api_key}`
  - Bounded retries (max 2, exponential backoff)
  - Timeout from `LLM_TIMEOUT_S` (default 30)
- Config additions in `config.py`
  - `openai_base_url: str = "https://api.openai.com/v1"` (Azure/local-LLM compatible)
  - `llm_timeout_s: int = 30`
- Structured-output validation is unchanged — response goes through the existing `MapEvidenceResponse` guardrails
- Stub remains default; enabled via `LLM_PROVIDER=openai` + `LLM_API_KEY=…`
- Tests: `tests/test_llm.py` — mock httpx to verify request shape, retry, timeout, and guardrail rejection of `SOC 2 compliant`

**Files touched**: `ai-service/app/llm.py`, `ai-service/app/config.py`, `ai-service/tests/test_llm.py`, `docker-compose.yml` (env passthrough).

**Verify**: with `LLM_PROVIDER=stub` all existing flows keep working. With a real key, `/map-evidence` returns real structured JSON.

---

### M3 — Real embeddings + dim-safe Qdrant (PROJECT_SPEC3 §6)

**Goal**: allow a real embedding provider without silently corrupting the Qdrant collection when dimensions change.

- New `OpenAIEmbeddingProvider` in `embeddings.py`
  - Model → dim map (`text-embedding-3-small` → 1536, `text-embedding-3-large` → 3072)
  - `POST {OPENAI_BASE_URL}/embeddings`
- `build_embedding` supports `openai` and `stub`
- `QdrantVectorStore.__init__`
  - If collection exists but `vectors_config.size != dimensions` → log ERROR and recreate collection (safe for dev; production must run `/rag/ingest` again)
- Config additions
  - `embedding_provider`, `embedding_model`, `EMBEDDING_API_KEY` (falls back to `LLM_API_KEY` if unset)
- Tests: `tests/test_embeddings.py` — mock httpx, verify batch shape and dim.

**Files touched**: `ai-service/app/embeddings.py`, `ai-service/app/vector_store.py`, `ai-service/app/config.py`, `ai-service/app/main.py` (wire new provider on startup), `ai-service/tests/test_embeddings.py`, `docker-compose.yml`.

**Verify**: switching `EMBEDDING_PROVIDER=openai` recreates Qdrant with dim 1536 and RAG demo corpus re-ingests without error.

---

### M4 — Real RAG ingestion (PROJECT_SPEC3 §7)

**Goal**: allow the operator to feed compliance-knowledge documents into RAG.

- New `ai-service/app/ingest.py`
  - `parse_document(bytes, mime) -> str` supporting `text/plain`, `application/pdf` (via `pypdf`), `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (via `python-docx`)
  - Chunker attaches full metadata per spec §7.3: `framework`, `framework_version`, `control_code?`, `document_name`, `section`, `page`, `source`, `chunk_id=uuid4`
- New endpoint `POST /rag/ingest` (multipart)
  - Fields: `file`, `framework`, `framework_version`, optional `control_code`, `source`
  - Header: `X-Internal-Token` compared to `AI_INGEST_TOKEN` env
  - Returns `{documentId, chunksCreated, status}`
- Backend proxy `POST /api/v1/rag/ingest` (OWNER role only) forwards to AI service with the shared token
- Requirements bump: add `pypdf==5.1.0`, `python-docx==1.1.2` to `requirements.txt`
- Frontend: minimal "Ingest knowledge" panel on Ask page (OWNER only), gated by feature flag

**Files touched**: `ai-service/app/ingest.py`, `ai-service/app/main.py`, `ai-service/app/chunker.py`, `ai-service/requirements.txt`, `RagController.java` (backend proxy), `RagIngestRequest.java`, `ask.component.ts`.

**Verify**: `curl -F file=@sample.pdf -F framework=SOC2 -F framework_version=2022 -H "X-Internal-Token: …" http://localhost:8000/rag/ingest` returns `chunksCreated>0`. Subsequent `/rag/query` retrieves from the ingested doc.

---

### M5 — RAG-powered evidence analysis (PROJECT_SPEC3 §8, §9) — CRITICAL

**Goal**: connect retrieval to the analysis pipeline. Spec §51 makes this the highest-priority AI item.

- `/map-evidence` in AI service now:
  1. Build retrieval query from `control.code + control.description + evidence.name + evidence.contentPreview` (bounded to ~500 chars)
  2. `rag.retrieve(query, top_k=5, framework="SOC2")`
  3. Build prompt with 4 explicit sections: SYSTEM INSTRUCTIONS / CONTROL / EVIDENCE / RETRIEVED KNOWLEDGE (untrusted)
  4. LLM call
  5. Response schema gains `sources: List[SourceRef]` where `SourceRef = {document, section, page?, chunk_id, score}`
- Migration `V16__ai_analysis_sources.sql`
  - `ai_analysis.sources JSONB NOT NULL DEFAULT '[]'`
- `AiAnalysisClient.java` parses `sources[]` from response and persists to `AiAnalysis.sources`
- Control detail UI: Sources panel below AI Analysis, showing document + section + page (mirrors spec §19)

**Files touched**: `ai-service/app/main.py`, `ai-service/app/schemas.py`, `ai-service/app/prompts.py`, `V16__…sql`, `AiAnalysis.java`, `AiAnalysisClient.java`, `AiAnalysisController.java`, `control-detail.component.ts`.

**Verify**: analyzing an IAM-related evidence artifact against `CC6.1` returns `sources[]` containing at least one chunk from the ingested SOC2 corpus. Sources render in the UI.

---

### M6 — GitHub OAuth (PROJECT_SPEC3 §11)

**Goal**: production-style authorization alongside the existing PAT mode.

- Config: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_OAUTH_REDIRECT_URI`
- New endpoints
  - `POST /api/v1/integrations/github/oauth/start` → `{redirectUrl}` with signed state
    - State = HMAC-SHA256 of `orgId|userId|nonce|expiresAt` using JWT secret
    - 10-minute TTL
  - `GET /api/v1/integrations/github/oauth/callback?code&state` → validate state, exchange code, store token in `SecretStore`, mark `configuration.mode=OAUTH`
- Existing PAT path unchanged (`configuration.mode=PAT`)
- Collector reads whichever mode is present — no API change
- Frontend: Integrations page shows "Connect via GitHub" button that hits `oauth/start` and opens the URL

**Files touched**: `GitHubOAuthController.java`, `GitHubOAuthService.java`, `IntegrationService.java` (small tweak to persist mode), `integrations.component.ts`, `application.yml`, `.env.example`.

**Verify**: dev app flow — button → GitHub authorize page → callback → integration status `CONNECTED`, mode `OAUTH`. Collection runs identically to PAT mode.

---

### M7 — AWS cross-account IAM Role (PROJECT_SPEC3 §12)

**Goal**: real AWS integration via STS AssumeRole with external ID.

- Add Maven deps: `software.amazon.awssdk:sts`, `iam`, `cloudtrail`, `auth` (BOM 2.28.x)
- Config: `AWS_ROLE_EXTERNAL_ID`, `AWS_REGION`, `AWS_COLLECTOR_ACCESS_KEY_ID` / `SECRET_ACCESS_KEY` (Syncpoint's AWS identity used for STS)
- New endpoints
  - `POST /api/v1/integrations/aws` `{displayName, roleArn, externalId, region?}` — validates role ARN format, stores config (no long-lived keys stored)
  - `POST /api/v1/integrations/{id}/test` invokes `AwsEvidenceCollector.test` which calls STS AssumeRole and `sts.GetCallerIdentity`
- New `AwsEvidenceCollector implements EvidenceCollector`
  - IAM: users (with `LoginProfile`, `MFADevices`, `AccessKeys` metadata), roles (name + assume-role policy), admin-tagged permissions
  - CloudTrail: `DescribeTrails` (name, S3 bucket, is-multi-region, is-logging)
- IAM policy JSON committed to `docs/integrations/aws-iam-role.md`
- Frontend: catalog `AWS.available=true`, connect form asks Role ARN + External ID

**Files touched**: `pom.xml`, `AwsEvidenceCollector.java`, `AwsIntegrationRequest.java`, `IntegrationService.java`, `IntegrationsController.java`, `integrations.component.ts`, `provider.types.ts`, `docs/integrations/aws-iam-role.md`.

**Verify**: connect flow with a dev sandbox account produces at least one IAM evidence artifact and one CloudTrail artifact.

---

### M8 — Scheduled collection (PROJECT_SPEC3 §13)

**Status: ✅ Shipped 2026-09-04**, pulled forward ahead of M2–M7
(see [SETTINGS-AND-SCHEDULED-COLLECTION.md](SETTINGS-AND-SCHEDULED-COLLECTION.md) for the
as-built design, which differs from the plan below in a few ways: the sweep is a single
tenant-free `ScheduledCollectionSweep` bean rather than two separate daily/weekly `@Scheduled`
methods, the cron is one configurable property (`syncpoint.collection.sweep-cron`, default
hourly) rather than hardcoded daily/weekly crons, and the schedule picker lives on the new
`/settings` Automation tab rather than directly on each integration card.)

**Goal**: honor the existing `IntegrationSchedule.{MANUAL,DAILY,WEEKLY}` enum.

- `@EnableScheduling` on `ComplianceApplication`
- New `ScheduledCollectionService`
  - `@Scheduled(cron="0 0 2 * * *")` — daily 02:00 UTC: for each org, find integrations where `schedule=DAILY`, `status=CONNECTED`, and `last_collection_at < now - 20h`, dispatch via existing `IntegrationService.triggerCollection`
  - `@Scheduled(cron="0 0 3 * * SUN")` — weekly: same, filter `schedule=WEEKLY` and `last_collection_at < now - 6d`
- `PATCH /api/v1/integrations/{id}/schedule` `{schedule}` to change cadence
- Frontend: schedule dropdown on each integration card
- Retries: bounded 3 with exponential backoff already handled in `CollectionRunner`; add distinct log for retry-after / rate-limit responses

**Files touched**: `ScheduledCollectionService.java`, `IntegrationController.java`, `IntegrationService.java`, `integrations.component.ts`, `application.yml` (`spring.task.scheduling.pool.size=2`).

**Verify**: switching an integration to `DAILY` and running the job manually via `@Scheduled` trigger produces a new `CollectionRun`.

---

### M9 — Jira OAuth + collector (PROJECT_SPEC3 §15)

**Goal**: third production integration for change-management evidence.

- Config: `JIRA_CLIENT_ID`, `JIRA_CLIENT_SECRET`, `JIRA_OAUTH_REDIRECT_URI`
- OAuth: mirror of M6 pointing at `auth.atlassian.com/authorize` and `auth.atlassian.com/oauth/token`
- Config stores `{cloudId, projectKey}` after user picks project
- `JiraEvidenceCollector`
  - `GET /rest/api/3/project/search`
  - `GET /rest/api/3/search?jql=project = {key} AND updated >= -90d` — collect issues (type, status, assignee, approvers via `customfield_*`)
  - Test = `myself` endpoint

**Files touched**: `JiraOAuthController.java`, `JiraOAuthService.java`, `JiraEvidenceCollector.java`, `IntegrationService.java`, `integrations.component.ts`, `provider.types.ts`.

**Verify**: connect flow returns list of projects, user picks one, collection produces issues as evidence.

---

### M10 — Security hardening + AI/RAG evaluation + E2E + pilot readiness

**Goal**: everything that turns "works on the dev machine" into "ready for a pilot customer".

- **Malware scanner abstraction** (PROJECT_SPEC3 §27)
  - `MalwareScanner` interface, `NoopMalwareScanner` (default profile), `ClamAvMalwareScanner` skeleton
  - `EvidenceService.upload` calls scanner; scan result stored on `EvidenceVersion.scan_status` (Flyway `V17__evidence_scan.sql`)
- **AI evaluation** (PROJECT_SPEC3 §29)
  - `ai-service/tests/eval/dataset.py`: 10 covered / 10 partial / 10 insufficient / 5 prompt-injection cases
  - `ai-service/tests/eval/test_classification.py`: run each case through `/map-evidence`, assert classification, guardrail rejection for injection
  - `pytest --run-eval` marker to gate the eval suite
- **RAG evaluation** (PROJECT_SPEC3 §30)
  - `ai-service/tests/eval/test_retrieval.py`: 5 queries, assert expected doc name appears in top-5
- **Backend end-to-end tests** (PROJECT_SPEC3 §§39-46)
  - `E2EAuthFlowIT` — register → login → dashboard
  - `E2EEvidenceFlowIT` — upload PDF → hash → visible
  - `E2ERagAnalyzeIT` — ingest doc → analyze evidence → sources present
  - `E2EAuditExportIT` — request export → download ZIP → validate no credentials in output
  - Use `@SpringBootTest(webEnvironment=RANDOM_PORT)` + Testcontainers postgres + minio
- **Security hygiene** (PROJECT_SPEC3 §26)
  - CI-friendly script `scripts/scan-secrets.sh` running `git grep` for common secret patterns
  - Confirm `.env` in `.gitignore`, verify with `git log --all --full-history -- .env`
- **Pilot readiness** (PROJECT_SPEC3 §§25, 47)
  - `deploy/.env.example` (prod flavor, requires real `SECRET_STORE_MASTER_KEY`)
  - `deploy/README.md` — how to run the pilot, includes AWS IAM policy, GitHub App URLs, Jira app registration
  - `docker-compose.hub.yml` — add health checks that wait for backend before frontend

**Files touched**: many; each subtask is independently verifiable.

**Verify**: all E2E tests green; eval report printed; pilot-run instructions verified by fresh clone.

## 4. Cross-cutting rules

Applied to every milestone.

- **Do not rewrite working modules just to change style** (PROJECT_SPEC3 §1.1)
- **Every schema change is a new Flyway migration** — never edit an applied one
- **After each milestone**: rebuild the affected image, `docker compose up -d`, run its verify script, bump Docker Hub tag (0.4.0 → 0.5.0 for M1, and so on), update this document's status column
- **Never log secrets** — audit events use safe metadata only
- **Retrieved content is untrusted** — all prompts keep the 4-section separation from spec §8.2

## 5. Docker Hub tag plan

> **Actual tags diverged from this plan.** `0.6.0` shipped Core Flows Wiring (M1 + UX wiring,
> not "M1 alone" as planned) and `0.7.0` shipped the Platform Admin Console + subscription
> workflow + M8 (not M2 as planned). M2 has not shipped. The table below remains the forward
> plan for M2–M10; whenever M2 actually lands, continue tagging from `0.7.0` upward rather than
> resetting to `0.6.0`.

| Milestone | Tag | What ships |
|---|---|---|
| M1 | `0.5.0` | onboarding gate |
| M2 | `0.6.0` | real LLM provider |
| M3 | `0.7.0` | real embeddings |
| M4 | `0.8.0` | RAG ingestion |
| M5 | `0.9.0` | RAG-powered analysis |
| M6 | `0.10.0` | GitHub OAuth |
| M7 | `0.11.0` | AWS collector |
| M8 | `0.12.0` | scheduled collection |
| M9 | `0.13.0` | Jira collector |
| M10 | `1.0.0-rc1` | pilot-ready |

Each tag is pushed for all three images (`syncpoint-backend`, `syncpoint-ai-service`, `syncpoint-frontend`) even if only one image changed, so `deploy/docker-compose.hub.yml` can pin all three to the same version.

## 6. Definition of MVP complete

See PROJECT_SPEC3.md §47 — this file's status columns and Docker Hub tag `1.0.0-rc1` are the machine-readable version of that checklist. When every row above is ✅ and `1.0.0-rc1` runs the spec §53 pilot scenario end-to-end without developer intervention, the MVP is complete.
