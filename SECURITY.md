# Security Hardening

Authorized operators: Singular/ty Defense Solutions, LLC · Christian Wilford.

This document describes the hardening applied after the 2026-11-11 security audit.
See also `docs/OFFSEC_SUITE.md` and `LEGAL.md`.

## Environment flags

| Variable | Default | Purpose |
|----------|---------|---------|
| `SECURE_MODE` | unset / `0` | When `1`/`true`, high-risk APIs **deny** requests unless a valid hub token is presented. Prefer enabling in any shared / internet-facing deploy. |
| `HUB_API_TOKEN` | empty | Shared Bearer / `X-Hub-Token` for high-risk APIs. Generate a long random value. Also accepts `OPERATOR_API_TOKEN` / `HEIMDALL_API_KEY` (non-placeholder). |
| `ADB_SHELL_ENABLED` | `0` | Must be `1` **and** authenticated for `/api/adb/*/shell` to run. Only enable on isolated lab hosts. |
| `HEIMDALL_MEMORY_KEY` | empty | Reserved for future AES-GCM memory encryption. The old base64 "encrypt" path returns **501**. |

Pass the token as:

```
Authorization: Bearer <HUB_API_TOKEN>
# or
X-Hub-Token: <HUB_API_TOKEN>
```

Do **not** put VirusTotal / AbuseIPDB / GreyNoise / OTX / Censys secrets in `NEXT_PUBLIC_*` — those ship to the browser. Mapbox `pk.` is the only justified public token.

## Security headers

Root `middleware.ts` and `next.config.mjs` `headers()` set:

- `Content-Security-Policy` (default-src 'self'; still allows `'unsafe-inline'`/`'unsafe-eval'` for Next — tighten for pure production builds later)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (camera/mic/geo off)
- HSTS in production

Edge middleware also inspects the request URL for path-traversal / XSS / SQLi signatures on `/api/*` and returns **403** `blocked_by_heimdall`, firing an event to `/api/security/ids/ingest`.

## Auth-gated / hardened surfaces

| Surface | Behavior |
|---------|----------|
| `/api/adb/*` | `requireHubAuth` in SECURE_MODE. Shell additionally requires `ADB_SHELL_ENABLED=1` + command allowlist (no shell metacharacters). |
| `/api/dimm-drive` mutating (`destroy`, mount, quota) | `requireHubAuth` |
| `/api/threat-intel/analyze` | Blocks loopback / RFC1918 / link-local / cloud-metadata targets (`target_blocked`) |
| `/api/evidence/json` + `/api/evidence/sqlite` | Request-guard + IDS log; sqlite mutating SQL blocked; auth in SECURE_MODE |
| `/api/ghostlight/search`, `/api/brain`, `/api/shodan/{search,host}` | `requireHubAuth` in SECURE_MODE |
| `/api/heimdal/security` encrypt/decrypt | **501** until real AES-GCM |

## Heimdall IDS

Detections persist under `local-data/heimdall-ids/` (gitignored):

- `events.jsonl` — ring of live threat events
- `failed-auth.count` — failed API auth counter

`GET /api/security/ids/status` reports them. Edge middleware and Node `inspectRequest` / `requireHubAuth` write via `recordIdsThreat` / `recordFailedApiAuth`.

## Markdown XSS

`lib/markdown.ts` and the markdown-editor escape HTML **first**, then apply a small allowlisted set of markdown replacements. Link hrefs are restricted to `http(s)` and relative paths (`javascript:` blocked).

## Dependency policy

- Keep `next` on the fixed 15.5.x line.
- Prefer `npm audit fix` (non-force). Do **not** `npm audit fix --force` without a maps (kepler / maplibre) regression pass — those majors are breaking. See `docs/DEPENDENCY_NOTES.md`.
