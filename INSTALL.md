# Install

Singular/ty Command Hub — local install for operators and contributors.

## Requirements

- Node.js **20+** (22 LTS recommended)
- npm 10+
- Optional local tools the OffSec / Hardware panels detect via `which`: `nmap`, `adb`, `scrcpy`, `tcpdump`, `tshark`, `ffmpeg`, `bluetoothctl`, `candump`, SDR tools, etc. Nothing is bundled or auto-run.
- Optional API keys (server-side only): `SHODAN_API_KEY`, `CENSYS_API_ID` + `CENSYS_API_SECRET`, VirusTotal / AbuseIPDB / GreyNoise / OTX as needed.

## Steps

```bash
git clone https://github.com/s3v3nlabs/command-hub.git
cd command-hub
cp .env.example .env.local   # fill only what you need; never commit .env*
npm install
npm run build                # must stay at 0 type errors
npm run start -- -p 3100     # or: npx next start -p 3100
# dev: npm run dev -- -p 3100
```

Open `http://localhost:3100`.

## Hardening (recommended for any shared host)

```bash
# in .env.local
SECURE_MODE=1
HUB_API_TOKEN=<long-random-value>
ADB_SHELL_ENABLED=0
CCTV_CONNECT_ENABLED=0
```

Pass the token as `Authorization: Bearer <HUB_API_TOKEN>` or `X-Hub-Token` on gated APIs.

## Data directories (gitignored)

- `data/offsec/` — engagements / findings
- `data/cctv/` — CCTV wall layouts + tile metadata
- `local-data/` — Heimdall IDS ring, CCTV HLS samples, other runtime state

See [USAGE.md](./USAGE.md), [UPDATING.md](./UPDATING.md), [SECURITY.md](./SECURITY.md), [LEGAL.md](./LEGAL.md).

## Invite-only distribution (Black Aurora)

To hand a tester a code-gated copy without relying on a public `git clone`:

1. Run the hub, open `/black-aurora/admin`, mint a code (see USAGE.md).
2. Send the code + drop URL. The tester downloads a git bundle / tarball from the portal.
3. Or set `BLACK_AURORA_MODE=github-private` and make the GitHub repo private (documented path).

