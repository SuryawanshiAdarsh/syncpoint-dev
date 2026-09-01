# Syncpoint MVP — Status (as of 2026-09-02)

At-a-glance status of everything against the two specifications
(`PROJECT_SPEC.md`, `PROJECT_SPEC2.md`, `PROJECT_SPEC3.md`).
Master plan: [ROADMAP.md](ROADMAP.md).
Detailed milestones: [MVP-COMPLETION-PLAN.md](MVP-COMPLETION-PLAN.md).
Non-code readiness: [PATH-TO-FIRST-CUSTOMER.md](PATH-TO-FIRST-CUSTOMER.md).
Layer contracts: [ARCHITECTURE.md](ARCHITECTURE.md).

Legend: ✅ done and live · 🟡 partial · ⏳ deferred · 🚫 not in MVP scope

---

## What changed in the current pass (E0 hardening + captions)

- ✅ **E0.1** Configuration consolidation — 4 `@ConfigurationProperties` records (Ai / Storage / SecretStore / Security). All 12 `@Value` sites removed.
- ✅ **E0.2** AI HTTP client deduped — renamed to `AiServiceClient`, shared `HttpClient` bean, `RagController` reduced to a thin proxy.
- ✅ **E0.3** Exception hierarchy tightened — `AiServiceException`, `ObjectStorageException` now extends `ApiException`, 4 silent `catch (RuntimeException ignore)` blocks replaced with `log.warn`, specific catches of `IOException`/`HttpTimeoutException`/`InterruptedException` in `AiServiceClient`.
- ✅ **E0.4** AI service exception middleware — `app/errors.py` produces the same `{timestamp, status, code, message, path}` shape as the Java backend.
- ✅ **E0.5** MDC + `X-Request-Id` correlation — new `RequestContextFilter` (backend) + `RequestIdMiddleware` (AI). One `X-Request-Id` traces backend → AI service in both log outputs. `MdcTaskDecorator` propagates MDC across `@Async` boundaries.
- ✅ **E0.6** AI service router split — `main.py` reduced from 150 → 45 lines; new `routers/{health,evidence,rag}.py`, `services.py` singletons, `logging_setup.py`.
- ✅ **E0.9** Architecture doc — [ARCHITECTURE.md](ARCHITECTURE.md) codifies layer contracts, tenant invariant, config properties inventory, exception hierarchy, MDC keys, "add a new provider in 10 lines" walkthrough.
- ✅ **Frontend captions module** — [shared/captions/captions.ts](../frontend/compliance-ui/src/app/shared/captions/captions.ts) holds every user-visible string. 11 pages migrated to reference it. Path alias `@captions` added.
- ✅ **Dashboard layout** — Evidence gaps + Recent evidence cards now stacked vertically.
- ✅ **All-in-one appliance** — new `Dockerfile.appliance` builds s6-supervised image (postgres + minio + backend + ai + nginx in one container). 1.45 GB after layer split + `chown -R` de-dup.
- ✅ **Docker Hub 0.5.0** — backend, ai-service, frontend all live. Appliance push blocked by Docker Hub network flakes; local image `syncpoint-appliance:0.5.1` is ready.
- 🟡 **Cold-start test** — Verified from a scratch directory: `curl` the two files, `docker compose up -d`, hit UI in < 30 s.

---

## Runable stack (V2 §71 first milestone)

| Component               | Status | Where |
|-------------------------|:------:|-------|
| Docker Compose (dev)    | ✅ | [docker-compose.yml](../docker-compose.yml) |
| Docker Compose (deploy) | ✅ | [deploy/docker-compose.hub.yml](../deploy/docker-compose.hub.yml) |
| PostgreSQL 16           | ✅ | migrations V1–V14 + repeatable seed |
| Redis 7                 | 🟡 | running but not yet consumed by app code |
| Qdrant                  | ✅ | populated at startup with demo corpus |
| MinIO (S3)              | ✅ | `evidence` bucket auto-created |
| Spring Boot backend     | ✅ | Java 21, Boot 3.3.4, 30+ endpoints |
| Angular 18 frontend     | ✅ | 9 feature pages behind nginx |
| Python AI service       | ✅ | FastAPI + LLM/Embedding abstractions + RAG |
| Docker Hub images       | ✅ | `adarshs1612/syncpoint-{backend,ai-service,frontend}:0.5.0` + `:latest` |
| All-in-one appliance    | 🟡 | Image built locally as `0.5.1`; Docker Hub push blocked by network flakes on 1 GB layer |

