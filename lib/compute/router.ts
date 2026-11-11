/**
 * Multi-backend model router / compute pool.
 * Real "RunPod chaining": health-checked pool, least-loaded / latency-aware /
 * cost-aware / round-robin / speculative-race policies, per-backend concurrency
 * caps, circuit breaker → shed to remaining healthy backends (CPU/local fallback).
 * HOLD_VYRNA_UNSYNC · lattice_sync: false
 */

import {
  discoverBackends,
  apiKeyPresent,
  resolveApiKey,
  chatEndpoint,
  healthEndpoint,
} from "./backends"
import { recordLatency, getMetricsSnapshot } from "./metrics"
import { listPerformanceSettings } from "./settings"
import type {
  ComputeBackend,
  BackendRuntimeState,
  BackendSnapshot,
  BackendHealth,
  RouterPolicy,
  ChatRequest,
  ChatResponse,
  ChatMessage,
  ComputePoolStatus,
} from "./types"
import { HOLD } from "./types"

const CIRCUIT_FAILURE_THRESHOLD = 3
const CIRCUIT_COOLDOWN_MS = 30_000
const DEFAULT_TIMEOUT_MS = 45_000
const HEALTH_TIMEOUT_MS = 2_000
const EWMA_ALPHA = 0.3

/** Module-scoped singleton state (process lifetime). */
const states = new Map<string, BackendRuntimeState>()
let rrCursor = 0
let defaultPolicy: RouterPolicy = (process.env.COMPUTE_ROUTER_POLICY?.trim() as RouterPolicy) || "least-loaded"

function emptyState(id: string): BackendRuntimeState {
  return {
    id,
    health: "unknown",
    inFlight: 0,
    totalRequests: 0,
    totalErrors: 0,
    totalTimeouts: 0,
    consecutiveFailures: 0,
    lastLatencyMs: null,
    ewmaLatencyMs: null,
    lastCheckedAt: null,
    lastError: null,
    circuitOpenedAt: null,
    models: [],
    warmed: false,
  }
}

function getState(id: string): BackendRuntimeState {
  let s = states.get(id)
  if (!s) {
    s = emptyState(id)
    states.set(id, s)
  }
  return s
}

function maybeCloseCircuit(s: BackendRuntimeState): void {
  if (s.health !== "circuit-open" || s.circuitOpenedAt == null) return
  if (Date.now() - s.circuitOpenedAt >= CIRCUIT_COOLDOWN_MS) {
    s.health = "unknown"
    s.circuitOpenedAt = null
    s.consecutiveFailures = 0
  }
}

function markSuccess(s: BackendRuntimeState, latencyMs: number): void {
  s.totalRequests += 1
  s.consecutiveFailures = 0
  s.lastLatencyMs = latencyMs
  s.ewmaLatencyMs =
    s.ewmaLatencyMs == null ? latencyMs : EWMA_ALPHA * latencyMs + (1 - EWMA_ALPHA) * s.ewmaLatencyMs
  s.lastError = null
  if (s.health === "circuit-open" || s.health === "down" || s.health === "unknown") {
    s.health = "healthy"
  }
  s.circuitOpenedAt = null
  recordLatency(latencyMs, true)
}

function markFailure(s: BackendRuntimeState, err: string, isTimeout: boolean): void {
  s.totalRequests += 1
  s.totalErrors += 1
  if (isTimeout) s.totalTimeouts += 1
  s.consecutiveFailures += 1
  s.lastError = err.slice(0, 240)
  recordLatency(s.lastLatencyMs ?? 0, false)
  if (s.consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD) {
    s.health = "circuit-open"
    s.circuitOpenedAt = Date.now()
  } else if (s.health === "healthy") {
    s.health = "degraded"
  } else if (s.health === "unknown") {
    s.health = "down"
  }
}

