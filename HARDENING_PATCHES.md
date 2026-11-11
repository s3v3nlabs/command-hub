# Hardening Patches (audit working copy)

**Tree:** `/workspace/command-hub-audit` only — do **not** confuse with `command-hub-publish`.  
**Not pushed** to origin. Apply selectively to the canonical tree after review.  
**Typecheck:** `tsc --noEmit` → **0 errors** after these changes.

## Patch set (files touched)

### New

| File | Purpose |
|------|---------|
| `middleware.ts` | Security headers + URL signature gate (path traversal / XSS / SQLi in query). Fire-and-forget ingest to IDS. |
| `lib/security/api-auth.ts` | `requireHubAuth` / `HUB_API_TOKEN` / SECURE_MODE deny-by-default for high-risk surfaces |
| `lib/security/request-guard.ts` | `inspectRequest`, `jailPath`, `assertSafeOutboundUrl` |
| `app/api/security/ids/ingest/route.ts` | Node ingest for Edge middleware detections |

### Modified

| File | Change |
|------|--------|
| `lib/security/ids-status.ts` | File-backed event ring + auth counter (`local-data/heimdall-ids/`); `recordIdsThreat` |
| `app/api/adb/**/route.ts` | Auth gate; shell additionally disabled unless `ADB_SHELL_ENABLED=1` + safe command pattern |
| `app/api/dimm-drive/route.ts` | Auth + guard on mutating actions (`destroy`, mount, quota) |
| `app/api/threat-intel/analyze/route.ts` | Block loopback/RFC1918/link-local/metadata targets; IDS log |
| `app/api/evidence/json/route.ts` | Guard + log unknown/traversal ids |
| `app/api/evidence/sqlite/route.ts` | Guard + log blocked SQL |
| `app/api/heimdal/security/route.ts` | Disable fake base64 “encrypt/decrypt” (501) |
| `lib/markdown.ts` | Escape-first markdown; block `javascript:` links |
| `app/markdown-editor/page.tsx` | Escape `& < >` before HTML templates |
| `lib/config/hub-config.ts` | Remove placeholder API/encryption defaults |
| `lib/consciousness/biofeedback-bridge.ts` | Remove `eval`; safe comparison parser |
| `next.config.mjs` | `headers()` CSP + XFO + nosniff + referrer-policy |
| `.env.example` | `HUB_API_TOKEN`, `OPERATOR_API_TOKEN`, `SECURE_MODE`, `ADB_SHELL_ENABLED` |

## Operator env (production / lab)

```bash
SECURE_MODE=1
HUB_API_TOKEN="<long random>"          # Authorization: Bearer …
ADB_SHELL_ENABLED=0                    # only enable on isolated lab hosts
# Do NOT put VT/AbuseIPDB/GreyNoise/OTX secrets in NEXT_PUBLIC_*
```

## Dependency upgrades (recommended order)

### Priority 1 — non-breaking / direct

```bash
cd /workspace/command-hub-audit   # or canonical tree after merge
npm install next@15.5.29 --save-exact --legacy-peer-deps
npm run typecheck && npm run build
```

Addresses `next` critical advisories reported by `npm audit` / install warning.

### Priority 2 — `npm audit fix` (non-force)

```bash
npm audit fix --legacy-peer-deps
npm run typecheck && npm run build
```

Review the lockfile diff; re-test maps + caller bridge.

### Priority 3 — major / breaking (stage carefully)

| Package | Issue (audit) | Suggested | Risk |
|---------|---------------|-----------|------|
| `maplibre-gl` | XSS sanitizer bypass ≤6.4.0 | `6.17.0`+ | **Major** — retest GeoMap / Kepler |
| `kepler.gl` / `@kepler.gl/*` | Large critical/high tree (`handlebars`, `form-data`, `request`, `fast-xml-parser`, …) | `3.3.0-alpha.20` (audit suggestion) | **High** UI breakage risk |
| `@modelcontextprotocol/sdk` | OAuth / session / memory issues | latest ≥ fix | Medium |
| `jsondiffpatch` (via `ai`) | XSS / prototype pollution | upgrade `ai` major | Medium |
| `@vercel/blob` / `@fastify/busboy` | multipart DoS/CRLF | blob `2.9.0` | Major possible |

**Do not** run `npm audit fix --force` on the publish tree without a maps regression pass.

## Heimdall detection improvements

1. **Wire HTTP path:** Edge middleware (URL) + Node `inspectRequest` on hot routes + `recordIdsThreat`.
2. **Persist detections:** `local-data/heimdall-ids/events.jsonl` + `failed-auth.count` (Next route bundles do not share in-memory singletons).
3. **Auth failures visible:** `requireHubAuth` → `recordFailedApiAuth`.
4. **Still to do:**
   - Apply `requireHubAuth` to: ghostlight, brain, shodan, evidence GET, engines spawn routes, privacy mutators, offsec engagements write APIs.
   - Body-aware middleware via a Node proxy or shared `withApiGuard` wrapper on every `app/api/**/route.ts`.
   - Production CSP without `'unsafe-eval'` where possible.
   - Re-enable `cors-manager` (remove from `tsconfig` exclude) and enforce allowlisted origins in middleware.
   - Replace disabled heimdal memory crypto with AES-GCM + key from env (`HEIMDALL_MEMORY_KEY`).

## Quick verification commands (localhost only)

```bash
export SECURE_MODE=1
# path traversal — expect 403 blocked_by_heimdall
curl -s "http://127.0.0.1:3200/api/evidence/json?id=../../../../etc/passwd"
# ADB shell — expect 403 forbidden_secure_mode
curl -s -X POST http://127.0.0.1:3200/api/adb/x/shell -H 'content-type: application/json' -d '{"command":"id; cat /etc/passwd"}'
# IDS feed
curl -s http://127.0.0.1:3200/api/security/ids/status | jq '.auth,.events[:5]'
```

## Applying to canonical tree

1. Copy listed files from `/workspace/command-hub-audit` → `/workspace/command-hub-publish` (or cherry-pick after a local commit **here only**).
2. Ensure `.gitignore` keeps `/local-data/`.
3. Set `SECURE_MODE=1` + `HUB_API_TOKEN` in operator `.env.local`.
4. Re-run the curl probes above on the publish port.
5. Then commit/push from the canonical repo when ready.

## Diff footprint (approx)

```
middleware.ts
lib/security/api-auth.ts
lib/security/request-guard.ts
lib/security/ids-status.ts
lib/markdown.ts
lib/config/hub-config.ts
lib/consciousness/biofeedback-bridge.ts
next.config.mjs
.env.example
app/api/security/ids/ingest/route.ts
app/api/adb/**/route.ts
app/api/dimm-drive/route.ts
app/api/threat-intel/analyze/route.ts
app/api/evidence/json/route.ts
app/api/evidence/sqlite/route.ts
app/api/heimdal/security/route.ts
app/markdown-editor/page.tsx
SECURITY_AUDIT.md
HARDENING_PATCHES.md
```
