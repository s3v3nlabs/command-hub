"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { TechPanel } from "@/components/ui/tech-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  RefreshCw,
  Cpu,
  HardDrive,
  Radio,
  Network,
  MessageSquare,
  ExternalLink,
  BookOpen,
  Activity,
} from "lucide-react"

type BadgeKind = "LIVE" | "DOWN" | "STUB" | "NOT_CFG" | "READY" | "OFFLINE"

type TriadicStatus = {
  ok?: boolean
  hold?: string
  lattice_sync?: boolean
  seats?: {
    commandHub?: { badge?: BadgeKind; detail?: string }
    ollama?: {
      badge?: BadgeKind
      online?: boolean
      binaryPresent?: boolean
      models?: string[]
      detail?: string
      base?: string
    }
    ghostlight?: {
      badge?: BadgeKind
      online?: boolean
      endpoint?: string
      serverName?: string
      detail?: string
    }
    dimmDrive?: {
      badge?: BadgeKind
      local?: {
        mounted?: boolean
        sizeGb?: number
        path?: string
        backend?: string
        usedBytes?: number
      }
      host?: {
        memTotalGi?: number
        memAvailableGi?: number
        boxHardCapGb?: number
      }
    }
    mesh?: {
      badge?: BadgeKind
      providers?: Array<{ id?: string; name?: string; status?: string; tier?: string }>
      note?: string
    }
    runpod?: { badge?: BadgeKind; detail?: string }
  }
  docs?: {
    root?: string
    files?: string[]
    present?: boolean
    excerpt?: string[]
  }
  ramGuard?: { leaveOsGi?: number; boxHintGi?: number; note?: string }
  links?: Record<string, string>
  error?: string
}

function badgeClass(b?: string) {
  switch (b) {
    case "LIVE":
    case "READY":
      return "border-emerald-500/50 text-emerald-300 bg-emerald-950/40"
    case "STUB":
    case "NOT_CFG":
      return "border-amber-500/50 text-amber-300 bg-amber-950/30"
    case "DOWN":
    case "OFFLINE":
      return "border-red-500/50 text-red-300 bg-red-950/40"
    default:
      return "border-gray-600 text-gray-400"
  }
}

function fmtBytes(n?: number) {
  if (n == null || !Number.isFinite(n)) return "—"
  if (n < 1024) return `${n} B`
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KiB`
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MiB`
  return `${(n / 1024 ** 3).toFixed(2)} GiB`
}

