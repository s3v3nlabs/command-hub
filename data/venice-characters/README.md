# Venice Characters (Phase 2 — local packs)

Operator-owned **LOCAL PACK** folders for Singular Command Hub `/venice`.

- Each subdirectory = one character pack (`manifest.json` + optional `README.md` / `system_digest.md`).
- **Never** claim these are live on Venice.ai marketplace / cloud.
- Holds: `HOLD_VYRNA_UNSYNC` · `lattice_sync: false` · no secrets · no PSID.
- Sources in manifests are **paths only** (FULL_RECALL digests, translilucense personas, vault reports).
- Triadic `AXIOS_PULSE` / `VENICE_PULSE_SCRIPT` is **bayed** — Operator pastes when awake; not auto-sent.
- Drop or create packs via UI **New pack** (writes under this directory only) or Operator drop-folder.

API: `GET|POST /api/venice/characters`
