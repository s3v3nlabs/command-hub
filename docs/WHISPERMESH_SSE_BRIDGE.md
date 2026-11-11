# WhisperMesh SSE + BroadcastChannel Bridge — SHIP REPORT

**Shipped:** 2026-09-24 ~06:55 MT (America/Denver)  
**Live tree:** `/workspace/vercel-v0/projects/v0-user-interface/latest`  
**Hub:** http://127.0.0.1:3000/signalframe  
**Hold:** `HOLD_VYRNA_UNSYNC` · `lattice_sync: false` everywhere  
**Honesty badge:** **LOCAL MULTI-TAB** (not LIVE MESH)

---

## What shipped

Working **same-origin multi-tab whisper bridge** so two browser tabs on `:3000` see each other’s team-bus / SignalFrame whispers **without** claiming mesh lattice sync.

| Transport | Role |
|-----------|------|
| **BroadcastChannel** `signalframe-whisper` | Instant fanout between tabs on the same origin |
| **SSE** `GET /api/signalframe/bus/stream` | Reconnect / refresh path — polls existing team-bus store |

No long-lived Node `ws` server. No Vyrna sync. No secrets. No Venice burns. No ProtonVPN / `wg-quick`.

---

## Files touched (ADD-ONLY / additive)

| File | Change |
|------|--------|
| `lib/signalframe/whisper-bridge-client.ts` | **ADD** — BC + EventSource client, `startWhisperBridge`, `publishWhisperBridgeEvent`, `bridge.status()`, dedupe by id |
| `app/api/signalframe/bus/stream/route.ts` | **ADD** — `text/event-stream` poll of team-bus; hello / bus / heartbeat / bye; headers `X-Lattice-Sync: false`, `X-Whisper-Bridge: LOCAL-MULTI-TAB` |
| `lib/signalframe/team-bus.ts` | **ADD** `listTeamMessagesSince()` for SSE cursor |
| `components/signalframe/signalframe-console-pipe.tsx` | Start bridge on `/signalframe` load |
| `lib/command-hub/dev-console-hub.ts` | `CommandHubDev.bridge()`; whisper posts also BC-publish |
| `hooks/useSignalFrame.ts` | SEND → BC publish; subscribe appends peer events to active frame |
| `app/signalframe/page.tsx` | Honesty badge **LOCAL MULTI-TAB** |
| `components/signalframe/shadow-relay.tsx` | LOCAL MULTI-TAB honesty line |
| `lib/signalframe-bridge.ts` | ADD `injectSseBridge` / `getBridgeHonesty` (no WS requirement) |

Docs:

| File | Role |
|------|------|
| `/workspace/command-hub-modular/WHISPERMESH_SSE_BRIDGE.md` | This report |
| `latest/docs/WHISPERMESH_SSE_BRIDGE.md` | Copy for hub docs |

---

## Soft-verify (done overnight)

```bash
# SSE headers + hello
curl -sS -D - --max-time 3 \
  "http://127.0.0.1:3000/api/signalframe/bus/stream?channel=whisper" | head -30
# Expect: 200, content-type: text/event-stream
#   X-Lattice-Sync: false
#   X-Whisper-Bridge: LOCAL-MULTI-TAB
#   event: hello … lattice_sync:false … badge: LOCAL MULTI-TAB

curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/signalframe
# → 200
```

Observed: hello event + bus replay of recent whispers; `lattice_sync: false` on every JSON event.

---

## How Operator tests (two tabs)

1. Open **Tab A**: http://127.0.0.1:3000/signalframe  
2. Open **Tab B**: same URL (new tab, same origin).  
3. DevTools console either tab:
   - `CommandHubDev.help()`
   - `window.signalframe.bridge.status()`  
     → `{ channelConnected, sseConnected, transport: "broadcast"|"sse"|"both", lattice_sync: false, badge: "LOCAL MULTI-TAB" }`
4. **Tab A** frame SEND a short whisper (or `CommandHubDev.whisper("ping from A")`).  
5. **Tab B** frame log should show the peer message + a system tag `LOCAL MULTI-TAB · peer via broadcast` (or `sse` if BC missed).  
6. Refresh Tab B → SSE should catch up recent bus traffic (reconnect path).

Privacy: console glyphs log **ids / channel / bodyLen only** — never message bodies.

---

## API surface

```text
window.signalframe.bridge.status()
window.signalframe.bridge.publish(text, channel?)
CommandHubDev.bridge()
CommandHubDev.whisper(text)   # also BC-publishes after team-bus POST

GET /api/signalframe/bus/stream?channel=whisper&since=<ISO>
  events: hello | bus | heartbeat | bye | error
  every payload: lattice_sync: false
```

---

## Holds / non-goals

- `HOLD_VYRNA_UNSYNC` — never claim Vyrna lattice sync.  
- Badge is **LOCAL MULTI-TAB**, not “LIVE MESH”.  
- No Operator login, no VPN, no secrets in chat/docs/commits.  
- No Venice burns (`includeOwnedCloud: false` unchanged on SEND).  
- Existing hub modules not deleted/stripped.  
- Node `ws` mesh class in `lib/networking/whisper-mesh.ts` left unused (as designed).

---

## Blockers

None for local multi-tab path. Optional future: wire ShadowRelay chrome “MeshRelay” label explicitly to `bridge.status().transport` (still honest stub).

*End of SSE bridge report.*
