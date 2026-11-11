# Module status

An honest per-route audit of the Command Hub. It was produced by building for production (`npm run build`), then loading every `app/**/page.tsx` route in headless Chromium (Playwright). The audit recorded HTTP status, page errors, client-side exceptions and hydration errors. Status is based on that run plus reading each route's code paths.

Last audited: November 11, 2026 (74 routes).

## Summary

| | Before | After |
|---|---|---|
| Routes that crash or throw (Broken) | **7** | **0** |
| `tsc --noEmit` errors | 487 | **0** (typecheck now enforced in `next build`) |
| AI engines returning canned/mock replies | AXIOS, Heimdall, Venice bridge, `/api/chat`, Shodan | **0**. All use real providers or show a "needs key" state |

Routes that were broken before:

- `/heimdal-terminal`, `/self-healing`, `/signalframe`, `/v0-bridge-terminal`: client exceptions (missing icons/exports, a missing context provider, Node `fs` in the browser).
- `/phone-suite`: "Failed to get devices" plus a hydration error (MossBerta changed the DOM at import time).
- `/forecast-engine`: page error (`isDriftDetected` name clash).
- `/intelligence/shodan`: hydration error, and fake "mock" scan results.

**After counts (74 routes):** 23 Working (including the AI Caller in demo mode and the three map routes), 20 Works with a key or local service, 29 Stub (simulated UI, labelled in the app), 2 Partial (`/recon`, `/visualizations`), 0 Broken.

Status legend:

- **Working**: works with no keys.
- **Works with key X**: real backend; shows a clear "needs key" or "not configured" state until X is set.
- **Partial**: some panels are real and others are simulated.
- **Stub**: UI only, with sample or simulated data. A **SIMULATED** banner is shown on the route (`lib/status/simulated-routes.ts`).

## Routes