/** Pure selection helper — exported for unit tests. */
export function selectBackend(
  backends: ComputeBackend[],
  getRuntime: (id: string) => BackendRuntimeState,
  policy: RouterPolicy,
  preferId?: string,
): ComputeBackend | null {
  const eligible = backends.filter((b) => {
    if (!b.enabled) return false
    const s = getRuntime(b.id)
    maybeCloseCircuit(s)
    if (s.health === "circuit-open") return false
    if (s.health === "down") return false
    if (s.inFlight >= b.maxConcurrency) return false
    if (b.apiKeyEnv && !apiKeyPresent(b)) return false
    return true
  })

  if (eligible.length === 0) return null

  if (preferId) {
    const pref = eligible.find((b) => b.id === preferId)
    if (pref) return pref
  }

  if (policy === "round-robin") {
    rrCursor = (rrCursor + 1) % eligible.length
    return eligible[rrCursor]!
  }

  if (policy === "cost-aware") {
    // Prefer cheaper backends that are healthy; break ties by load then latency.
    return [...eligible].sort((a, b) => {
      const sa = getRuntime(a.id)
      const sb = getRuntime(b.id)
      if (a.costWeight !== b.costWeight) return a.costWeight - b.costWeight
      if (sa.inFlight !== sb.inFlight) return sa.inFlight - sb.inFlight
      return (sa.ewmaLatencyMs ?? 9999) - (sb.ewmaLatencyMs ?? 9999)
    })[0]!
  }

  if (policy === "latency-aware") {
    return [...eligible].sort((a, b) => {
      const sa = getRuntime(a.id)
      const sb = getRuntime(b.id)
      const la = sa.ewmaLatencyMs ?? (sa.health === "healthy" ? 500 : 5000)
      const lb = sb.ewmaLatencyMs ?? (sb.health === "healthy" ? 500 : 5000)
      if (la !== lb) return la - lb
      return sa.inFlight - sb.inFlight
    })[0]!
  }

  // least-loaded (default) and speculative (selection of primary; race handled separately)
  return [...eligible].sort((a, b) => {
    const sa = getRuntime(a.id)
    const sb = getRuntime(b.id)
    const loadA = sa.inFlight / Math.max(1, a.maxConcurrency)
    const loadB = sb.inFlight / Math.max(1, b.maxConcurrency)
    if (loadA !== loadB) return loadA - loadB
    return (sa.ewmaLatencyMs ?? 9999) - (sb.ewmaLatencyMs ?? 9999)
  })[0]!
}

/** Rank eligible backends for speculative race (up to N). Exported for tests. */
export function rankBackendsForSpeculative(
  backends: ComputeBackend[],
  getRuntime: (id: string) => BackendRuntimeState,
  count: number,
): ComputeBackend[] {
  const eligible = backends.filter((b) => {
    if (!b.enabled) return false
    const s = getRuntime(b.id)
    maybeCloseCircuit(s)
    if (s.health === "circuit-open" || s.health === "down") return false
    if (s.inFlight >= b.maxConcurrency) return false
    if (b.apiKeyEnv && !apiKeyPresent(b)) return false
    return true
  })
  const ranked = [...eligible].sort((a, b) => {
    const sa = getRuntime(a.id)
    const sb = getRuntime(b.id)
    const loadA = sa.inFlight / Math.max(1, a.maxConcurrency)
    const loadB = sb.inFlight / Math.max(1, b.maxConcurrency)
    if (loadA !== loadB) return loadA - loadB
    return (sa.ewmaLatencyMs ?? 9999) - (sb.ewmaLatencyMs ?? 9999)
  })
  return ranked.slice(0, Math.max(1, count))
}

