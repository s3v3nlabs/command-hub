#!/usr/bin/env bash
# Start the Termux companion on http://127.0.0.1:8788
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# Load optional .env (config.local.json from the Setup screen takes precedence
# for HUB_BASE_URL / token once saved).
if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT/.env"
  set +a
fi

HOST="${COMPANION_HOST:-127.0.0.1}"
PORT="${COMPANION_PORT:-8788}"

if [ -x "$ROOT/.venv/bin/python" ]; then
  PY="$ROOT/.venv/bin/python"
elif [ -x "$ROOT/.venv/bin/uvicorn" ]; then
  PY="$ROOT/.venv/bin/python"
elif command -v python3 >/dev/null 2>&1; then
  PY=python3
else
  echo "python3 not found. Run bash install.sh first."
  exit 1
fi

export PYTHONUNBUFFERED=1
export PYTHONPATH="$ROOT${PYTHONPATH:+:$PYTHONPATH}"

echo "Singular/ty Command Hub · Termux companion"
echo "Listening on http://${HOST}:${PORT}"
echo "This is a client — it does not host the full hub."
echo "Ctrl-C to stop."
echo

exec "$PY" -m uvicorn app.main:app --host "$HOST" --port "$PORT"
