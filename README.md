# AI Compliance Evidence Collector

A B2B SaaS MVP for automated SOC 2 evidence collection, evidence
mapping, AI-assisted gap analysis, and audit-package generation.

## Architecture

-   Angular --- frontend
-   Spring Boot / Java 21 --- core backend
-   Python / FastAPI --- AI and RAG service
-   PostgreSQL --- relational data
-   Redis --- jobs/cache
-   Qdrant --- vector search
-   MinIO --- local S3-compatible evidence storage
-   Docker Compose --- local environment

## Repository

``` text
ai-compliance-evidence/
├── frontend/
├── backend/
├── ai-service/
├── database/
├── docs/
├── infrastructure/
├── docker-compose.yml
├── .env.example
├── PROJECT_SPEC.md
└── README.md
```

## Important

`PROJECT_SPEC.md` is the source of truth for implementation.

Read it before changing architecture or creating new modules.

## Local setup

Prerequisites:

-   Git
-   Docker Desktop
-   Java 21
-   Node.js LTS
-   Python 3.12+
-   Maven (or use the Maven wrapper generated in Phase 1)

### 1. Environment

Windows (PowerShell):

``` powershell
Copy-Item .env.example .env
```

macOS/Linux:

``` bash
cp .env.example .env
```

### 2. Start infrastructure

Only Postgres, Redis, Qdrant, and MinIO come up in Phase 0. The Spring
Boot, Angular, and Python services are added in later phases.

Windows (PowerShell):

``` powershell
.\infrastructure\scripts\up.ps1
# or, for logs:
.\infrastructure\scripts\dev.ps1
```

macOS/Linux (Make):

``` bash
make up
make logs
```

Direct Docker Compose (any OS):

``` bash
docker compose up -d
docker compose ps
```

### 3. Verify

Windows:

``` powershell
.\infrastructure\scripts\verify.ps1
```

macOS/Linux:

``` bash
make verify
```

Expected: `postgres`, `redis`, `qdrant`, `minio` all report OK. The MinIO
console is at http://localhost:9001 (credentials from `.env`). A bucket
named `evidence` is created automatically by the `minio-init` one-shot
container.

### 4. Stop / reset

``` powershell
# stop (preserves data)
.\infrastructure\scripts\down.ps1

# stop AND delete all local data (destructive)
.\infrastructure\scripts\reset.ps1
```

### 5. Application services (later phases)

The commands below apply once each service is scaffolded. They are
listed here for reference and do nothing yet on a fresh Phase 0 clone.

Backend (Phase 1):

``` bash
cd backend/compliance-api
./mvnw spring-boot:run
```

Frontend (Phase 2+):

``` bash
cd frontend/compliance-ui
npm install
npm start
```

AI service (Phase 5+):

``` bash
cd ai-service
python -m venv .venv
source .venv/bin/activate     # macOS/Linux
# .venv\Scripts\Activate.ps1  # Windows PowerShell
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Initial development order

1.  Repository/infrastructure bootstrap
2.  Authentication and tenant isolation
3.  SOC 2 control library
4.  Evidence management
5.  GitHub evidence collector
6.  AI analysis
7.  RAG
8.  Dashboard
9.  Audit package export
10. AWS connector

## Product rule

The application must never state that a company is "SOC 2 compliant."

It can report evidence coverage, missing evidence, AI analysis, and
human review status.

## Copilot

Use the Copilot Execution Protocol in `PROJECT_SPEC.md`.

Start with:

> Read PROJECT_SPEC.md completely. Do not write application code yet.
> Inspect the repository and propose the Phase 0 implementation plan
> only.

## Backend package base

Java base package: `com.syncpoint.compliance`

## Ports (local)

| Service    | Port(s)      |
|------------|--------------|
| Frontend (Angular via nginx) | 4200 |
| Backend    | 8080         |
| AI Service | 8000         |
| PostgreSQL | 5432         |
| Redis      | 6379         |
| Qdrant     | 6333, 6334   |
| MinIO API  | 9000         |
| MinIO UI   | 9001         |

## Quickstart — full stack

```powershell
cd c:\syncpoint
Copy-Item .env.example .env
docker compose up -d --build
.\infrastructure\scripts\verify.ps1
```

Then open http://localhost:4200 in your browser, register a user (first user
becomes OWNER), and walk through Dashboard → Controls → Evidence → Integrations
→ Audit Package.

## Backend

The Spring Boot backend (`backend/compliance-api/`) runs inside Docker by default.

Swagger UI: http://localhost:8080/swagger-ui.html
OpenAPI JSON: http://localhost:8080/v3/api-docs
Health: http://localhost:8080/actuator/health

### Quick smoke test

```powershell
# register a user + org (creates OWNER membership, returns tokens)
$body = @{
  email = 'owner@example.com'
  password = 'very-strong-password'
  name = 'Owner One'
  organizationName = 'Acme Compliance'
} | ConvertTo-Json
$reg = Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/v1/auth/register `
  -ContentType application/json -Body $body

# call /auth/me with the access token
Invoke-RestMethod -Uri http://localhost:8080/api/v1/auth/me `
  -Headers @{ Authorization = "Bearer $($reg.accessToken)" }
```

### Running outside Docker

Requires Java 21 + Maven 3.9+ installed locally.

```powershell
cd backend/compliance-api
mvn spring-boot:run
```

You'll need Postgres reachable at `localhost:5432` (start it with `docker compose up -d postgres`).

### Tests

Integration tests use Testcontainers (spin up a disposable Postgres). Docker must be running.

```powershell
cd backend/compliance-api
mvn verify
```
