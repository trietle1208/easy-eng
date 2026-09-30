#!/bin/sh
set -eu

# Subcommands for one-off jobs in the production image:
#   docker compose run --rm web seed --content
#   docker compose run --rm web seed --demo
if [ "${1:-}" = "seed" ]; then
  shift
  echo "[entrypoint] Seeding database..."
  exec node /app/seed.cjs "$@"
fi

echo "[entrypoint] Running database migrations..."
node /app/migrate.cjs

echo "[entrypoint] Starting Next.js server..."
exec node server.js
