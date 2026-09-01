# Syncpoint Architecture & Coding Contracts

> Companion to [BUILD-PLAN.md](BUILD-PLAN.md), [MVP-COMPLETION-PLAN.md](MVP-COMPLETION-PLAN.md), and [FRONTEND-ARCHITECTURE.md](FRONTEND-ARCHITECTURE.md).
> This file codifies the invariants every contributor must preserve.

---

## 1. System topology

```text
Angular UI  ──HTTPS──▶  Spring Boot API  ──HTTP──▶  FastAPI AI service
   :4200 (nginx)         :8080                         :8000
                            │                             │
                            ├─▶ PostgreSQL (state)         ├─▶ Qdrant (vectors, in-memory fallback)
                            ├─▶ MinIO / S3 (evidence)      └─▶ LLM provider (OpenAI or stub)
                            └─▶ Envelope-encrypted secret store
```

Delivery: 3 published images (`syncpoint-backend`, `syncpoint-ai-service`, `syncpoint-frontend`) **and** an all-in-one `syncpoint-appliance` that colocates everything under s6-overlay.

## 2. Backend layer contract

Every feature module follows the same layout, in this exact order:

```text
controller/    → thin, HTTP concerns only (routing, DTO validation, HTTP status)
service/       → business logic, @Transactional boundaries, TenantContext.require()
repository/    → Spring Data JPA interfaces, all queries constrained by organizationId
entity/        → JPA @Entity, no business methods except invariants
dto/           → java records used at the API boundary
```

**Rules**
- A controller **must not** import a repository directly.
- A repository query that returns tenant-owned data **must** take `organizationId` as a parameter.
- Services resolve tenant scope through `TenantContext.require().organizationId()` — never trust client-supplied IDs.
- DTOs are inputs (`*Request`) or outputs (`*Response`) — never entity classes.

## 3. Multi-tenant isolation invariant

```java
// service method template
UUID orgId = TenantContext.require().organizationId();
Entity e = repository.findByIdAndOrganizationId(id, orgId)
    .orElseThrow(() -> new NotFoundException("..."));
```

If a repository is missing an `AndOrganizationId` variant, add one — do not filter in Java code.

## 4. Configuration

All backend tunables live in `application.yml` under `syncpoint.*`, and are consumed via typed records under `com.syncpoint.compliance.config.properties`:

| Prefix | Record | Owns |
|---|---|---|
| `syncpoint.jwt` | `JwtProperties` | JWT secret, TTLs, issuer |
| `syncpoint.storage` | `StorageProperties` | S3/MinIO endpoint, keys, bucket |
| `syncpoint.secrets` | `SecretStoreProperties` | Master key for envelope encryption |
| `syncpoint.ai` | `AiProperties` | AI service URL, timeout, ingest token (M4) |
| `syncpoint.security` | `SecurityProperties` | CORS, rate-limit nested record |

**Never introduce a new `@Value("${…}")` in application code**. Add a field to the matching record or create a new record annotated with `@ConfigurationProperties(prefix = "syncpoint.<area>")`. `@ConfigurationPropertiesScan` on `ComplianceApplication` picks them up automatically.

AI service mirrors the pattern via `pydantic-settings` in `ai-service/app/config.py`. Never call `os.getenv` directly.

## 5. Exception hierarchy

```text
RuntimeException
└─ ApiException(status, code, message [, cause])       ← global handler translates to ErrorResponse
   ├─ NotFoundException                → 404 NOT_FOUND
   ├─ ForbiddenException               → 403 FORBIDDEN
   ├─ ObjectStorageException           → 502 STORAGE_ERROR
   └─ AiServiceException               → 502 AI_ERROR (also carries AI_DISABLED via factory)
```

**Rules**
- Throw `ApiException` (or a subclass) from services. Do not throw raw `RuntimeException`.
- The `GlobalExceptionHandler` produces one `ErrorResponse` shape: `{timestamp, status, code, message, path}`.
- The AI service returns the same shape via `app/errors.py` (`AiError`, `AiValidationError`, `AiUpstreamError`, `AiUnavailableError`).
- Never `catch (Exception e)` broadly except at the outer boundary of an integration (SDK, HTTP transport) — and always wrap into a specific domain exception with the original as `cause`.
- Never `catch (…) { }` silently. If a failure is best-effort, `log.warn(...)` with enough context to reconstruct what happened.

## 6. Logging & observability

- Every backend class that logs uses `private static final Logger log = LoggerFactory.getLogger(<Class>.class);`. No `System.out`, no `printStackTrace()`.
- Log pattern (see `application.yml`): `%d{HH:mm:ss.SSS} %-5level [%X{requestId:-------}/%X{orgId:-------------}/%X{userId:-------------}] %logger{28} - %msg%n`
- `RequestContextFilter` populates `MDC.requestId` at the top of the filter chain and echoes it back via `X-Request-Id`.
- `JwtAuthenticationFilter` populates `MDC.orgId` and `MDC.userId` after successful auth, and clears them on request end.
- `MdcTaskDecorator` wired into both `collectionExecutor` and `exportExecutor` beans copies the MDC into async threads so background jobs remain traceable.
- `AiServiceClient` forwards the current `X-Request-Id` on every AI call. The AI service's `RequestIdMiddleware` picks it up so cross-service logs share one id.

**Never log** secrets, tokens, API keys, JWTs, raw evidence bytes, or credential-store contents.

## 7. Async & scheduled work

- Async pool beans live in `com.syncpoint.compliance.config.AsyncConfig`. Two exist:
  - `collectionExecutor` (2/8/64) — evidence collection runs
  - `exportExecutor` (1/4/32) — audit-package builds
