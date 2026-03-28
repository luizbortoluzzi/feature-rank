#!/usr/bin/env bash
# =============================================================================
# cron-reset.sh — Cron wrapper for the daily database reset
# =============================================================================
# Runs reset-db.sh and logs output to a rotating log file.
# Install as a cron job:
#
#   crontab -e
#   # Reset demo database every day at 02:00 UTC
#   0 2 * * * /opt/demo-apps/feature-rank/scripts/cron-reset.sh
#
# Log file: /var/log/feature-rank-reset.log (last 500 lines retained)
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/feature-rank-reset.log"
MAX_LOG_LINES=500

# ── Rotate log (keep last MAX_LOG_LINES lines) ────────────────────────────────
if [ -f "$LOG_FILE" ]; then
  tail -n "$MAX_LOG_LINES" "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
fi

# ── Run reset and append to log ───────────────────────────────────────────────
{
  echo "========================================"
  echo "Cron reset started at $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  echo "========================================"
  "$SCRIPT_DIR/reset-db.sh"
  echo "Cron reset finished at $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
} >> "$LOG_FILE" 2>&1

exit 0