---

## Backend (Spring Boot)

| Area | Status | Notes |
|------|:------:|-------|
| Auth: register / login / refresh / me | ✅ | JWT HS256, BCrypt(12), TenantContext ThreadLocal |
| Multi-tenancy (V2 §50) | ✅ | Every tenant-scoped repo call filters by `organization_id`. Live-verified via cross-org test. |
| RBAC: OWNER / ADMIN / REVIEWER / VIEWER | ✅ | `@PreAuthorize` on all sensitive mutations |
| Rate-limiting `/auth/*` | ✅ | In-memory sliding window (20/min per IP) |
| CORS profile-driven | ✅ | `CORS_ALLOWED_ORIGINS` env |
| Global exception handler + spec §27 error format | ✅ | |
| Audit event catalog (spec §55, 15 event types) | ✅ | `AuditEvents.java` constants + `metadata JSONB` |
| `SecretStore` (envelope-encrypted DB) | ✅ | AES-256-GCM DEK-per-record, master key from env |
| Frameworks + Controls | ✅ | 15 SOC 2 demo controls seeded via Flyway repeatable migration |
| Per-org control status resolver | ✅ | Live-derived from evidence mappings: COVERED / PARTIAL / MISSING / NEEDS_REVIEW |
| Evidence + versions + mappings + reviews | ✅ | MinIO upload, sha256, per-tenant storage keys |
| MIME/extension allowlist + size limit | ✅ | 50 MB max, six formats |
| `EvidenceCollector` abstraction | ✅ | `CollectorRegistry` looks up by provider enum |
| GitHub PAT connector (real API) | ✅ | Members / repos / branch protection |
| AWS / Jira / Google Workspace connectors | ⏳ | Placeholder tiles in UI; interface ready to receive impls |
| Full GitHub App OAuth flow | ⏳ | PAT works for MVP demo; App flow is post-MVP |
| Async `CollectionRunner` | ✅ | Dedicated `ThreadPoolTaskExecutor` |
| Collection runs + items history | ✅ | `collection_runs`, `collection_items` tables |
| AI analysis: `POST /evidence/{id}/analyze` | ✅ | Backend → AI service → stores `ai_analysis` + creates `AI_SUGGESTED` mapping |
| AI RAG proxy: `POST /api/v1/rag/query` | ✅ | Authenticated pass-through to AI service |
| Dashboard endpoints | ✅ | `/dashboard/summary`, `/gaps`, `/recent-evidence` |
| Async audit-package export (ZIP) | ✅ | Full spec §63 layout, incl. evidence hashes |
| OpenAPI / Swagger UI | ✅ | http://localhost:8080/swagger-ui.html |
| Testcontainers integration tests | 🟡 | 3 tests exist and pass in principle; re-run against new modules not yet performed |
| Refresh-token rotation / revocation | ⏳ | Access token expires; refresh is stateless |

---

## AI service (Python / FastAPI)

| Area | Status | Notes |
|------|:------:|-------|
| `LLMProvider` interface | ✅ | Provider-agnostic per §30 |
| `StubLLMProvider` (deterministic mock) | ✅ | Runs entire product without any external API key |
| `OpenAILLMProvider` | 🟡 | Skeleton present; `generate_structured` currently raises NotImplemented |
| `EmbeddingProvider` interface | ✅ | Provider-agnostic per §31 |
| `StubEmbeddingProvider` (hash-based) | ✅ | Enough for pipeline; not semantically meaningful |
| Real embedding provider | ⏳ | Same skeleton pattern |
| Endpoints: `/health`, `/classify`, `/map-evidence`, `/analyze-gap` | ✅ | Pydantic-validated structured output |
| Guardrails (spec §37, §57) | ✅ | Classification allowlist, forbidden-phrase validator on `reason`, retrieved-context / system-prompt separation |
| Prompt versioning | ✅ | `prompt_version` written on every AI analysis record |
| RAG pipeline | ✅ | Chunk → embed → Qdrant → retrieve → cite |
| Qdrant integration | ✅ | Real client + `InMemoryVectorStore` fallback |
| Demo corpus (8 SOC 2 knowledge docs) | ✅ | Auto-ingested at startup |

