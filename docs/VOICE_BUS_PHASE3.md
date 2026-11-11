# Hub Voice Bus Phase 3 — STT/TTS Scaffold (SHIP)

**Operator:** S3v3n | Labs S3v3nslabs  
**Agent:** Grok Bot (executor)  
**Shipped:** 2026-09-24 ~07:04–07:08 MDT (America/Denver)  
**Hold:** `HOLD_VYRNA_UNSYNC` · `lattice_sync: false`  
**Constraint:** ADD-ONLY · no secrets · **NO Grok voice clone** · no Venice burns · no large STT model download (15Gi box) · Privacy Fortress (no server plaintext transcript logs)

**Queue:** R2 item **16** / hub-voice  
**Live tree:** `/workspace/vercel-v0/projects/v0-user-interface/latest`  
**Hint reused:** `components/CommandHub/VoiceAlertTest.tsx` (browser TTS pattern; not rewritten)

---

## Route

| URL | Soft-verify |
|-----|-------------|
| **http://127.0.0.1:3000/voice** | expect **200** |
| http://127.0.0.1:3000/api/voice/status | **200** honest seats |
| http://127.0.0.1:3000/api/voice/tts | GET = probe; POST = **503 STUB** until `LMNT_API_KEY` |

Alias `/voice-bus` not created — single canonical `/voice`.

---

## LIVE vs STUB seats (honesty)

| Seat | Badge | Notes |
|------|-------|-------|
| Browser Web Speech (STT+TTS) | **BROWSER_LOCAL** | Mic → transcript + speak demos run **in-browser only**. Prefer female `speechSynthesis` voice when available. Server cannot claim LIVE mic. |
| Whisper STT | **NOT_CFG** (overnight) | Probes **only** when `WHISPER_LOCAL_URL` is set (localhost). No blind `:8080` probe (avoids tunnel-client HTML false PARTIAL). **Never** calls paid OpenAI even if `OPENAI_API_KEY` present. No whisper.cpp model download. |
| LMNT TTS | **NOT_CFG** / **READY** | Env `LMNT_API_KEY` presence check only (never printed). Absent → POST `/api/voice/tts` **503 STUB**. Present → real LMNT speech call (text not logged). |
| Nova Prime / Singularity IP TTS | **STUB** | Cards list reclaim **paths** if found under `singular-ty-engines` / FREQUENCY_TECH. No fake synthesis. |
| Female Operator TTS seat | UI selector | Defaults to **browser female** OR **LMNT** when configured. Banner: **Operator-owned seat — not Grok clone**. |

---

## Files (ADD-ONLY)

### New
- `app/voice/page.tsx`
- `components/voice/VoiceBusPanel.tsx`
- `app/api/voice/status/route.ts`
- `app/api/voice/tts/route.ts`
- `lib/voice/status.ts`
- `command-hub-modular/VOICE_BUS_PHASE3.md` (this report)
- `latest/docs/VOICE_BUS_PHASE3.md` (mirror)

### Edited (ADD nav / env names only)
- `components/layout/sidebar.tsx` — `Mic` import; top **Voice Bus** → `/voice`; Ops Modules **Voice Bus STT/TTS**
- `app/command-hub/page.tsx` — fortress rail `voice-bus` → `/voice`
- `.env.example` — `LMNT_API_KEY=` · `WHISPER_LOCAL_URL=`
- `command-hub-modular/OPERATOR_PUSH_QUEUE_72H.md` — R2 item 16 note

### Unchanged (not thinned)
- `/music` · `/soundcheck` · `/triadic` · `/signalframe`
- `components/CommandHub/VoiceAlertTest.tsx`
- `lib/audio.ts`

---

## API shape

`GET /api/voice/status` →

```json
{
  "ok": true,
  "service": "voice",
  "hold": "HOLD_VYRNA_UNSYNC",
  "lattice_sync": false,
  "seats": {
    "browser": { "badge": "BROWSER_LOCAL", "role": "STT+TTS", "..." : "..." },
    "whisper": { "badge": "NOT_CFG", "role": "STT", "..." : "..." },
    "lmnt": { "badge": "NOT_CFG", "role": "TTS", "configured": false },
    "nova": { "badge": "STUB", "role": "TTS_IP", "paths": ["…"] }
  },
  "operatorSeat": {
    "id": "female-operator-tts",
    "default": "browser",
    "banner": "Operator-owned seat — not Grok clone"
  },
  "bans": ["No Grok / xAI voice clone …"],
  "links": { "music": "/music", "soundcheck": "/soundcheck", "…" : "…" }
}
```

`POST /api/voice/tts` `{ "text": "…", "voice": "leah" }`  
→ audio when LMNT configured · else **503** `{ stub: true, status: "STUB" }` · never invents audio · does not log text body.

---

## Operator how-to

1. Open **http://127.0.0.1:3000/voice** (or Sidebar → **Voice Bus** / Ops Modules → **Voice Bus STT/TTS** / Command Hub fortress → **Voice Bus**).
2. Allow mic when prompted → **Enable mic / listen** → transcript stays in-tab (not server-logged).
3. Pick **Browser female voice** (default) → edit speak box → **Speak**.
4. To enable LMNT later: set `LMNT_API_KEY` in `.env.local` (never commit) → restart Next → seat badge **READY** → selector unlocks LMNT.
5. Local Whisper later: run whisper.cpp / openai-compatible on localhost → set `WHISPER_LOCAL_URL=http://127.0.0.1:PORT` → refresh status (still no paid OpenAI overnight).
6. Nova / Singularity IP: reclaim from paths listed on the Nova card / engines tree — no overnight fake TTS.
7. Related: `/music` · `/soundcheck` · `/triadic` · `/signalframe` · `/privacy`. Hands-free is R2 #17 (link disabled until built).

---

## Explicit bans honored

- Do **not** clone or imitate Grok / xAI voice.
- Do **not** claim Vyrna lattice voice sync (`lattice_sync: false`).
- Do **not** download large STT models overnight (available RAM ~5Gi of 15Gi at ship time).
- Do **not** thin `/music` or `/soundcheck`.
