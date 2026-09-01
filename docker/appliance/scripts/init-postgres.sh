#!/usr/bin/env bash
# First-boot initialisation for the embedded PostgreSQL instance.
# Idempotent — no-op when $PGDATA already contains a cluster.
set -euo pipefail

: "${PGDATA:?PGDATA not set}"
: "${POSTGRES_DB:?POSTGRES_DB not set}"
: "${POSTGRES_USER:?POSTGRES_USER not set}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD not set}"

PG_BIN=/usr/lib/postgresql/15/bin

if [ -s "$PGDATA/PG_VERSION" ]; then
    exit 0
fi

mkdir -p "$PGDATA"
chown -R postgres:postgres "$PGDATA"
chmod 700 "$PGDATA"

su -s /bin/bash postgres -c \
    "$PG_BIN/initdb -D '$PGDATA' --auth-local=trust --auth-host=scram-sha-256 --username='$POSTGRES_USER' --pwfile=<(echo '$POSTGRES_PASSWORD')"

# Start temporarily on the loopback to create the application database.
su -s /bin/bash postgres -c \
    "$PG_BIN/pg_ctl -D '$PGDATA' -w -o '-c listen_addresses=127.0.0.1 -p 5432' start"

su -s /bin/bash postgres -c \
    "$PG_BIN/psql -U '$POSTGRES_USER' -d postgres -c \"CREATE DATABASE $POSTGRES_DB OWNER $POSTGRES_USER;\""

su -s /bin/bash postgres -c \
    "$PG_BIN/pg_ctl -D '$PGDATA' -m fast -w stop"

echo "postgres cluster initialised at $PGDATA"
