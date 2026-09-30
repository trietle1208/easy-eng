#!/bin/sh
# Nightly Postgres dump with retention (default 7 days).
# Used by the `backup` Compose service; also runnable on the host:
#   PGHOST=localhost PGUSER=easy PGPASSWORD=easy PGDATABASE=easy_english ./scripts/pg-backup.sh
set -eu

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${BACKUP_DIR}/easy_english_${STAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"
echo "[backup] Writing ${OUT}"
pg_dump --no-owner --no-acl | gzip -c >"$OUT"
echo "[backup] Done ($(wc -c <"$OUT") bytes)"

# Prune old dumps
find "$BACKUP_DIR" -type f -name 'easy_english_*.sql.gz' -mtime "+${RETENTION_DAYS}" -print -delete || true
