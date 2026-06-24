#!/bin/sh
set -e
cd "$(dirname "$0")"
docker compose --env-file .env.public -f docker-compose.public.yml up -d --build "$@"
