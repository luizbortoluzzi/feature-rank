#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Pull latest code, rebuild images, and restart the stack
# =============================================================================
# Usage (from repo root):
#   ./scripts/deploy.sh
#
# Requires .env.prod to exist at the repo root.
# Safe to run repeatedly — uses rolling restart with health check gating.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$REPO_DIR/.env.prod"
COMPOSE_FILE="$REPO_DIR/docker-compose.prod.yml"

echo "==> [deploy] Starting deployment from: $REPO_DIR"

# ── Pre-flight checks ─────────────────────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found." >&2
  echo "       Copy .env.prod.example to .env.prod and fill in all values." >&2
  exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "ERROR: $COMPOSE_FILE not found." >&2
  exit 1
fi

# ── Ensure shared network exists ─────────────────────────────────────────────
echo "==> [deploy] Ensuring traefik_net network exists..."
docker network create traefik_net 2>/dev/null && echo "    Created traefik_net." \
  || echo "    traefik_net already exists."

# ── Pull latest code ──────────────────────────────────────────────────────────
echo "==> [deploy] Pulling latest code..."
cd "$REPO_DIR"
git fetch --all
git pull --ff-only

# ── Build updated images ──────────────────────────────────────────────────────
echo "==> [deploy] Building images..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --pull

# ── Start / update services (health-check gated) ─────────────────────────────
echo "==> [deploy] Starting services..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --wait

# ── Report status ─────────────────────────────────────────────────────────────
echo ""
echo "==> [deploy] Deployment complete. Current service status:"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps

echo ""
echo "==> [deploy] Recent backend logs:"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs --tail=20 backend
