# Hub Hands-free Phase 4 — Nav + Cross-AI Multiplex (SHIP)

**Operator:** S3v3n | Labs S3v3nslabs  
**Agent:** Grok Bot (executor)  
**Shipped:** 2026-09-24 ~07:07–07:20 MDT (America/Denver)  
**Hold:** `HOLD_VYRNA_UNSYNC` · `lattice_sync: false`  
**Constraint:** ADD-ONLY · no secrets · **NO Grok voice clone** · no Venice API burns · no wake-word model download · Privacy Fortress (no server plaintext prompt/transcript logs)

**Queue:** R2 item **17** / hands-free + cross-AI multiplex  
**Live tree:** `/workspace/vercel-v0/projects/v0-user-interface/latest`  
**Reused:** Phase 3 `VoiceBusPanel` speech patterns → thin hook `lib/voice/useSpeechRecognition.ts` (ADD-ONLY; VoiceBusPanel left intact)

---

## Route

| URL | Soft-verify |
|-----|-------------|
| **http://127.0.0.1:3000/handsfree** | expect **200** |
| http://127.0.0.1:3000/api/handsfree/status | **200** honest seats + command cheat-sheet |

---

## Hands-free nav commands (BROWSER-LOCAL)

Client-only `SpeechRecognition` → `router.push`. Badge **BROWSER-LOCAL**. Cheat-sheet also clickable.

| Say | Route |
|-----|-------|
| open reclaim | `/reclaim` |
| open venice | `/venice` |
| open music | `/music` |
| open triadic | `/triadic` |
| open signalframe | `/signalframe` |
| open voice | `/voice` |
| open privacy | `/privacy` |
| open mesh | `/mesh` |
| open soundcheck | `/soundcheck` |
| open twin | `/operator-twin` |
| open command hub | `/command-hub` |
| open handsfree | `/handsfree` |

Aliases exist (e.g. “go to …”, “open heimdallr”, “open voice bus”) — see `lib/handsfree/commands.ts`.

---

## Multiplex seats — LIVE vs STUB (honesty)

| Seat | Badge (overnight) | API | Notes |
|------|-------------------|-----|-------|
| Operator Twin | **LIVE** (indexed) | `POST /api/ai/twin` | Local RAG · no fake answer if DOWN |
| AXIOS local | **LIVE** if engine files present | `POST /api/s3v3n-panel` `{ preferSeat:"axios", includeOwnedCloud:false }` | Extract axios column only · honesty if offline |
| Ollama | **DOWN** (serve not running) | `POST /api/triadic/ollama-chat` | Shows DOWN / 503 text — no fake completion |
| Ghostlight search | **LIVE** if vault DB present | `POST /api/ghostlight/search` | Read/FTS · titles/snippets only |
| Venice cloud | **STUB** | none | Link to `/venice` · **never** calls `api.venice.ai` |

Optional **Listen → prompt** toggle fills multiplex textarea from browser transcript (same hook).

---

## Files (ADD-ONLY)

### New
- `app/handsfree/page.tsx`
- `components/handsfree/HandsFreePanel.tsx`
- `app/api/handsfree/status/route.ts`
- `lib/handsfree/commands.ts`
- `lib/handsfree/status.ts`
- `lib/voice/useSpeechRecognition.ts`
- `command-hub-modular/HANDSFREE_PHASE4.md` (this report)
- `latest/docs/HANDSFREE_PHASE4.md` (mirror)

### Edited (nav enable / queue note only)
- `components/layout/sidebar.tsx` — Hand import; top **Hands-free** → `/handsfree`; Ops Modules **Hands-free Multiplex**
- `app/command-hub/page.tsx` — fortress rail `handsfree` → `/handsfree`
- `components/voice/VoiceBusPanel.tsx` — enable `/handsfree` link (was disabled R2 #17)
- `command-hub-modular/OPERATOR_PUSH_QUEUE_72H.md` — R2 item 17 DONE

### Unchanged (not thinned)
- `/voice` · `/music` · `/soundcheck` · `/triadic` · `/signalframe` · `/venice`
- Phase 3 voice APIs / VoiceBusPanel STT/TTS logic (hook added beside, not a rewrite strip)

---

## API shape

`GET /api/handsfree/status` →

```json
{
  "ok": true,
  "service": "handsfree",
  "hold": "HOLD_VYRNA_UNSYNC",
  "lattice_sync": false,
  "nav": { "mode": "BROWSER_LOCAL", "badge": "BROWSER_LOCAL", "commands": [/* cheat-sheet */] },
  "seats": {
    "twin": { "badge": "LIVE|PARTIAL|DOWN", "api": "POST /api/ai/twin", "...": "..." },
    "axios": { "badge": "LIVE|DOWN", "...": "..." },
    "ollama": { "badge": "LIVE|DOWN", "...": "..." },
    "ghostlight": { "badge": "LIVE|DOWN", "...": "..." },
    "venice": { "badge": "STUB", "href": "/venice" }
  },
  "bans": ["No Grok / xAI voice clone", "No Venice API burns from /handsfree", "..."]
}
```

---

## Operator how-to

1. Open **http://127.0.0.1:3000/handsfree** (Sidebar → **Hands-free** / Ops Modules / Command Hub fortress / `/voice` related link).
2. **Enable nav listen** (Chrome/Edge) → say e.g. “open reclaim” → client navigates.
3. Check seat badges · select columns · type Operator prompt · **Fan to selected**.
4. Optional: **Listen → prompt** to dictate into multiplex box (client-only).
5. Venice column if selected shows STUB + link — use `/venice` for cloud chat.
6. Related: `/voice` · `/triadic` · `/signalframe` · `/privacy` · `/mesh`.

---

## Explicit bans honored

- Do **not** clone or imitate Grok / xAI voice.
- Do **not** claim Vyrna lattice voice sync (`lattice_sync: false`).
- Do **not** download wake-word / large STT models overnight.
- Do **not** call `api.venice.ai` from `/handsfree`.
- Do **not** log full prompt bodies to server logs.
- Do **not** thin existing modules (ADD-ONLY).
