# Syncpoint Compliance — Deploy from Docker Hub

Pre-built images for all three application services are published to Docker
Hub under `adarshs1612/syncpoint-*`. Anyone with Docker installed can pull and
run the full 7-service stack with just two files — no source clone, no build.

## Images (pulled, not built)

- `adarshs1612/syncpoint-backend:0.8.0`
- `adarshs1612/syncpoint-ai-service:0.8.0`
- `adarshs1612/syncpoint-frontend:0.8.0`

Plus stock images pulled from Docker Hub (third-party base images, not
Syncpoint's own): `postgres:16-alpine`, `redis:7-alpine`,
`qdrant/qdrant:latest`, `minio/minio:latest`, `minio/mc:latest`, `axllent/mailpit:latest`.

## Quickstart (recipient side)

Only requires **Docker Desktop 24+** or **Docker Engine 24+** with Compose v2
— no git clone needed, just the two files in this folder
(`docker-compose.hub.yml` and `.env.example`).

```bash
# 1. Configure
cp .env.example .env

# 1a. Generate a required secret-store master key and put it in .env
#     (macOS/Linux): openssl rand -base64 32
#     (Windows PowerShell): [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
#     Paste the output as SECRET_STORE_MASTER_KEY= in .env -- the backend will refuse to start
#     without it (this deployment sets SECRET_STORE_REQUIRE_MASTER_KEY=true on purpose, so a
#     stored integration credential can never silently vanish on a restart).

# 2. Pull and start everything
docker compose -f docker-compose.hub.yml up -d

# 3. Wait ~30s for backend healthcheck to go green
docker compose -f docker-compose.hub.yml ps

# 4. Open the UI
open http://localhost:4200
```

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
renewal requests, a Type II compliance program with a full system description,
9 control owners, 8 risk-register entries, and 4 control exceptions, etc. —
see `database/seed/demo.sql`'s header comment for the full list).

1. Also share `database/seed/demo.sql` alongside the two files above.
2. Start the stack and wait for it to be healthy (step 2-3 in Quickstart).
3. Load the seed — copy the file into the Postgres container and run it with
   `psql -f`, rather than piping through stdin. This avoids a real, previously
   -hit bug where PowerShell's default stdin encoding silently corrupts
   em-dashes and other non-ASCII characters in the seed's text (Windows and
   macOS/Linux both use the same commands below, only the container name
   differs if you changed it):

   ```bash
   docker compose -f docker-compose.hub.yml cp demo.sql postgres:/tmp/demo.sql
   docker compose -f docker-compose.hub.yml exec postgres \
       psql -U compliance -d compliance -v ON_ERROR_STOP=1 -f /tmp/demo.sql
   ```

   ```powershell
   # Windows PowerShell — identical commands, no `-Encoding`/redirection
   # workarounds needed since the file is copied as raw bytes, not piped.
   docker compose -f docker-compose.hub.yml cp demo.sql postgres:/tmp/demo.sql
   docker compose -f docker-compose.hub.yml exec postgres `
       psql -U compliance -d compliance -v ON_ERROR_STOP=1 -f /tmp/demo.sql
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
setup, except for `SECRET_STORE_MASTER_KEY` -- that one is enforced at startup
(`SECRET_STORE_REQUIRE_MASTER_KEY=true` in `docker-compose.hub.yml`) and the
backend will fail to boot without it, on purpose. Before exposing this to real
users, at minimum:

- Set a real `JWT_SECRET` (32+ random bytes)
- Change all `change-me` passwords
- Tighten `CORS_ALLOWED_ORIGINS` to the real frontend host

Rotating `SECRET_STORE_MASTER_KEY` after it's in use re-encrypts nothing
automatically -- every previously-stored integration credential becomes
unreadable and each integration must be reconnected. Treat it as a one-time
setup value, not something to change casually.

The application does not put itself behind TLS — front it with a reverse proxy
(nginx/Caddy/Cloudflare) that terminates HTTPS.

## Version

As of 2026-09-04, this repository no longer publishes prebuilt images to
Docker Hub. Build and run locally:

```bash
docker compose -f deploy/docker-compose.hub.yml up -d --build
```

To pick up new source changes, rebuild and restart:

```bash
docker compose -f deploy/docker-compose.hub.yml up -d --build
```
