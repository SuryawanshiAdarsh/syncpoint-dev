# Syncpoint Compliance

A B2B SaaS MVP for automated SOC 2 evidence collection, evidence
mapping, AI-assisted gap analysis, and audit-package generation.

## Try it in 2 minutes (any machine with Docker Desktop)

You do **not** need to clone the repo. Two files are enough.

```powershell
# 1. Create a scratch folder
mkdir syncpoint-demo; cd syncpoint-demo

# 2. Grab the compose file and env template
curl -O https://raw.githubusercontent.com/SuryawanshiAdarsh/syncpoint-dev/main/deploy/docker-compose.hub.yml
curl -O https://raw.githubusercontent.com/SuryawanshiAdarsh/syncpoint-dev/main/deploy/.env.example
Copy-Item .env.example .env

# 3. Pull + start
docker compose -f docker-compose.hub.yml up -d

# 4. Wait ~30 seconds, then open
start http://localhost:4200
```

Then click **Register** on the sign-in screen to create your first tenant. That's it — no CLI, no seed script needed.

macOS / Linux is identical apart from `cp` instead of `Copy-Item`:

```bash
mkdir syncpoint-demo && cd syncpoint-demo
curl -O https://raw.githubusercontent.com/SuryawanshiAdarsh/syncpoint-dev/main/deploy/docker-compose.hub.yml
curl -O https://raw.githubusercontent.com/SuryawanshiAdarsh/syncpoint-dev/main/deploy/.env.example
cp .env.example .env
docker compose -f docker-compose.hub.yml up -d
open http://localhost:4200
```

The stack pulls `syncpoint-backend:0.5.0`, `syncpoint-ai-service:0.5.0`, and `syncpoint-frontend:0.5.0` from Docker Hub, plus stock images for Postgres, Redis, Qdrant, and MinIO. Total download ≈ 700 MB.

### Ports opened

| Port | Service |
|---|---|
| 4200 | Angular UI (front door) — nginx proxies `/api/*` and `/actuator/*` to the backend |
| 9001 | MinIO console (evidence blobs) — optional, for inspecting evidence uploads |

Backend, AI service, Postgres, Redis, Qdrant, and MinIO API are **not** exposed on the host — everything happens on the internal Docker network.

### Shut it down / wipe state

```powershell
docker compose -f docker-compose.hub.yml down            # stop but keep data
docker compose -f docker-compose.hub.yml down -v         # stop and delete all data
```

### Bring your own OpenAI key (optional)

Set these in `.env` before `docker compose up -d`:

```
LLM_PROVIDER=openai
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini
```

Without them, the AI service runs with a deterministic stub — good enough for demo and CI.

## Repository layout

``` text
syncpoint-dev/
├── frontend/                  # Angular 18 SPA
├── backend/                   # Spring Boot 3, Java 21
├── ai-service/                # FastAPI + RAG + LLM abstractions
├── database/                  # Flyway migrations + demo seed
├── deploy/
│   ├── docker-compose.hub.yml # Pull prebuilt images from Docker Hub
│   └── .env.example
├── dev-guide/                 # ARCHITECTURE, BUILD-PLAN, MVP-COMPLETION-PLAN, STATUS
├── docs/                      # Product/system specs
├── docker-compose.yml         # Local build compose (for development)
├── Dockerfile.appliance       # All-in-one image (postgres+minio+backend+ai+nginx via s6)
├── PROJECT_SPEC*.md           # Source-of-truth specifications
└── README.md                  # This file
```

## Building from source (contributors)

```powershell
git clone https://github.com/SuryawanshiAdarsh/syncpoint-dev.git
cd syncpoint-dev
Copy-Item .env.example .env
docker compose up -d --build
```

That builds `backend`, `ai-service`, and `frontend` from local sources.

Docs to read next:

- [dev-guide/ARCHITECTURE.md](dev-guide/ARCHITECTURE.md) — layer contracts, exception hierarchy, tenant isolation, config properties
- [dev-guide/MVP-COMPLETION-PLAN.md](dev-guide/MVP-COMPLETION-PLAN.md) — remaining milestones (M1–M10)
- [PROJECT_SPEC3.md](PROJECT_SPEC3.md) — MVP completion spec (source of truth)

## Prerequisites for local development

Only Docker Desktop is needed to **run** the app.
To **modify** the code you additionally need:

- Java 21 + Maven (or the Maven wrapper)
- Node.js LTS
- Python 3.12+

---

## Legacy setup instructions (superseded by the Quickstart above)

The following section is retained for anyone coming from earlier docs.

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
