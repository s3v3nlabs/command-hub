# Command Hub Security Audit

**Scope:** Singular/ty Command Hub (Next.js 15) — authorized review of **our own** codebase only.  
**Working copy:** `/workspace/command-hub-audit` (isolated from `command-hub-publish`; nothing pushed to origin).  
**Date:** 2026-11-11 (America/New_York)  
**Auditor role:** black-box + white-box defensive review; Heimdall / IDS observed before and after hardening.

## Method

1. Static review of `app/api/**`, `lib/**`, `next.config.mjs`, absence of root `middleware.ts` (pre-fix), DB helpers.
2. `gitleaks detect` (filesystem) + `rg` for secret-shaped strings.
3. `npm audit` (85 findings: 8 critical / 44 high / 27 moderate / 6 low).
4. Local verification against `http://127.0.0.1:3200` only — each high-risk probe repeated **3×**.
5. Heimdall / IDS: `GET /api/security/ids/status`, file-backed ring at `local-data/heimdall-ids/` after hardening.

## Executive summary

| Area | Pre-harden | Post-harden (this tree) |
|------|------------|-------------------------|
| Unauthenticated ADB shell (arbitrary command) | **Confirmed** (500 only because no device) | **Blocked** (403 SECURE_MODE / token; shell off unless `ADB_SHELL_ENABLED=1`) |
| Unauthenticated DIMM `destroy` | **Confirmed** (200, `destroyDimm()` invoked) | **Blocked** (403 SECURE_MODE / token) |
| Evidence path traversal | App allowlist already blocked (`unknown_file_id`) | Middleware **blocks + logs** (`path_traversal_signature`) |
| Mutating SQL on evidence SQLite | App guard already blocked | Guard **logs** to Heimdall IDS |
| Threat-intel loopback `127.0.0.1` | **Confirmed** accepted (200 analysis) | **Blocked** (`target_blocked`) + IDS log |
| XSS via `lib/markdown.ts` | **Confirmed** (HTML not escaped; `javascript:` links) | **Fixed** (escape-first; http(s)/relative only) |
| Security headers / CSP | **Missing** | Present via `middleware.ts` + `next.config.mjs` |
| Heimdall request detection | **Missed all 21 baseline probes** (0 live threat events) | **Caught consistently** across 3× runs (30 events, 6 failed-auth) |
| Committed secrets | gitleaks: 1 false positive (`signalframe_prefs_v2`) | No real secrets found in tree |
| Dependency CVEs | next@15.1.0 flagged; 8 critical transitive | Upgrade list in `HARDENING_PATCHES.md` (not force-applied) |

---

## Findings table

