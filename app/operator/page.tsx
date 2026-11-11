"use client"

import { useCallback, useEffect, useState } from "react"
import { Smartphone, Shield, History, Crosshair, RefreshCw, ChevronRight, Layers } from "lucide-react"
import { WORKSPACE_PRESETS, getWorkspace, resolveFeatured } from "@/lib/workspaces/presets"

type Mod = { id: string; name: string; route?: string; nav?: { label?: string } }
type Entry = { ts: string; category: string; action: string; source: string; sealed?: boolean }
type Tech = { id: string; name: string; hits: number }

/**
 * Compact, mobile/tablet-first operator view for field work. Single-column,
 * large tap targets. Reuses /api/modules, audit timeline, and ATT&CK navigator.
 * Honest degradation when an endpoint needs an operator token.
 */
export default function OperatorViewPage() {
  const [modules, setModules] = useState<Mod[]>([])
  const [audit, setAudit] = useState<Entry[]>([])
  const [tech, setTech] = useState<Tech[]>([])
  const [token, setToken] = useState("")
  const [wsId, setWsId] = useState("all")
  const [status, setStatus] = useState<{ ok?: boolean; events?: number } | null>(null)

  const h = useCallback((): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {}), [token])

  const load = useCallback(async () => {
    try {
      const m = await fetch("/api/modules").then((r) => r.json()).catch(() => ({}))
      setModules(Array.isArray(m.modules) ? m.modules : [])
    } catch {}
    try {
      const a = await fetch("/api/audit/timeline?limit=12", { headers: h() }).then((r) => r.json()).catch(() => ({}))
      if (a.ok) setAudit(a.entries || [])
    } catch {}
    try {
      const n = await fetch("/api/offsec/attack-navigator", { headers: h() }).then((r) => r.json()).catch(() => ({}))
      if (n.ok) {
        setTech(n.topTechniques || [])
        setStatus({ ok: true, events: n.totalObserved })
      }
    } catch {}
  }, [h])

  useEffect(() => {
    try {
      setWsId(localStorage.getItem("hub-workspace") || "all")
    } catch {}
    load()
  }, [load])

  const ws = getWorkspace(wsId)
  const featured = resolveFeatured(ws, modules).filter((m) => m.route)
  const grid = featured.length ? featured : modules.filter((m) => m.route).slice(0, 12)

  return (
    <div className="min-h-screen bg-black text-[color:var(--ghost-ink)]">
      {/* compact top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-[color:var(--ghost-line)] bg-black/90 px-3 py-2 backdrop-blur">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Smartphone size={16} /> Operator
        </div>
        <div className="flex items-center gap-1.5">
          <select
            className="ghost-input !py-1 !text-xs"
            value={wsId}
            onChange={(e) => {
              setWsId(e.target.value)
              try {
                localStorage.setItem("hub-workspace", e.target.value)
                window.dispatchEvent(new CustomEvent("hub-workspace-change", { detail: e.target.value }))
              } catch {}
            }}
          >
            {WORKSPACE_PRESETS.map((w) => (
              <option key={w.id} value={w.id}>
                {w.label}
              </option>
            ))}
          </select>
          <button className="ghost-btn !px-2 !py-1" onClick={load} aria-label="refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-md space-y-3 p-3">
        <input
          type="password"
          placeholder="Operator token (optional)"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="ghost-input w-full text-xs"
        />

        {/* status */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded border border-[color:var(--ghost-line)] bg-black/50 p-2">
            <div className="flex items-center gap-1 text-[color:var(--ghost-dim)]">
              <Shield size={12} /> Heimdall
            </div>
            <div className="text-lg font-semibold">{status?.events ?? "—"}</div>
            <div className="text-[10px] text-[color:var(--ghost-dim)]">events observed</div>
          </div>
          <div className="rounded border border-[color:var(--ghost-line)] bg-black/50 p-2">
            <div className="flex items-center gap-1 text-[color:var(--ghost-dim)]">
              <Layers size={12} /> Workspace
            </div>
            <div className="text-lg font-semibold">{ws.label}</div>
            <div className="text-[10px] text-[color:var(--ghost-dim)]">{grid.length} featured</div>
          </div>
        </div>

        {/* quick module grid — large tap targets */}
        <div className="grid grid-cols-2 gap-2">
          {grid.map((m) => (
            <a
              key={m.id}
              href={m.route}
              className="flex items-center justify-between rounded border border-[color:var(--ghost-line)] bg-black/50 px-3 py-3 text-xs active:bg-dark-100/10"
            >
              <span className="font-medium">{m.nav?.label || m.name}</span>
              <ChevronRight size={14} className="opacity-50" />
            </a>
          ))}
        </div>

        {/* ATT&CK top */}
        {tech.length > 0 && (
          <div className="rounded border border-[color:var(--ghost-line)] bg-black/50 p-2 text-xs">
            <div className="mb-1 flex items-center gap-1 font-semibold">
              <Crosshair size={13} /> Top ATT&CK
            </div>
            <div className="flex flex-wrap gap-1">
              {tech.slice(0, 6).map((t) => (
                <span key={t.id} className="rounded bg-red-900/60 px-1.5 py-0.5 text-red-200">
                  {t.id} ×{t.hits}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* audit tail */}
        <div className="rounded border border-[color:var(--ghost-line)] bg-black/50 p-2 text-xs">
          <div className="mb-1 flex items-center gap-1 font-semibold">
            <History size={13} /> Recent audit
          </div>
          {audit.length ? (
            <ul className="space-y-1">
              {audit.slice(0, 8).map((e, i) => (
                <li key={i} className="flex items-start gap-2 border-t border-[color:var(--ghost-line)]/40 pt-1 first:border-0 first:pt-0">
                  <span className="shrink-0 font-mono text-[9px] text-[color:var(--ghost-dim)]">{e.ts?.slice(11, 19)}</span>
                  <span className="min-w-0 flex-1 truncate">{e.sealed ? "sealed record" : e.action}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-[color:var(--ghost-dim)]">No audit entries (or token required).</div>
          )}
        </div>

        <a href="/" className="block rounded border border-[color:var(--ghost-line)] bg-black/50 px-3 py-2 text-center text-xs active:bg-dark-100/10">
          Full desktop hub →
        </a>
      </div>
    </div>
  )
}
