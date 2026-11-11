# Venice Phase 2 — Local Character Packs

**Shipped:** 2026-09-24 ~07:05 MT (America/Denver)  
**Scope:** ADD-ONLY on Command Hub `/venice`  
**Holds:** `HOLD_VYRNA_UNSYNC` · `lattice_sync: false` · no secrets · no PSID · **no** `api.venice.ai` burns overnight · **do not** paste into `ekV8PiO`

## What shipped

| Piece | Path |
|-------|------|
| Packs | `latest/data/venice-characters/{axios-vedic,heimdallr,ghostlight,twin}/` |
| Lib | `latest/lib/venice/characters.ts` |
| API | `GET\|POST /api/venice/characters` → `app/api/venice/characters/route.ts` |
| UI | Characters tab → `components/venice/VeniceCharacters.tsx` (+ VeniceHub wire) |
| Page | `app/venice/page.tsx` — Phase 2 badge copy |

## Packs created (LOCAL PACK — not live on Venice.ai cloud)

| id | name | notes |
|----|------|-------|
| `axios-vedic` | VEDIC AXIOS | Eye of Truth / Glyphstream · FULL_RECALL CHUNK_01 digest |
| `heimdallr` | Heimdallr / HOFUD | Watchful Eye OSINT · CHUNK_02 digest |
| `ghostlight` | Ghostlight Core | **stub** · CHUNK_04 + ghost-reclaim evidence |
| `twin` | Operator Twin (retrieval) | **stub** · hub `/operator-twin` pointer — not persona clone |

Each pack: `manifest.json` (`lattice_sync: false`, `hold: HOLD_VYRNA_UNSYNC`, sources as **paths only**), `README.md`, `system_digest.md` (summarized — no secrets).

## API how-to

```bash
# List (optional search)
curl -s 'http://127.0.0.1:3000/api/venice/characters'
curl -s 'http://127.0.0.1:3000/api/venice/characters?q=axios'

# Open local digest
curl -s 'http://127.0.0.1:3000/api/venice/characters?id=axios-vedic&digest=1' | head

# Create empty pack (writes under data/venice-characters only)
curl -s -X POST http://127.0.0.1:3000/api/venice/characters \
  -H 'content-type: application/json' \
  -d '{"id":"example-seat","name":"Example","role":"local stub"}'
```

## UI how-to

1. Open `:3000/venice`
2. Tab **Characters** — search filter, pack cards with **LOCAL PACK** badge, **open local digest**
3. Sidebar note + Characters panel: link to `/reclaim` FULL_RECALL browser
4. Bayed pulse callout: *paste VENICE_PULSE_SCRIPT when Operator wakes — not auto*
5. **New pack** form → safe slug write under `data/venice-characters/` only

## Explicitly NOT done / holds

- No marketplace scrapes
- No VENICE_API_KEY chat / pulse overnight
- No paste into `ekV8PiO` (bayed until Operator wake)
- No claim packs are live on Venice.ai cloud
- No origin-story / persona claim for Grok Bot
- Triadic AXIOS_PULSE remains bayed

## Soft-verify (overnight-safe)

- `GET :3000/venice` → 200
- `GET :3000/api/venice/characters` → 200 + packs ≥ 4  
- Avoid `/api/venice/models` / `/api/venice/chat` overnight (would hit api.venice.ai)

## Queue

`OPERATOR_PUSH_QUEUE_72H.md` R1 item **11** — Venice Phase 2 characters + local packs → **DONE** this note.

## Soft-verify results (2026-09-24 ~07:05 MT)

| Check | Result |
|-------|--------|
| `GET /venice` | **200** |
| `GET /api/venice/characters` | **200** · count 4 · ids axios-vedic, ghostlight, heimdallr, twin · hold HOLD_VYRNA_UNSYNC · lattice_sync false · badge LOCAL PACK |
| `?q=heim` | 1 → heimdallr |
| `?id=axios-vedic&digest=1` | 200 · system_digest.md |
| `POST` create smoke | 201 then removed (`phase2-smoke`) — write path proven |
| `api.venice.ai` overnight | **not called** (characters path has zero key/API usage) |