- Methods annotated `@Async("<pool-name>")` on `@Service` classes. Never inject an `ExecutorService` manually.
- Do not wrap an `@Async` method in `@Transactional` — self-invocation bypasses the proxy. Persist per-step with individual repository calls.

## 8. Adding a new integration provider (10 lines)

```java
@Component
public class MyProviderCollector implements EvidenceCollector {
    @Override public IntegrationProvider getProvider() { return IntegrationProvider.MY_PROVIDER; }
    @Override public TestResult test(TestContext ctx)   { /* … */ }
    @Override public List<CollectedItem> collect(CollectionContext ctx) { /* … */ }
}
```

`CollectorRegistry` picks it up automatically. Add the enum value to `IntegrationProvider`, wire a `POST /api/v1/integrations/<provider>` on `IntegrationController`, and expose it in `PROVIDER_CATALOG` on the frontend.

## 9. Adding a new LLM or embedding provider

Python side (`ai-service/app/`):

```python
class MyLLM(LLMProvider):
    name = "my-provider"
    async def generate_structured(self, system, user, schema_hint):
        # HTTP call to your provider, JSON mode, retry, timeout
        ...
```

Extend `build_llm()` in `llm.py` with a new `key == "my-provider"` branch. Same shape for `EmbeddingProvider` in `embeddings.py`. `VectorStore` in `vector_store.py`.

## 10. AI service structure

```text
ai-service/app/
├── main.py            ← app factory only (~40 lines)
├── config.py          ← Settings (pydantic-settings)
├── errors.py          ← AiError hierarchy + FastAPI handlers
├── logging_setup.py   ← configure_logging() + RequestIdMiddleware
├── services.py        ← singletons: llm, embedder, vector_store, rag
├── routers/
│   ├── health.py      ← GET /health
│   ├── evidence.py    ← POST /map-evidence, /classify, /analyze-gap
│   └── rag.py         ← POST /rag/query (M4 will add /rag/ingest here)
├── llm.py             ← LLMProvider abstraction + Stub/OpenAI
├── embeddings.py      ← EmbeddingProvider abstraction
├── vector_store.py    ← VectorStore abstraction (Qdrant + InMemory)
├── rag.py, chunker.py, corpus.py, prompts.py, schemas.py
```

Adding a new endpoint = new function in the matching router. Do not touch `main.py` unless you're adding a new router.

## 11. Frontend architecture

See [FRONTEND-ARCHITECTURE.md](FRONTEND-ARCHITECTURE.md) for the full model.

Short version:
- Standalone Angular 18 components, RxJS signals for state
- Path aliases: `@ui @core @features @env`
- Shared primitives in `src/app/shared/ui/` — always prefer `ui-page-header`, `ui-card`, `ui-badge`, `ui-status-badge`, `ui-button`, `ui-empty-state`, `ui-toolbar`, `ui-search`, `ui-filter-chips` over inline mat-* elements
- Design tokens (CSS custom properties) declared in `styles.scss` — never hard-code colors, spacing, or radii

## 12. Database migrations

- Flyway migrations in `backend/compliance-api/src/main/resources/db/migration/`.
- Naming: `Vxxx__description.sql`, monotonically increasing, snake_case description.
- **Never edit an applied migration**. Create a new one instead (e.g. `V16__ai_analysis_sources.sql`).
- Repeatable seeds use `R__seed_soc2_demo.sql` — safe to re-run.

## 13. Security posture (audit-relevant)

- All credentials sit in the envelope-encrypted `SecretStore` (AES-256-GCM, DEK-per-record wrapped by a master key from `SECRET_STORE_MASTER_KEY`).
- Passwords hashed with BCrypt cost 12.
- JWT HS256, access token 15 min, refresh token 7 days.
- Rate limit on `/api/v1/auth/*`: 20 req / 60 s / IP (sliding window, in-memory).
- CORS: patterns whitelisted via `syncpoint.security.cors-allowed-origins`. Never `*`.
- Audit log covers 15 event types (see `AuditEvents.java`). Every state-changing operation records one.

## 14. Testing conventions (M10 will grow this)

- Java integration tests: `*IT.java` under `src/test/java/**`, `@SpringBootTest(webEnvironment = RANDOM_PORT)`, Testcontainers postgres + minio.
- Python tests: `pytest` under `ai-service/tests/`, `pytest-asyncio` for async endpoints.
- End-to-end smoke: `infrastructure/scripts/verify.ps1` covers the 7-container health picture.

## 15. Verification checklist before merging feature work

1. `mvn -B -DskipTests compile` — clean.
2. `docker compose build backend ai-service frontend` — all three succeed.
3. `docker compose up -d` → wait for healthy → run the module's smoke curl.
4. New env vars added to `.env.example`.
5. New migrations pass `flyway validate` (Spring startup succeeds).
6. If the change touches AI, new curl includes an `X-Request-Id` and the value appears in both `docker logs syncpoint-backend` and `docker logs syncpoint-ai`.
7. `syncpoint-appliance` image builds and boots (`docker build -f Dockerfile.appliance . && docker run --rm -p 4200:4200 syncpoint-appliance` → healthy in < 3 min).

## 16. Non-goals

Do not introduce any of the following without discussion:

- Redis-backed distributed jobs (existing `@Async` is sufficient for MVP).
- gRPC between services (HTTP/1.1 JSON matches simplicity requirement).
- Multi-region deployment topology (out of MVP scope).
- Kotlin, Scala, or a second JVM language.
- A second frontend framework.
- A dedicated microservice per bounded context.
- Kubernetes manifests (Docker Compose + the appliance image are the delivery model).

If you find yourself wanting any of these, first read [MVP-COMPLETION-PLAN.md](MVP-COMPLETION-PLAN.md) §Non-goals and PROJECT_SPEC3 §48.
