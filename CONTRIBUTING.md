# Contributing

Issues and pull requests are welcome at https://github.com/s3v3nlabs/command-hub.

## Rules

- Never include secrets, `.env*` files, personal data, vault/evidence dumps, or databases in a PR.
- Keep the public repo **gitleaks-clean** (`gitleaks detect --source .`). False positives go in `.gitleaks.toml` allowlist only after human review.
- Run `npm run build` before opening a PR — typecheck is on; 0 errors required.
- Credit third-party tools with name + upstream URL when you add launcher/reference panels.
- Prefer **honest WIP shells** over fake demos for hardware-gated or interception/spoofing-class capabilities.
- Do not ship working caller-ID / IMEI / location spoofing, call interception, or audio injection.
- Avoid "guaranteed", "lock", or "certain" language in threat-model / prediction UI copy.
- Commit messages: short imperative summary; credit author as configured in your fork. Upstream commits on `main` are credited to **Christian Wilford**.

## Dev loop

```bash
cp .env.example .env.local
npm install
npm run dev -- -p 3100
# elsewhere:
npm run build
```

New OffSec / Intelligence routes should be registered in `lib/modules/registry.ts` (so Dev Operator `listModules` can see them) and linked from `components/layout/sidebar.tsx`.

## Security reports

See [SECURITY.md](./SECURITY.md) — responsible disclosure.
