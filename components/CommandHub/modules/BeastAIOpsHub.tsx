"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  Brain,
  ExternalLink,
  RefreshCw,
  Send,
  Zap,
  Radio,
  Phone,
  Map,
  Layers,
  Shield,
  Terminal,
  Cpu,
  Activity,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TechCard, TechCardContent, TechCardHeader, TechCardTitle } from "@/components/ui/tech-card"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

type HonestStatus = "live" | "offline" | "stub" | "partial" | "placeholder" | "key-present"

interface ProviderStatus {
  id: string
  name: string
  label: string
  keyPresent: boolean
  status: HonestStatus
  detail: string
  deepLink?: string
}

interface EngineSpec {
  id: string
  name: string
  script: string
  modes: string[]
  status: HonestStatus
  detail: string
}

interface StatusPayload {
  ok: boolean
  providers: ProviderStatus[]
  ollama: { online: boolean; tags: string[]; detail: string; base: string }
  engines: EngineSpec[]
  deepLinks: Array<{ id: string; label: string; href: string }>
  localNav: Array<{ id: string; label: string; href: string }>
}

const STATUS_STYLE: Record<HonestStatus, string> = {
  live: "border-emerald-500/50 text-emerald-300 bg-emerald-500/10",
  "key-present": "border-cyan-500/50 text-cyan-300 bg-cyan-500/10",
  partial: "border-amber-500/50 text-amber-300 bg-amber-500/10",
  stub: "border-violet-500/50 text-violet-300 bg-violet-500/10",
  placeholder: "border-slate-500/50 text-slate-400 bg-slate-500/10",
  offline: "border-rose-500/50 text-rose-300 bg-rose-500/10",
}

const ROUTABLE = [
  "openai",
  "xai",
  "groq",
  "ollama",
  "venice",
  "heimdall",
  "v0-bridge",
  "mistral",
  "nvidia-nim",
  "whisper",
]