| ID | Severity | File:line (approx) | Description | Verified | Heimdall detect / log / block (pre → post) | Fix (in audit tree) |
|----|----------|-------------------|-------------|----------|--------------------------------------------|---------------------|
| F01 | **Critical** | `app/api/adb/[deviceId]/shell/route.ts` + `lib/graphene/adbTools.ts:346` | Unauthenticated ADB shell accepts arbitrary `command` and passes to `adb shell` with no allowlist. | **Y** — 3× POST returned 500 `"Device deadbeef not found"` (proves handler ran with attacker command). | Pre: N/N/N → Post: **Y/Y/Y** (403 + IDS auth events) | `requireHubAuth` + `ADB_SHELL_ENABLED` gate + metachar allowlist + IDS |
| F02 | **High** | `app/api/dimm-drive/route.ts` (`destroy` → `destroyDimm`) | Unauthenticated mutating DIMM actions including `destroy` call `dimmctl destroy`. | **Y** — 3× POST `{"action":"destroy"}` → **200** and status payload. | Pre: N/N/N → Post: **Y/Y/Y** | Auth required for mutating actions under SECURE_MODE |
| F03 | **High** | Most `app/api/**` routes | Missing authn/authz on sensitive APIs (ADB, evidence, ghostlight, brain, threat-intel, shodan, etc.). Only hive checks `S3V3N_HIVE_SECRET`. | **Y** (design + probes) | Pre: N (no failed-auth counter use) → Post: partial (ADB/DIMM gated; others still open) | `lib/security/api-auth.ts`; wire remaining high-risk routes |
| F04 | **High** | No root `middleware.ts`; `next.config.mjs` lacked headers | Missing CSP, `X-Frame-Options`, `X-Content-Type-Options`, etc. | **Y** — pre: no headers; post: headers present on `/` | N/A → headers always on | `middleware.ts` + `next.config.mjs` `headers()` |
| F05 | **High** | `lib/markdown.ts` + `components/frame/message-bubble.tsx:27` | Stored/reflected XSS: `dangerouslySetInnerHTML` with parser that only escaped fenced code; links allowed any scheme. | **Y** — unit: `<script>` and `javascript:` rendered unsafely before fix; after fix escaped/blocked. | N/A (client render) | Escape-first markdown; sanitize hrefs |
| F06 | **High** | `app/markdown-editor/page.tsx` | Naive regex “markdown→HTML” without HTML escape before injection. | **Y** (code review) | N/A | Pre-escape `& < >` before replacements |
| F07 | **High** | Heimdall IDS not on request path | `lib/heimdal/*threat*` + `lib/security/ids-status.ts` existed but **did not** inspect HTTP. `recordFailedApiAuth` unused. CORS manager excluded from `tsconfig`. | **Y** — 21 baseline attacks → still only boot/simulated events | Pre: miss all → Post: detect/log/block on wired surfaces | Request guard + edge middleware + file-backed IDS + ingest API |
| F08 | **High** | `lib/config/hub-config.ts` | Hardcoded **placeholder secrets** including default WhisperMesh key hex and Heimdall API key placeholder (would be used if env unset). | **Y** (static) | N/A | Emptied defaults; require real env |
| F09 | **Medium** | `app/api/threat-intel/analyze/route.ts` | Accepted loopback/private IPs (`127.0.0.1`) for analysis (SSRF-adjacent / noise / possible outbound to intel APIs with internal target). | **Y** — 3× **200** with reputation payload pre-fix | Pre: N/N/N → Post: **Y/Y/Y** | Block RFC1918/loopback/link-local/metadata |
| F10 | **Medium** | `app/api/heimdal/security/route.ts` | “encrypt_memory” was **base64**, not encryption; decryptable by anyone with DB read. | **Y** (static) | N/A | Disabled (501) until AES-GCM |
| F11 | **Medium** | `lib/consciousness/biofeedback-bridge.ts` | `eval()` on substituted conditions. | **Y** (static) | N/A | Replaced with literal comparison parser |
| F12 | **Medium** | `.env.example` `NEXT_PUBLIC_*_API_KEY` for VT/AbuseIPDB/GreyNoise/OTX | Encourages shipping third-party intel keys to the browser bundle. | **Y** (static) | N/A | Prefer server-only keys; Mapbox `pk.` token is the only justified `NEXT_PUBLIC_` token |
| F13 | **Medium** | `next@15.1.0` | npm/advisory: DoS / cache poisoning / related Next advisories; install warns CVE-2025-66478 family. Fix available `15.5.29` (non-major). | **Y** (`npm audit`) | N/A | Upgrade recommended (see patches doc) |
| F14 | **Medium** | Transitive: `maplibre-gl`, `handlebars`, `form-data`, `fast-xml-parser`, `request`, kepler stack | Critical/high npm audit findings, many via `kepler.gl`. | **Y** (`npm audit`) | N/A | Staged upgrades; kepler major may break maps |
| F15 | **Low** | Evidence JSON/SQLite path helpers | Already strong: allowlist + `path_escape_blocked` + read-only SQL assert. | **Y** — traversal → `unknown_file_id` / `mutating_sql_blocked` | Pre: block without log → Post: block **with** Heimdall log | Keep; logging added |
| F16 | **Low** | `app/api/offsec/tools/route.ts` | `execFile("which", [bin])` on fixed allowlisted bin names — **not** RCE. | **Y** (static) | N/A | No change required |
| F17 | **Low** | `app/api/reclaim/pack/route.ts` | Pack path jailed (`.md` only, `..` blocked). | **Y** (static) | N/A | No change required |
| F18 | **Info** | gitleaks | One hit: `signalframe_prefs_v2` localStorage key — **false positive**. | Y | N/A | Add to `.gitleaksignore` if noisy |

---

## Heimdall / defense effectiveness

### How defenses are “activated”

