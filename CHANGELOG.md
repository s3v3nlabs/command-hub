# Changelog

All notable changes to the Singular/ty Command Hub. Format inspired by Keep a Changelog. Dates in America/New_York context of the commit day.

## [Unreleased]

## 2026-11-11

### Added
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
