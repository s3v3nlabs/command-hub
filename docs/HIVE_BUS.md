# Hive Bus — cross-hub AI collab

Team Command Hub bus for panel consensus + intel packets.  
**Not** Vyrna lattice sync.

**Hold:** `HOLD_VYRNA_UNSYNC` · every event includes `lattice_sync: false`  
**Privacy Fortress:** never log prompt / intel summary bodies.

## Endpoints

| Method | Path | Role |
|--------|------|------|
| `GET` | `/api/hive` | Status + recent events |
| `POST` | `/api/hive` | `{ fromHub, toHub?, prompt, panel? }` consensus |
| `POST` | `/api/hive` | `{ kind: "intel", title, summary, severity, ... }` intel packet |

## Peers (optional)

Env **names only** (do not invent secrets):

- `S3V3N_HIVE_PEERS` — comma-separated peer base URLs
- `S3V3N_HIVE_SECRET` — shared header `x-s3v3n-hive-secret` / `S3V3N_HIVE_SECRET`

If unset, peer fan-out is skipped (local-only).

## BIG intel path

High/critical intel → replicate to peers → local Twin/RAG learn note → Signalframe team whisper → auto-draft `modules/proposals/patch-*.md` (defense notes only — no exploit payloads).

## See also

- `docs/PRIVACY_FORTRESS.md`
- `docs/BOUNTY_DISCLOSURE.md`
- `/modules` Hive status chip
