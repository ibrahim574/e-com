#!/bin/sh

echo "[entrypoint] Ensuring product uploads directory exists..."
mkdir -p public/products/uploads

echo "[entrypoint] Applying database migrations..."
if ! npx prisma migrate deploy; then
  echo "[entrypoint] WARNING: 'prisma migrate deploy' failed. Continuing so the app can start; check DATABASE_URL and the db service."
fi

if [ "$RUN_DB_SEED" = "true" ]; then
  echo "[entrypoint] Seeding database (RUN_DB_SEED=true)..."
  if ! npx prisma db seed; then
    echo "[entrypoint] WARNING: 'prisma db seed' failed. Continuing without seed data."
  fi
fi

echo "[entrypoint] Starting Next.js on port ${PORT:-3000}..."
exec node server.js
