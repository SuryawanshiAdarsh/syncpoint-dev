# Local Development Environment Setup

Everything a new engineer needs to go from `git clone` to a running full stack
(backend + frontend + AI service + Postgres + Redis + Qdrant + MinIO + Mailpit)
on their own machine. If you only want to **try** the product (not develop it),
use the [root README's 2-minute quickstart](../README.md) instead — that path
pulls prebuilt images from Docker Hub and needs no source code at all. This
guide is for people who will actually **write code**.

## 1. Prerequisites

| Tool | Version | Required for |
|---|---|---|
| **Git** | any recent | cloning the repo |
| **Docker Desktop** (or Docker Engine + Compose v2 on Linux) | 24+ | running everything — this is the only hard requirement |
| **Java JDK** | 21 | only if you want to build/run the backend outside Docker (e.g. from IntelliJ) |
| **Node.js** | 20.x | only if you want to run the frontend outside Docker with hot-reload |
| **npm** | bundled with Node 20 | same as above |

If you only ever run things through `docker compose`, you technically don't
need Java or Node installed at all — the Dockerfiles bring their own. Most
people still install both locally so their IDE gets real autocomplete/type
checking.

## 2. Clone and configure

```powershell
git clone <your-fork-or-remote-url> syncpoint-dev
cd syncpoint-dev
Copy-Item .env.example .env
```

```bash
# macOS/Linux
git clone <your-fork-or-remote-url> syncpoint-dev
cd syncpoint-dev
cp .env.example .env
```

Open `.env` and check the values. For local development the defaults in
`.env.example` work as-is (weak passwords, no LLM key, ephemeral secret-store
key) — **do not** use these defaults for anything beyond your own machine.

Two values worth knowing about:
- `JWT_SECRET` — any 32+ character string is fine locally.
- `SECRET_STORE_MASTER_KEY` — leave blank for local dev. The backend will log a
  loud warning and generate a temporary key each restart (stored integration
  credentials won't survive a restart, which is fine for dev/demo data). Real
  deployments set `SECRET_STORE_REQUIRE_MASTER_KEY=true` and require a real
  key — see [DEPLOYMENT.md](DEPLOYMENT.md) / `deploy/README.md`.

## 3. Start the full stack

From the repo root:

```powershell
docker compose up -d --build
```

First run takes a few minutes (Maven + npm downloads get cached after that).
Subsequent runs of `docker compose up -d` (without `--build`) are seconds.

Check everything came up healthy:

```powershell
docker compose ps
```

You want to see `postgres`, `redis`, `qdrant`, `minio`, `minio-init` (exits
after running once — that's expected), `mailpit`, `ai-service`, `backend`, and
`frontend` all `Up` (backend/postgres show a health status too).

### Ports you'll use

| Port | What | Notes |
|---|---|---|
| **4200** | Frontend (Angular via nginx) | main app — start here |
| **8080** | Backend API | direct access, useful for `curl`/Postman |
| **8025** | Mailpit web UI | every password-reset/invite/verify email the backend sends lands here — nothing ever leaves your machine |
| **9001** | MinIO console | inspect uploaded evidence files |
| 5432 | Postgres | direct DB access if you need `psql`/a GUI client |
| 6379 | Redis | rarely needed directly |
| 6333/6334 | Qdrant | rarely needed directly |
| 8000 | AI service (Python/FastAPI) | direct access for debugging AI mapping |

## 4. Load demo data (optional but recommended)

The app boots with an empty database (just the SOC 2 control catalog, seeded
automatically by a Flyway repeatable migration). To get a fully populated demo
tenant (evidence, policies, risks, integrations, etc.):

```powershell
docker compose cp database/seed/demo.sql postgres:/tmp/demo.sql
docker compose exec postgres psql -U compliance -d compliance -v ON_ERROR_STOP=1 -f /tmp/demo.sql
```

Same commands work unmodified on macOS/Linux. **Do not** pipe the file through
`Get-Content | psql` on Windows — that has corrupted non-ASCII characters in
the past. The `cp` + `-f` approach above copies the file as raw bytes and is
safe everywhere.

## 5. Log in

Open **http://localhost:4200** and sign in with the seeded demo account:

```
Email:    demo-owner@syncpoint.local
Password: demo-password-2026
```

Or click **Create an organization** to register your own tenant from scratch.

## 6. Day-to-day commands

```powershell
# Rebuild + restart just one service after a code change
docker compose up -d --build backend
docker compose up -d --build frontend

# Tail logs
docker compose logs -f backend
docker compose logs -f ai-service

# Stop everything, keep data
docker compose down

# Stop everything, wipe all data (fresh database next start)
docker compose down -v

# Restart a single container without rebuilding
docker compose restart backend
```

## 7. Faster frontend iteration (optional — hot reload)

Rebuilding the Docker image on every frontend change is slow. For active
frontend work, keep the backend + supporting services running in Docker, but
run Angular's dev server locally with hot reload:

```powershell
# 1. Start everything EXCEPT frontend
docker compose up -d postgres redis qdrant minio minio-init mailpit ai-service backend
```

Create a one-time local proxy config (not committed — this is a personal dev
convenience file) at `frontend/compliance-ui/proxy.conf.json`:

```json
{
  "/api": { "target": "http://localhost:8080", "secure": false },
  "/actuator": { "target": "http://localhost:8080", "secure": false }
}
```

Then run the dev server against it:

```powershell
cd frontend/compliance-ui
npm install
npx ng serve --host 0.0.0.0 --port 4200 --proxy-config proxy.conf.json
```

This is needed because the app's API calls are relative (`/api/v1/...`) — in
the Docker frontend, nginx proxies those to the backend container; in plain
`ng serve` there's no proxy unless you add one yourself, hence the file above.

## 8. Working on the backend outside Docker (optional)

You can import `backend/compliance-api` into IntelliJ/VS Code as a normal
Maven project and run `ComplianceApplication` directly, pointing it at the
Dockerized Postgres/Redis/Qdrant/MinIO (all exposed on `localhost` per the
ports table above — set `SPRING_PROFILES_ACTIVE=default` and the DB/S3/etc.
env vars to `localhost` instead of the Docker service names).

**Known gotcha**: if your machine has a corporate Maven `settings.xml` that
mirrors all repositories through an internal Nexus, and that Nexus isn't
reachable from your network, local `mvn compile`/IDE builds will fail to
resolve dependencies even though the project's own `pom.xml` only depends on
public Maven Central artifacts. If that happens, don't fight it — `docker
compose build backend` resolves dependencies through Docker's own network path
and works reliably; treat it as your ground-truth build/compile check instead
of local Maven.

## 9. Troubleshooting

| Symptom | Fix |
|---|---|
| `docker compose up` fails with a container-name conflict | Another Compose project is using the same container name. Docker container names are global on the host regardless of project. Run `docker compose down` (not `stop`) on whatever else is running, then retry. |
| Docker Desktop seems hung / `docker ps` errors even though the app is "Running" | `Get-Process "Docker Desktop" \| Stop-Process -Force`, relaunch Docker Desktop, wait ~30s, retry. |
| Backend container keeps restarting / unhealthy | `docker compose logs backend` — almost always a Postgres connection issue (wrong env var) or a Flyway migration failure on a half-migrated volume. If the volume is corrupted beyond repair for a dev box, `docker compose down -v` and start clean. |
| Non-ASCII characters (em-dashes, curly quotes) get mangled after loading a `.sql` file | You piped the file through a shell redirect/`Get-Content` instead of using `docker compose cp` + `psql -f` (§4 above). |
| Frontend shows blank page / console 404s on `/assets/...` | You're opening the built `dist/` output directly via `file://` instead of through a real HTTP server (nginx via Docker, or `ng serve`). Root-relative asset paths don't resolve under `file://`. |
| Multi-line PowerShell command hangs or silently truncates | Prefer single-line, semicolon-chained PowerShell commands over multi-line here-strings, especially for REST test scripts. |

## 10. Where to go next

- [ARCHITECTURE.md](ARCHITECTURE.md) — backend module layout, tenancy model, security filter chain
- [FRONTEND-ARCHITECTURE.md](FRONTEND-ARCHITECTURE.md) — Angular structure, `@ui`/`@captions` conventions
- [STATUS.md](STATUS.md) — what's built, what's in progress right now
- [SOC2-READINESS-BACKLOG.md](SOC2-READINESS-BACKLOG.md) — prioritized list of what to build next
