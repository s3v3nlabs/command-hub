# Contributing

Issues and pull requests are welcome at https://github.com/s3v3nlabs/command-hub.

We develop **iteratively** (agile), not waterfall. Short cycles beat big-bang releases.

## Iterative method

1. **Pick one feature** (or one honest WIP shell). Keep the blast radius small.
2. **Build → typecheck → test → build** until green.
3. **Commit per feature** with a clear message. Credit: Christian Wilford on upstream `main`.
4. **Green build before every push** to `origin/main`.
5. **Refactor when it hurts**, not on a schedule. Prefer consolidating duplicates over adding a third copy.
6. Repeat. ROADMAP.md is a living map, not a Gantt chart.

## Local loop

```bash
cp .env.example .env.local   # empty names only — fill what you need
npm install
npm run typecheck
npm test
npm run build
npm run dev -- -p 3100       # or: npx next start -p 3100
```

## Rules

- Never include secrets, `.env*` files, personal data, vault/evidence dumps, or databases in a PR.
- Keep the public repo **gitleaks-clean** (`gitleaks detect --source .`). False positives go in `.gitleaks.toml` after human review.
- Prefer **honest WIP shells** over fake demos for wiretapping / self-propagating malware (WIP-by-law). Everything else lawful → **fully functional**, gated by the **staged ladder** (USAGE.md).
- Do not ship working caller-ID / IMEI / location spoofing, call interception, or audio injection.
- Avoid "guaranteed", "lock", or "certain" language in threat-model / prediction UI copy.
- New routes: register in `lib/modules/registry.ts` + `components/layout/sidebar.tsx`.
- Credit third-party tools (name + URL); update NOTICE when you add references.

## Proposing a module

1. Sketch a `ModuleManifest` (id, name, version, description, route, permissions, `lattice_sync: false`).
2. Drop under `modules/<id>/` or POST via `/api/modules` / Dev Operator `create_module_stub`.
3. Wire a real page + API; use `requireHubAuth` + staged ladder if it can touch third-party targets.
4. Document in USAGE.md / MODULE_STATUS.md; add credits to NOTICE.

## Security reports

See [SECURITY.md](./SECURITY.md). Prefer private GitHub Security Advisories for exploit details.

## Criticism welcome

We explicitly want hard feedback on architecture, UX, legal gating, and missing realism. Open a bug / feature / security issue, or a PR. Small iterative patches preferred.
