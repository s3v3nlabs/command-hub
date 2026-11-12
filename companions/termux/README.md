# Termux phone companion

A light **operator client** for the Singular/ty Command Hub, installable on
Android via [Termux](https://termux.dev). It talks to a remote hub (laptop,
VPS, LAN, or Tailscale) and gives you a mobile operator deck, health ping,
Black Aurora redeem helper, SignalFrame presence, and deep-links into the
full hub.

This is **not** a phone-hosted Command Hub. It does **not** run Ghidra, the
Android Lab, Docker, or the Next.js 15 suite on the device. The full hub
still needs Node 20+ on a real Linux host — Termux is the wrong place for
that build.

Credit: **Christian Wilford (s3v3n), AI Architect, Offensive Security
Enthusiast, Founder of Singular/ty Defense Solutions, LLC.** Apache-2.0,
same license as the hub.

## One-liner (Termux)

```bash
pkg install python git -y
git clone https://github.com/s3v3nlabs/command-hub.git
cd command-hub/companions/termux
bash install.sh
bash start.sh
```

Then open **http://127.0.0.1:8788** in the phone browser. If
[Termux:API](https://wiki.termux.com/wiki/Termux:API) is installed:

```bash
termux-open-url http://127.0.0.1:8788
```

`install.sh` creates a local `.venv`, installs a slim FastAPI/uvicorn/Jinja2
stack (pydantic v1 — no Rust toolchain required on most Termux setups), and
copies `.env.example` to `.env`. If `pip install` ever fails on a Rust
extension: `pkg install rust binutils` and re-run `bash install.sh`.

## Point it at a hub

On the **Setup** screen (or in `.env` / `config.local.json`):

| Field | What to put |
|---|---|
| **Hub base URL** | `http://<lan-or-tailscale-ip>:3100` (or `https://…` for a hosted hub) |
| **Operator token** | Optional. Required only when the hub set `HUB_API_TOKEN` or `SECURE_MODE=1`. Unlocks the audit timeline and ATT&CK navigator. |
| **Operator name** | Used for SignalFrame presence heartbeats / notes. |

The hub must listen on a **reachable interface**. This will *not* work if the
hub bound only to localhost and you are on another device:

```bash
# on the hub host, after npm run build
npx next start -H 0.0.0.0 -p 3100
```

Use Tailscale (or a VPN) rather than exposing a lab hub to the public
internet. `127.0.0.1` as the base URL only works when the hub is on the same
device, or forwarded with `adb reverse tcp:3100 tcp:3100`.

Saved settings live in gitignored `config.local.json` (mode 0600). Never
commit a real token. `.env.example` has empty placeholders only.

## What it does

1. **Setup** — persist the hub URL and optional Bearer token.
2. **Health / ping** — GET the hub home page and `/api/modules`; probe
   `/api/audit/timeline?limit=12` and `/api/offsec/attack-navigator` with the
   token when set. Shows reachable / auth state honestly (unauthorized if
   the token is missing or wrong — never faked).
3. **Operator deck** — module tiles with large tap targets, workspace
   preset chips (`red` / `blue` / `tiger` / `investigator` / `all`) as a
   **local filter only**, recent audit tail, top ATT&CK techniques.
4. **Quick open** — deep-links that open the remote hub in the Android
   browser: `/operator`, `/marketplace`, `/audit`, `/black-aurora`,
   `/offsec`, `/compute`, `/signalframe/presence`. Fallback:
   `am start -a android.intent.action.VIEW -d 'http://<hub>/operator'`.
5. **Black Aurora redeem helper** — paste an invite code, **soft-check**
   first (`redeem=false`, does not consume a use), then optionally
   **redeem** (`redeem=true`). Shows drop / access URLs. Redeem is
   one-way on single-use codes — confirm before you tap it.
6. **Presence** — `POST /api/signalframe/presence` heartbeat and engagement
   notes, plus the current online list.

## What it does not do

- Run or build the Next.js Command Hub on the phone.
- Run RE engines (Ghidra, radare2, REA), Android Lab / AVD / scrcpy, or Docker.
- Mint or revoke Black Aurora invites (that is `/black-aurora/admin` on the hub, gated by `HUB_API_TOKEN`).
- Bypass staged-ladder authorization. Offensive capabilities stay on the hub and stay gated.

## Layout

```
companions/termux/
  README.md          this file
  install.sh         Termux / local installer
  start.sh           uvicorn on :8788
  requirements.txt   slim Python deps
  .env.example       empty placeholders
  .gitignore         config.local.json, .env, .venv, __pycache__
  app/main.py        FastAPI application
  app/static/        CSS + JS
  app/templates/     Jinja2 pages
```

Default listen: `127.0.0.1:8788` (`COMPANION_HOST` / `COMPANION_PORT` in `.env`).
Port 8788 is also the AI Caller media-bridge default *on the hub host* — that
does not conflict, because this process runs on the phone.

## Updating

From a previous clone:

```bash
cd command-hub
git pull
cd companions/termux
bash install.sh    # picks up requirement changes
bash start.sh
```

## Legal

Authorized, lawful use only — see the hub's [LEGAL.md](../../LEGAL.md).
This companion is a viewer and a thin API client.
