/**
 * Backend discovery from env. Never returns secret values — only presence flags.
 * HOLD_VYRNA_UNSYNC · lattice_sync: false
 */

import type { ComputeBackend, BackendKind } from "./types"

const DEFAULT_OLLAMA = "http://127.0.0.1:11434"

function stripSlash(u: string): string {
  return u.replace(/\/+$/, "")
}

function parseJsonBackends(raw: string): ComputeBackend[] {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    const out: ComputeBackend[] = []
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue
      const o = item as Record<string, unknown>
      const baseUrl = typeof o.baseUrl === "string" ? stripSlash(o.baseUrl.trim()) : ""
      if (!baseUrl) continue
      const id =
        typeof o.id === "string" && o.id.trim()
          ? o.id.trim()
          : `backend-${out.length + 1}`
      const kind: BackendKind =
        o.kind === "ollama" || o.kind === "runpod" || o.kind === "openai-compatible"
          ? o.kind
          : guessKind(baseUrl)
      out.push({
        id,
        kind,
        baseUrl,
        chatPath: typeof o.chatPath === "string" ? o.chatPath : undefined,
        healthPath: typeof o.healthPath === "string" ? o.healthPath : undefined,
        label: typeof o.label === "string" && o.label.trim() ? o.label.trim() : id,
        maxConcurrency: clampInt(o.maxConcurrency, 1, 32, kind === "ollama" ? 2 : 4),
        costWeight: clampInt(o.costWeight, 1, 100, kind === "runpod" ? 5 : 1),
        defaultModel: typeof o.defaultModel === "string" ? o.defaultModel : undefined,
        apiKeyEnv: typeof o.apiKeyEnv === "string" ? o.apiKeyEnv : undefined,
        enabled: o.enabled !== false,
      })
    }
    return out
  } catch {
    return []
  }
}

function parseCommaList(raw: string): ComputeBackend[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((url, i) => {
      const baseUrl = stripSlash(url)
      const kind = guessKind(baseUrl)
      return {
        id: `env-${i + 1}`,
        kind,
        baseUrl,
        label: `COMPUTE_BACKENDS[${i}]`,
        maxConcurrency: kind === "ollama" ? 2 : 4,
        costWeight: kind === "runpod" ? 5 : 1,
        enabled: true,
      } satisfies ComputeBackend
    })
}

function guessKind(url: string): BackendKind {
  const u = url.toLowerCase()
  if (u.includes("runpod") || u.includes("api.runpod.ai")) return "runpod"
  if (u.includes("11434") || u.includes("ollama")) return "ollama"
  return "openai-compatible"
}

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, Math.floor(n)))
}

/**
 * Resolve the configured backend pool.
 * Order of discovery:
 *  1. COMPUTE_BACKENDS (JSON array or comma-separated base URLs)
 *  2. LOCAL_LLM_BASE_URL / OLLAMA_BASE_URL (always added if distinct)
 *  3. RUNPOD_ENDPOINT_URL or RUNPOD_BASE_URL (if set)
 * Dedupes by baseUrl. Empty pool is valid — callers must degrade honestly.
 */