export default function TriadicPage() {
  const [status, setStatus] = useState<TriadicStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [chatOut, setChatOut] = useState<string | null>(null)
  const [chatModel, setChatModel] = useState<string>("")
  const [chatStatus, setChatStatus] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/triadic/status", { cache: "no-store" })
      setStatus((await res.json()) as TriadicStatus)
    } catch (e) {
      setStatus({
        ok: false,
        error: e instanceof Error ? e.message : "refresh failed",
        lattice_sync: false,
        hold: "HOLD_VYRNA_UNSYNC",
      })
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const smokeChat = async () => {
    setBusy(true)
    setChatOut(null)
    setChatStatus(null)
    try {
      const res = await fetch("/api/triadic/ollama-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Reply with exactly: TRIADIC_SMOKE_OK",
          model: chatModel || undefined,
        }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        text?: string
        status?: string
        model?: string
        offline?: boolean
      }
      setChatStatus(data.status || (data.ok ? "LIVE" : "OFFLINE"))
      setChatOut(data.text || "(no response)")
      if (data.model) setChatModel(data.model)
    } catch (e) {
      setChatStatus("OFFLINE")
      setChatOut(e instanceof Error ? e.message : "chat failed")
    } finally {
      setBusy(false)
      void refresh()
    }
  }

  const s = status?.seats
  const models = s?.ollama?.models || []

  return (
    <div className="hub-shell flex bg-black text-dark-800">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="TRIADIC LOCAL AI — COMMAND HUB SEAT" />
        <div className="flex flex-wrap items-center gap-2 border-b border-dark-300/40 bg-dark-100/40 px-6 py-2">
          <Badge variant="outline" className="font-mono text-xs border-cyan-500/40 text-cyan-300">
            /triadic
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-amber-500/40 text-amber-300">
            HOLD_VYRNA_UNSYNC
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-amber-600/50 text-amber-200">
            lattice_sync: false
          </Badge>
          <Badge variant="outline" className={`font-mono text-[10px] ${badgeClass(s?.ollama?.badge)}`}>
            Ollama: {s?.ollama?.badge || "…"}
          </Badge>
          <Badge variant="outline" className={`font-mono text-[10px] ${badgeClass(s?.ghostlight?.badge)}`}>
            Ghostlight: {s?.ghostlight?.badge || "…"}
          </Badge>
          <Badge variant="outline" className={`font-mono text-[10px] ${badgeClass(s?.mesh?.badge)}`}>
            Mesh: {s?.mesh?.badge || "…"}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto h-7 font-mono text-[10px]"
            onClick={() => void refresh()}
            disabled={busy}
          >
            <RefreshCw className={`mr-1 h-3 w-3 ${busy ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="space-y-4 p-6">
          <p className="font-mono text-xs text-dark-500 max-w-3xl">
            Local-first Triadic seat: P16 brainstem (Ollama) · Ghostlight MCP · DIMM Drive · RunPod/mesh muscle
            (DRY-RUN). Honest probes only — no Venice burns, no fake GPU runs, no lattice claims.
          </p>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <TechPanel title="Ollama (brainstem)" className="min-h-[160px]">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="h-4 w-4 text-cyan-400" />
                <Badge className={`font-mono text-[10px] ${badgeClass(s?.ollama?.badge)}`}>
                  {s?.ollama?.badge || "…"}
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-dark-500 mb-2">{s?.ollama?.detail}</p>
              <p className="font-mono text-[10px] text-dark-600">
                base: {s?.ollama?.base || "http://127.0.0.1:11434"}
              </p>
              <p className="font-mono text-[10px] text-dark-600">
                binary: {s?.ollama?.binaryPresent ? "present" : "missing"}
              </p>
              {models.length > 0 ? (
                <ul className="mt-2 space-y-0.5 font-mono text-[10px] text-emerald-300/90">
                  {models.slice(0, 8).map((m) => (
                    <li key={m}>· {m}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 font-mono text-[10px] text-amber-400/80">
                  No model list (server down or empty)
                </p>
              )}
            </TechPanel>

            <TechPanel title="DIMM Drive quota" className="min-h-[160px]">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="h-4 w-4 text-violet-400" />
                <Badge className={`font-mono text-[10px] ${badgeClass(s?.dimmDrive?.badge)}`}>
                  {s?.dimmDrive?.badge || "…"}
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-dark-500">
                {s?.dimmDrive?.local?.backend || "—"} · {s?.dimmDrive?.local?.sizeGb ?? "—"} Gi
              </p>
              <p className="font-mono text-[10px] text-dark-600 truncate">
                {s?.dimmDrive?.local?.path || "—"}
              </p>
              <p className="font-mono text-[10px] text-dark-600">
                used: {fmtBytes(s?.dimmDrive?.local?.usedBytes)}
              </p>
              <p className="font-mono text-[10px] text-dark-600 mt-1">
                host avail: {s?.dimmDrive?.host?.memAvailableGi?.toFixed?.(2) ?? "—"} /{" "}
                {s?.dimmDrive?.host?.memTotalGi?.toFixed?.(2) ?? "—"} Gi
              </p>
              <Link href="/dimm-drive" className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] text-cyan-400 underline">
                Open /dimm-drive <ExternalLink className="h-3 w-3" />
              </Link>
            </TechPanel>

            <TechPanel title="Ghostlight MCP" className="min-h-[160px]">
              <div className="flex items-center gap-2 mb-2">
                <Radio className="h-4 w-4 text-emerald-400" />
                <Badge className={`font-mono text-[10px] ${badgeClass(s?.ghostlight?.badge)}`}>
                  {s?.ghostlight?.badge || "…"}
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-dark-500">{s?.ghostlight?.detail}</p>
              <p className="font-mono text-[10px] text-dark-600 mt-1">
                {s?.ghostlight?.endpoint || "127.0.0.1:8765/mcp"}
              </p>
              {s?.ghostlight?.serverName && (
                <p className="font-mono text-[10px] text-emerald-300/80">
                  server: {s.ghostlight.serverName}
                </p>
              )}
            </TechPanel>

            <TechPanel title="RunPod / mesh chain" className="min-h-[160px]">
              <div className="flex items-center gap-2 mb-2">
                <Network className="h-4 w-4 text-amber-400" />
                <Badge className={`font-mono text-[10px] ${badgeClass(s?.mesh?.badge)}`}>
                  {s?.mesh?.badge || "…"}
                </Badge>
                <Badge className={`font-mono text-[10px] ${badgeClass(s?.runpod?.badge)}`}>
                  RunPod: {s?.runpod?.badge || "STUB"}
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-dark-500">{s?.mesh?.note}</p>
              <ul className="mt-2 max-h-24 overflow-auto space-y-0.5 font-mono text-[10px] text-dark-500">
                {(s?.mesh?.providers || []).slice(0, 8).map((p) => (
                  <li key={p.id || p.name}>
                    · {p.name || p.id}:{" "}
                    <span className={p.status === "ready" ? "text-emerald-400" : "text-amber-400"}>
                      {p.status || "stub"}
                    </span>
                  </li>
                ))}
              </ul>
              <Link href="/mesh" className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] text-cyan-400 underline">
                Open /mesh <ExternalLink className="h-3 w-3" />
              </Link>
            </TechPanel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TechPanel title="Local chat smoke (Ollama only)">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-cyan-400" />
                <select
                  className="h-8 rounded border border-dark-400/40 bg-dark-100/60 px-2 font-mono text-[11px] text-dark-700"
                  value={chatModel}
                  onChange={(e) => setChatModel(e.target.value)}
                  disabled={!models.length}
                >
                  <option value="">auto (first tag)</option>
                  {models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  className="h-8 font-mono text-[11px]"
                  onClick={() => void smokeChat()}
                  disabled={busy}
                >
                  <Activity className="mr-1 h-3 w-3" />
                  Smoke chat
                </Button>
                {chatStatus && (
                  <Badge className={`font-mono text-[10px] ${badgeClass(chatStatus)}`}>
                    {chatStatus}
                  </Badge>
                )}
              </div>
              <pre className="max-h-48 overflow-auto rounded border border-dark-300/30 bg-black/50 p-3 font-mono text-[11px] text-dark-600 whitespace-pre-wrap">
                {chatOut ||
                  (s?.ollama?.online
                    ? "Ready — click Smoke chat (hits localhost Ollama only)."
                    : "Ollama DOWN — smoke will return clear OFFLINE (no fake tokens).")}
              </pre>
            </TechPanel>

            <TechPanel title="Architecture digest (paths only)">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-violet-400" />
                <Badge variant="outline" className="font-mono text-[10px] border-violet-500/40 text-violet-300">
                  {status?.docs?.present ? "PACK ON DISK" : "PACK MISSING"}
                </Badge>
              </div>
              <p className="font-mono text-[10px] text-dark-600 break-all mb-2">
                {status?.docs?.root}
              </p>
              <ul className="mb-3 space-y-1 font-mono text-[11px] text-dark-500">
                {(status?.docs?.excerpt || []).map((line) => (
                  <li key={line}>· {line}</li>
                ))}
              </ul>
              <p className="font-mono text-[10px] text-dark-600 mb-1">Files:</p>
              <ul className="font-mono text-[10px] text-cyan-300/70 space-y-0.5">
                {(status?.docs?.files || []).map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
              {status?.ramGuard && (
                <p className="mt-3 font-mono text-[10px] text-amber-400/80">
                  RAM guard: leave ≥{status.ramGuard.leaveOsGi}Gi OS · box ~{status.ramGuard.boxHintGi}Gi ·{" "}
                  {status.ramGuard.note}
                </p>
              )}
            </TechPanel>
          </div>

          <TechPanel title="Linked surfaces">
            <div className="flex flex-wrap gap-3 font-mono text-xs">
              {[
                ["/dimm-drive", "DIMM Drive"],
                ["/mesh", "GPU Mesh"],
                ["/symtrain", "Σ3D-SYMTRAIN"],
                ["/reclaim", "Reclaim"],
                ["/venice", "Venice"],
                ["/command-hub", "Command Hub"],
                ["/modules", "Module Bay"],
                ["/ai-hub", "AI Ops"],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="inline-flex items-center gap-1 rounded border border-dark-400/40 px-2 py-1 text-cyan-400 hover:border-cyan-500/50 hover:bg-dark-100/30"
                >
                  {label} <ExternalLink className="h-3 w-3" />
                </Link>
              ))}
            </div>
          </TechPanel>
        </div>
      </div>
    </div>
  )
}