| Module | Route | Status | What's needed |
|---|---|---|---|
| Home dashboard | `/` | Working | |
| Command Hub fortress | `/command-hub` | Working | |
| Module registry | `/modules` | Working | |
| Setup guide | `/setup-guide` | Working | |
| Settings / theme | `/settings` | Working | |
| Intelligence index | `/intelligence` | Working | |
| SignalFrame (WhisperMesh bus) | `/signalframe` | Working | Local file bus + SSE; LLM replies need any LLM key (see below) |
| WhisperMesh / mesh | `/mesh` | Working | Optional local adapters (`S3V3N_MESH_DIR`) |
| Privacy | `/privacy` | Working | Optional `S3V3N_PRIVACY_*`; Tor only if you run it |
| Evidence Explorer | `/evidence-explorer` | Working | Files under `EVIDENCE_ROOT`; Postgres optional (`POSTGRES_URL`) |
| Reclaim packs | `/reclaim` | Working | `RECLAIM_PACKS_ROOT` |
| Dev Operator | `/dev-operator` | Working | LLM key for AI suggestions |
| JSON manager | `/json-manager` | Working | In-browser tool |
| Harmonic calibration | `/harmonic-calibration` | Working | Web Audio, in-browser |
| Music Hub | `/music` | Working | Streaming services are official-OAuth stubs |
| SoundCheck | `/soundcheck` | Working | |
| Bounty board | `/bounty` | Working | |
| SymTrain | `/symtrain` | Working | Training needs a local trainer (`S3V3N_SYMTRAIN_TRAINER`); Omniverse is not available (stub) |
| Twin redirect | `/twin` | Working | Redirects to `/operator-twin` |
| AI Caller (Grok Bot caller) | `/ai-caller` | Working (demo) / Works with key | Real calls: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `PUBLIC_BASE_URL` + bridge; STT/TTS key (OpenAI, or Deepgram/ElevenLabs/LMNT); any LLM key. See README "AI Caller setup" |
| Recon | `/recon` | Partial | KEV feed is **real** (CISA, no key). Scanner and leak monitor are simulated |
| AI Hub (engine chat) | `/ai-hub` | Works with key | Any of `XAI_API_KEY`, `OPENAI_API_KEY`, `VENICE_API_KEY`, `GROQ_API_KEY`, or local Ollama |
| Heimdal terminal | `/heimdal-terminal` | Works with key | Same LLM keys; the metrics panels are labelled SAMPLE |
| Operator Twin | `/operator-twin` | Works with key | LLM key; local index in `TWIN_INDEX_DIR` |
| Hands-free | `/handsfree` | Works with key | LLM key or Ollama; local Whisper (`WHISPER_LOCAL_URL`) for voice input |
| Triadic | `/triadic` | Works with local service | Ollama (`OLLAMA_BASE_URL`, `OLLAMA_OPS_MODEL`) |
| Venice characters | `/venice` | Works with key | `VENICE_API_KEY` |
| Voice bus / TTS | `/voice` | Works with key | `LMNT_API_KEY`, or `OPENAI_API_KEY`, or `ELEVENLABS_API_KEY`; STT via `WHISPER_LOCAL_URL` |
| AI autonomy tests | `/ai-autonomy-tests` | Works with key | LLM key (`/api/chat`, s3v3n panel) |
| Test harness | `/test-harness` | Works with key | LLM key; optional `BUILDSHIP_PANEL_URL` |
| Integration tests | `/integration-tests` | Works with key | Reports which of Postgres / Supabase / Groq / xAI / Blob are configured |
| DIMM drive / GPU mesh | `/dimm-drive` | Works with local service | `DIMMCTL`, `DIMM_CONFIG`; GPU scheduling is dry-run unless `RUNPOD_API_KEY` is set (never auto-spins) |
| Shodan | `/intelligence/shodan` | Works with key | `SHODAN_API_KEY` for host/search; InternetDB lookup is keyless |
| Threat intel lookups | `/intelligence/threat-intel` | Works with key | Any of `VIRUSTOTAL_API_KEY`, `ABUSEIPDB_API_KEY`, `GREYNOISE_API_KEY`, `OTX_API_KEY`, `CENSYS_API_ID`/`SECRET` |
| Kepler intelligence map | `/intelligence/kepler` | Working | GeoMap (deck.gl hex/heatmap/points) over parsed intel + data packs. Upload now handles GeoJSON/JSON/CSV with lat/lng; free text still goes through entity extraction. Mapbox basemap with `NEXT_PUBLIC_MAPBOX_TOKEN`, otherwise free MapLibre + CARTO/OSM |
| Dashboard | `/dashboard` | Works with key | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Database health | `/database-health` | Works with key | Supabase keys |
| Database setup | `/database-setup` | Works with key | Supabase keys |
| Forecast engine | `/forecast-engine` | Works with key | Supabase keys (runs with in-memory data without them) |
| v0 bridge terminal | `/v0-bridge-terminal` | Works with key | Supabase keys for persistence |
| Phone Suite | `/phone-suite` | Works with local service | `adb` on the host with a USB-debug device (shows a hint otherwise). Voice-clone, IMEI/location-spoof and SIP panels are **UI mocks** that do nothing. They are labelled in the UI and will not be implemented |
| Geospatial map | `/intelligence/map` | Working | Data packs (quakes, botnet C2s by country, NWS alerts, countries) + Load your own; live refresh per pack |
| Hunter map | `/intelligence/hunter` | Working | Same map, botnet-C2 focus |
| Graphene bridge | `/graphene-bridge` | Works with local service | `adb`; camera stream is not implemented (use scrcpy) |
| BeastWagon | `/beastwagon` | Stub | Simulated telemetry; no data feed exists |
| Command prompt | `/command-prompt` | Stub | Mock shell. A real remote shell is deliberately not exposed in a web UI |
| Linux terminal | `/linux-terminal` | Stub | Same as above |
| Windows terminal | `/windows-terminal` | Stub | Same as above |
| Terminal (multi-pane) | `/terminal` | Stub | Simulated command output |
| Terminal dashboard | `/terminal-dashboard` | Stub | Sample logs |
| Conscious terminal | `/conscious-terminal` | Stub | Scripted replies; use `/ai-hub` for real chat |
| File explorer | `/file-explorer` | Stub | Mock tree; use `/evidence-explorer` for real files |
| File browser | `/file-browser` | Stub | Mock tree |
| Obsidian vault | `/obsidian-vault` | Stub | Sample vault; needs a vault reader |
| Markdown editor | `/markdown-editor` | Stub | Editing works; "save to vault" is simulated |
| Self-healing | `/self-healing` | Stub | Sample incidents (route no longer crashes) |
| System config | `/system-config` | Stub | Env manager and repair simulator use sample data |
| Legacy modules | `/legacy-modules` | Stub | Sample list |
| Sacred hall | `/sacred-hall` | Stub | Simulated readings |
| Visualizations | `/visualizations` | Partial | Threat globe uses real data packs (Natural Earth outlines, Feodo C2s, USGS quakes); network and system-health views are sample data |
| Network security | `/network-security` | Stub | Sample status values |
| Threat analysis | `/threat-analysis` | Stub | Sample threats; use `/intelligence/threat-intel` |
| Reports | `/reports` | Stub | Sample list |
| Singularity hub | `/hub` | Stub | Sample panels |
| CCTV | `/intelligence/cctv` | Stub | No camera feeds |
| ERD / investigation graph | `/intelligence/erd` | Stub | Sample data |
| OSINT | `/intelligence/osint` | Stub | Simulated search |
| Recruit | `/intelligence/recruit` | Stub | Simulated search |
| Recruitment | `/intelligence/recruitment` | Stub | Simulated search |
| Secure messages | `/intelligence/secure` | Stub | Sample messages; nothing is sent or encrypted |
| Messages | `/intelligence/messages` | Stub | Sample messages |
| SIGINT | `/intelligence/sigint` | Stub | Simulated logs |
| Signal bands | `/intelligence/signal` | Stub | Simulated readings |
| Vault streams (Postgres panel) | `/intelligence/vault-streams` | Stub | Mock query results |

