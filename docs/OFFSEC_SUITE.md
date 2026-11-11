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
No secrets in git. `.env.example` holds empty var NAMES only. `data/`, vaults, and engagement data are
gitignored. Public repo stays gitleaks-clean.
