# WhisperMesh — Proxy-chain ≠ Mesh LoRA

**ADD-ONLY · HOLD_VYRNA_UNSYNC · `lattice_sync: false`**  
**Live tree:** `v0-user-interface/latest`  
**Bible:** `command-hub-modular/WHISPERMESH_BUILD_BIBLE.md` §5

## One-line

**Proxy-chain** is Privacy Fortress *egress*. **Mesh LoRA** is SYMTRAIN/DIMM *model fine-tune*. They are not the same layer.

| Concept | What it is | What it is not |
|---------|------------|----------------|
| **proxy-chain** | `S3V3N_EGRESS_MODE=proxy-chain` + optional `S3V3N_HTTP_PROXY` first hop for server-side non-local fetches | WhisperMesh whisper bus · VPN login · multi-hop auto-chain · LoRA training |
| **Mesh LoRA** | Designed train-lane fine-tune on Operator GPU seats (SYMTRAIN / DIMM / GPU mesh) | WhisperMesh protocol · **DRY-RUN/STUB only** from hub UI today |

## Proxy-chain honesty

Env **names only** (never commit values):

| Var | Role |
|-----|------|
| `S3V3N_EGRESS_MODE` | `direct` \| `vpn` \| `tor` \| `proxy-chain` |
| `S3V3N_HTTP_PROXY` | `http(s)://host:port` — first hop for undici `ProxyAgent` |
| `S3V3N_TOR_SOCKS` | TCP reachability check only |

`GET /api/privacy/status` reports (no secrets):

- `egress.mode`
- `egress.httpProxyConfigured` — env string present (yes/no only)
- `egress.proxyActive` — mode needs proxy **and** usable `http(s)://` URL
- `egress.proxyChainSelected` / `proxyChainConfigured` / `proxyChainHonesty`

UI: `/privacy` · SignalFrame **ShadowRelay** (`components/signalframe/shadow-relay.tsx`).

Further hops beyond the first HTTP proxy are **Operator infrastructure**. This app attaches at most one ProxyAgent.

ProtonVPN / WireGuard: see `docs/PRIVACY_FORTRESS.md` Appendix A (host `wg-quick` by Operator — hub does not log in or bring tunnels up).

## Mesh LoRA honesty

- Docs: `docs/SYMTRAIN.md` · `docs/GPU_MESH.md` · `docs/MESH_EFFICIENCY.md`
- Hub: `/symtrain` (Train Lane + **MESH LoRA TRAIN-LANE** DRY-RUN/STUB panel) · `/mesh`
- Actions today: `dryRunTrain` / mesh `dryRun` — symbolic / stub only
- **Do not** claim live LoRA fine-tune, Omniverse license, or paid GPU pods
- WhisperMesh **may later route** train jobs via Hive/mesh APIs; that routing is future adjacency, not current protocol

## Hold

- `HOLD_VYRNA_UNSYNC`
- Every status payload keeps `lattice_sync: false`
- No Venice burns without Operator key
- No secrets in UI, docs, or commits