## AI engines

| Engine | Before | After |
|---|---|---|
| AXIOS, Heimdall, Ghostlight, EchoNexus, Nova Prime, ShadowVox, OB1 | Canned/offline replies (their Python backends live outside this repo) | **Real** persona chat through `lib/llm` (xAI → OpenAI → Venice → Groq → Ollama). Without a provider: "needs key" |
| Venice bridge (`lib/ai/ops-router`) | Stub | **Real** Venice API call (`VENICE_API_KEY`) |
| `/api/chat` | Mock text | **Real** LLM, or an honest 503 |
| Sigil2vec | Stub | **Real** embedding index (OpenAI → Ollama → local hashed vectors), stored in `local-data/sigil2vec` |
| Voice TTS | LMNT only | LMNT → OpenAI → ElevenLabs |
| Shodan | Fake mock results | **Real** API, or "Needs SHODAN_API_KEY". InternetDB is keyless |
| WhisperMesh bus | Real | Real (local file bus + SSE) |
| GPU mesh scheduler | Dry-run | Dry-run by design (needs `RUNPOD_API_KEY`; never auto-spins) |
| Omniverse adapter | Stub | Stub. Needs NVIDIA Omniverse; no real backend in this repo |
| AI Caller | n/a | New. Real Twilio + STT/LLM/TTS pipeline; demo mode without keys |

## Typecheck

`next build` now enforces TypeScript (`typescript.ignoreBuildErrors: false`). Some legacy files are not imported by any route. They had type errors and are listed in `tsconfig.json` `exclude`, e.g. old CVE/Nmap parsers, phonesuite system classes, Supabase helpers and unused consciousness panels. If you wire one of them into a page, TypeScript checks it again automatically, because imported files are always checked. Run `npm run typecheck` to verify.

## Maps and data packs

All map routes share one component, `components/maps/GeoMap.tsx`:

- **Basemap.** Mapbox Dark is used when `NEXT_PUBLIC_MAPBOX_TOKEN` is a `pk.*` token. Set it in `.env.local` only and never commit it. Without a token the map uses free **MapLibre + CARTO Dark Matter** (OpenStreetMap data). If that style can't load, for example offline, the map falls back to a plain background with the bundled Natural Earth country outlines. A map always renders. Force the free basemap with `?basemap=maplibre` or the in-map toggle.
- **Layers.** deck.gl **points / hexagon / heatmap** plus GeoJSON polygons. These are the same layer engine Kepler.gl uses. The full kepler.gl React UI (redux + styled-components) is not embedded.
- **Data packs.** These are in `public/data-packs/` (about 320 KB total). `manifest.json` records the name, source URL, license, update date, feature count and size. Each pack loads from the cached copy by default, and "fetch live from source" refreshes it through `/api/data-packs/:id?live=1`. If the live fetch fails, the cached copy is shown. Refresh the cache with `node scripts/update-data-packs.mjs`.
- **Load your own.** GeoJSON, a JSON array, or CSV/TSV with lat/lng columns. Files are parsed in the browser and never uploaded.

