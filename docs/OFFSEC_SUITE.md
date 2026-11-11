# OffSec Suite — what's REAL vs WORK IN PROGRESS

This mirrors the honesty of `docs/MODULE_STATUS.md`. The suite is built for red / blue / tiger teams
and law-enforcement-style internal auditing. Everything legal to implement is built real; only
hardware-gated or interception/spoofing-class capabilities are honest WIP shells.

**Legal:** see `LEGAL.md`. Authorized, lawful use only; written authorization required before testing.

## Shared
- `components/offsec/legal-notice.tsx` — legal banner + first-use acknowledgement modal (versioned).
- `lib/offsec/legal.ts` — single source of legal wording.
- `components/offsec/suite-shell.tsx` — common chrome (sidebar/header/banner/ghostnode theme).

## REAL
| Area | Route | What it does |
|---|---|---|
| Arsenal (kill-chain + CTF) | `/offsec` | Data-driven catalog (`lib/offsec/arsenal.ts`). Reference + command-builder panels, live local-install detection via `/api/offsec/tools` (read-only `which` of a fixed in-repo binary list). Kill-chain and Competitions/CTF views, search. Standards: OSCP/OSEP/OSWE/OSED, DEF CON SECTF, Trace Labs. |
| Engagements / findings | `/offsec/engagements` | Engagement scope / RoE / authorization, research notes, and findings log. File-backed store `lib/offsec/engagements-store.ts` → `data/offsec/` (gitignored). API `/api/offsec/engagements`. |
| OSINT suite | `/offsec/osint` | OSINT Framework tree, Google dorking builder + full operator reference, username/email/phone lookup launchers (Sherlock/Maigret/holehe/PhoneInfoga), research-to-DB. |
| Entity graph | `/offsec/graph` | Maltego-style investigative graph in our aesthetic (our look, not Maltego's). |
| Data toolkit / Hash-ID | `/offsec/toolkit` | CyberChef-style transforms + hash identifier, 100% client-side/offline. |
| Privacy stack | `/offsec/privacy` | Proton VPN CLI / Bridge / Mail / reverse-alias, proxychains, reverse proxy, encrypted messaging — documented setup + env/status checks. No credentials stored in repo. |
| Bug bounty | `/bounty` | Program / disclosure tracker (pre-existing, kept). |
| Hardware & RF | `/offsec/hardware` | Local launcher/config/reference panels for Bluetooth (BlueZ/bettercap/Ubertooth), CAN bus (can-utils/cantools), USB/HID (DuckyScript generator + BadUSB heuristic detector + lsusb), LAN capture (tcpdump/tshark/netsniff-ng), Shodan + Censys FULL server-side search, VoIP (sngrep/Asterisk ref), SDR (rtl-sdr/HackRF/GNU Radio), Flipper Zero (real) + Flipper One (PREDICTED/UNRELEASED). Drives operator-owned hardware; auto-runs nothing. |
| Phone Suite | `/offsec/phone` | scrcpy + ADB mirror/control/forensics for YOUR authorized Android device. Hub `/api/adb/*` gated by HUB_API_TOKEN (SECURE_MODE) and ADB shell behind ADB_SHELL_ENABLED=1 + arg allowlist. No call interception / audio injection. |
| Android Lab | `/offsec/android-lab` | Disposable local Android Virtual Devices (emulator + adb) for mobile-app QA/security testing on this host. Honest SDK-not-installed state (never fabricates a device). API `/api/offsec/android-lab`, auth-gated. Authorized devices/apps only; staged-ladder for any real external device. |
| Deception Mesh | `/offsec/deception` | Emulated USB/serial/service/route decoys, canary tokens, malware capture+quarantine (sha256), attacker fingerprinting. Events → Heimdall IDS + AES-256-GCM eyes-only log. VT opt-in + staged-ladder. Glyph skin is COSMETIC only. |
| CCTV Wall | `/intelligence/cctv` | Multi-feed video wall with per-tile recon metadata (network/geo/device/exposure/engagement). Layouts in `data/cctv/`. Connect/transcode staged-unlock gated (`CCTV_CONNECT_ENABLED`). Metadata model: `lib/cctv/types.ts`. |
| Threat Field | `/offsec/threat-field` | Modeled Nash mixed-strategy equilibria, Fourier analysis of attack time series, seeded Monte-Carlo probability field over network zones. 3D (three.js/r3f) + 2D heatmap fallback. Honest model language only — never guaranteed/lock/certain. API `/api/offsec/threat-field`. Libs under `lib/offsec/threat-engine/`. |

Command builders only render text to copy into the operator's own authorized terminal; the UI executes
nothing. The tool-detection API takes no client input and runs only `which` against a fixed list.

## WORK IN PROGRESS (honest, non-functional scaffolds — `/offsec/lab`)
Caller-ID / IMEI / location spoofer · SIP / dip-trunk telephony · phone phreaking · active cellular
interception — these stay WIP shells and will never ship as working interception/spoofing code.

For Kali/ADB, virtualization, LoRa, forensics / anti-forensics, and reverse engineering, the suite
prefers REAL launcher/config/reference panels that drive the operator's own locally-installed tools
(detect presence, document setup, build safe commands) and only falls back to WIP where a real local
hook is not feasible in this environment.

## Secrets
Shodan (`SHODAN_API_KEY`) and Censys (`CENSYS_API_ID`/`CENSYS_API_SECRET`) keys are read server-side only and
never shipped to the browser; `/api/shodan/*` and `/api/censys/*` require hub auth in SECURE_MODE and block
loopback/RFC1918/link-local/metadata IPs. No secrets in git. `.env.example` holds empty var NAMES only. `data/`, vaults, and engagement data are
gitignored. Public repo stays gitleaks-clean.
