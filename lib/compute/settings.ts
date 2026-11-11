/**
 * Performance settings surface — honest about what the hub can vs cannot control.
 * Quantization / KV-cache / GPU offload live on the model server (Ollama etc.);
 * the hub documents them and exposes the knobs that actually apply here
 * (router policy, concurrency, speculative race, warm-pool).
 * HOLD_VYRNA_UNSYNC · lattice_sync: false
 */

import type { PerformanceSetting } from "./types"

let speculativeEnabled = process.env.COMPUTE_SPECULATIVE === "1" || process.env.COMPUTE_SPECULATIVE === "true"
let warmOnStart = process.env.COMPUTE_WARM_ON_START === "1" || process.env.COMPUTE_WARM_ON_START === "true"

export function listPerformanceSettings(): PerformanceSetting[] {
  return [
    {
      id: "router-policy",
      title: "Router policy",
      hubControl: "env-config",
      summary: "How the pool picks a backend: least-loaded, latency-aware, cost-aware, round-robin, or speculative race.",
      guidance: [
        "Set COMPUTE_ROUTER_POLICY=least-loaded|latency-aware|cost-aware|round-robin|speculative",
        "Override per request via the API `policy` field",
        "cost-aware prefers low costWeight backends (local Ollama over RunPod)",
      ],
      appliesTo: ["hub router"],
    },
    {
      id: "speculative-race",
      title: "Speculative / parallel prompting",
      hubControl: "toggle",
      enabled: speculativeEnabled,
      summary: "Race 2+ healthy backends; first successful completion wins (lowest-latency-wins).",
      guidance: [
        "Enable with COMPUTE_SPECULATIVE=1 or POST /api/compute {action:'set', speculative:true}",
        "Costs more tokens/GPU-seconds on paid backends — pair with cost-aware when budget matters",
        "Useless with a single backend (falls back to normal routing)",
      ],
      appliesTo: ["hub router"],
    },
    {
      id: "concurrency-caps",
      title: "Per-backend concurrency caps",
      hubControl: "env-config",
      summary: "Hard cap on in-flight requests per backend so a slow Ollama doesn't get stampeded.",
      guidance: [
        "COMPUTE_LOCAL_CONCURRENCY (default 2), COMPUTE_RUNPOD_CONCURRENCY (default 4)",
        "Or set maxConcurrency per entry in COMPUTE_BACKENDS JSON",
        "Job queue has its own COMPUTE_JOB_CONCURRENCY (default 4)",
      ],
      appliesTo: ["hub router", "job queue"],
    },
    {
      id: "circuit-breaker",
      title: "Circuit breaker → CPU / local fallback",
      hubControl: "document-only",
      summary: "After 3 consecutive failures a backend opens for 30s; traffic sheds to remaining healthy backends (typically local Ollama).",
      guidance: [
        "Automatic — no toggle",
        "Watch /compute for circuit-open badges",
        "Fix the backend, wait for cooldown, or POST {action:'health'} to re-probe",
      ],
      appliesTo: ["hub router"],
    },
    {
      id: "warm-pool",
      title: "Warm-pool model pre-load",
      hubControl: "toggle",
      enabled: warmOnStart,
      summary: "Issue a tiny completion so model weights stay resident (kills cold-start latency).",
      guidance: [
        "POST /api/compute {action:'warm'} or {action:'warm', backendId:'local-ollama'}",
        "COMPUTE_WARM_ON_START=1 to warm on first status fetch",
        "Ollama keeps models loaded based on its own keep_alive; this just primes them",
      ],
      appliesTo: ["hub router", "Ollama", "RunPod"],
    },
    {
      id: "quantization",
      title: "Quantization (Q4/Q5/Q8)",
      hubControl: "document-only",
      summary: "Model-server side. Hub cannot force it — pull a quantized tag in Ollama.",
      guidance: [
        "ollama pull llama3.2:3b-instruct-q4_K_M   # example Q4",
        "Smaller weights → less RAM, faster tokens, slight quality tradeoff",
        "Set LOCAL_LLM_MODEL to the quantized tag so the hub routes to it",
        "There is no hub API that 'turns on quantization' — it is a model artifact choice",
      ],
      appliesTo: ["Ollama", "llama.cpp", "model server"],
    },
    {
      id: "gpu-offload",
      title: "GPU offload layers",
      hubControl: "document-only",
      summary: "Ollama / llama.cpp decide how many layers live on GPU (num_gpu / n_gpu_layers).",
      guidance: [
        "Ollama: set in Modelfile `PARAMETER num_gpu 99` (or env OLLAMA_NUM_GPU)",
        "llama.cpp server: --n-gpu-layers N",
        "Hub does not inject these — configure the model server, then point LOCAL_LLM_BASE_URL at it",
        "Verify with nvidia-smi / ollama ps while a request is in flight",
      ],
      appliesTo: ["Ollama", "llama.cpp"],
    },
    {
      id: "kv-cache",
      title: "KV-cache reuse",
      hubControl: "document-only",
      summary: "Prefix KV-cache lives inside the model server. Reusing a stable system prompt helps.",
      guidance: [
        "Keep the system prompt identical across turns so the server can reuse the prefix cache",
        "Ollama and most OpenAI-compat servers do this automatically",
        "Hub already sends a stable Dev Operator system prompt for this reason",
      ],
      appliesTo: ["model server"],
    },
    {
      id: "batching",
      title: "Request batching",
      hubControl: "document-only",
      summary: "Continuous batching is a model-server feature (vLLM, TGI, some RunPod workers).",
      guidance: [
        "Ollama does limited continuous batching on its own — no hub knob",
        "For high-QPS: point COMPUTE_BACKENDS at a vLLM / TGI OpenAI-compat URL",
        "Hub job queue already bounds concurrency so you don't overload a non-batching server",
      ],
      appliesTo: ["vLLM", "TGI", "RunPod workers"],
    },
    {
      id: "tiered-memory",
      title: "Tiered memory (DIMM Drive + model size vs RAM)",
      hubControl: "document-only",
      summary: "Real analog of 'RAM boosting': keep model caches on a RAM-backed volume; pick a model that fits.",
      guidance: [
        "DIMM Drive (/dimm-drive) mounts a capped tmpfs for AI caches — see docs/DIMM_DRIVE.md",
        "Rule of thumb: model RAM ≈ weights + KV-cache + runtime (~1.2–1.5× quantized weight size)",
        "If the model does not fit in RAM it will page to disk and tank tokens/sec — pick a smaller/quantized tag",
        "NOT REAL: 'virtualizing RAM into extra compute' / 'virtual CPU AI brain' — those do not exist; do not claim them",
      ],
      appliesTo: ["DIMM Drive", "host RAM", "model selection"],
    },
    {
      id: "job-parallelism",
      title: "Async job parallelism (TS async + worker_threads)",
      hubControl: "env-config",
      summary: "Bounded concurrent job runner for scans/enrichment/analysis. Hub is TypeScript, not Kotlin — this is the real 'coroutines/threads' equivalent.",
      guidance: [
        "COMPUTE_JOB_CONCURRENCY (default 4)",
        "I/O-bound jobs use async; CPU-bound kind uses Node worker_threads",
        "Dashboard at /compute — submit / cancel / status via /api/compute",
      ],
      appliesTo: ["hub job queue"],
    },
  ]
}

export function getSpeculativeEnabled(): boolean {
  return speculativeEnabled
}

export function setSpeculativeEnabled(v: boolean): void {
  speculativeEnabled = v
}

export function getWarmOnStart(): boolean {
  return warmOnStart
}

export function setWarmOnStart(v: boolean): void {
  warmOnStart = v
}
