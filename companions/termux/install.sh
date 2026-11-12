#!/usr/bin/env bash
# Singular/ty Command Hub — Termux companion installer.
# Installs Python deps and prints how to start the local client.
# This does NOT install or build the full Next.js Command Hub.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "=== Singular/ty Command Hub · Termux companion ==="
echo "A phone client. It does not run Ghidra, Android Lab, Docker, or Next.js."
echo

if command -v pkg >/dev/null 2>&1; then
  echo "[termux] ensuring python is installed…"
  pkg install -y python >/dev/null
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required."
  echo "  On Termux:  pkg install python"
  echo "  On Debian:  sudo apt-get install python3 python3-venv python3-pip"
  exit 1
fi

PYTHON=python3
if ! "$PYTHON" -c "import venv" 2>/dev/null; then
  echo "python3 venv module missing. On Debian: sudo apt-get install python3-venv"
  # Termux's python package includes venv; continue anyway and fall back to --user.
fi

if "$PYTHON" -c "import venv" 2>/dev/null; then
  if [ ! -d .venv ]; then
    echo "[venv] creating .venv…"
    "$PYTHON" -m venv .venv
  fi
  # shellcheck disable=SC1091
  source .venv/bin/activate
  PIP=".venv/bin/pip"
  PY=".venv/bin/python"
else
  PIP="$PYTHON -m pip"
  PY="$PYTHON"
fi

echo "[pip] installing requirements (FastAPI + uvicorn + Jinja2)…"
# Prefer binary wheels. If pydantic-core ever sneaks in and fails to build:
#   pkg install rust binutils   && re-run this script
$PIP install --upgrade pip >/dev/null
if ! $PIP install -r requirements.txt; then
  echo
  echo "pip install failed. On Termux, a Rust toolchain sometimes helps:"
  echo "  pkg install rust binutils"
  echo "then re-run: bash install.sh"
  exit 1
fi

chmod +x "$ROOT/start.sh" "$ROOT/install.sh"

if [ ! -f "$ROOT/.env" ] && [ -f "$ROOT/.env.example" ]; then
  cp "$ROOT/.env.example" "$ROOT/.env"
  echo "[env] wrote .env from .env.example — edit HUB_BASE_URL (or use the Setup screen)."
fi

echo
echo "Install complete."
echo
echo "  cd $ROOT"
echo "  bash start.sh"
echo
echo "Then open  http://127.0.0.1:8788  in this phone's browser"
echo "(Termux:  termux-open-url http://127.0.0.1:8788   if termux-api is installed)."
echo
echo "Point Setup at the machine running the full hub, e.g."
echo "  http://<tailscale-or-lan-ip>:3100"
echo "The hub must listen on a reachable interface:"
echo "  npx next start -H 0.0.0.0 -p 3100"
echo
echo "Christian Wilford (s3v3n), AI Architect, Offensive Security Enthusiast,"
echo "Founder of Singular/ty Defense Solutions, LLC."
