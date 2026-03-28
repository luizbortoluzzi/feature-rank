#!/bin/sh
set -e

# Wait for MySQL TCP port to be reachable using Python socket
DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-3306}"

echo "Waiting for MySQL at $DB_HOST:$DB_PORT..."
python - <<'PYEOF'
import socket, time, os, sys
host = os.environ.get('DB_HOST', 'db')
port = int(os.environ.get('DB_PORT', 3306))
deadline = time.time() + 60
while time.time() < deadline:
    try:
        with socket.create_connection((host, port), timeout=1):
            print("MySQL is reachable.", flush=True)
            sys.exit(0)
    except OSError:
        time.sleep(1)
print("MySQL not reachable after 60s.", flush=True)
sys.exit(1)
PYEOF

# Always run migrations — safe and idempotent in all environments.
# In production, the gunicorn command overrides this entrypoint's CMD but
# migrations still run here before gunicorn starts, ensuring the schema is
# up to date on every container start or redeploy.
echo "Running migrations..."
python manage.py migrate --noinput

exec "$@"
