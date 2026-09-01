# System Architecture

## 1. Product boundary

Syncpoint Compliance is an **evidence automation system** for SOC 2. It helps
customers collect, organize, map, review, and export compliance evidence.

It is explicitly **not**:

- a certification engine,
- an autonomous compliance decision-maker,
- a substitute for a licensed CPA auditor.

Formal architecture principle (PROJECT_SPEC2 §75):

> **Code determines facts. AI interprets. Humans make final judgments.**

## 2. High-level component diagram

```
                            Customer (browser)
                                    │
                                    ▼
                     ┌──────────────────────────┐
                     │  Angular 18 UI (nginx)   │  frontend
                     └──────────────────────────┘
                                    │  (proxied /api, /actuator)
                                    ▼
                     ┌──────────────────────────┐
                     │  Spring Boot backend     │  backend
                     │  Java 21 · Boot 3.3      │
                     └──────────────────────────┘
                                    │
      ┌──────────────┬──────────────┼──────────────┬──────────────────┐
      ▼              ▼              ▼              ▼                  ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌──────────────┐
│PostgreSQL│  │  MinIO   │  │  Redis   │  │ AI service   │  │ Provider APIs│
│ Metadata │  │ Evidence │  │ (jobs)   │  │ FastAPI      │  │ GitHub, etc. │
└──────────┘  └──────────┘  └──────────┘  └──────────────┘  └──────────────┘
                                                 │
                                                 ▼
                                          ┌──────────────┐
                                          │   Qdrant     │
                                          │ vector store │
                                          └──────────────┘
```

## 3. Service responsibilities

### Frontend — `frontend/compliance-ui/`
- Angular 18, standalone components, Angular Material.
- Consumes only the backend REST API. Never talks directly to Postgres,
  MinIO, Qdrant, or the AI service.
- Bundled with nginx for production; nginx also reverse-proxies `/api/*`
  and `/actuator/*` to the backend so the browser never crosses a CORS
  boundary in dev/demo.
- Auth: JWT in `localStorage`, injected on every request by an HTTP
  interceptor. 401 responses trigger auto-logout.

### Backend — `backend/compliance-api/`
- Spring Boot 3.3, Java 21.
- Owns the domain model, authorization, tenant isolation, evidence
  lifecycle, integrations lifecycle, and audit-package export.
- Feature-oriented packaging under `com.syncpoint.compliance`:
  `auth/`, `organization/`, `compliance/`, `evidence/`, `integrations/`,
  `collection/`, `ai/`, `audit/`, `export/`, `common/`, `storage/`, `config/`.
- Every connector is behind an `EvidenceCollector` interface; the evidence
  service never contains provider-specific code.

### AI service — `ai-service/`
- Python 3.12, FastAPI, Pydantic.
- Two provider-agnostic abstractions: `LLMProvider` and `EmbeddingProvider`.
- Ships with deterministic stub providers so the full product demos with no
  external API keys; swap `LLM_PROVIDER=openai` (etc.) at runtime.
- Endpoints: `/health`, `/classify`, `/map-evidence`, `/analyze-gap`,
  `/rag/query`.

### PostgreSQL
- Sole source of truth for structured application data.
- Every tenant-owned table carries `organization_id`.
- Migrations managed by Flyway; live in the backend classpath under
  `backend/compliance-api/src/main/resources/db/migration/`.

### MinIO (S3)
- Stores evidence file bytes and generated audit-package ZIPs.
- Storage keys are always `organizations/{orgId}/evidence/{evidenceId}/{versionId}`
  or `organizations/{orgId}/exports/{jobId}.zip` — never user-controlled paths.

### Redis
- Reserved for future job queueing and idempotency keys.
- Currently reachable but unused by the app code; keeps the compose topology
  future-proof.

### Qdrant
- Backs the RAG demo corpus. AI service seeds it at startup from the
  demo compliance-knowledge documents.

## 4. Data flow at request time

1. Browser sends `POST /api/v1/auth/login` → nginx proxies to backend.
2. Backend validates credentials, mints JWT (HS256, 15-min access), returns tokens.
3. UI stores tokens; every subsequent request carries `Authorization: Bearer …`.
4. Backend `JwtAuthenticationFilter` populates `SecurityContext` and
   `TenantContext` (ThreadLocal with `userId`, `organizationId`, `role`).
5. Repositories always filter by `TenantContext.require().organizationId()`.
6. `finally`-block on the filter clears both contexts before releasing the thread.

## 5. Deployment topologies

- **Dev / local demo**: `docker-compose.yml` at repo root builds every image
  locally.
- **Recipient demo (Docker Hub)**: `deploy/docker-compose.hub.yml` pulls
  `adarshs1612/syncpoint-*:0.1.0` and exposes only the frontend port.
- **Production (target)**: reverse proxy for TLS + WAF, managed Postgres,
  managed object storage, managed Qdrant, injected secrets (KMS-backed
  `SECRET_STORE_MASTER_KEY`).

## 6. Where things run and what they can reach

| Layer         | Reaches                              | Cannot reach directly            |
|---------------|---------------------------------------|----------------------------------|
| Browser       | Frontend only                         | Backend, AI, Postgres, Qdrant, MinIO |
| Frontend/nginx| Backend                               | Postgres, AI, Qdrant, MinIO      |
| Backend       | Postgres, MinIO, AI, Provider APIs    | Qdrant directly (goes via AI)    |
| AI service    | Qdrant, LLM/embedding provider APIs   | Postgres, MinIO                  |

This layering is what makes multi-tenant isolation defensible: the browser
cannot bypass the backend, and the AI service does not have access to raw
customer secrets stored in Postgres.
