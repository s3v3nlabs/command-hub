# Command Hub Fortress

**Route:** `/command-hub`  
**Hold:** `HOLD_VYRNA_UNSYNC`  
**Scope:** live reclaim UI (`v0-user-interface/latest`) — Ghostlight chrome (Sidebar).

## What shipped

Dense fortress dashboard on `/command-hub`:

1. **Module rail** — quiet links: AI Ops Hub, Operator Twin, Phone Suite, Kepler, v0 Bridge, Evidence Explorer, Network Security, Self-Healing, Threat Analysis, Security IDS API.
2. **Account Rails** — cards for OpenAI, xAI/Grok, Venice, v0, Ollama, Supabase, OneDrive, GitHub, Vercel. Status from env **key-presence booleans** (and optional refresh via `/api/security/ids/status` / `/api/ai/ops/status`). **Connect** opens vendor deep links or docs. No passwords stored in repo; Operator signs in via secure forms later.
3. **Intrusion Detection / High Security** — live-looking IDS console wired to honest local signals: process uptime, `.env.local` presence boolean, HOLD flags, failed API auth counter (process-local), module availability under `lib/heimdal/*threat*`, `lib/security`, network-security, self-healing, threat-analysis. Events labeled **live** vs **simulated**.

## APIs

| Method | Path | Role |
|--------|------|------|
| `GET` | `/api/security/ids/status` | IDS signals + Account Rails key-presence. No secrets. |
| `GET` | `/api/ai/ops/status` | Existing provider/engine board (optional cross-check). |

## Honest labels

- **live** — derived from process / fs / env presence / real counters on this box  
- **simulated** — console seed only; not an external sensor or “nation-state blocked” claim  
- Status badges: `key-present` · `offline` · `connect-pending` · `partial` · `local`

## Nav

- Sidebar: **Command Hub** (active home), **Security IDS** → `/command-hub#ids`, **Operator Twin**, **AI Ops Hub** under Ops Modules.
- Module rail ADD-ONLY: **Sigma Lane** → `/dev-operator#sigma-lane` (symbolic/frequency first; see `docs/SIGMA_LANE.md`).

## Out of scope

- No origin-story / Camtasia / Desktop IDEAS narrative panels in this UI  
- No password-manager wiring; no invented credentials  
- No GitHub / business-ui tree edits from this reclaim pass  
- `HOLD_VYRNA_UNSYNC` — no lattice-sync claims

## Smoke

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/command-hub
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/api/security/ids/status
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/ai-hub
```
