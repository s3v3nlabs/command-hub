# Mesh Efficiency — Operator-owned GPU seats

**ADD-ONLY · HOLD_VYRNA_UNSYNC · lattice_sync: false**

Standing free/quota GPU peers as hub integrations/modules. Auth is always
**Operator-owned**. Perishable means ephemeral **pods/jobs/notebooks**, never
identities.

## ALLOWED

- Module plugins for providers where **you** own the account
- Local **quota ledger** (manual or env-fed remaining hours/credits)
- **Schedule / rotate / combine jobs** across Operator-owned seats
- **Combo-lock** — do not dual-schedule the same seat
- **Assimilate** job outputs into Teacher→Student train bus / DIMM symbols
- Destroy idle pods/notebooks promptly

## FORBIDDEN

- Automation, scripts, email farms, CAPTCHA solvers, or flows that create
  **trashable / burner / perishable accounts** to farm free tiers
- Rotating throwaway identities or multi-account ToS-quota evasion
- Scraping provider UIs to evade quotas
- Any API action shaped like `createBurner`, `createAccount`,
  `rotateIdentity`, `farmFreeTier`, `captchaSolver`, `emailFarm`

Those requests return **HTTP 403** from `POST /api/mesh`.

## Providers (modules under `modules/mesh-*`)

| Module | Provider | Typical role |
|--------|----------|--------------|
| mesh-kaggle | Kaggle | train / reason |
| mesh-colab | Colab | reason / vision |
| mesh-hf-zerogpu | HF ZeroGPU | sigil2vec / vision |
| mesh-paperspace | Paperspace | render / train |
| mesh-lightning | Lightning | audio / train |
| mesh-modal | Modal | vision / reason |
| mesh-runpod | RunPod | reason / train |
| mesh-vastai | Vast.ai (optional) | train |

See also `docs/GPU_MESH.md` and dimm-drive `config.json` mesh peers
(all `enabled: false` by default).

## Rotate / combine / combo-lock

1. Operator edits remaining hours/credits on `/mesh` (or `POST updateQuota`).
2. `dryRun` picks the best unlocked peer for a role by remaining quota.
3. `scheduleJob` combo-locks that seat (no-op until Operator creds present).
4. When the ephemeral job finishes, **destroy** the pod/notebook and
   `releaseLock` so the seat can take the next job.
5. `assimilate` writes sanitized outputs into the train lesson store.

## Free-tier honesty

Free tiers vary, reset on provider schedules, and may disappear. The ledger is
**Operator-reported** — this UI never scrapes quotas for evasion. Prefer paying
seats you own when free quota is gone.

## Links

- UI: `/mesh` · Module Bay: `/modules` · Command Hub: `/command-hub`
- DIMM: `/dimm-drive` · Symtrain: `/symtrain`
- API: `GET/POST /api/mesh`
