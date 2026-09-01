# Syncpoint MVP — Build Plan

This file is the coding agent's persistent scratchpad. It tracks scope,
architectural decisions, and progress across many tool calls so context can be
rebuilt from disk instead of re-derived every turn.

**Do not treat this as user-facing documentation.** It exists for the agent.

---

## Ground truth

- Primary specs: `PROJECT_SPEC.md` (V1) and `PROJECT_SPEC2.md` (V2, authoritative).
- V2 §69 requires a gap-analysis first, then approval, then implement only approved P0/P1.
  The user has now **explicitly approved building a full-fleshed MVP** (their words:
  "go ahead I want this fullfleshed MVP working").
- V2 §65 priorities: P0 runability, P1 security, P2 evidence workflow, P3 onboarding,
  P4 GitHub, P5 AI, P6 RAG, P7 AWS, P8 Jira, P9 dashboard/export, P10 hardening.
- V2 §75 architecture principle: **code determines facts, AI interprets, humans decide.**

## Confirmed decisions

- Java base package: `com.syncpoint.compliance` (no Lombok, records for DTOs).
- Angular 18 standalone components + Angular Material (frontend built via nginx image).
- AI service: Python 3.12 + FastAPI + Pydantic; LLM/Embedding provider-agnostic.
  Ships with a `StubLLMProvider` (deterministic mock) so demos work without an API key;
  swappable via `LLM_PROVIDER=openai` at runtime.
- GitHub integration: **Personal Access Token flow** for MVP (not full GitHub App).
  User pastes a fine-grained PAT with read scopes; we store it via `SecretStore`.
  A full GitHub App migration is future work.
- AWS/Jira/Google connectors: **not implemented** in this MVP pass — they get
  registered stubs so the UI can list them as "Coming soon".
- Async collection: Spring `@Async` with a dedicated `ThreadPoolTaskExecutor`.
  Redis-backed queue can replace it later without touching the collector interface.
- Migrations live in `backend/compliance-api/src/main/resources/db/migration/`
  (Spring/Flyway default). The repo-root `database/migrations/` folder is decorative;
  a README there points at the classpath location.

## Scope (this build pass)

Backend (P0–P4 + P9):
- [x] F0  Bootstrap infra + backend (done in Phases 0/1)
- [x] F1  Compose placeholders for frontend/ai-service; `audit_events.metadata JSONB`
- [x] F2  `SecretStore` abstraction (envelope-encrypted DB); full audit event catalog (§55)
- [x] F3  Frameworks + Controls + SOC 2 demo seed (10–15 controls)
- [x] F4  Evidence + evidence_versions + mappings + reviews; MinIO client; upload endpoint
- [x] F6  Integrations lifecycle + `EvidenceCollector` abstraction + `CollectionRunner`
- [x] F7  GitHub PAT connector (real API: members / repos / branch protection)
- [x] F9b Backend → AI service HTTP client (`AiAnalysisClient`)
- [x] F13a Dashboard endpoints (`/dashboard/summary`, `/dashboard/gaps`, `/dashboard/recent-evidence`)
- [x] F13b Async ZIP export (`POST /exports/audit-package`, `GET /exports/{id}`)

AI service (P5 minimal + P6 skeleton):
- [x] F9a FastAPI scaffold + `LLMProvider` + `EmbeddingProvider` interfaces
- [x] F9c `/classify`, `/map-evidence`, `/analyze-gap` with Pydantic-validated structured output
- [x] F10 RAG pipeline (Qdrant client, chunker, demo corpus, real retrieval)

Frontend (P0/P3 + P9 minimal):
- [x] F5a Angular 18 scaffold + Docker (nginx multi-stage)
- [x] F5b Auth module (login/register) + HTTP interceptor + route guards + `TokenStore`
- [x] F5c Shell layout (sidebar, header) + routing
- [x] F5d Dashboard page (summary + coverage bar)
- [x] F5e Controls list + detail (with evidence panel)
- [x] F5f Evidence list + manual upload
- [x] F5g Integrations page (connect GitHub via PAT, test, collect)
- [x] F5h Onboarding wizard (5 screens per §8)
- [x] F5i Export page (trigger + poll status + download)

Hardening (P10 minimal):
- [x] F14a Rate-limit `/auth/login` and `/auth/register` via a simple in-memory bucket
- [x] F14b Profile-driven CORS (dev = localhost:*, prod = env-driven allow-list)
- [ ] F14c Full test coverage — smoke tests only in this pass

Explicitly deferred:
- Real GitHub App OAuth flow (PAT is used instead)
- AWS cross-account IAM Role, Jira OAuth, Google Workspace OAuth
- Full RAG with real embeddings + document ingestion pipeline
- Password rotation, refresh token revocation, JWT blacklist
- Malware scanning (interface exists, stub only)
- SSO/SAML, billing, i18n, notifications

## Progress checkpoints

Update the checkboxes above as each phase is verified. Also append short notes
below each time a phase completes so context can be reloaded quickly.