export async function probeBackend(backend: ComputeBackend): Promise<{
  ok: boolean
  models: string[]
  latencyMs: number
  error?: string
}> {
  const s = getState(backend.id)
  maybeCloseCircuit(s)
  if (s.health === "circuit-open") {
    return { ok: false, models: s.models, latencyMs: 0, error: "circuit-open" }
  }
  if (backend.apiKeyEnv && !apiKeyPresent(backend)) {
    s.health = "down"
    s.lastError = `missing env ${backend.apiKeyEnv}`
    s.lastCheckedAt = Date.now()
    return { ok: false, models: [], latencyMs: 0, error: s.lastError }
  }

  const url = healthEndpoint(backend)
  const started = Date.now()
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), HEALTH_TIMEOUT_MS)
  try {
    const headers: Record<string, string> = { Accept: "application/json" }
    const key = resolveApiKey(backend)
    if (key) headers.Authorization = `Bearer ${key}`
    const r = await fetch(url, { signal: ctrl.signal, cache: "no-store", headers })
    clearTimeout(t)
    const latencyMs = Date.now() - started
    s.lastCheckedAt = Date.now()
    if (!r.ok) {
      markFailure(s, `health HTTP ${r.status}`, false)
      s.health = "down"
      return { ok: false, models: [], latencyMs, error: `HTTP ${r.status}` }
    }
    let models: string[] = []
    try {
      const body = (await r.json()) as Record<string, unknown>
      if (Array.isArray(body.models)) {
        // Ollama /api/tags
        models = body.models
          .map((m) => (m && typeof m === "object" && "name" in m ? String((m as { name: unknown }).name) : ""))
          .filter(Boolean)
      } else if (Array.isArray(body.data)) {
        // OpenAI /v1/models
        models = body.data
          .map((m) => (m && typeof m === "object" && "id" in m ? String((m as { id: unknown }).id) : ""))
          .filter(Boolean)
      }
    } catch {
      /* body optional */
    }
    s.models = models
    s.health = "healthy"
    s.consecutiveFailures = 0
    s.lastLatencyMs = latencyMs
    s.ewmaLatencyMs =
      s.ewmaLatencyMs == null ? latencyMs : EWMA_ALPHA * latencyMs + (1 - EWMA_ALPHA) * s.ewmaLatencyMs
    s.lastError = null
    return { ok: true, models, latencyMs }
  } catch (e) {
    clearTimeout(t)
    const latencyMs = Date.now() - started
    const msg = e instanceof Error ? e.message : String(e)
    const isTimeout = /abort/i.test(msg)
    markFailure(s, msg, isTimeout)
    // markFailure may have opened the circuit; otherwise mark down for this probe.
    if (s.consecutiveFailures < CIRCUIT_FAILURE_THRESHOLD) {
      s.health = "down"
    }
    s.lastCheckedAt = Date.now()
    return { ok: false, models: s.models, latencyMs, error: msg }
  }
}

export async function refreshPoolHealth(): Promise<BackendSnapshot[]> {
  const backends = discoverBackends()
  await Promise.all(backends.map((b) => probeBackend(b)))
  return backends.map(toSnapshot)
}

function toSnapshot(b: ComputeBackend): BackendSnapshot {
  return {
    ...b,
    state: { ...getState(b.id) },
    apiKeyPresent: apiKeyPresent(b),
  }
}

function buildMessages(req: ChatRequest): ChatMessage[] {
  const msgs: ChatMessage[] = []
  if (req.system) msgs.push({ role: "system", content: req.system })
  for (const m of req.messages) msgs.push(m)
  return msgs
}

async function invokeBackend(
  backend: ComputeBackend,
  req: ChatRequest,
): Promise<{ ok: boolean; text: string; model: string | null; latencyMs: number; error?: string }> {
  const s = getState(backend.id)
  s.inFlight += 1
  const started = Date.now()
  const ctrl = new AbortController()
  const timeoutMs = req.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const model = req.model || backend.defaultModel || "default"
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    }
    const key = resolveApiKey(backend)
    if (key) headers.Authorization = `Bearer ${key}`

    const body = {
      model,
      messages: buildMessages(req),
      max_tokens: req.maxTokens ?? 1024,
      temperature: req.temperature ?? 0.2,
      stream: false,
    }

    const r = await fetch(chatEndpoint(backend), {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: ctrl.signal,
      cache: "no-store",
    })
    clearTimeout(t)
    const latencyMs = Date.now() - started
    if (!r.ok) {
      const errText = (await r.text().catch(() => "")).slice(0, 200)
      markFailure(s, `chat HTTP ${r.status}: ${errText}`, false)
      return { ok: false, text: "", model, latencyMs, error: `HTTP ${r.status}` }
    }
    const json = (await r.json()) as Record<string, unknown>
    let text = ""
    // OpenAI-compat
    const choices = json.choices
    if (Array.isArray(choices) && choices[0] && typeof choices[0] === "object") {
      const c0 = choices[0] as { message?: { content?: string }; text?: string }
      text = c0.message?.content || c0.text || ""
    }
    // Ollama native fallback shape
    if (!text && typeof json.message === "object" && json.message) {
      text = String((json.message as { content?: string }).content || "")
    }
    if (!text && typeof json.response === "string") text = json.response
    if (!text) {
      markFailure(s, "empty completion", false)
      return { ok: false, text: "", model, latencyMs, error: "empty completion" }
    }
    markSuccess(s, latencyMs)
    return { ok: true, text, model, latencyMs }
  } catch (e) {
    clearTimeout(t)
    const latencyMs = Date.now() - started
    const msg = e instanceof Error ? e.message : String(e)
    const isTimeout = /abort/i.test(msg)
    markFailure(s, msg, isTimeout)
    return { ok: false, text: "", model: req.model || backend.defaultModel || null, latencyMs, error: msg }
  } finally {
    s.inFlight = Math.max(0, s.inFlight - 1)
  }
}

