"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"

interface Entry {
  id?: string
  ts?: string
  timestamp?: string
  source?: string
  subsystem?: string
  action?: string
  capability?: string
  message?: string
  allowed?: boolean
  reason?: string
  [k: string]: unknown
}

export function ActivityLog({ className }: { className?: string }) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    setError("")
    try {
      const r = await fetch("/api/audit/timeline")
      const j = await r.json()
      const list = (j.entries || j.events || j.timeline || []) as Entry[]
      setEntries(Array.isArray(list) ? list.slice(0, 50) : [])
      if (!j.ok && j.error) setError(String(j.error))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wider text-zinc-400">
        <span>Activity log — live audit timeline</span>
        <button className="ghost-btn !px-1.5 !py-0.5" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={10} />
        </button>
      </div>
      {error && <div className="text-xs text-red-300">{error}</div>}
      {!entries.length && !error && (
        <div className="text-xs text-zinc-500">No audit events on this host yet. Actions on gated lab tools will appear here.</div>
      )}
      <ul className="max-h-80 space-y-1 overflow-auto font-mono text-[11px]">
        {entries.map((e, i) => (
          <li key={String(e.id || i)} className="border-b border-zinc-800 py-1">
            <span className="text-zinc-500">{e.ts || e.timestamp}</span>{" "}
            <span className="text-emerald-200">{String(e.source || e.subsystem || e.capability || "")}</span>{" "}
            <span>{String(e.action || e.message || e.reason || "")}</span>
            {e.allowed === false && <span className="ml-1 text-red-300">DENIED</span>}
            {e.allowed === true && <span className="ml-1 text-emerald-400">ALLOWED</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
