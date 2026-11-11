# BuildShip Panel of Experts (live path)

ADD-ONLY live wiring for Command Hub’s multi-AI panel. Offline mock harness remains the default when env is unset.

## Env names (values never committed)

| Name | Required | Purpose |
|------|----------|---------|
| `BUILDSHIP_PANEL_URL` | for live | Shipped BuildShip REST URL from Connect → REST API → Ship |
| `BUILDSHIP_PANEL_SECRET` | optional | Bearer token if BuildShip request auth is enabled |

Put values in `.env.local` or Vercel project env. Do **not** commit secrets or invent a placeholder URL.

## Flow

```
UI / harness
  → POST /api/panel  { prompt, sessionId? }
       → server fetch(BUILDSHIP_PANEL_URL)  (+ optional Bearer)
       ← panel JSON (normalized)
  ← metadata.source: "buildship-live"
```

If `BUILDSHIP_PANEL_URL` is unset, `/api/panel` returns **503** and `getMultiModelResponses()` falls back to mock (`mockGPT` / `echoAI` / `ghostLM`, `source: "mock"`).

## Files

- `app/api/panel/route.ts` — server proxy (URL never sent to client)
- `lib/selfHealing/BuildShipHarness.ts` — live try + mock fallback; exports `getPanelSource()`
- `app/test-harness/page.tsx` — optional source badge
- `app/api/chat/route.ts` — optional top-answer branch when URL is set

## Operator setup

1. Open historical project `https://app.buildship.com/p/buildship-aeoff0` or remix [AI Panel of Experts](https://buildship.com/templates/ai-panel-of-experts).
2. Confirm Keyless nodes (BuildShip credits).
3. Ship as REST API; copy URL → `BUILDSHIP_PANEL_URL`.
4. Restart `pnpm`/`npm` dev; open `/test-harness` — badge should show `buildship-live`.

Docs: https://docs.buildship.com/basics/ship-an-api

> **Primary path:** S3v3n private panel — see `docs/S3V3N_PANEL.md`. BuildShip URL is optional secondary only.
