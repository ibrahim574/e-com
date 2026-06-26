#!/usr/bin/env bash
#
# Restore a full backup created from Admin > Backup.
# Usage: ./scripts/restore.sh <backup.tar.gz>
#
# Restores: database, all uploaded files, and the environment snapshot.
# Override the compose file with COMPOSE_FILE=docker-compose.public.yml ./scripts/restore.sh ...

set -euo pipefail

ARCHIVE="${1:-}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

if [ -z "$ARCHIVE" ] || [ ! -f "$ARCHIVE" ]; then
  echo "Usage: ./scripts/restore.sh <backup.tar.gz>"
  exit 1
fi

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "[restore] Extracting archive..."
tar -xzf "$ARCHIVE" -C "$WORK"

# 1. Restore env snapshot to .env (without clobbering an existing one).
if [ -f "$WORK/.env.backup" ]; then
  if [ -f .env ]; then
    cp "$WORK/.env.backup" .env.restored
    echo "[restore] .env already exists; saved snapshot as .env.restored (review & merge)."
  else
    cp "$WORK/.env.backup" .env
    chmod 600 .env
    echo "[restore] Wrote .env from snapshot."
  fi
fi

# Load POSTGRES_* so psql targets the right user/db.
set -a
# shellcheck disable=SC1091
[ -f .env ] && . ./.env
set +a
PG_USER="${POSTGRES_USER:-postgres}"
PG_DB="${POSTGRES_DB:-radio_store}"

# 2. Restore uploaded files.
echo "[restore] Restoring uploaded files..."
for dir in public/products/uploads public/hero/uploads public/featured/uploads public/site/uploads uploads; do
  if [ -d "$WORK/$dir" ]; then
    mkdir -p "$dir"
    cp -a "$WORK/$dir/." "$dir/" 2>/dev/null || true
  fi
done

# 3. Start the database and wait until it is ready.
echo "[restore] Starting database..."
docker compose -f "$COMPOSE_FILE" up -d db
echo "[restore] Waiting for Postgres to accept connections..."
until docker compose -f "$COMPOSE_FILE" exec -T db pg_isready -U "$PG_USER" >/dev/null 2>&1; do
  sleep 2
done

# 4. Restore the database dump (the dump uses --clean --if-exists, so it is idempotent).
echo "[restore] Restoring database into '$PG_DB'..."
docker compose -f "$COMPOSE_FILE" exec -T db psql -v ON_ERROR_STOP=0 -U "$PG_USER" -d "$PG_DB" < "$WORK/db.sql"

# 5. Bring up the full stack.
echo "[restore] Building and starting the application..."
docker compose -f "$COMPOSE_FILE" up -d --build

echo "[restore] Done. The store has been restored from $ARCHIVE."
