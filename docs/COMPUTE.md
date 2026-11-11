# Compute / AI Acceleration

Real performance infrastructure for the hub's local-AI workloads (Dev Operator, RE AI-assist, OSINT enrichment, threat-field sims).

**Route:** `/compute` · **API:** `GET/POST /api/compute` · **Lib:** `lib/compute/*`

HOLD_VYRNA_UNSYNC · `lattice_sync: false`

## What is real

| Capability | Where | Notes |
|---|---|---|
| Multi-backend model router | `lib/compute/router.ts` | Pool local Ollama, RunPod, and any OpenAI-compatible base URL |
| Health checks + failover | router | Probe `/api/tags` or `/v1/models`; skip down / circuit-open |
| Least-loaded / latency-aware / cost-aware / round-robin | router | `COMPUTE_ROUTER_POLICY` or per-request `policy` |
| Speculative / parallel prompting | router | Race N healthy backends; first success wins |
| Per-backend concurrency caps | router | `maxConcurrency` / `COMPUTE_LOCAL_CONCURRENCY` |
| Circuit breaker → local fallback | router | 3 failures → 30s open; traffic sheds to remaining healthy backends |
| Warm-pool pre-load | router `warmBackend` | Tiny completion so weights stay resident |
| Bounded job queue | `lib/compute/jobs.ts` | Async semaphore for I/O; `worker_threads` for CPU-bound |
| Throughput / latency metrics | `lib/compute/metrics.ts` | In-process ring buffer — no external telemetry |
| Tiered memory (RAM disk for caches) | `/dimm-drive` | Cap-limited tmpfs — see `docs/DIMM_DRIVE.md` |

## What is documented-only (model-server side)

These are real speedups, but the hub cannot force them. Configure the model server, then point the pool at it.

- **Quantization (Q4/Q5/Q8)** — `ollama pull <model>:<quant-tag>`; set `LOCAL_LLM_MODEL` to that tag
- **GPU offload** — Ollama `PARAMETER num_gpu` / `OLLAMA_NUM_GPU`; llama.cpp `--n-gpu-layers`
- **KV-cache reuse** — keep system prompts stable across turns (Dev Operator already does)
- **Continuous batching** — vLLM / TGI / some RunPod workers; point `COMPUTE_BACKENDS` at them

## What is NOT real (do not claim)

- **"Virtualized RAM → extra compute"** / **"virtual CPU AI brain"** — fiction. RAM is capacity, not FLOPs. The real analogs are: pick a quantized model that fits, keep caches on DIMM Drive (tmpfs), and offload layers to a GPU.
- **Kotlin coroutines inside this hub** — the hub is Next.js / TypeScript. The real equivalent is `async/await` + a bounded job queue + Node `worker_threads` for CPU-bound work.
- **Pretending the hub "turns on" quantization or GPU layers** — those are model-server settings. The Performance surface on `/compute` labels them `document-only` on purpose.

## Config (empty defaults in `.env.example`)

```bash
# Pool discovery (any combination)
LOCAL_LLM_BASE_URL=""          # or OLLAMA_BASE_URL — always added if set
LOCAL_LLM_MODEL=""
COMPUTE_BACKENDS=""            # JSON array OR comma-separated base URLs
RUNPOD_ENDPOINT_URL=""         # or RUNPOD_BASE_URL
RUNPOD_API_KEY=""
RUNPOD_MODEL=""
COMPUTE_OPENAI_BASE_URL=""     # extra OpenAI-compat worker
COMPUTE_OPENAI_API_KEY=""

# Behavior
COMPUTE_ROUTER_POLICY=""       # least-loaded | latency-aware | cost-aware | round-robin | speculative
COMPUTE_SPECULATIVE=""         # 1 to default speculative races
COMPUTE_WARM_ON_START=""       # 1 to warm on first status fetch
COMPUTE_JOB_CONCURRENCY=""     # default 4
COMPUTE_LOCAL_CONCURRENCY=""   # default 2
COMPUTE_RUNPOD_CONCURRENCY=""  # default 4
```

### `COMPUTE_BACKENDS` JSON example

```json
[
  {
    "id": "local",
    "kind": "ollama",
    "baseUrl": "http://127.0.0.1:11434",
    "label": "Ollama",
    "maxConcurrency": 2,
    "costWeight": 1,
    "defaultModel": "llama3.2:3b-instruct-q4_K_M"
  },
  {
    "id": "runpod-a",
    "kind": "runpod",
    "baseUrl": "https://api.runpod.ai/v2/<endpoint-id>",
    "label": "RunPod A",
    "maxConcurrency": 4,
    "costWeight": 5,
    "apiKeyEnv": "RUNPOD_API_KEY",
    "chatPath": "/openai/v1/chat/completions"
  }
]
```

## Degradation

| State | Behavior |
|---|---|
| Zero backends configured | Status shows clear "no compute backend configured"; chat returns `ok:false` |
| One backend reachable | Pool works; no failover redundancy; `degraded: true` on responses |
| Multiple reachable | Full routing, speculative race, circuit-breaker shed |
| Backend flaps | Circuit opens after 3 failures for 30s; traffic moves to healthy peers (typically local Ollama) |

## API sketch

```
GET  /api/compute                  → pool status, jobs, metrics, performance guidance
GET  /api/compute?action=health    → re-probe all backends
GET  /api/compute?action=jobs      → job list
GET  /api/compute?action=job&id=…  → one job
POST /api/compute {"action":"chat","prompt":"…"} 
POST /api/compute {"action":"chat","policy":"speculative","speculativeCount":2,"messages":[…]}
POST /api/compute {"action":"warm"} / {"action":"warm","backendId":"local-ollama"}
POST /api/compute {"action":"submit_job","kind":"cpu-bound"|"chat"|…,"payload":{…}}
POST /api/compute {"action":"cancel_job","id":"…"}
POST /api/compute {"action":"set","policy":"cost-aware","speculative":true,"jobConcurrency":4}
```

Mutating actions honor `requireHubAuth` when `SECURE_MODE=1` or a hub token is configured.

## Dev Operator

The Dev Operator system prompt knows about `/compute` and `/api/compute`. Prefer routing inference through the pool when backends are configured (`GET /api/compute` for health). Sigma-lane still comes first for defensive lane decisions.

## Related

- `docs/DIMM_DRIVE.md` — real RAM-disk tier for AI caches
- `docs/GPU_MESH.md` — planning stub for paid GPU peers (keys presence only)
- `lib/ai/ops-router.ts` / `lib/llm/` — existing single-provider helpers (still valid; pool sits beside them)
