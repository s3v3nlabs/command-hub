"use client"

import { useCallback, useEffect, useState } from "react"

export async function liveGet<T = Record<string, unknown>>(module: string, params?: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams()
  if (params) for (const [k, v] of Object.entries(params)) if (v != null) qs.set(k, v)
  const url = `/api/live/${module}${qs.toString() ? `?${qs}` : ""}`
  const r = await fetch(url, { cache: "no-store" })
  const j = (await r.json()) as T
  return j
}

export async function livePost<T = Record<string, unknown>>(module: string, body: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  const t = token || (typeof window !== "undefined" ? window.localStorage.getItem("hub-api-token") || "" : "")
  if (t) headers.Authorization = `Bearer ${t}`
  const r = await fetch(`/api/live/${module}`, { method: "POST", headers, body: JSON.stringify(body) })
  return (await r.json()) as T
}

export function useLive<T = Record<string, unknown>>(
  module: string,
  params?: Record<string, string>,
  opts?: { refreshMs?: number; enabled?: boolean },
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const enabled = opts?.enabled !== false
  const key = JSON.stringify({ module, params, enabled })

  const reload = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    try {
      const j = await liveGet<T>(module, params)
      setData(j)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [module, JSON.stringify(params), enabled])

  useEffect(() => {
    void reload()
    if (!opts?.refreshMs || !enabled) return
    const id = setInterval(() => void reload(), opts.refreshMs)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, opts?.refreshMs, reload])

  return { data, error, loading, reload }
}