---

## Frontend (Angular 18)

| Page | Status | Notes |
|------|:------:|-------|
| Login | ✅ | Standalone component, Material |
| Register | ✅ | First user becomes OWNER |
| Shell (sidebar + header + logout) | ✅ | |
| Dashboard | ✅ | Coverage gauge, gaps table, recent-evidence table |
| Controls list + filter | ✅ | Search + status filter |
| Control detail + mapped evidence | ✅ | |
| Evidence: upload / list / map / analyze / approve | ✅ | Multipart upload, dropdown control mapping, AI analyze button |
| Integrations: connect / test / collect / disconnect | ✅ | GitHub PAT flow; other providers = "coming soon" tiles |
| Onboarding wizard | ✅ | 5-step guided path (spec §8) |
| Ask AI (RAG) | ✅ | Q&A with citations |
| Audit package export | ✅ | Start job → poll → download ZIP |
| Route guards (auth + public) | ✅ | |
| HTTP interceptor injecting JWT + auto-logout on 401 | ✅ | |

---

## Infrastructure & DevOps

| Item | Status | Notes |
|------|:------:|-------|
| Env-driven config (`.env`) | ✅ | Every knob in `application.yml` overridable via env |
| Local verify script (`verify.ps1`) | ✅ | All 7 services |
| Makefile (POSIX) | ✅ | up / down / logs / reset / verify |
| PowerShell scripts | ✅ | up / down / dev / reset / verify |
| Docker Hub images published | ✅ | `adarshs1612/syncpoint-{backend,ai-service,frontend}:0.1.0` |
| Deploy compose file for recipients | ✅ | [deploy/docker-compose.hub.yml](../deploy/docker-compose.hub.yml) |
| Deploy README | ✅ | [deploy/README.md](../deploy/README.md) |
| HTTPS termination | ⏳ | Expected to be provided by an upstream reverse proxy in prod |
| CI/CD | ⏳ | Manual local builds only in this pass |

---

## Documentation (spec §5)

| File | Status |
|------|:------:|
| `docs/architecture/system-architecture.md` | ✅ |
| `docs/architecture/customer-onboarding.md` | ✅ |
| `docs/architecture/integration-architecture.md` | ✅ |
| `docs/architecture/evidence-data-flow.md` | ✅ |
| `docs/architecture/security.md` | ✅ |
| `docs/api/api-overview.md` | ✅ |
| `docs/compliance/soc2-controls.md` | ✅ |
| `docs/compliance/evidence-model.md` | ✅ |
| `database/README.md` + `database/seed/demo.sql` | ✅ |

---

## What's remaining to reach a "full" product (post-MVP)

**Security hardening**
- Refresh-token rotation & revocation
- Password complexity policy + password rotation
- Malware scanning integration (interface exists as a stub)
- SSO / SAML / SCIM
- Full CI/CD with automated Testcontainers + frontend test runs
- Full test suite re-run against the new modules

**Integrations**
- GitHub App (full OAuth callback + installation storage)
- AWS cross-account IAM Role
- Jira OAuth
- Google Workspace OAuth

**AI**
- Real `OpenAILLMProvider.generate_structured` HTTP call
- Real embedding provider
- Richer RAG corpus (multi-tenant document upload UI)
- Reranking / hybrid search

**Product**
- Scheduled collection runs (Manual/Daily/Weekly persisted; scheduler not yet wired)
- Freshness expiry auto-transitions (currently computed at read time)
- Notifications (email / webhook)
- Additional frameworks (ISO 27001, HIPAA, etc.)
- Billing / plan tiers