export function discoverBackends(): ComputeBackend[] {
  const byUrl = new Map<string, ComputeBackend>()

  const raw = process.env.COMPUTE_BACKENDS?.trim() || ""
  if (raw) {
    const list = raw.startsWith("[") ? parseJsonBackends(raw) : parseCommaList(raw)
    for (const b of list) byUrl.set(b.baseUrl, b)
  }

  const local =
    process.env.LOCAL_LLM_BASE_URL?.trim() ||
    process.env.OLLAMA_BASE_URL?.trim() ||
    ""
  if (local) {
    const baseUrl = stripSlash(local)
    if (!byUrl.has(baseUrl)) {
      byUrl.set(baseUrl, {
        id: "local-ollama",
        kind: "ollama",
        baseUrl,
        label: "Local Ollama / OpenAI-compat",
        maxConcurrency: clampInt(process.env.COMPUTE_LOCAL_CONCURRENCY, 1, 16, 2),
        costWeight: 1,
        defaultModel:
          process.env.LOCAL_LLM_MODEL?.trim() ||
          process.env.OLLAMA_OPS_MODEL?.trim() ||
          undefined,
        enabled: true,
      })
    }
  } else if (byUrl.size === 0) {
    // Sensible default probe target — may be down; health check will say so.
    byUrl.set(DEFAULT_OLLAMA, {
      id: "local-ollama",
      kind: "ollama",
      baseUrl: DEFAULT_OLLAMA,
      label: "Local Ollama (default probe)",
      maxConcurrency: 2,
      costWeight: 1,
      defaultModel:
        process.env.LOCAL_LLM_MODEL?.trim() ||
        process.env.OLLAMA_OPS_MODEL?.trim() ||
        undefined,
      enabled: true,
    })
  }

  const runpod =
    process.env.RUNPOD_ENDPOINT_URL?.trim() ||
    process.env.RUNPOD_BASE_URL?.trim() ||
    ""
  if (runpod) {
    const baseUrl = stripSlash(runpod)
    if (!byUrl.has(baseUrl)) {
      byUrl.set(baseUrl, {
        id: "runpod-primary",
        kind: "runpod",
        baseUrl,
        label: "RunPod endpoint",
        maxConcurrency: clampInt(process.env.COMPUTE_RUNPOD_CONCURRENCY, 1, 16, 4),
        costWeight: 5,
        defaultModel: process.env.RUNPOD_MODEL?.trim() || undefined,
        apiKeyEnv: "RUNPOD_API_KEY",
        chatPath: process.env.RUNPOD_CHAT_PATH?.trim() || undefined,
        enabled: true,
      })
    }
  }

  // Extra OpenAI-compatible base (e.g. a second RunPod worker or LM Studio)
  const extra = process.env.COMPUTE_OPENAI_BASE_URL?.trim() || ""
  if (extra) {
    const baseUrl = stripSlash(extra)
    if (!byUrl.has(baseUrl)) {
      byUrl.set(baseUrl, {
        id: "openai-compat",
        kind: "openai-compatible",
        baseUrl,
        label: "OpenAI-compatible",
        maxConcurrency: 4,
        costWeight: 3,
        defaultModel: process.env.COMPUTE_OPENAI_MODEL?.trim() || undefined,
        apiKeyEnv: process.env.COMPUTE_OPENAI_API_KEY_ENV?.trim() || "COMPUTE_OPENAI_API_KEY",
        enabled: true,
      })
    }
  }

  return Array.from(byUrl.values()).filter((b) => b.enabled)
}

export function apiKeyPresent(backend: ComputeBackend): boolean {
  if (!backend.apiKeyEnv) return true // no key required
  const v = process.env[backend.apiKeyEnv]
  return !!(v && v.trim() && !v.includes("placeholder"))
}

export function resolveApiKey(backend: ComputeBackend): string | null {
  if (!backend.apiKeyEnv) return null
  const v = process.env[backend.apiKeyEnv]?.trim()
  if (!v || v.includes("placeholder")) return null
  return v
}

export function chatEndpoint(backend: ComputeBackend): string {
  if (backend.chatPath) return `${backend.baseUrl}${backend.chatPath.startsWith("/") ? "" : "/"}${backend.chatPath}`
  if (backend.kind === "ollama") {
    // Prefer OpenAI-compat path if the server exposes it; fall back handled by caller.
    return `${backend.baseUrl}/v1/chat/completions`
  }
  if (backend.kind === "runpod") {
    // Many RunPod serverless OpenAI-proxy workers expose /openai/v1/chat/completions
    // or /v1/chat/completions. Prefer the latter; override via chatPath.
    return `${backend.baseUrl}/v1/chat/completions`
  }
  return `${backend.baseUrl}/v1/chat/completions`
}

export function healthEndpoint(backend: ComputeBackend): string {
  if (backend.healthPath) {
    return `${backend.baseUrl}${backend.healthPath.startsWith("/") ? "" : "/"}${backend.healthPath}`
  }
  if (backend.kind === "ollama") return `${backend.baseUrl}/api/tags`
  // OpenAI-compat / RunPod: models listing is the lightest probe
  return `${backend.baseUrl}/v1/models`
}