- Phase 0/1 verified end-to-end via live docker-compose stack on 2026-08-31.
  Postgres, Redis, Qdrant, MinIO, Backend all healthy. Auth flow, tenant
  isolation, 401 semantics, Flyway migrations V1–V5 all pass.
- **F1–F4, F6, F7, F9, F13 verified live 2026-09-01:**
  - 14 Flyway migrations + repeatable SOC 2 seed applied cleanly (15 controls).
  - Manual evidence upload → MinIO put → sha256 hash → mapping (HUMAN_CONFIRMED
    COVERED) → review APPROVED → CC6.3 status auto-computed to COVERED.
  - Backend → AI service `/map-evidence` call returned a valid Pydantic-validated
    PARTIAL classification; backend stored `ai_analysis` + created an
    `AI_SUGGESTED` mapping → CC6.1 status auto-computed to NEEDS_REVIEW.
  - Async export produced a valid ZIP (README.txt, index.csv, per-control
    folders with evidence.json + evidence-files/, audit-log.json).
- Notable fixes made during the pass:
  - MIME allowlist tolerates `application/octet-stream` (curl/browser default);
    falls back to extension→MIME map.
  - Backend AI client uses `java.net.http.HttpClient` forced to HTTP/1.1
    (Java 21 default HTTP/2 request bodies were being lost against uvicorn).
  - `@Async` self-invocation in `CollectionRunner` — dropped @Transactional on
    the same-instance callee since Spring Data save() is already atomic.

Still TODO to reach the full customer-facing MVP:
- F10 (real RAG pipeline; currently `/rag/query` is stubbed via the LLM)
- F14a rate limiting on `/auth/*` (deferred to hardening pass)
- Real GitHub App OAuth (currently PAT); AWS/Jira/Google collectors

**F5 (frontend) verified live 2026-09-01.** Angular 18 built via multi-stage
Node → nginx image. UI reachable at http://localhost:4200, proxies `/api/*`
and `/actuator/*` to `backend:8080`. Full register-through-proxy flow verified;
all 15 controls surface through the UI. All 7 services report OK from verify.ps1.

**F10 (RAG) verified live 2026-09-01.** AI service now ingests a demo
compliance-knowledge corpus on startup, chunks + embeds it, and stores it in
Qdrant. `/rag/query` performs real vector search and returns citations.
Backend exposes `POST /api/v1/rag/query` as an authenticated proxy; frontend
has an "Ask AI" page. Note: embeddings are hash-based stubs, so ranking is
plumbing-only — swapping in a real embedding provider (OpenAI/Cohere) via
`EMBEDDING_PROVIDER` env yields meaningful similarity.

**F14a (rate limiting) + F14b (CORS profiles) verified live 2026-09-01.**
In-memory sliding-window filter (`AuthRateLimitFilter`) applied to
`/api/v1/auth/login` and `/register`; 25 rapid attempts produced 20×401 + 5×429.
CORS allow-list is now env-driven via `CORS_ALLOWED_ORIGINS`.

**Images published to Docker Hub 2026-09-01:**
- `adarshs1612/syncpoint-backend:0.1.0`     (606 MB)
- `adarshs1612/syncpoint-ai-service:0.1.0`  (404 MB)
- `adarshs1612/syncpoint-frontend:0.1.0`    (75 MB)

`deploy/docker-compose.hub.yml` + `deploy/.env.example` + `deploy/README.md`
give any recipient a one-command install from Docker Hub. Verified by tearing
down the local build-tagged stack, deleting the local `syncpoint-*:latest`
images, pulling from Hub, bringing the stack up, and successfully registering
a user through the frontend proxy against the pulled images.

Deploy compose intentionally exposes only ports 4200 (UI) and 9001 (MinIO
console) — backend/AI/Qdrant/MinIO S3 stay on the internal docker network
which is why `verify.ps1` (designed for dev compose) shows FAILs for those.

**Docs + database complete 2026-09-01.** 8 spec-mandated docs written under
`docs/architecture/`, `docs/api/`, `docs/compliance/`. Database folder now has
a README explaining the migration layout and a fully-idempotent
`database/seed/demo.sql` (+ `demo.ps1` wrapper) that produces a Demo Corp
tenant with an OWNER, a REVIEWER, three evidence artifacts, one
HUMAN_CONFIRMED + one AI_SUGGESTED mapping, and full audit events.
Verified: after seeding, dashboard reports 15 controls / 1 COVERED / 1
NEEDS_REVIEW / 13 MISSING / 3 evidence.

See [STATUS.md](STATUS.md) for a clean at-a-glance done/remaining table.

## Key file locations

- Docker Compose: [docker-compose.yml](../docker-compose.yml)
- Backend module root: `backend/compliance-api/src/main/java/com/syncpoint/compliance/`
- Migrations: `backend/compliance-api/src/main/resources/db/migration/`
- AI service: `ai-service/app/`
- Frontend: `frontend/compliance-ui/src/app/`

## Test-verify commands

```powershell
cd c:\syncpoint
docker compose up -d
.\infrastructure\scripts\verify.ps1
```
