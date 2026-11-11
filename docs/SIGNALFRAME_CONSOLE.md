# SignalFrame Console Pipe — Operator Runbook

**Route:** `/signalframe`  
**Hold:** `HOLD_VYRNA_UNSYNC` · every status keeps `lattice_sync: false`  
**Privacy:** Glyph banners + meta only — **never** log message bodies  
**Shipped:** 2026-09-24 ~06:45 MT (America/Denver)

---

## What loads on `/signalframe`

1. `components/signalframe/signalframe-console-pipe.tsx` imports:
   - `lib/signalframe/consciousness-bridge.ts` → binds **`window.signalframe`**
   - `lib/command-hub/dev-console-hub.ts` → binds **`window.CommandHubDev`** (dev-flagged)
2. DevTools console shows glyph banners (`⟐` / `🕯`) when the pipe is ready.

Dev flag: enabled when `NODE_ENV=development`, or `S3V3N_DEV_CONSOLE=1`, or `NEXT_PUBLIC_S3V3N_DEV_CONSOLE=1`. On `/signalframe` the hub also binds in-browser so Operator help works locally without extra env.

---

## Safe commands (copy into DevTools)

```js
CommandHubDev.help()
CommandHubDev.status()          // signalframe + /api/privacy/status summary
CommandHubDev.whisper("ping")   // POST team-bus; body never console.logged

window.signalframe.status()
window.signalframe.whisper("meta")   // forwards to consciousness; console shows len only
window.signalframe.vision("meta")
window.signalframe.ghostlog.write({ type: "note", id: "op-1" })  // sanitized
window.signalframe._heimdall
```

**Rejected / unused:** `__WHISPER__` is not a shipped global. Prefer `window.signalframe` + `CommandHubDev`.

---

## Privacy Fortress rules (console)

| Do | Don't |
|----|-------|
| Log status, ids, channel, `lattice_sync: false`, body **length** | `console.log` prompt / reply / whisper **bodies** |
| Keep glyph banners for observability | Arbitrary `eval` of remote paste |
| Use local seats first for frame SEND | Claim Vyrna lattice sync |

---

## Frame toolbar ops (R1.5)

On each frame header: **Mirror · Fork · Mute · Reveal**

| Op | Effect |
|----|--------|
| **Mirror** | Creates a linked copy (`mirrorSourceId`); source `mirrorStatus=mirroring`, copy `mirrored` |
| **Fork** | Independent clone (messages deep-copied); clears mirror link |
| **Mute** | Sets `isMuted`; SEND blocked + system ack |
| **Reveal** | Clears mute + unminimizes; SEND restored |

Bridge twin: `lib/signalframe-bridge.ts` mutates its frame map the same way (socket injection still Phase-2).

---

## Smoke

1. Open `http://127.0.0.1:3000/signalframe`
2. DevTools → Console → expect `⟐ SignalFrame console pipe ready` / `CommandHubDev bound`
3. Run `CommandHubDev.help()` and `window.signalframe.status()`
4. Toolbar: Mute → type → blocked; Reveal → SEND works again

---

## Next (not this ship)

- Bridge SSE / localhost WS socket injection (R1.6) — skipped if large
- Venice Phase-2 Bearer — Operator key only; no burns on frame SEND without flag

---

## Multi-tab bridge (ADD-ONLY overnight)

Same-origin **LOCAL MULTI-TAB** fanout (not live mesh):

```js
window.signalframe.bridge.status()
// → { transport: "broadcast"|"sse"|"both", lattice_sync: false, badge: "LOCAL MULTI-TAB", … }
CommandHubDev.bridge()
```

Two tabs on `/signalframe`: SEND or `CommandHubDev.whisper("hi")` in tab A appears in tab B via BroadcastChannel (SSE reconnect at `/api/signalframe/bus/stream`). Full report: `docs/WHISPERMESH_SSE_BRIDGE.md`.
