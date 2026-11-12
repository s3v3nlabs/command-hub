#!/usr/bin/env bash
# Run the packaged smoke test against a temporary synthetic vault.
# Never talks to a live index or a process already bound to :8765.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENV="${GHOSTLIGHT_VENV:-$ROOT/.venv}"
if [[ ! -x "$VENV/bin/python" ]]; then
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install -U pip
  "$VENV/bin/pip" install -r "$ROOT/requirements.txt"
fi
export PYTHONPATH="$ROOT/src${PYTHONPATH:+:$PYTHONPATH}"
# Unset vault/token env so we cannot accidentally hit a live instance.
unset GHOSTLIGHT_VAULT GHOSTLIGHT_MCP_TOKEN GHOSTLIGHT_VAULT_TOKEN GHOSTLIGHT_PORT || true
exec "$VENV/bin/python" -m ghostlight_vault smoke "$@"