/**
 * Route a chat completion through the pool.
 * Speculative policy races N backends; first success wins; losers are abandoned
 * (inFlight still decremented via finally).
 */
export async function routeChat(req: ChatRequest): Promise<ChatResponse> {
  const backends = discoverBackends()
  const policy: RouterPolicy = req.policy || defaultPolicy

  if (backends.length === 0) {
    return {
      ok: false,
      text: "",
      backendId: null,
      model: null,
      latencyMs: 0,
      policy,
      error: "no compute backend configured",
      degraded: true,
      hold: HOLD,
      lattice_sync: false,
    }
  }

  // Refresh stale unknown health opportunistically (non-blocking if recently checked).
  await Promise.all(
    backends
      .filter((b) => {
        const s = getState(b.id)
        return s.health === "unknown" || s.lastCheckedAt == null || Date.now() - s.lastCheckedAt > 60_000
      })
      .map((b) => probeBackend(b)),
  )

  if (policy === "speculative" || (req.speculativeCount && req.speculativeCount > 1)) {
    const n = req.speculativeCount ?? Math.min(2, backends.length)
    const ranked = rankBackendsForSpeculative(backends, getState, n)
    if (ranked.length === 0) {
      return noBackendResponse(policy)
    }
    if (ranked.length === 1) {
      const r = await invokeBackend(ranked[0]!, req)
      return {
        ok: r.ok,
        text: r.text,
        backendId: ranked[0]!.id,
        model: r.model,
        latencyMs: r.latencyMs,
        policy,
        speculative: false,
        error: r.error,
        degraded: backends.length === 1,
        hold: HOLD,
        lattice_sync: false,
      }
    }
    // Race: first ok wins
    const result = await raceFirstOk(ranked, req)
    return { ...result, policy, speculative: true, hold: HOLD, lattice_sync: false }
  }

  // Try primary then failover through remaining eligible backends.
  const tried = new Set<string>()
  let lastErr = "no eligible backend"
  let lastLatency = 0
  const maxAttempts = Math.min(backends.length, 4)
  for (let i = 0; i < maxAttempts; i++) {
    const pick = selectBackend(
      backends.filter((b) => !tried.has(b.id)),
      getState,
      policy,
      i === 0 ? req.preferBackendId : undefined,
    )
    if (!pick) break
    tried.add(pick.id)
    const r = await invokeBackend(pick, req)
    lastLatency = r.latencyMs
    if (r.ok) {
      return {
        ok: true,
        text: r.text,
        backendId: pick.id,
        model: r.model,
        latencyMs: r.latencyMs,
        policy,
        degraded: backends.length === 1,
        hold: HOLD,
        lattice_sync: false,
      }
    }
    lastErr = r.error || "backend failed"
  }

  return {
    ok: false,
    text: "",
    backendId: null,
    model: null,
    latencyMs: lastLatency,
    policy,
    error: lastErr,
    degraded: true,
    hold: HOLD,
    lattice_sync: false,
  }
}

async function raceFirstOk(
  backends: ComputeBackend[],
  req: ChatRequest,
): Promise<Omit<ChatResponse, "policy" | "speculative" | "hold" | "lattice_sync">> {
  return new Promise((resolve) => {
    let remaining = backends.length
    let settled = false
    let lastErr = "all speculative backends failed"
    let lastLatency = 0
    for (const b of backends) {
      void invokeBackend(b, req).then((r) => {
        lastLatency = r.latencyMs
        if (settled) {
          remaining -= 1
          return
        }
        if (r.ok) {
          settled = true
          resolve({
            ok: true,
            text: r.text,
            backendId: b.id,
            model: r.model,
            latencyMs: r.latencyMs,
            degraded: false,
          })
          return
        }
        lastErr = r.error || lastErr
        remaining -= 1
        if (remaining === 0 && !settled) {
          settled = true
          resolve({
            ok: false,
            text: "",
            backendId: null,
            model: null,
            latencyMs: lastLatency,
            error: lastErr,
            degraded: true,
          })
        }
      })
    }
  })
}

