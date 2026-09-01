# Syncpoint Compliance — Docker Hub Deploy

Prebuilt images are published on Docker Hub. Anyone with Docker installed can
run the full 7-service stack in one command.

## Images (Docker Hub)

- `adarshs1612/syncpoint-backend:0.1.0`
- `adarshs1612/syncpoint-ai-service:0.1.0`
- `adarshs1612/syncpoint-frontend:0.1.0`

Plus stock images pulled from Docker Hub: `postgres:16-alpine`, `redis:7-alpine`,
`qdrant/qdrant:latest`, `minio/minio:latest`, `minio/mc:latest`.

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

Backend, AI service, Qdrant, Postgres, Redis, and the MinIO S3 API are
intentionally NOT exposed — the frontend proxies `/api/*` internally.

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

Images pushed 2026-09-01, git commit unknown (published from a working tree).
Regenerate images with:

```bash
docker compose build
docker tag syncpoint-backend:latest    adarshs1612/syncpoint-backend:0.1.1
docker tag syncpoint-ai-service:latest adarshs1612/syncpoint-ai-service:0.1.1
docker tag syncpoint-frontend:latest   adarshs1612/syncpoint-frontend:0.1.1
docker push adarshs1612/syncpoint-backend:0.1.1
docker push adarshs1612/syncpoint-ai-service:0.1.1
docker push adarshs1612/syncpoint-frontend:0.1.1
```
