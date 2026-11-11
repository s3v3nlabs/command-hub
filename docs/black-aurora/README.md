# Black Aurora Labs — Invite Portal

Monochrome classified-terminal portal for issuing invite codes and gating a **source bundle download** of the Command Hub.

## Honesty

- A **public** GitHub repository **cannot** be code-gated for `git clone`. Anyone can clone a public repo.
- This portal’s real control is a **server-side gated download** (`git bundle` or tarball) after a valid invite is redeemed.
- True clone-gating requires making the GitHub repo **private** and handing out collaborator invites / fine-grained PATs out-of-band (`BLACK_AURORA_MODE=github-private` documents that path; no live token minting).
- Browser anti-screenshot / destroy-on-blur (SecureFrame) is a **UX deterrent only** — not enforceable. Real controls: single-use tokens, server expiry/revoke, `Cache-Control: no-store`.

## Routes

| Path | Purpose |
|------|---------|
| `/black-aurora` | Landing |
| `/black-aurora/verify` | Enter 8-char code |
| `/black-aurora/drop/[token]` | Soft-check + unlock |
| `/black-aurora/access/[token]` | Instructions + download |
| `/black-aurora/admin` | Mint / list / revoke (HUB_API_TOKEN) |

## APIs

- `GET/POST /api/black-aurora/invites` — admin (auth)
- `POST /api/black-aurora/verify` — `{ code, redeem?: boolean }`
- `GET /api/black-aurora/download?grant=...&format=bundle|tar` — streams artifact

## Data

Invites live at `data/black-aurora/invites.json` (gitignored via `/data/*`). Temp bundles under `local-data/black-aurora/bundles/` (gitignored).

See USAGE.md § Black Aurora Labs.
