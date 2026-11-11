# S3v3n Panel of Experts (private)

Local mirror of the BuildShip “AI Panel of Experts” UX — **without** BuildShip cloud/billing.

## Pattern

1. One prompt → parallel fan-out to many seats  
2. Compare outputs side-by-side (`/test-harness`)  
3. Score / leaderboard / pick a seat for follow-up  
4. Aggregated top (or selected) answer  
5. Local REST: `POST /api/s3v3n-panel` (Ship-as-API equivalent)

## Seats (privacy-first)

| Seat | Privacy | When live |
|------|---------|-----------|
| `twin-rag` | `PRIVATE_LOCAL` | Operator Twin local index |
| `ollama` | `PRIVATE_LOCAL` | `127.0.0.1:11434` up |
| `axios` | `PRIVATE_LOCAL` | `singular-ty-engines/run_axios.py` |
| `ghostlight-vault` | `PRIVATE_LOCAL` | MCP `127.0.0.1:8765` only (never public tunnel URL) |
| `venice` | `PRIVATE_VENICE` | `VENICE_API_KEY` set (owned key only) |
| `groq` / `xai` / `openai` | owned-key | reclaim `.env.local` keys |
| mock harness | `MOCK_ZERO_EGRESS` | zero network fallback |

**Refused:** scraping third-party UIs, unpaid commercial spoof, cookie theft, BuildShip-as-required-cloud.

## Harness order

`S3v3n private panel` → optional `BUILDSHIP_PANEL_URL` (`/api/panel`) → mock

## Env names (no secrets committed)

```
VENICE_API_KEY=
VENICE_API_URL=          # optional, default api.venice.ai
VENICE_OPS_MODEL=
S3V3N_PANEL_PERSIST=     # set 1 to write chmod-600 metadata-only evidence under chatgpt-vault ingest
BUILDSHIP_PANEL_URL=     # optional secondary
BUILDSHIP_PANEL_SECRET=
```

## Privacy rules

- Do not log prompt/response bodies to console, analytics, or shared files.  
- Evidence (if enabled): metadata + prompt hash only, `chmod 600`, reclaim vault path, never commit.  
- Ghostlight adapter uses **loopback only**.

## Files

- `lib/selfHealing/S3v3nPanel.ts`
- `app/api/s3v3n-panel/route.ts`
- `lib/selfHealing/BuildShipHarness.ts` (wired order)
- `app/test-harness/page.tsx` (leaderboard / pick / aggregate / badges)
- `app/api/panel/route.ts` (optional BuildShip proxy)
