# Kepler + v0 Bridge Live Notes

Date: 2026-09-24 (America/Denver)

## Kepler Map (`/intelligence/kepler`) — REAL Mapbox

### Status
- `NEXT_PUBLIC_MAPBOX_TOKEN` present in `.env.local` (chmod 600, gitignored). Value not logged.
- Deps installed: `kepler.gl@3.2.6`, `react-redux`, `redux`, `styled-components`, `mapbox-gl` (+ deck.gl via Kepler tree).
- Live map surface: `components/maps/kepler-gl-real.tsx` — **Mapbox dark-v11** + **deck.gl** Hexagon / Heatmap / Scatter layers loading Heimdal intelligence points.
- `components/maps/kepler-module.tsx` keeps Ghostlight tabs/search/chrome; when token present shows **MAPBOX · KEPLER.GL LIVE** and auto-selects KEPLER backend; OSM/tactical stub retained as fallback if token missing.
- Full KeplerGl React chrome is React-19 fragile (`findDOMNode` / react-sortable-hoc); production renderer uses Mapbox + deck.gl (Kepler’s engine) for a working hex/heat map.

### Smoke
- `GET /intelligence/kepler` — 200
- Next restarted with `Environments: .env.local`

### Constraints honored
- No commit of `.env.local`
- Token never printed (length/prefix only)
- ADD-ONLY to UI chrome