| Mechanism | How enabled | What it actually did pre-audit |
|-----------|-------------|--------------------------------|
| `SECURE_MODE=1` | env | Flag surfaced in IDS status only — **not enforced** on APIs |
| `lib/heimdal/advanced-threat-detection.ts` / `enhanced-threat-detection.ts` | imported as modules | Prompt/symbolic classifiers; **not** hooked to HTTP middleware |
| `GET /api/security/ids/status` | always | Honest local signals; simulated seed events |
| `lib/security/cors-manager.ts` | — | **Excluded** in `tsconfig.json`; unused |
| Supabase `utils/supabase/middleware.ts` | — | Helper exists; **no root middleware** wired it |

### Baseline (before hardening) — 3× each

| Probe | Result | Heimdall detect | log | block |
|-------|--------|-----------------|-----|-------|
| `GET /api/evidence/json?id=../../../../etc/passwd` | 400 `unknown_file_id` | N | N | N* |
| `POST /api/evidence/sqlite` `DROP TABLE` | 400 `mutating_sql_blocked` | N | N | N* |
| `POST /api/adb/deadbeef/shell` `id; cat /etc/passwd` | 500 device missing | N | N | N |
| `POST /api/dimm-drive` `destroy` | **200** | N | N | N |
| `POST /api/threat-intel/analyze` `127.0.0.1` | **200** | N | N | N |
| XSS query to ghostlight | 500 (FTS) | N | N | N |
| `__proto__` on `/api/panel` | 503 unconfigured | N | N | N |

\*App-layer block without IDS visibility.

### After hardening — 3× each (file-backed IDS)

| Probe | Result | detect | log | block |
|-------|--------|--------|-----|-------|
| Path traversal evidence | **403** `blocked_by_heimdall` | Y | Y | Y |
| Mutating SQL | 400 + IDS `sqli_probe` / `mutating_sql_blocked` | Y | Y | Y (app) |
| ADB shell | **403** `forbidden_secure_mode` | Y | Y | Y |
| DIMM destroy | **403** `forbidden_secure_mode` | Y | Y | Y |
| Threat-intel `127.0.0.1` | **400** `target_blocked` | Y | Y | Y |
| XSS URL probe | **403** `xss_probe_signature` | Y | Y | Y |
| Security headers on `/` | CSP + XFO + nosniff + referrer | — | — | — |

**Consistency:** All post-harden detections appeared on **all 3 runs** and persisted in `local-data/heimdall-ids/events.jsonl` (30 events) with `failed-auth.count=6`.

### Gaps remaining (Heimdall should catch but still weak)

1. Many APIs still lack `requireHubAuth` (ghostlight, brain, shodan, evidence GET, venice, caller except Twilio signature, etc.).
2. Edge middleware only inspects URL (not JSON body) — body SQLi/cmd injection relies on per-route `inspectRequest`.
3. CSP still allows `'unsafe-inline'` / `'unsafe-eval'` (needed for Next/dev); tighten for production builds.
4. Symbolic Heimdall threat classes are still not connected to the HTTP guard (optional later).
5. In-memory IDS was useless across route bundles — **fixed** via filesystem ring; keep `local-data/` uncommitted.

---

## Dependencies (`npm audit`)

- **Total:** 85 (8 critical, 44 high, 27 moderate, 6 low)
- **Direct critical:** `next@15.1.0` → fix `15.5.29` (semver minor/patch line)
- **Critical via maps/kepler:** `maplibre-gl`, `handlebars`, `form-data`, `fast-xml-parser`, `request`, `@kepler.gl/*`
- Full machine-readable dump: `npm-audit.json` (local audit copy only)

## Secrets

- **gitleaks:** 1 false positive only.
- **Do not** commit `.env.local` / real keys. `.env.example` lists empty placeholders including new `HUB_API_TOKEN`, `SECURE_MODE`, `ADB_SHELL_ENABLED`.

## Honesty notes

- No CVE numbers invented beyond what `npm audit` / Next install warning reported.
- Threat-intel pre-fix “analysis” of `127.0.0.1` returned fluctuating scores — treated as **endpoint accepts internal targets**, not as a claim about real VT data quality.
- ADB RCE was **not** fully executed against a phone (none attached); vulnerability is **confirmed at the API contract** (arbitrary command accepted without auth).