| Pack | Source | License | Location precision |
|---|---|---|---|
| Natural Earth countries 1:110m | naturalearthdata.com (nvkelso/natural-earth-vector) | Public domain | Polygons |
| USGS earthquakes M2.5+ (7 days) | earthquake.usgs.gov GeoJSON feed | Public domain | Exact epicentre |
| abuse.ch Feodo Tracker botnet C2s | feodotracker.abuse.ch recommended blocklist | CC0 | **Country centroid** (feed's country code; no IP geolocation) |
| NOAA/NWS active alerts | api.weather.gov | Public domain | Polygon when given, otherwise **state / marine-area centre** |

Not built:

- **CISA KEV joined to vendor country.** A vendor's headquarters says nothing about where a vulnerability is exploited, so the KEV feed stays a list on `/recon`.
- **`components/terminal/network-map.tsx`.** This is a non-geographic topology diagram inside the simulated `/terminal` output and stays sample data.
- **`NmapVault`.** No route mounts it, so it is excluded from typecheck as legacy.

## Security hardening (2026-11-11)

Applied from the audit of `/workspace/command-hub-audit` onto this tree (re-implemented, not blind-copied):

- Root `middleware.ts` + `next.config.mjs` `headers()` — CSP / XFO / nosniff / referrer-policy; URL signature gate.
- `lib/security/api-auth.ts` (`requireHubAuth`, `SECURE_MODE`, `HUB_API_TOKEN`) wired to ADB, DIMM mutators, evidence SQLite, ghostlight, brain, shodan search/host.
- ADB shell: `ADB_SHELL_ENABLED=1` + command allowlist (no shell metacharacters).
- Threat-intel analyze: blocks loopback / RFC1918 / link-local / metadata targets.
- Markdown XSS: escape-first in `lib/markdown.ts` and markdown-editor; `javascript:` hrefs blocked.
- Heimdall IDS: file-backed ring at `local-data/heimdall-ids/` + `/api/security/ids/ingest`.
- hub-config placeholders emptied; biofeedback `eval` removed; fake base64 encrypt → 501.
- See `SECURITY.md` for operator env and `docs/DEPENDENCY_NOTES.md` for package upgrades.

## Hardware / RF suite (Workstream B, 2026-11-11)
- `/offsec/hardware` — Bluetooth, CAN bus, USB/HID (DuckyScript generator + BadUSB heuristic detector),
  LAN capture, Shodan+Censys (server-side), VoIP, SDR, Flipper Zero (real) + Flipper One (PREDICTED/UNRELEASED).
  REAL local launcher/config/reference panels + command builders. Auto-runs nothing.
- `/offsec/phone` — scrcpy + ADB workflows for the operator's OWN authorized device. ADB API routes gated.
- Server-side intel: `/api/shodan/{search,host,dns,count,internetdb,status}` and
  `/api/censys/{search,host,status}`. Keys server-only; hub-auth gated in SECURE_MODE; SSRF-blocked IPs.
- Honest WIP shells remain: call interception / audio injection, IMSI-catcher / Stingray-class — never shipped functional.
- New libs: `lib/offsec/hardware.ts`, `lib/offsec/duckyscript.ts`, `lib/censys/server.ts`.

## Threat Field engine (Workstream C, 2026-11-11)
- `/offsec/threat-field` + `/api/offsec/threat-field` — Nash (fictitious play), Fourier/FFT, Monte-Carlo zone field.
- 3D viz via `@react-three/fiber` / `three` with automatic 2D canvas fallback.
- `lib/offsec/threat-engine/{types,nash,fourier,montecarlo,field}.ts`. Model output only.

## Docs / CCTV / cleanup (Workstream D, 2026-11-11)
- Docs: README quickstart, INSTALL.md, USAGE.md, UPDATING.md, CONTRIBUTING.md; SECURITY.md responsible disclosure; in-hub `/help`.
- CCTV wall rewritten at `/intelligence/cctv` with per-tile recon metadata model (`lib/cctv/types.ts`), recon import (`fromShodan`/`fromCensys`/`fromUrl`), vendor patterns, file-backed layouts (`data/cctv/`), staged-unlock connect (`CCTV_CONNECT_ENABLED`).
- Consciousness framing neutralized in UI/bootstrap (hub-bus + compat alias). Dev Operator dependencies preserved.

## Dev Operator (Workstream E, 2026-11-11)
- System prompt aware of new OffSec / CCTV / threat-field modules.
- Backend status: `lib/dev-operator/backend-status.ts` + UI strip (sigma-lane / panel-twin / model-connected).
- Env: `LOCAL_LLM_BASE_URL`, `OLLAMA_BASE_URL`, `LOCAL_LLM_MODEL` (plus existing Venice/Ollama ops keys).

## Deception / Heimdall eyes-only (Workstream F, 2026-11-11)
- `/offsec/deception` + `/api/offsec/deception{,/capture,/vt,/canary}` — REAL defensive deception mesh.
- Decoys emulated (USB/serial/service/route); canaries; capture+quarantine+hash; fingerprinting.
- VT: hash lookup free; sample upload opt-in (`DECEPTION_VT_SUBMIT_ENABLED`) + staged ladder.
- Eyes-only logs: AES-256-GCM (`lib/heimdall/eyes-only.ts`, key `HEIMDALL_LOG_KEY`). Glyph skin COSMETIC.
- Sandboxed agent: design + privsep stub + compose/seccomp/AppArmor sketches (`docs/architecture/SANDBOXED_AGENT.md`). Detonation refused on-host.
- Artifacts: `data/offsec/deception/` (decoys/canaries/profiles/samples/events), `local-data/deception-quarantine/`, `local-data/heimdall-eyes-only/` (all gitignored).
