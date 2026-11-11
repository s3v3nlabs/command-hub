# Roadmap

Iterative. This is a living map of what is REAL, what is WIP-by-law, and what is planned next — not a waterfall schedule.

## REAL now

- Security hardening (middleware headers, `requireHubAuth`, SSRF guards, markdown XSS escape-first, Heimdall IDS file-backed, next 15.5.x)
- OffSec Arsenal (kill-chain + CTF), OSINT, entity graph, toolkit/hash-ID, privacy stack, engagements
- Hardware & RF (BT, CAN, USB/Ducky+BadUSB, LAN, Shodan+Censys server-side, VoIP, SDR, Flipper Zero + Flipper One predicted)
- Phone Suite (scrcpy + ADB for YOUR device; API gated)
- Android Lab (`/offsec/android-lab`) — disposable local AVDs + adb for mobile-app QA/security testing; honest SDK-not-installed state
- Threat Field (Nash / Fourier / Monte-Carlo + 3D/2D)
- CCTV wall with per-tile recon metadata; connect staged-ladder gated
- Deception mesh (decoys, canaries, capture/quarantine, VT opt-in, eyes-only AES-256-GCM logs)
- Dev Operator (defensive; backend status strip; model via `LOCAL_LLM_*`)
- Staged-ladder authorization (`lib/offsec/scope-ladder.ts`) — the gating standard
- Docs: INSTALL / USAGE / UPDATING / CONTRIBUTING / SECURITY / LEGAL / NOTICE / Apache-2.0

## WIP-by-law (honest shells — never faked working)

- Live interception / recording of, or third-party audio injection into, calls the operator is not a party to (wiretapping)
- Generating / distributing live self-propagating malware
- Caller-ID / IMEI / location spoofing; SIP / dip-trunk fraud; IMSI-catcher / Stingray-class active cellular interception

## Planned next (iterative)

- Out-of-process `hub-agentd` privilege-separation daemon (see `docs/architecture/SANDBOXED_AGENT.md`)
- Detonation microVM wired to the deception quarantine
- Signed update verification for agentd
- Broader staged-ladder wiring on remaining recon / ADB mutating / privacy-egress surfaces
- More real local CLI launchers as operators request them

## Feedback

We want criticism. Open a bug / feature / security issue, or a PR. Prefer small iterative changes over megapatches. See CONTRIBUTING.md.
