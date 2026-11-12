#!/usr/bin/env bash
# Start Ghostlight Vault on 127.0.0.1:8765 (MCP at /mcp, REST at /api/*).
# Does not print the bearer token. Does not touch any already-running process.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

TOKEN_FILE="${GHOSTLIGHT_TOKEN_FILE:-$ROOT/.bearer_token}"
VENV="${GHOSTLIGHT_VENV:-$ROOT/.venv}"
HOST="${GHOSTLIGHT_HOST:-127.0.0.1}"
PORT="${GHOSTLIGHT_PORT:-8765}"
VAULT="${GHOSTLIGHT_VAULT:-$ROOT/data/vault}"

if [[ ! -x "$VENV/bin/python" ]]; then
  echo "Creating venv at $VENV"
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install -U pip
  "$VENV/bin/pip" install -r "$ROOT/requirements.txt"
fi

if [[ ! -f "$TOKEN_FILE" ]]; then
  PYTHONPATH="$ROOT/src${PYTHONPATH:+:$PYTHONPATH}" \
    "$VENV/bin/python" -m ghostlight_vault gen-token --out "$TOKEN_FILE"
fi

export GHOSTLIGHT_MCP_TOKEN="$(tr -d '[:space:]' < "$TOKEN_FILE")"
export GHOSTLIGHT_VAULT="${VAULT}"
export GHOSTLIGHT_HOST="${HOST}"
export GHOSTLIGHT_PORT="${PORT}"
export PYTHONPATH="$ROOT/src${PYTHONPATH:+:$PYTHONPATH}"

exec "$VENV/bin/python" -m ghostlight_vault serve "$@"
