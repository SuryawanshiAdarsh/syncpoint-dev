SHELL := /bin/sh

.PHONY: help up down logs ps reset env verify

help:
	@echo "Targets:"
	@echo "  make env      - copy .env.example to .env if missing"
	@echo "  make up       - start local infrastructure (postgres, redis, qdrant, minio)"
	@echo "  make down     - stop local infrastructure"
	@echo "  make logs     - tail infra logs"
	@echo "  make ps       - show container status"
	@echo "  make reset    - stop and remove volumes (DESTRUCTIVE)"
	@echo "  make verify   - basic connectivity checks against running infra"

env:
	@test -f .env || (cp .env.example .env && echo "created .env from .env.example")

up: env
	docker compose up -d
	docker compose ps

down:
	docker compose down

logs:
	docker compose logs -f --tail=200

ps:
	docker compose ps

reset:
	docker compose down -v

verify:
	@echo "postgres: " && docker compose exec -T postgres pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB || true
	@echo "redis:    " && docker compose exec -T redis redis-cli ping || true
	@echo "qdrant:   " && curl -sf http://localhost:6333/collections >/dev/null && echo OK || echo FAIL
	@echo "minio:    " && curl -sf http://localhost:9000/minio/health/live >/dev/null && echo OK || echo FAIL
	@echo "backend:  " && curl -sf http://localhost:8080/actuator/health/liveness >/dev/null && echo OK || echo FAIL
