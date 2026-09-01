# Database

## Where the migrations actually live

The Flyway migrations for the backend live in the backend's Java classpath:

```
backend/compliance-api/src/main/resources/db/migration/
    V1__baseline.sql
    V2__organizations.sql
    V3__users.sql
    V4__organization_members.sql
    V5__audit_events.sql
    V6__audit_events_metadata.sql
    V7__secret_records.sql
    V8__frameworks.sql
    V9__controls.sql
    V10__evidence.sql
    V11__integrations.sql
    V12__collection_runs.sql
    V13__export_jobs.sql
    V14__ai_analysis.sql
    R__seed_soc2_demo.sql              (repeatable — SOC 2 framework + 15 controls)
```

This is the Flyway default location and lets the backend apply migrations
automatically at every startup without any extra tooling. The repo-root
`database/` directory (this folder) is kept as an organisational anchor per
PROJECT_SPEC §5 and holds:

- **This README** — pointing at the classpath location.
- **`seed/`** — optional SQL scripts a developer can run against a
  running database to load throwaway demo data. These are *not* Flyway
  migrations; they are DBA-style helper scripts.
- **`migrations/`** — currently empty (a `.gitkeep` sentinel). If a
  future component needs its own migrations distinct from the backend
  (e.g. an admin service or a separate schema for reporting), they can
  live here.

## Schema at a glance

The applied schema after V14 + `R__seed_soc2_demo`:

```
organizations
users
organization_members            (role: OWNER | ADMIN | REVIEWER | VIEWER)
audit_events                    (metadata JSONB)
secret_records                  (envelope-encrypted provider credentials)
frameworks                      + seeded with SOC 2 (DEMO)
controls                        + seeded with 15 demo controls
evidence
evidence_versions               (append-only)
evidence_control_mappings       (AI_SUGGESTED | HUMAN_CONFIRMED | HUMAN_REJECTED)
evidence_reviews                (APPROVED | REJECTED)
integrations                    (PENDING | CONNECTED | ERROR | DISCONNECTED)
collection_runs                 (QUEUED | RUNNING | COMPLETED | PARTIAL | FAILED)
collection_items                (SUCCESS | SKIPPED | FAILED)
export_jobs                     (QUEUED | RUNNING | COMPLETED | FAILED)
ai_analysis                     (provider, model, prompt_version, result JSONB)
flyway_schema_history           (Flyway internal)
```

Every tenant-scoped table carries `organization_id` with a foreign key and
an index. Refer to
[docs/architecture/evidence-data-flow.md](../docs/architecture/evidence-data-flow.md)
for the entity narrative.

## Applying migrations

Migrations are applied automatically by the backend on startup — nothing to
do by hand.

If you want to inspect them from psql:

```powershell
# from inside the postgres container
docker compose exec -T postgres psql -U compliance -d compliance -c `
    "SELECT version, description, success, installed_on
     FROM flyway_schema_history
     ORDER BY installed_rank;"
```

## Running the demo seed (optional)

`seed/demo.sql` inserts a self-contained *demo tenant*: one demo org, two
users, a small stack of evidence, mappings, and a completed collection run.
It's designed so you can `docker compose up`, run the file, and the demo
account is immediately populated.

Because it inserts BCrypt-hashed passwords, the file is safe to run
directly against a fresh database. Details:

- **Login:** `demo-owner@syncpoint.local` / `demo-password-2026`
- **Login:** `demo-reviewer@syncpoint.local` / `demo-password-2026`
- **Organization:** *Demo Corp*
- **Sample evidence:** three artifacts covering CC6.1, CC6.3, and CC8.1.

Load it from the host with:

```powershell
docker compose exec -T postgres psql -U compliance -d compliance `
    < .\database\seed\demo.sql
```

or from inside the container:

```powershell
docker compose exec -T postgres psql -U compliance -d compliance `
    -f /docker-entrypoint-initdb.d/demo.sql
```

To wipe and re-run:

```powershell
docker compose down -v      # destroys the postgres volume
docker compose up -d        # migrations re-apply
docker compose exec -T postgres psql -U compliance -d compliance `
    < .\database\seed\demo.sql
```

## Full reset

```powershell
docker compose down -v
docker compose up -d
```

That's it. Flyway will replay every migration and re-run the repeatable
seed automatically.
