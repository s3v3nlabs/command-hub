# GPU mesh quick prep

**ADD-ONLY · HOLD_VYRNA_UNSYNC · no live paid pods · no spinning GPUs**

The DIMM mesh is currently a disabled planning stub. Peer records live in
`/workspace/dimm-drive/config.json`; every endpoint is empty and every peer is
`enabled: false`. No account, notebook, pod, or GPU is created by this UI.

## Peer providers

- runpod — community/cheap pay-as-you-go; destroy when idle
- vastai — paid spot marketplace
- modal — credits-based hosted compute
- kaggle — free-ish notebook quota
- colab — free notebook tier
- paperspace — limited/free Gradient notebook option
- lightning — trial-ish availability
- huggingface-zerogpu — short demo jobs

`GET /api/dimm-drive` returns the configured peer list and only the names of
present environment keys (`RUNPOD_API_KEY`, `MODAL_TOKEN_ID`, `VAST_API_KEY`,
`KAGGLE_USERNAME`). It never returns their values. The page reports the mesh as
**not connected** until an operator intentionally enables a peer with a real
endpoint/notebook.

Hosted inference services such as Together, Fireworks, and Groq are API
providers, not DIY pod peers. See `singular-ty-engines/dimm-drive/chain.md` for
the honest 2026 free-vs-paid snapshot.


## Train Lane / free-tier Module Bay (ADD-ONLY)

Free-tier peers (kaggle, colab, hf-zerogpu, lightning, paperspace, …) may appear as
**Module Bay plugins** bound to **Operator-owned accounts only**, feeding a **quota mesh**.

- **Perishable** = jobs/pods (destroy when idle).
- **HARD FORBID** burner / trashable / perishable **ACCOUNT** farming.
- Job outputs assimilate into Teacher lessons via `/api/symtrain` `assimilateJob`.
- SYMTRAIN GPU path remains **dry-run** until the Operator intentionally enables keys/peers.

See `docs/SYMTRAIN.md` · `docs/TEACHER_STUDENT.md`.
