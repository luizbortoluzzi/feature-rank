#!/usr/bin/env bash
# =============================================================================
# create-seed-dump.sh — Create the initial demo database seed dump
# =============================================================================
# Run this ONCE after the first successful deployment to capture the clean
# demo state. The dump is stored outside the repo (at SEED_PATH) so it is
# never accidentally committed, but is preserved across deployments.
#
# The daily reset script (reset-db.sh) restores from this dump.
#
# Usage:
#   ./scripts/create-seed-dump.sh
#
# Prerequisites:
#   - Stack is running: docker compose -f docker-compose.prod.yml ... up -d
#   - Database has been migrated and seeded:
#       docker exec feature-rank-backend python manage.py seed_reference_data
#       docker exec feature-rank-backend python manage.py seed_demo_data
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$REPO_DIR/.env.prod"
SEED_PATH="/opt/demo-apps/feature-rank/seed.sql"

# ── Load env vars ─────────────────────────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found." >&2
  exit 1
fi
# shellcheck disable=SC1090
set -o allexport; source "$ENV_FILE"; set +o allexport

echo "==> [create-seed-dump] Dumping database to $SEED_PATH..."

# Ensure target directory exists
mkdir -p "$(dirname "$SEED_PATH")"

# Dump from the running MySQL container.
# --single-transaction ensures a consistent snapshot without locking tables.
# --no-tablespaces avoids privilege errors when running as a non-root DB user.
docker exec feature-rank-db mysqldump \
  --user="$MYSQL_USER" \
  --password="$MYSQL_PASSWORD" \
  --single-transaction \
  --no-tablespaces \
  --routines \
  --triggers \
  "$MYSQL_DATABASE" > "$SEED_PATH"

echo "==> [create-seed-dump] Dump written to $SEED_PATH"
echo "    Size: $(du -h "$SEED_PATH" | cut -f1)"
echo ""
echo "    The daily reset cron job (scripts/cron-reset.sh) will restore from this file."
echo "    Re-run this script any time you want to update the baseline demo state."
