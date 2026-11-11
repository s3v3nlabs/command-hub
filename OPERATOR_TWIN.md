# Operator Twin v1

**Route:** `/operator-twin`  
**API:** `GET|POST /api/ai/twin`  
**Hold:** `HOLD_VYRNA_UNSYNC` — `lattice_sync: false`  
**Scope:** local reclaim UI only (`v0-user-interface/latest`).  
**Honest label:** retrieval Twin over chat vaults — **not** a full persona clone; **no** cloud twin training upload.

## What shipped

| Piece | Path |
|-------|------|
| Page | `app/operator-twin/page.tsx` |
| UI | `components/CommandHub/modules/BeastOperatorTwin.tsx` |
| Indexer / search / query | `lib/ai/operator-twin.ts` |
| API | `app/api/ai/twin/route.ts` |
| Local index | `.local/twin-index/` (gitignored; `chmod 600` on DB/JSONL) |
| Docs | `OPERATOR_TWIN.md` |
| Sec hooks (stub) | `lib/command-hub/security-hooks.ts` |

Nav: sidebar **Ops Modules → Operator Twin**; home quick action **Operator Twin**.

## Vault sources (read-only)

- `/workspace/chatgpt-vault`
- `/workspace/grok-vault`
- `/workspace/gemini-vault`
- `/workspace/venice-vault`
- `/workspace/vercel-v0/v0-history`
- `/workspace/singular-ty-engines/personas`
- `/workspace/singular-ty-engines/prompts`

Ingest: text excerpts (`.md` `.txt` `.json` `.jsonl` `.yaml` `.yml` `.vtt` `.srt` …).  
Skip: binary, `.env*`, oversized files, `reclaim_keys` / quarantine dirs.  
Redact on store/display: lines matching `sk-` / `eyJ` / `BEGIN PRIVATE` / `gsk_` / `xai-` / Bearer tokens.

Camtasia / transcript: indexer records any path hitting `camtasia|transcript|.vtt|.srt|caption`. If none found under vault roots, status lists empty — honest gap for P3 voice.

## Refresh index

```bash
# Via API (preferred while dev server up)
curl -s -X POST http://127.0.0.1:3000/api/ai/twin \
  -H 'content-type: application/json' \
  -d '{"action":"refresh"}'

# Or click **Refresh index** on /operator-twin
```

Index files:

- `.local/twin-index/chunks.jsonl` — redacted chunks  
- `.local/twin-index/meta.json` — docs/chunks/root stats  

## Query shape (no secrets)

```bash
# Status
curl -s http://127.0.0.1:3000/api/ai/twin | head

# Search only
curl -s 'http://127.0.0.1:3000/api/ai/twin?action=search&q=heimdall'

# Twin answer (LLM if groq/openai/xai key present; else retrieval-only stitch)
curl -s -X POST http://127.0.0.1:3000/api/ai/twin \
  -H 'content-type: application/json' \
  -d '{"query":"What tone do engines personas use for Heimdall?","topK":5}'
```

Response includes `sources[]` (`vault`, `path`, `title`, `score`, `excerpt`), `confidence`, `mode` (`llm`|`retrieval-only`), `thin`, `hold`, `lattice_sync: false`.

System prompt (server): *You are Operator Twin for S3v3n; use only provided memory; never invent reclaim secrets; lattice_sync false.* Routes through `lib/ai/ops-router` (`routePrompt` with system override), preferring groq → openai → xai.

## Limits

- Cap files/chunks per root (see `lib/ai/operator-twin.ts` constants) — large ChatGPT raw dumps are sampled, not fully mirrored.
- Keyword / FTS-lite scoring (JSONL), not embeddings.
- If all provider auth fail → honest retrieval-only stitch of top chunks.
- Never paste secrets into chat, this doc, or API responses.

## P3 gaps (voice / etc.)

- Voice / STT Twin (Whisper or local) not wired  
- Camtasia project ingest if/when transcript text appears under vaults  
- Embedding index / better chunking for multi-GB raw exports  
- Command Hub high-sec / IDS / account rails: stubs in `lib/command-hub/security-hooks.ts` — login wiring follow-on; no credential consume  

## Smoke

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/operator-twin
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/api/ai/twin
curl -s -X POST http://127.0.0.1:3000/api/ai/twin \
  -H 'content-type: application/json' \
  -d '{"query":"Summarize Axios persona constraints without secrets","topK":4}'
```
