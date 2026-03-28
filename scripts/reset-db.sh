#!/usr/bin/env bash
# =============================================================================
# reset-db.sh — Reset the demo database to the clean seed state
# =============================================================================
# Restores the database from the seed dump created by create-seed-dump.sh.
# The backend container is stopped during the restore to prevent dirty reads,
# then restarted. Total downtime is typically under 60 seconds.
#
# Usage:
#   ./scripts/reset-db.sh
#
# Called by cron-reset.sh on a daily schedule. Safe to run manually.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$REPO_DIR/.env.prod"
COMPOSE_FILE="$REPO_DIR/docker-compose.prod.yml"
SEED_PATH="/opt/demo-apps/feature-rank/seed.sql"
LOG_PREFIX="[reset-db $(date -u '+%Y-%m-%dT%H:%M:%SZ')]"

# ── Load env vars ─────────────────────────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  echo "$LOG_PREFIX ERROR: $ENV_FILE not found." >&2
  exit 1
fi
# shellcheck disable=SC1090
set -o allexport; source "$ENV_FILE"; set +o allexport

# ── Verify seed dump exists ───────────────────────────────────────────────────
if [ ! -f "$SEED_PATH" ]; then
  echo "$LOG_PREFIX ERROR: Seed dump not found at $SEED_PATH" >&2
  echo "$LOG_PREFIX Run scripts/create-seed-dump.sh after the first successful deployment." >&2
  exit 1
fi

echo "$LOG_PREFIX Starting database reset..."

# ── Stop the backend to prevent requests during restore ──────────────────────
echo "$LOG_PREFIX Stopping backend container..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop backend

# ── Drop and recreate the database ───────────────────────────────────────────
echo "$LOG_PREFIX Dropping and recreating database $MYSQL_DATABASE..."
docker exec feature-rank-db mysql \
  --user=root \
  --password="$MYSQL_ROOT_PASSWORD" \
  --execute="
    DROP DATABASE IF EXISTS \`$MYSQL_DATABASE\`;
    CREATE DATABASE \`$MYSQL_DATABASE\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    GRANT ALL PRIVILEGES ON \`$MYSQL_DATABASE\`.* TO '$MYSQL_USER'@'%';
    FLUSH PRIVILEGES;
  "

# ── Restore from seed dump ────────────────────────────────────────────────────
echo "$LOG_PREFIX Restoring seed dump from $SEED_PATH..."
docker exec -i feature-rank-db mysql \
  --user="$MYSQL_USER" \
  --password="$MYSQL_PASSWORD" \
  "$MYSQL_DATABASE" < "$SEED_PATH"

# ── Restart the backend ───────────────────────────────────────────────────────
echo "$LOG_PREFIX Starting backend container..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" start backend

# ── Wait for backend health ───────────────────────────────────────────────────
echo "$LOG_PREFIX Waiting for backend health check..."
WAIT=0
until docker inspect --format='{{.State.Health.Status}}' feature-rank-backend 2>/dev/null \
  | grep -q "healthy"; do
  sleep 5
  WAIT=$((WAIT + 5))
  if [ "$WAIT" -ge 120 ]; then
    echo "$LOG_PREFIX WARNING: Backend did not become healthy within 120s." >&2
    break
  fi
done

echo "$LOG_PREFIX Database reset complete. Downtime: ${WAIT}s"
