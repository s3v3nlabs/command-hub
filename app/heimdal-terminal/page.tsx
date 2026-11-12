"use client"

export const dynamic = "force-dynamic"

import { useCallback, useEffect, useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TechPanel } from "@/components/ui/tech-panel"
import { Badge } from "@/components/ui/badge"
import { EngineChat } from "@/components/engines/EngineChat"
import { ActivityLog } from "@/components/dashboard/activity-log"
import { Shield, RefreshCw } from "lucide-react"

type IdsEvent = {
  id: string
  ts: string
  severity: string
  source: string
  message: string
  kind: string
}

type IdsPayload = {
  ok: boolean
  generatedAt?: string
  uptimeSec?: number
  process?: { pid: number; node: string; platform: string; hostname: string; rssMb: number }
  auth?: { failedApiAuthCount: number; note: string }
  lastScan?: { at: string; kind: string; summary: string }
  events?: IdsEvent[]
  legend?: { live: string; unavailable?: string }
  error?: string
}

export default function HeimdallTerminalPage() {
  const [ids, setIds] = useState<IdsPayload | null>(null)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/security/ids/status")
      const j = (await r.json()) as IdsPayload
      if (!r.ok || j.ok === false) setError(j.error || `HTTP ${r.status}`)
      else {
        setError("")
        setIds(j)
      }
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [load])

  return (
    <div className="hub-shell flex bg-black text-white">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="space-y-6 p-6">
          <TechPanel
            title="HEIMDALL SECURITY TERMINAL"
            subtitle="LIVE HOST SIGNALS + ANALYST CHAT"
            cornerAccent
            borderAccent
            actions={
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
                  {ids?.process?.hostname || "host"} · pid {ids?.process?.pid ?? "—"}
                </Badge>
                <button className="ghost-btn !px-2 !py-0.5" onClick={() => void load()}>
                  <RefreshCw size={12} />
                </button>
              </div>
            }
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 text-center font-mono">
              <div>
                <div className="text-3xl font-bold text-emerald-300">
                  {ids?.process?.rssMb != null ? `${ids.process.rssMb} MB` : "—"}
                </div>
                <div className="text-xs uppercase tracking-wider text-gray-400">Process RSS</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-300">
                  {ids?.uptimeSec != null ? `${Math.floor(ids.uptimeSec / 60)}m` : "—"}
                </div>
                <div className="text-xs uppercase tracking-wider text-gray-400">Hub uptime</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-amber-300">
                  {ids?.auth?.failedApiAuthCount ?? "—"}
                </div>
                <div className="text-xs uppercase tracking-wider text-gray-400">Failed API auth</div>
              </div>
            </div>
            {ids?.lastScan && (
              <p className="mt-3 font-mono text-[11px] text-zinc-400">
                Last sweep ({ids.lastScan.kind}) at {ids.lastScan.at}: {ids.lastScan.summary}
              </p>
            )}
            {ids?.legend && (
              <p className="mt-1 font-mono text-[11px] text-zinc-500">
                {ids.legend.live}
                {ids.legend.unavailable ? ` · ${ids.legend.unavailable}` : ""}
              </p>
            )}
            {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
          </TechPanel>

          <EngineChat engine="heimdall" title="Heimdall analyst (live AI)" />

          <TechPanel title="LIVE IDS EVENTS" subtitle="FROM /api/security/ids/status — THIS HOST ONLY" cornerAccent borderAccent>
            <ul className="max-h-64 space-y-1 overflow-auto font-mono text-[11px]">
              {(ids?.events || []).length === 0 && (
                <li className="text-zinc-500">No IDS events recorded on this host yet.</li>
              )}
              {(ids?.events || []).map((e) => (
                <li key={e.id} className="border-b border-zinc-800 py-1">
                  <Shield size={10} className="mr-1 inline" />
                  <span className="text-zinc-500">{e.ts}</span>{" "}
                  <span className="uppercase text-amber-200">{e.severity}</span>{" "}
                  <span className="text-emerald-200">{e.source}</span> {e.message}
                </li>
              ))}
            </ul>
          </TechPanel>

          <TechPanel title="AUDIT TIMELINE" subtitle="REAL AUTHORIZATION AND LAB ACTIONS" cornerAccent borderAccent>
            <ActivityLog />
          </TechPanel>
        </div>
      </div>
    </div>
  )
}