export default function BeastAIOpsHub() {
  const [status, setStatus] = useState<StatusPayload | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [provider, setProvider] = useState("groq")
  const [prompt, setPrompt] = useState("")
  const [liberation, setLiberation] = useState(false)
  const [sending, setSending] = useState(false)
  const [response, setResponse] = useState<string>("")
  const [responseMeta, setResponseMeta] = useState<string>("")
  const [engineBusy, setEngineBusy] = useState<string | null>(null)
  const [engineLog, setEngineLog] = useState("")

  const refreshStatus = useCallback(async () => {
    setLoadingStatus(true)
    try {
      const res = await fetch("/api/ai/ops/status", { cache: "no-store" })
      const data = (await res.json()) as StatusPayload
      setStatus(data)
      if (data.providers?.length) {
        const preferred =
          data.providers.find((p) => p.id === "groq" && p.keyPresent) ||
          data.providers.find((p) => p.id === "xai" && p.keyPresent) ||
          data.providers.find((p) => p.id === "openai" && p.keyPresent) ||
          data.providers.find((p) => p.id === "ollama" && p.status === "live")
        if (preferred) setProvider(preferred.id)
      }
    } catch (err) {
      setStatus(null)
      setResponseMeta(err instanceof Error ? err.message : "status fetch failed")
    } finally {
      setLoadingStatus(false)
    }
  }, [])

  useEffect(() => {
    refreshStatus()
  }, [refreshStatus])

  const sendPrompt = async () => {
    if (!prompt.trim() || sending) return
    setSending(true)
    setResponse("")
    setResponseMeta("routing…")
    try {
      const res = await fetch("/api/ai/ops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, prompt, liberation }),
      })
      const data = await res.json()
      setResponse(data.text || data.error || "(no text)")
      setResponseMeta(
        [
          `HTTP ${res.status}`,
          data.status || "",
          data.mode || "",
          data.ok ? "ok" : "fail",
          liberation ? "liberation:on" : "liberation:off",
        ]
          .filter(Boolean)
          .join(" · "),
      )
    } catch (err) {
      setResponse(err instanceof Error ? err.message : "send failed")
      setResponseMeta("client-error")
    } finally {
      setSending(false)
    }
  }

  const smokeEngine = async (engineId: string, mode: "demo" | "handshake") => {
    setEngineBusy(engineId)
    setEngineLog(`Running ${engineId} ${mode}…`)
    try {
      const res = await fetch("/api/ai/ops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "engine-smoke", engine: engineId, mode }),
      })
      const data = await res.json()
      setEngineLog(
        [
          `# ${engineId} / ${mode} · exit ${data.exitCode ?? "?"} · ${data.detail || ""}`,
          data.output || data.error || "(empty)",
        ].join("\n"),
      )
    } catch (err) {
      setEngineLog(err instanceof Error ? err.message : "engine smoke failed")
    } finally {
      setEngineBusy(null)
    }
  }

  return (
    <div className="space-y-4 text-dark-800">
      {/* Title strip — Ghostlight chrome */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded border border-cyan-500/40 bg-cyan-500/10">
            <Brain className="h-5 w-5 text-cyan-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-cyan-100 font-mono">
              BEAST AI OPS HUB
            </h1>
            <p className="text-xs text-dark-600 font-mono">
              Provider board · engines · prompt router · HOLD_VYRNA_UNSYNC
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs border-amber-500/40 text-amber-300">
            lattice_sync: false
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-xs",
              status?.ollama?.online
                ? "border-emerald-500/40 text-emerald-300"
                : "border-rose-500/40 text-rose-300",
            )}
          >
            ollama: {status?.ollama?.online ? "live" : "offline"}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={refreshStatus}
            disabled={loadingStatus}
            className="font-mono text-xs border-dark-300/50"
          >
            <RefreshCw className={cn("mr-1 h-3 w-3", loadingStatus && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Local deep nav */}
      <div className="flex flex-wrap gap-2 border border-dark-300/40 bg-dark-100/40 rounded px-3 py-2">
        {(
          status?.localNav || [
            { id: "phone", label: "Phone Suite", href: "/phone-suite" },
            { id: "kepler", label: "Kepler", href: "/intelligence/kepler" },
            { id: "heimdal", label: "Heimdal Terminal", href: "/heimdal-terminal" },
            { id: "reclaim", label: "Reclaim / Eye of Truth", href: "/reclaim" },
            { id: "operator-twin", label: "Operator Twin", href: "/operator-twin" },
          ]
        ).map((n) => (
          <Link
            key={n.id}
            href={n.href}
            className="inline-flex items-center gap-1 rounded border border-cyan-500/30 bg-cyan-500/5 px-2 py-1 text-xs font-mono text-cyan-200 hover:bg-cyan-500/15"
          >
            {n.id.includes("phone") ? (
              <Phone className="h-3 w-3" />
            ) : n.id.includes("kepler") ? (
              <Map className="h-3 w-3" />
            ) : n.id.includes("v0") ? (
              <Layers className="h-3 w-3" />
            ) : (
              <Shield className="h-3 w-3" />
            )}
            {n.label}
          </Link>
        ))}
        <Link
          href="/reclaim"
          className="inline-flex items-center gap-1 rounded border border-violet-500/40 bg-violet-500/5 px-2 py-1 text-xs font-mono text-violet-200 hover:bg-violet-500/15"
        >
          <Shield className="h-3 w-3" /> Reclaim / Eye of Truth
        </Link>
        <Link
          href="/command-hub"
          className="inline-flex items-center gap-1 rounded border border-dark-300/40 px-2 py-1 text-xs font-mono text-dark-600 hover:text-dark-800"
        >
          <Terminal className="h-3 w-3" /> Command Hub
        </Link>
      </div>

      {/* Provider board */}
      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-mono uppercase tracking-wide text-cyan-300/90">
          <Cpu className="h-4 w-4" /> Provider board
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
          {(status?.providers || []).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setProvider(p.id)}
              className={cn(
                "text-left rounded border p-3 transition-colors",
                provider === p.id
                  ? "border-cyan-400/60 bg-cyan-500/10 ring-1 ring-cyan-400/30"
                  : "border-dark-300/40 bg-dark-100/30 hover:border-dark-300/70",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold text-dark-800">{p.name}</span>
                <Badge variant="outline" className={cn("font-mono text-[10px] shrink-0", STATUS_STYLE[p.status])}>
                  {p.status}
                </Badge>
              </div>
              <p className="mt-1 text-[11px] text-dark-600 font-mono line-clamp-2">{p.detail}</p>
              <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-dark-600">
                <span>key: {p.keyPresent ? "yes" : "no"}</span>
                {p.deepLink && (
                  <a
                    href={p.deepLink.startsWith("/") ? p.deepLink : p.deepLink}
                    target={p.deepLink.startsWith("/") ? undefined : "_blank"}
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-0.5 text-cyan-400 hover:underline"
                  >
                    link <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
            </button>
          ))}
          {!status && loadingStatus && (
            <div className="col-span-full text-xs font-mono text-dark-600">Loading providers…</div>
          )}
        </div>
      </section>

      {/* Deep links rail */}
      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-mono uppercase tracking-wide text-violet-300/90">
          <ExternalLink className="h-4 w-4" /> Deep links
        </h2>
        <div className="flex flex-wrap gap-2">
          {(status?.deepLinks || []).map((d) => (
            <a
              key={d.id}
              href={d.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded border border-violet-500/30 bg-violet-500/5 px-2.5 py-1.5 text-xs font-mono text-violet-200 hover:bg-violet-500/15"
            >
              {d.label} <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Prompt router */}
        <TechCard cornerAccent className="border-dark-300/40 bg-dark-100/20">
          <TechCardHeader className="pb-2">
            <TechCardTitle className="flex items-center gap-2 text-sm font-mono text-cyan-200">
              <Send className="h-4 w-4" /> Prompt router
            </TechCardTitle>
          </TechCardHeader>
          <TechCardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-mono text-dark-600">Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="rounded border border-dark-300/50 bg-black/40 px-2 py-1.5 text-xs font-mono text-dark-800"
              >
                {ROUTABLE.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2 ml-auto">
                <Switch id="liberation" checked={liberation} onCheckedChange={setLiberation} />
                <Label htmlFor="liberation" className="text-xs font-mono text-amber-300">
                  Liberation protocol
                </Label>
              </div>
            </div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ops prompt — routed via /api/ai/ops"
              className="min-h-[120px] font-mono text-sm bg-black/40 border-dark-300/50"
            />
            <div className="flex items-center gap-2">
              <Button
                onClick={sendPrompt}
                disabled={sending || !prompt.trim()}
                className="font-mono text-xs bg-cyan-600 hover:bg-cyan-500"
              >
                {sending ? (
                  <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Zap className="mr-1 h-3 w-3" />
                )}
                Send
              </Button>
              <span className="text-[11px] font-mono text-dark-600">{responseMeta}</span>
            </div>
            <ScrollArea className="h-56 rounded border border-dark-300/40 bg-black/50 p-3">
              <pre className="whitespace-pre-wrap text-xs font-mono text-emerald-100/90">
                {response || "Response will appear here."}
              </pre>
            </ScrollArea>
          </TechCardContent>
        </TechCard>

        {/* Engines rail */}
        <TechCard cornerAccent className="border-dark-300/40 bg-dark-100/20">
          <TechCardHeader className="pb-2">
            <TechCardTitle className="flex items-center gap-2 text-sm font-mono text-amber-200">
              <Activity className="h-4 w-4" /> Engines rail
              <span className="text-[10px] text-dark-600 font-normal">
                /workspace/singular-ty-engines · --demo / --handshake only
              </span>
            </TechCardTitle>
          </TechCardHeader>
          <TechCardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(status?.engines || []).map((e) => (
                <div
                  key={e.id}
                  className="rounded border border-dark-300/40 bg-black/30 p-2.5 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{e.name}</span>
                    <Badge variant="outline" className={cn("font-mono text-[10px]", STATUS_STYLE[e.status])}>
                      {e.status}
                    </Badge>
                  </div>
                  <p className="text-[10px] font-mono text-dark-600">{e.detail}</p>
                  <div className="flex flex-wrap gap-1">
                    {e.modes.includes("demo") && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={engineBusy === e.id}
                        onClick={() => smokeEngine(e.id, "demo")}
                        className="h-7 text-[10px] font-mono"
                      >
                        <Radio className="mr-1 h-3 w-3" />
                        --demo
                      </Button>
                    )}
                    {e.modes.includes("handshake") && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={engineBusy === e.id}
                        onClick={() => smokeEngine(e.id, "handshake")}
                        className="h-7 text-[10px] font-mono"
                      >
                        <Shield className="mr-1 h-3 w-3" />
                        --handshake
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <ScrollArea className="h-40 rounded border border-dark-300/40 bg-black/50 p-3">
              <pre className="whitespace-pre-wrap text-[11px] font-mono text-amber-100/80">
                {engineLog || "Engine smoke output…"}
              </pre>
            </ScrollArea>
          </TechCardContent>
        </TechCard>
      </div>

      {status?.ollama && (
        <p className="text-[11px] font-mono text-dark-600">
          Ollama {status.ollama.base}: {status.ollama.detail}
          {status.ollama.tags?.length ? ` · tags: ${status.ollama.tags.join(", ")}` : ""}
        </p>
      )}
    </div>
  )
}
