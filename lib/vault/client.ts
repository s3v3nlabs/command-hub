/**
 * Server-side client for the Ghostlight Vault Python service.
 * Never exposes the bearer token to the browser. Returns an honest
 * degraded payload when the service is down or unconfigured.
 */

import { scrubHit, scrubVaultText } from "./scrub"

export type VaultDegraded = {
  ok: false
  degraded: true
  reason: string
  status?: number
}

export type VaultOk<T> = T & { ok: true; degraded: false }

export type VaultResult<T> = VaultOk<T> | VaultDegraded

const DEFAULT_URL = "http://127.0.0.1:8765"
const TIMEOUT_MS = 12_000

export function vaultBaseUrl(): string {
  return (process.env.GHOSTLIGHT_VAULT_URL || DEFAULT_URL).replace(/\/$/, "")
}

export function vaultToken(): string {
  return (
    process.env.GHOSTLIGHT_VAULT_TOKEN?.trim() ||
    process.env.GHOSTLIGHT_MCP_TOKEN?.trim() ||
    ""
  )
}

function degraded(reason: string, status?: number): VaultDegraded {
  return { ok: false, degraded: true, reason, status }
}

export async function vaultFetch<T extends object = Record<string, unknown>>(
  path: string,
  init: RequestInit = {},
): Promise<VaultResult<T>> {
  const base = vaultBaseUrl()
  const token = vaultToken()
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  const headers = new Headers(init.headers)
  if (token) headers.set("Authorization", `Bearer ${token}`)
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json")
  try {
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers,
      signal: ctrl.signal,
      cache: "no-store",
    })
    const text = await res.text()
    let data: unknown
    try {
      data = text ? JSON.parse(text) : {}
    } catch {
      data = { raw: scrubVaultText(text, 400) }
    }
    if (res.status === 401 || res.status === 403) {
      return degraded(
        token
          ? "vault rejected the configured token (401/403)"
          : "vault requires a bearer token — set GHOSTLIGHT_VAULT_TOKEN or GHOSTLIGHT_MCP_TOKEN",
        res.status,
      )
    }
    if (res.status === 503 && path.includes("ready")) {
      const reason =
        typeof data === "object" && data && "reason" in data
          ? String((data as { reason?: string }).reason)
          : "vault not ready"
      return degraded(reason, 503)
    }
    if (!res.ok) {
      const err =
        typeof data === "object" && data && "error" in data
          ? String((data as { error?: string }).error)
          : `vault HTTP ${res.status}`
      return degraded(err, res.status)
    }
    const body = (typeof data === "object" && data ? data : { data }) as T
    return { ...(body as T), ok: true, degraded: false }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "fetch failed"
    const reason = /abort|timeout/i.test(msg)
      ? `vault service timed out after ${TIMEOUT_MS}ms (${base})`
      : `vault service unreachable at ${base}`
    return degraded(reason)
  } finally {
    clearTimeout(timer)
  }
}

export async function vaultHealth(): Promise<
  VaultResult<{
    live: boolean
    ready: boolean
    version?: string
    ingest_enabled?: boolean
    db_exists?: boolean
    conversations?: number
    messages_fts?: number
    reason?: string
  }>
> {
  const base = vaultBaseUrl()
  const live = await pingPlain(`${base}/healthz`)
  const ready = await pingPlain(`${base}/readyz`)
  const status = await vaultFetch<{
    version?: string
    ingest_enabled?: boolean
    db_exists?: boolean
    conversations?: number
    messages_fts?: number
    reason?: string
    ready?: boolean
  }>("/api/status")
  // /api/status is unauthenticated on the Python service (no secrets).
  // If even that fails, still report healthz/readyz.
  if (!status.ok) {
    if (!live.ok && !ready.ok) {
      return degraded(status.reason)
    }
    return {
      ok: true,
      degraded: false,
      live: live.ok,
      ready: ready.ok,
      reason: ready.body || status.reason,
    }
  }
  return {
    ...status,
    live: live.ok,
    ready: ready.ok || status.ready === true,
  }
}

async function pingPlain(url: string): Promise<{ ok: boolean; body: string }> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 4000)
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" })
    const body = (await res.text()).trim()
    return { ok: res.ok, body }
  } catch {
    return { ok: false, body: "" }
  } finally {
    clearTimeout(timer)
  }
}

export type VaultHit = {
  conversation_id: string
  role: string | null
  snip: string
  create_time: string | null
  title?: string | null
  profile?: string | null
  backend?: string
  evidence?: string
  meta_evidence?: string
}

export async function vaultSearch(params: {
  query: string
  limit?: number
  role?: string
  conversation_id?: string
  since?: string
  until?: string
}): Promise<VaultResult<{ query: string; count: number; hits: VaultHit[]; backend?: string; fts_query?: string }>> {
  const q = new URLSearchParams()
  q.set("q", params.query)
  if (params.limit) q.set("limit", String(params.limit))
  if (params.role) q.set("role", params.role)
  if (params.conversation_id) q.set("conversation_id", params.conversation_id)
  if (params.since) q.set("since", params.since)
  if (params.until) q.set("until", params.until)
  const result = await vaultFetch<{
    query?: string
    count?: number
    hits?: VaultHit[]
    backend?: string
    fts_query?: string
  }>(`/api/search?${q.toString()}`)
  if (!result.ok) return result
  const hits = (result.hits || []).map((h) => scrubHit(h))
  return {
    ok: true,
    degraded: false,
    query: result.query || params.query,
    count: result.count ?? hits.length,
    hits,
    backend: result.backend,
    fts_query: result.fts_query,
  }
}

export async function vaultStats(): Promise<
  VaultResult<{ conversations?: number; messages_fts?: number; db_exists?: boolean; ingest_enabled?: boolean; by_profile?: Record<string, number> }>
> {
  return vaultFetch("/api/stats")
}

export async function vaultConversations(params: { profile?: string; limit?: number; offset?: number } = {}) {
  const q = new URLSearchParams()
  if (params.profile) q.set("profile", params.profile)
  if (params.limit) q.set("limit", String(params.limit))
  if (params.offset) q.set("offset", String(params.offset))
  return vaultFetch<{ count: number; conversations: Array<Record<string, unknown>> }>(
    `/api/conversations?${q.toString()}`,
  )
}

export async function vaultConversation(id: string, limit = 400) {
  const result = await vaultFetch<{
    conversation: Record<string, unknown>
    message_count: number
    messages: Array<Record<string, unknown>>
  }>(`/api/conversations/${encodeURIComponent(id)}?limit=${limit}`)
  if (!result.ok) return result
  return {
    ...result,
    messages: (result.messages || []).map((m) => scrubHit(m)),
  }
}
