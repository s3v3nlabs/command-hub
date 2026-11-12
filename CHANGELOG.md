# Changelog

All notable changes to the Singular/ty Command Hub. Format inspired by Keep a Changelog. Dates in America/New_York context of the commit day.

## [Unreleased]

### Added
- **AXIOS Kernel v1.0 + Memory Core ingest:** Operator-provided institutional archive / persona kernel (`docs/AXIOS_KERNEL_v1.md`, `docs/AXIOS_MEMORY_CORE.md`, `data/axios/AXIOS_MEMORY_CORE.md`) folded into the axios-vedic digest and `lib/engines/personas.ts`. Vedic / Glyphstream identity is kept; analytical layer adds evidence-category labels, `AXIOS // ANALYSIS` response mode, hard constraints, and operational memory (Tumbleweed, Oopsie Poopsie, EchoPulse). Symbolic lattice anchors are documented as non-authenticating. Archive findings are Operator doctrine, not independently verified in this ingest.

### Changed
- **Kepler / GeoMap Ghostlight stylization:** night-ops HUD (corner brackets, scanlines, classified strip, crosshair, threat status bar), cyan→crimson severity ramps, point halo glow, denser hex/heat bloom, ops-style HEX/HEAT/POINTS switches. Mapbox dark-v11 + optional fog; MapLibre Dark Matter and offline `#05070d` fallback unchanged. Sample Heimdall set labeled as demo.


## 2026-11-11

### Added
- **Device Bridge PWA:** `/companion`, `/companion/bridge`, `/companion/hub-view` + `/api/companion/*` — hub-served installable companion. Phone camera/mic via getUserMedia → WebRTC to the hub, GPS/battery/network telemetry, safe remote actions (presence heartbeat, in-hub navigate prompt). SSE+POST signaling, session tickets (not the hub token), `HUB_API_TOKEN` / `SECURE_MODE` gating for join and live media. CCTV wall lists live bodycams and links to the hub seat (1:1 WebRTC, no SFU, no TURN). Permissions-Policy allows sensors on companion/CCTV routes only. See `docs/COMPANION_BRIDGE.md`.
- **Termux phone companion:** `companions/termux/` — FastAPI operator client for Android/Termux. Talks to a remote hub (health ping, operator deck, workspace chips as local filters, Black Aurora redeem helper, SignalFrame presence, deep-links). Honest about not hosting Next.js / Ghidra / Android Lab / Docker on-device.
- **Black Aurora Labs invite portal:** `/black-aurora` (+ verify/drop/access/admin) — real invite-token backend (single-use/expiry/revoke), gated git-bundle/tarball download, monochrome classified UI. Honest about public-repo clone limits. See `docs/black-aurora/`.
- **Compute / AI Acceleration:** `/compute` + `/api/compute` + `lib/compute/*` — multi-backend router (Ollama/RunPod/OpenAI-compat), bounded job queue (async + worker_threads), warm-pool, speculative race, circuit-breaker failover; honest performance surface (quantization/GPU/KV/batching documented-only). Debunks virtual-RAM-to-compute claims. See `docs/COMPUTE.md`.
- **ATT&CK navigator heatmap:** `/offsec/attack-navigator` — Heimdall/deception-observed techniques lit on a live enterprise heatmap.
- **RE Workbench:** `/offsec/reverse-engineering` + `/api/offsec/reverse-engineering/*` — REA (MIT) MCP broker (stdio, verified against rea-agents 6.8.0) with radare2 + Ghidra headless fallback; evidence records with provider/source/limitations; one engine per session; sha256 cache; local-model AI assist (defensive); dynamic REA tools staged-ladder gated + audit-logged.
- **Android Lab:** `/offsec/android-lab` + `/api/offsec/android-lab` — local AVD lifecycle, adb control, screencap live view, app assessment hooks; honest SDK-not-installed state.
- **Security hardening (Workstream A):** root `middleware.ts` + `next.config` headers; `requireHubAuth` / `SECURE_MODE`; ADB shell allowlist; SSRF blocks; markdown XSS escape-first; empty hub-config secrets; Heimdall IDS file-backed; next → 15.5.29; `SECURITY.md`.
- **Hardware & RF + Phone Suite (Workstream B):** `/offsec/hardware`, `/offsec/phone`; DuckyScript generator + BadUSB detector; full server-side Shodan + Censys; Flipper Zero real / Flipper One PREDICTED.
- **Threat Field (Workstream C):** `/offsec/threat-field` — Nash, Fourier/FFT, Monte-Carlo; 3D (r3f) + 2D fallback.
- **Docs + CCTV + Dev Operator + staged ladder (Workstreams D/E):** INSTALL/USAGE/UPDATING/CONTRIBUTING; `/help`; CCTV wall with per-tile recon metadata (`lib/cctv/*`); Dev Operator backend status + `LOCAL_LLM_*`; staged-ladder (`/api/offsec/scope`).
- **Deception + Heimdall eyes-only + sandbox design (Workstream F):** `/offsec/deception`; AES-256-GCM eyes-only logs; cosmetic glyph skin (explicitly non-security); sandboxed-agent design + privsep stub.
- **Apache License 2.0** + NOTICE third-party credits.
- **CI / tests / project health (Workstream H):** GitHub Actions CI (typecheck/test/build/gitleaks/audit), vitest suite, issue/PR templates, ROADMAP, CHANGELOG.

### Changed
- Consciousness / sentience framing neutralized to hub-bus (compat alias preserved).
- Public repo stays gitleaks-clean (`.gitleaks.toml`).

### Security
- Staged-ladder gating standard documented in USAGE.md and enforced on CCTV transcode + VT sample upload.
