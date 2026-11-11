/**
 * Compute / AI Acceleration — shared types.
 * REAL: multi-backend routing, job parallelism, health, circuit breakers.
 * NOT REAL: "virtualized RAM → extra compute", "virtual CPU AI brain".
 * HOLD_VYRNA_UNSYNC · lattice_sync: false
 */

export const HOLD = "HOLD_VYRNA_UNSYNC" as const

export type BackendKind = "ollama" | "openai-compatible" | "runpod"

export type BackendHealth = "healthy" | "degraded" | "down" | "unknown" | "circuit-open"

export type RouterPolicy = "least-loaded" | "round-robin" | "latency-aware" | "cost-aware" | "speculative"

export interface ComputeBackend {
  id: string
  kind: BackendKind
  /** Base URL without trailing slash (e.g. http://127.0.0.1:11434 or https://api.runpod.ai/v2/<id>) */
  baseUrl: string
  /** Optional OpenAI-compatible chat path override. Default: /v1/chat/completions for openai-compatible; /api/chat for ollama. */
  chatPath?: string
  /** Optional tags path for health (Ollama /api/tags). */
  healthPath?: string
  label: string
  /** Soft concurrency cap for in-flight requests through this backend. */
  maxConcurrency: number
  /** Relative cost weight (higher = more expensive). Used by cost-aware policy. */
  costWeight: number
  /** Default model id if caller does not specify one. */
  defaultModel?: string
  /** Bearer / API key env var NAME (never the value). Empty = no auth header. */
  apiKeyEnv?: string
  enabled: boolean
}

export interface BackendRuntimeState {
  id: string
  health: BackendHealth
  inFlight: number
  totalRequests: number
  totalErrors: number
  totalTimeouts: number
  consecutiveFailures: number
  lastLatencyMs: number | null
  ewmaLatencyMs: number | null
  lastCheckedAt: number | null
  lastError: string | null
  circuitOpenedAt: number | null
  models: string[]
  warmed: boolean
}

export interface BackendSnapshot extends ComputeBackend {
  state: BackendRuntimeState
  apiKeyPresent: boolean
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | string
  content: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  model?: string
  system?: string
  maxTokens?: number
  temperature?: number
  timeoutMs?: number
  /** Prefer a specific backend id; still fails over if it is down. */
  preferBackendId?: string
  policy?: RouterPolicy
  /** Race N healthy backends; first successful completion wins. */
  speculativeCount?: number
}

export interface ChatResponse {
  ok: boolean
  text: string
  backendId: string | null
  model: string | null
  latencyMs: number
  policy: RouterPolicy
  speculative?: boolean
  error?: string
  degraded?: boolean
  hold: typeof HOLD
  lattice_sync: false
}

export type JobStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled"

export type JobKind = "chat" | "enrich" | "analyze" | "scan" | "warm" | "custom" | "cpu-bound"

export interface JobRecord {
  id: string
  kind: JobKind
  label: string
  status: JobStatus
  createdAt: number
  startedAt: number | null
  finishedAt: number | null
  progress: number
  error: string | null
  result: unknown
  backendId: string | null
  cancelRequested: boolean
}

export interface JobSubmitInput {
  kind: JobKind
  label?: string
  /** Opaque payload the runner interprets. */
  payload?: Record<string, unknown>
  /** Optional priority — higher runs sooner within the queue. */
  priority?: number
}

export interface PerformanceSetting {
  id: string
  title: string
  /** What the operator can actually do from the hub. */
  hubControl: "toggle" | "document-only" | "env-config"
  enabled?: boolean
  summary: string
  guidance: string[]
  appliesTo: string[]
}

export interface ComputePoolStatus {
  ok: boolean
  service: "compute"
  backends: BackendSnapshot[]
  reachableCount: number
  configuredCount: number
  policy: RouterPolicy
  jobs: {
    queued: number
    running: number
    concurrency: number
    recent: JobRecord[]
  }
  metrics: {
    requestsTotal: number
    errorsTotal: number
    avgLatencyMs: number | null
    p95LatencyMs: number | null
    throughputPerMin: number
  }
  performance: PerformanceSetting[]
  degradation: string
  hold: typeof HOLD
  lattice_sync: false
}
