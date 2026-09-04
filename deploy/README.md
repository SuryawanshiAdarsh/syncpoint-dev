# Syncpoint Compliance — Docker Hub Deploy

Prebuilt images are published on Docker Hub. Anyone with Docker installed can
run the full 7-service stack in one command.

## Images (Docker Hub)

- `adarshs1612/syncpoint-backend:0.7.0`
- `adarshs1612/syncpoint-ai-service:0.7.0`
- `adarshs1612/syncpoint-frontend:0.7.0`

Plus stock images pulled from Docker Hub: `postgres:16-alpine`, `redis:7-alpine`,
`qdrant/qdrant:latest`, `minio/minio:latest`, `minio/mc:latest`, `axllent/mailpit:latest`.

## Quickstart (recipient side)

Only requires **Docker Desktop 24+** or **Docker Engine 24+** with Compose v2.

```bash
# 1. Grab the compose + env files
curl -O https://raw.githubusercontent.com/<you>/syncpoint/main/deploy/docker-compose.hub.yml
curl -O https://raw.githubusercontent.com/<you>/syncpoint/main/deploy/.env.example
cp .env.example .env

# 2. Start everything
docker compose -f docker-compose.hub.yml up -d

# 3. Wait ~30s for backend healthcheck to go green
docker compose -f docker-compose.hub.yml ps

# 4. Open the UI
open http://localhost:4200
```

Or, if you don't have this repo published anywhere yet, just share
`docker-compose.hub.yml` + `.env.example` directly. Nothing else is needed —
the images already have the frontend, backend, migrations, and AI service
baked in.

## Ports the recipient will use

| Service        | Port | Notes                               |
|----------------|------|-------------------------------------|
| Frontend (UI)  | 4200 | Angular via nginx                   |
| MinIO console  | 9001 | Optional; view uploaded evidence    |
| Mailpit        | 8025 | Optional; view password reset / invite emails |

Backend, AI service, Qdrant, Postgres, Redis, and the MinIO S3 API are
intentionally NOT exposed — the frontend proxies `/api/*` internally.

## Load the demo data (recommended for a demo/walkthrough)

The stack above starts with an empty database — a recipient can register their
own organization and start from zero, or you can hand them the same fully
populated demo data used for screenshots/walkthroughs (15 customer orgs, 60
evidence artifacts, 4 integrations, ~48 collection runs, ~220 audit events,
renewal requests, etc. — see `database/seed/demo.sql`'s header comment for the
full list).

1. Also share `database/seed/demo.sql` alongside the two files above.
2. Start the stack and wait for it to be healthy (step 2-3 in Quickstart).
3. Load the seed:

   ```bash
   # macOS/Linux
   docker compose -f docker-compose.hub.yml exec -T postgres \
       psql -U compliance -d compliance -v ON_ERROR_STOP=1 < demo.sql
   ```

   ```powershell
   # Windows PowerShell — plain `<` redirection does not work; pipe the file
   # in with an explicit UTF-8 read, otherwise em-dashes and other non-ASCII
   # characters get silently corrupted by PowerShell's default codepage.
   Get-Content demo.sql -Raw -Encoding UTF8 | docker compose -f docker-compose.hub.yml exec -T postgres `
       psql -U compliance -d compliance -v ON_ERROR_STOP=1
   ```

4. Restart the backend once so it records today's real coverage-trend data
   point on top of the seeded history:

   ```bash
   docker compose -f docker-compose.hub.yml restart backend
   ```

5. Log in as `demo-owner@syncpoint.local` / `demo-password-2026` (this account
   is also a platform admin — see the "Admin console" link in the sidebar).

The seed is idempotent: re-running it (e.g. after `down -v` + `up -d` again)
produces the exact same data every time.

## First-run flow

1. Open http://localhost:4200
2. Click **Create an organization** and register (min 12-char password).
3. The first user becomes OWNER.
4. Upload evidence, click **AI analyze**, review, and generate an audit ZIP.

## Wipe / reset

```bash
docker compose -f docker-compose.hub.yml down -v
```

This drops Postgres, MinIO, and Qdrant volumes so a fresh start behaves like a
clean install.

## Security notes (do not skip in real deployments)

The `.env.example` bundled here is deliberately weak so the demo runs with zero
setup. Before exposing this to real users, at minimum:

- Set a real `JWT_SECRET` (32+ random bytes)
- Set a real `SECRET_STORE_MASTER_KEY` (base64 of 32 random bytes)
- Change all `change-me` passwords
- Tighten `CORS_ALLOWED_ORIGINS` to the real frontend host

The application does not put itself behind TLS — front it with a reverse proxy
(nginx/Caddy/Cloudflare) that terminates HTTPS.

## Version

Images pushed 2026-09-04 (0.7.0), git commit unknown (published from a working tree).
Regenerate images with:

```bash
docker compose build
docker tag syncpoint-backend:latest    adarshs1612/syncpoint-backend:0.7.1
docker tag syncpoint-ai-service:latest adarshs1612/syncpoint-ai-service:0.7.1
docker tag syncpoint-frontend:latest   adarshs1612/syncpoint-frontend:0.7.1
docker push adarshs1612/syncpoint-backend:0.7.1
docker push adarshs1612/syncpoint-ai-service:0.7.1
docker push adarshs1612/syncpoint-frontend:0.7.1
```
