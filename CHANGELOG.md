# Changelog

All notable changes to the Singular/ty Command Hub. Format inspired by Keep a Changelog. Dates in America/New_York context of the commit day.

## [Unreleased]

## 2026-11-11

### Added
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
