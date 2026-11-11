# DIMM Drive

**ADD-ONLY** · HOLD_VYRNA_UNSYNC · lattice_sync: false

Convert a quota-designated slice of host RAM (and optional remote/RunPod RAM) into a fast disk for local AI caches.

## Paths

| Piece | Path |
|-------|------|
| Engines control | `/workspace/singular-ty-engines/dimm-drive/scripts/dimmctl.sh` |
| Config (no secrets) | `/workspace/dimm-drive/config.json` |
| Mount / consumer path | `/workspace/dimm-drive/mnt` → tmpfs **or** `/dev/shm/singular-dimm` |
| Live helpers | `lib/dimm-drive/` |
| API | `GET/POST /api/dimm-drive` |
| UI | `/dimm-drive` (+ chips on `/dev-operator`, `/command-hub`) |
| Sigil2vec stub | `singular-ty-engines/dimm-drive/sigil2vec/` → DIMM `sigil/` |

## Safety (15Gi box)

- Cap = `min(requested, floor(available×0.5), 4Gi)` unless `DIMM_FORCE=1`
- Never take last 2Gi for OS
- Refuse if available &lt; 2.5Gi (unless force)

## Research

- **Sigil2vec**: designed in vault (`triadic_relearn`, phone_runpod) as glyph→~128-D→vector DB — **no runnable pack on disk**. Stub hash-unit embed stores vectors under `sigil/`.
- **sigil2cec**: typo / non-name — removed.
- **RunPod chain**: vault reports describe pods as CommandHub agents / mesh GPU relay — see engines `chain.md`.

## Couplings

- KV-cache + GGUF scratch → `models/`, `kv/`
- EchoNexus / sigma symbol pools → `symbols/`
- Sigil2vec hits → `sigil/`
- Ollama → `dimmctl.sh hook-ollama` / `OLLAMA_MODELS`
- Sigma pink/brown pulse MultiDimPool shards → prefer DIMM path when mounted (`preferDimmSubdir`)
- Warm RunPod pod with matching `/dev/shm/singular-dimm` for tier-2 mirror

## API

```http
GET  /api/dimm-drive
GET  /api/dimm-drive?action=tiers
POST /api/dimm-drive {"action":"setQuotaGb","sizeGb":0.5}
POST /api/dimm-drive {"action":"ensureMounted","sizeGb":0.5}
POST /api/dimm-drive {"action":"destroy"}
```

## Sigil2vec (2026-09-24)

- Adapter: `singular-ty-engines/dimm-drive/sigil2vec/adapter.py`
- When `cv2` is importable in `.venv-echonexus`, a local CNN-free descriptor probe is available (64×64 gray hist+Sobel+ORB → 128-D), but the public badge remains **STUB_HASH** because no trained/runnable Sigil2vec pack is present
- Hash-unit fallback is also **STUB_HASH**
- UI: `/dimm-drive` + `/api/dimm-drive` + mesh assimilate tag
- HOLD_VYRNA_UNSYNC · lattice_sync: false
