#!/bin/sh
set -e

UPLOAD_DIRS="
public/products/uploads
public/hero/uploads
public/featured/uploads
public/site/uploads
uploads/invoices
uploads/expenses
uploads/invoice-logos
"

echo "[entrypoint] Ensuring upload directories exist and are writable..."
for dir in $UPLOAD_DIRS; do
  mkdir -p "$dir"
  chown -R nextjs:nodejs "$dir"
done

# Wait for Postgres on the Docker network (hostname "db"). depends_on + healthcheck
# can still race; pg_isready is installed in the runner image.
DB_HOST="${DATABASE_HOST:-db}"
DB_PORT="${DATABASE_PORT:-5432}"
DB_USER="${DATABASE_USER:-postgres}"
echo "[entrypoint] Waiting for database at ${DB_HOST}:${DB_PORT}..."
TRIES=0
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -q; do
  TRIES=$((TRIES + 1))
  if [ "$TRIES" -ge 60 ]; then
    echo "[entrypoint] ERROR: database not reachable after 60s."
    echo "[entrypoint] Check: docker ps, both app+db on same compose network, DATABASE_URL host is 'db'."
    exit 1
  fi
  sleep 1
done
echo "[entrypoint] Database is ready."

echo "[entrypoint] Applying database migrations..."
if ! su-exec nextjs npx prisma migrate deploy; then
  echo "[entrypoint] ERROR: prisma migrate deploy failed."
  exit 1
fi

if [ "$RUN_DB_SEED" = "true" ]; then
  echo "[entrypoint] Seeding database (RUN_DB_SEED=true)..."
  if ! su-exec nextjs npx prisma db seed; then
    echo "[entrypoint] WARNING: 'prisma db seed' failed. Continuing without seed data."
  fi
fi

echo "[entrypoint] Starting Next.js on port ${PORT:-3000}..."
exec su-exec nextjs node server.js
