# Dependency notes (post-audit)

## Applied / recommended

| Package | Action | Notes |
|---------|--------|-------|
| `next` | **Bumped to 15.5.29** | Applied. Addresses critical Next advisories reported against 15.1.0. |
| miscellaneous | `npm audit fix` (non-force) **applied** | Vulns 84 → 69. Remaining need majors (kepler/maplibre/zod/shadcn) — not force-applied. |

## Do NOT force without a maps regression pass

| Package | Issue | Suggested | Risk |
|---------|-------|-----------|------|
| `maplibre-gl` | XSS sanitizer bypass ≤6.4.0 | `6.17.0`+ | **Major** — retest GeoMap / Kepler |
| `kepler.gl` / `@kepler.gl/*` | Large critical/high tree (`handlebars`, `form-data`, `request`, `fast-xml-parser`, …) | newer alpha / major | **High** UI breakage risk |
| `@vercel/blob` | multipart issues | latest | Possible major |

Never run `npm audit fix --force` on the publish tree without verifying `/intelligence/map`, Kepler, and the AI Caller bridge.
