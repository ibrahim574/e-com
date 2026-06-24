#!/bin/sh
set -e

npx prisma migrate deploy

if [ "$RUN_DB_SEED" = "true" ]; then
  npx prisma db seed
fi

exec node server.js
