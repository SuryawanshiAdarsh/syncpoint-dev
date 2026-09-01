# API Overview

Base path: `/api/v1` — served by the Spring Boot backend on port 8080.
When the Angular UI is running, nginx transparently proxies `/api/*` and
`/actuator/*` from `4200 → backend:8080`, so from a browser both
`http://localhost:8080/api/...` and `http://localhost:4200/api/...` work.

Interactive documentation: **[Swagger UI](http://localhost:8080/swagger-ui.html)**
· raw: **[OpenAPI JSON](http://localhost:8080/v3/api-docs)**.

## Conventions

- All timestamps are **ISO-8601 UTC** (`2026-09-01T10:15:30.123Z`).
- All ids are **UUID v4**.
- Request and response bodies are **JSON**. Uploads use `multipart/form-data`.
- Authentication: **Bearer JWT** in the `Authorization` header — except the
  four public endpoints below.
- Error format (spec §27):
  ```json
  {
    "timestamp": "2026-09-01T10:15:30.123Z",
    "status": 400,
    "code": "VALIDATION_ERROR",
    "message": "email: must be a well-formed email address",
    "path": "/api/v1/auth/register"
  }
  ```
- Rate-limited endpoints (`/auth/login`, `/auth/register`) return **429**
  with a `Retry-After` header when the bucket is exhausted.

## Public endpoints

| Method | Path                     | Purpose                                        |
|--------|--------------------------|------------------------------------------------|
| POST   | `/auth/register`         | Create org + first OWNER user; returns tokens  |
| POST   | `/auth/login`            | Email + password → tokens                      |
| POST   | `/auth/refresh`          | Refresh token → new access token               |
| GET    | `/actuator/health`       | Liveness / readiness                           |
| GET    | `/v3/api-docs`           | OpenAPI JSON                                   |
| GET    | `/swagger-ui.html`       | Interactive API docs                           |

## Authenticated endpoints

Every endpoint below requires `Authorization: Bearer <accessToken>`.

### Identity & organization

| Method | Path                                          | Role     |
|--------|-----------------------------------------------|----------|
| GET    | `/auth/me`                                    | any      |
| GET    | `/organizations/current`                      | any      |
| PATCH  | `/organizations/current`                      | OWNER    |
| GET    | `/organizations/current/members`              | any      |
| POST   | `/organizations/current/members`              | OWNER, ADMIN |
| PATCH  | `/organizations/current/members/{id}`         | OWNER    |

### Compliance framework

| Method | Path                                | Role  |
|--------|-------------------------------------|-------|
| GET    | `/frameworks`                       | any   |
| GET    | `/frameworks/{id}`                  | any   |
| GET    | `/frameworks/{id}/controls`         | any   |
| GET    | `/controls`                         | any   |
| GET    | `/controls/{id}`                    | any   |
| GET    | `/controls/{id}/evidence`           | any   |

### Evidence

| Method | Path                                  | Role                     |
|--------|---------------------------------------|--------------------------|
| GET    | `/evidence`                           | any                      |
| GET    | `/evidence/{id}`                      | any                      |
| POST   | `/evidence/upload` *(multipart)*      | OWNER, ADMIN, REVIEWER   |
| DELETE | `/evidence/{id}`                      | OWNER, ADMIN             |
| GET    | `/evidence/{id}/mappings`             | any                      |
| POST   | `/evidence/{id}/map`                  | OWNER, ADMIN, REVIEWER   |
| POST   | `/evidence/{id}/review`               | OWNER, ADMIN, REVIEWER   |
| POST   | `/evidence/{id}/analyze`              | OWNER, ADMIN, REVIEWER   |

Evidence upload form fields: `name` (optional), `description` (optional),
`file` (required; ≤ 50 MB; pdf/csv/json/txt/docx/xlsx).

### Integrations

| Method | Path                                  | Role                 |
|--------|---------------------------------------|----------------------|
| GET    | `/integrations`                       | any                  |
| GET    | `/integrations/{id}`                  | any                  |
| POST   | `/integrations/github`                | OWNER, ADMIN         |
| POST   | `/integrations/{id}/test`             | OWNER, ADMIN         |
| POST   | `/integrations/{id}/collect`          | OWNER, ADMIN         |
| DELETE | `/integrations/{id}`                  | OWNER, ADMIN         |

`POST /integrations/github` body: `{ "token": "github_pat_…", "displayName": "..." }`.
The token is never returned.

### Collections

| Method | Path                                    | Role  |
|--------|-----------------------------------------|-------|
| GET    | `/collections`                          | any   |
| GET    | `/collections?integrationId={id}`       | any   |
| GET    | `/collections/{id}`                     | any   |

`GET /collections/{id}` returns `{ run: {…}, items: [ {…} ] }`.

### Dashboard

| Method | Path                            |
|--------|---------------------------------|
| GET    | `/dashboard/summary`            |
| GET    | `/dashboard/gaps`               |
| GET    | `/dashboard/recent-evidence`    |

### AI

| Method | Path                    | Notes                                             |
|--------|-------------------------|---------------------------------------------------|
| POST   | `/evidence/{id}/analyze`| Backend → AI service; stores `ai_analysis` row   |
| POST   | `/rag/query`            | Authenticated proxy to AI `/rag/query`           |

### Export

| Method | Path                                 | Role         |
|--------|--------------------------------------|--------------|
| POST   | `/exports/audit-package`             | OWNER, ADMIN |
| GET    | `/exports/{id}`                      | any          |
| GET    | `/exports/{id}/download`             | OWNER, ADMIN |

Job model: `POST` returns 202 with a job id; `GET` polls status
(`QUEUED` → `RUNNING` → `COMPLETED` / `FAILED`); `download` returns
the ZIP.

## AI service HTTP contract

Not exposed to the browser directly. The backend calls these on the
internal Docker network at `http://ai-service:8000`.

| Method | Path            | Purpose                                          |
|--------|-----------------|--------------------------------------------------|
| GET    | `/health`       | Provider names, model, prompt version, RAG state |
| POST   | `/classify`     | Structured classification only                   |
| POST   | `/map-evidence` | Full mapping incl. supported / missing / action  |
| POST   | `/analyze-gap`  | Gap analysis over supplied evidence set          |
| POST   | `/rag/query`    | Retrieval-augmented Q&A with citations           |

All responses are Pydantic-validated. Classification is restricted to the
allowlist `COVERED / PARTIAL / INSUFFICIENT`.

## Common status codes

- **200** OK.
- **201** Created — new resource returned.
- **202** Accepted — async job queued.
- **204** No Content — delete / disconnect succeeded.
- **400 VALIDATION_ERROR** — Bean Validation failure on a request body.
- **401 UNAUTHORIZED** — missing / invalid / expired JWT.
- **403 FORBIDDEN** — authenticated but role or org mismatch.
- **404 NOT_FOUND** — resource does not exist under the caller's org.
- **409 CONFLICT** — unique-constraint violation (e.g. duplicate email).
- **415 UNSUPPORTED_TYPE** — evidence upload with a disallowed
  extension / MIME.
- **429 RATE_LIMITED** — auth endpoints only.
- **502 AI_ERROR** — backend could not reach or parse a response from the
  AI service.
- **500 INTERNAL_ERROR** — unexpected server error (always logged).

## Example: full mvp path via `curl`

```bash
BASE=http://localhost:4200/api/v1

# 1. Register
TOKENS=$(curl -sS -X POST "$BASE/auth/register" \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@syncpoint.local","password":"very-strong-password",
       "name":"Demo","organizationName":"Demo Corp"}')

ACCESS=$(echo "$TOKENS" | jq -r '.accessToken')

# 2. List controls
curl -sS "$BASE/controls" -H "Authorization: Bearer $ACCESS" | jq '.[0]'

# 3. Upload evidence
curl -sS -X POST "$BASE/evidence/upload" \
  -H "Authorization: Bearer $ACCESS" \
  -F "name=Q1 Access Review" \
  -F "file=@access-review.json;type=application/json"

# 4. Trigger an audit-package export
JOB=$(curl -sS -X POST "$BASE/exports/audit-package" \
  -H "Authorization: Bearer $ACCESS")
JOB_ID=$(echo "$JOB" | jq -r '.id')

curl -sS "$BASE/exports/$JOB_ID" -H "Authorization: Bearer $ACCESS" | jq

# 5. Download the ZIP
curl -sSL -o package.zip -H "Authorization: Bearer $ACCESS" \
  "$BASE/exports/$JOB_ID/download"
```