function noBackendResponse(policy: RouterPolicy): ChatResponse {
  return {
    ok: false,
    text: "",
    backendId: null,
    model: null,
    latencyMs: 0,
    policy,
    error: "no healthy compute backend (all down, circuit-open, or at concurrency cap)",
    degraded: true,
    hold: HOLD,
    lattice_sync: false,
  }
}

/** Warm-pool: hit /api/tags or send a tiny completion to load model weights. */
export async function warmBackend(backendId?: string): Promise<{
  ok: boolean
  warmed: string[]
  errors: Record<string, string>
}> {
  const backends = discoverBackends().filter((b) => !backendId || b.id === backendId)
  const warmed: string[] = []
  const errors: Record<string, string> = {}
  for (const b of backends) {
    const probe = await probeBackend(b)
    if (!probe.ok) {
      errors[b.id] = probe.error || "probe failed"
      continue
    }
    const model = b.defaultModel || probe.models[0]
    if (!model) {
      // Health ok but no model listed — still mark warmed at connection level.
      getState(b.id).warmed = true
      warmed.push(b.id)
      continue
    }
    const r = await invokeBackend(b, {
      messages: [{ role: "user", content: "ping" }],
      model,
      maxTokens: 1,
      temperature: 0,
      timeoutMs: 60_000,
    })
    if (r.ok || r.error === "empty completion") {
      // empty is fine for warm — weights are loaded
      getState(b.id).warmed = true
      warmed.push(b.id)
    } else {
      errors[b.id] = r.error || "warm failed"
    }
  }
  return { ok: warmed.length > 0, warmed, errors }
}

export function getPoolStatus(recentJobs: ComputePoolStatus["jobs"]["recent"] = [], jobStats?: {
  queued: number
  running: number
  concurrency: number
}): ComputePoolStatus {
  const backends = discoverBackends().map(toSnapshot)
  const reachable = backends.filter(
    (b) => b.state.health === "healthy" || b.state.health === "degraded",
  ).length
  const metrics = getMetricsSnapshot()

  let degradation: string
  if (backends.length === 0) {
    degradation = "no compute backend configured — set LOCAL_LLM_BASE_URL / OLLAMA_BASE_URL or COMPUTE_BACKENDS"
  } else if (reachable === 0) {
    degradation = "backends configured but none reachable — start Ollama or fix RunPod endpoint"
  } else if (reachable === 1) {
    degradation = "single backend reachable — pool active but no failover redundancy"
  } else {
    degradation = "pool healthy — multi-backend routing active"
  }

  return {
    ok: true,
    service: "compute",
    backends,
    reachableCount: reachable,
    configuredCount: backends.length,
    policy: defaultPolicy,
    jobs: {
      queued: jobStats?.queued ?? 0,
      running: jobStats?.running ?? 0,
      concurrency: jobStats?.concurrency ?? 0,
      recent: recentJobs,
    },
    metrics: {
      requestsTotal: metrics.requestsTotal,
      errorsTotal: metrics.errorsTotal,
      avgLatencyMs: metrics.avgLatencyMs,
      p95LatencyMs: metrics.p95LatencyMs,
      throughputPerMin: metrics.throughputPerMin,
    },
    performance: listPerformanceSettings(),
    degradation,
    hold: HOLD,
    lattice_sync: false,
  }
}

export function setDefaultPolicy(policy: RouterPolicy): void {
  defaultPolicy = policy
}

export function getDefaultPolicy(): RouterPolicy {
  return defaultPolicy
}

/** Test-only: reset singleton state between vitest cases. */
export function __resetRouterStateForTests(): void {
  states.clear()
  rrCursor = 0
  defaultPolicy = "least-loaded"
}

export function __getStateForTests(id: string): BackendRuntimeState {
  return getState(id)
}
