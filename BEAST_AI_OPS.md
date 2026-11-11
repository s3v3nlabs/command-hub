# Beast AI Ops Hub

**Route:** `/ai-hub`  
**Hold:** `HOLD_VYRNA_UNSYNC` — no lattice-sync claims.  
**Scope:** live reclaim UI only (`v0-user-interface/latest`). Ollama pipe wired; currently expect **offline** until `ollama serve` is up on the box.

## What shipped

### UI
- `components/CommandHub/modules/BeastAIOpsHub.tsx` — dense Ops Hub
- `app/ai-hub/page.tsx` — Ghostlight chrome (Sidebar + Header strip), same pattern as Phone Suite / v0 Bridge
- Nav: sidebar **AI Ops Hub** → `/ai-hub`; home quick action **AI Ops Hub**

### Panels
1. **Provider board** — OpenAI/GPT, xAI/Grok, Groq, Ollama, Venice Vedic Axios, Heimdall, v0 Bridge, Mistral (placeholder), NVIDIA NIM (placeholder), Whisper STT (placeholder). Status from **key presence booleans** + Ollama probe. Secrets never returned.
2. **Deep links rail** — ChatGPT, Grok, Venice, v0.dev, Ollama docs/local, NVIDIA NIM, Mistral console (new tab).
3. **Engines rail** — Axios, Heimdall, Nova Prime, EchoNexus, Shadowvox, OB-1. Safe smoke via API (`--demo` / `--handshake` only, short timeout) under `/workspace/singular-ty-engines`.
4. **Prompt router** — textarea + provider select + liberation toggle → `POST /api/ai/ops`.
5. **Local nav** — Phone Suite, Kepler, v0 Bridge, Heimdal terminal.

### APIs
| Method | Path | Role |
|--------|------|------|
| `GET` | `/api/ai/ops/status` | Providers (keyPresent bool + honest status), ollama tags, engines summary, deep links. No secrets. |
| `POST` | `/api/ai/ops` | `{ provider, prompt, liberation? }` or `{ action: "engine-smoke", engine, mode? }` |

Server helper: `lib/ai/ops-router.ts`.

### Honest status labels
`live` · `offline` · `stub` · `partial` · `placeholder` · `key-present`

## How to use
1. Open `http://127.0.0.1:3000/ai-hub`
2. Click **Refresh** to load board status
3. Select a provider card (or dropdown), type a prompt, optional **Liberation protocol**, **Send**
4. Use engine **--demo** / **--handshake** buttons for local stub smoke only
5. Deep links open vendor consoles; Venice returns structured “open + copy” + optional Axios `--demo` output

## Provider routing behavior
| Provider | Behavior |
|----------|----------|
| OpenAI | Live chat when `OPENAI_API_KEY` present |
| xAI | Live chat when `XAI_API_KEY` present |
| Groq | Live chat when `GROQ_API_KEY` (or `AI_GROQ_API_KEY`) present |
| Ollama | `http://127.0.0.1:11434` — shows offline clearly when down; chat when up |
| Venice | Partial bridge: open Venice.ai + copy prompt; optional `run_axios.py --demo` |
| Heimdall | Engines local handshake (`lattice_sync: false`) |
| v0 Bridge | Stub / deep-link to `/v0-bridge-terminal` |
| Mistral / NIM / Whisper | Placeholders |

Existing `lib/AI_Multiplexer.ts` remains (liberation protocols / simulated providers). Ops Hub uses the new ops-router for real key-gated HTTP calls.

## Gaps / next
- **Ollama down** on box — start local daemon to flip status to live
- **Venice** — no official API; bridge is open+copy + Axios demo
- **Mapbox / Kepler twin (P2)** — geospatial twin not in this ship
- Mistral / NIM / Whisper need keys + real clients later
- Do not scrub `.env.local`; never paste secrets into chat or this doc

## Smoke
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/ai-hub
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/
curl -s http://127.0.0.1:3000/api/ai/ops/status | head
# Safe prompt (if a key exists):
curl -s -X POST http://127.0.0.1:3000/api/ai/ops \
  -H 'content-type: application/json' \
  -d '{"provider":"groq","prompt":"Reply with exactly: OPS_OK","liberation":false}'
```

## P2 shipped
**Operator Twin** — `/operator-twin` + `GET|POST /api/ai/twin` (local vault retrieval). See `OPERATOR_TWIN.md`.

## P3 suggestion
Voice / STT Twin + Camtasia transcript ingest when present; Command Hub IDS/account rails (stubs in `lib/command-hub/security-hooks.ts`).
