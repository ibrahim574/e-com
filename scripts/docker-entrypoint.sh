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

echo "[entrypoint] Applying database migrations..."
if ! su-exec nextjs npx prisma migrate deploy; then
  echo "[entrypoint] WARNING: 'prisma migrate deploy' failed. Continuing so the app can start; check DATABASE_URL and the db service."
fi

if [ "$RUN_DB_SEED" = "true" ]; then
  echo "[entrypoint] Seeding database (RUN_DB_SEED=true)..."
  if ! su-exec nextjs npx prisma db seed; then
    echo "[entrypoint] WARNING: 'prisma db seed' failed. Continuing without seed data."
  fi
fi

echo "[entrypoint] Starting Next.js on port ${PORT:-3000}..."
exec su-exec nextjs node server.js
