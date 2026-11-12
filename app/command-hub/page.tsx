"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { TechPanel } from "@/components/ui/tech-panel"
import { TechCard, TechCardHeader, TechCardTitle, TechCardContent } from "@/components/ui/tech-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Shield,
  Brain,
  Smartphone,
  Map,
  Layers,
  Archive,
  Network,
  Zap,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  KeyRound,
  Activity,
  GraduationCap,
  User,
  EyeOff,
  Package,
  Terminal,
  HardDrive,
  Music2,
  Mic,
  Hand,
  PhoneCall,
} from "lucide-react"

type SignalKind = "live" | "unavailable"

interface AccountRail {
  id: string
  name: string
  keyPresent: boolean
  status: string
  detail: string
  connectHref: string
  connectLabel: string
}

interface IdsEvent {
  id: string
  ts: string
  severity: string
  source: string
  message: string
  kind: SignalKind
}

interface IdsPayload {
  ok: boolean
  generatedAt?: string
  uptimeSec?: number
  envLocalPresent?: boolean
  holdFlags?: Record<string, boolean>
  auth?: { failedApiAuthCount: number; note: string }
  modules?: Array<{ id: string; label: string; available: boolean; kind: SignalKind }>
  lastScan?: { at: string; kind: SignalKind; summary: string }
  events?: IdsEvent[]
  legend?: { live: string; unavailable: string }
  accountRails?: AccountRail[]
  process?: { pid: number; node: string; platform: string; rssMb: number }
}

const FORTRESS_LINKS = [
  { id: "ai-hub", name: "AI Ops Hub", href: "/ai-hub", icon: Brain },
  { id: "operator-twin", name: "Operator Twin", href: "/operator-twin", icon: User },
  { id: "phone-suite", name: "Phone Suite", href: "/phone-suite", icon: Smartphone },
  { id: "kepler", name: "Kepler", href: "/intelligence/kepler", icon: Map },
  { id: "evidence", name: "Evidence Explorer", href: "/evidence-explorer", icon: Archive },
  { id: "network", name: "Network Security", href: "/network-security", icon: Network },
  { id: "threat", name: "Threat Analysis", href: "/threat-analysis", icon: AlertTriangle },
  { id: "privacy", name: "Privacy Fortress", href: "/privacy", icon: EyeOff },
  { id: "modules", name: "Module Bay", href: "/modules", icon: Package },
  { id: "dev-operator", name: "Dev Operator AI", href: "/dev-operator", icon: Terminal },
  { id: "sigma-lane", name: "Sigma Lane", href: "/dev-operator#sigma-lane", icon: Activity },
  { id: "ai-caller", name: "AI Caller", href: "/ai-caller", icon: PhoneCall },
  { id: "music-hub", name: "Music Hub", href: "/music", icon: Music2 },
  { id: "voice-bus", name: "Voice Bus", href: "/voice", icon: Mic },
  { id: "handsfree", name: "Hands-free", href: "/handsfree", icon: Hand },
  { id: "train-lane", name: "Train Lane", href: "/symtrain", icon: GraduationCap },
  { id: "dimm-drive", name: "DIMM Drive", href: "/dimm-drive", icon: HardDrive },
]

function statusBadgeClass(status: string) {
  if (status === "key-present" || status === "local") return "border-emerald-500/40 text-emerald-300"
  if (status === "partial") return "border-amber-500/40 text-amber-300"
  if (status === "connect-pending") return "border-cyan-500/40 text-cyan-300"
  return "border-gray-600 text-gray-400"
}

function severityClass(sev: string) {
  if (sev === "critical" || sev === "high") return "text-red-400"
  if (sev === "medium") return "text-amber-300"
  if (sev === "low") return "text-cyan-300"
  return "text-gray-400"
}

export default function CommandHubPage() {
  const [ids, setIds] = useState<IdsPayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/security/ids/status", { cache: "no-store" })
      if (!res.ok) throw new Error(`IDS HTTP ${res.status}`)
      const data = (await res.json()) as IdsPayload
      setIds(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "refresh failed")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const rails = ids?.accountRails ?? []
  const events = ids?.events ?? []

  return (
    <div className="hub-shell flex bg-black text-dark-800">
      <Sidebar />

      <div className="hub-shell-main">
        <Header title="COMMAND HUB — FORTRESS" />
        <div className="flex flex-wrap items-center gap-2 border-b border-dark-300/40 bg-dark-100/40 px-6 py-2">
          <Badge variant="outline" className="font-mono text-xs border-cyan-500/40 text-cyan-300">
            /command-hub
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-amber-500/40 text-amber-300">
            HOLD_VYRNA_UNSYNC
          </Badge>
          <Badge variant="outline" className="font-mono text-xs border-emerald-500/40 text-emerald-300">
            HIGH SECURITY
          </Badge>
          <span className="text-xs text-dark-600 font-mono">
            Ghostlight · Account Rails · IDS (live host signals)
          </span>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto h-7 text-xs font-mono border-gray-600 bg-transparent"
            onClick={() => void refresh()}
            disabled={loading}
          >
            <RefreshCw className={`mr-1 h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="hub-shell-scroll p-4 md:p-6 space-y-6">
          {/* Module rail */}
          <TechPanel
            title="FORTRESS MODULES"
            subtitle="QUIET PRODUCT LINKS — SINGULARITY DEFENSE"
            cornerAccent={true}
            borderAccent={true}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {FORTRESS_LINKS.map((m) => {
                const Icon = m.icon
                return (
                  <Link key={m.id} href={m.href}>
                    <TechCard
                      variant="default"
                      cornerAccent={true}
                      glowEffect={true}
                      className="h-full hover:border-gray-500 transition-all cursor-pointer"
                    >
                      <TechCardHeader>
                        <TechCardTitle className="flex items-center space-x-2 text-xs">
                          <Icon className="w-3.5 h-3.5 text-gray-300" />
                          <span>{m.name}</span>
                        </TechCardTitle>
                      </TechCardHeader>
                      <TechCardContent>
                        <span className="font-mono text-[10px] text-gray-500">{m.href}</span>
                      </TechCardContent>
                    </TechCard>
                  </Link>
                )
              })}
            </div>
          </TechPanel>

          {/* Additive Camtasia blueprint */}
          <TechPanel
            title="STACK BLUEPRINT (CAMTASIA)"
            subtitle="FUTURE OPTIONAL PACKAGE LAYOUT · NO LIVE MIGRATION"
            cornerAccent={true}
            borderAccent={true}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <TechCard variant="info" cornerAccent={true} className="border-cyan-900/70">
                <TechCardHeader>
                  <TechCardTitle className="text-xs">Blueprint doc</TechCardTitle>
                </TechCardHeader>
                <TechCardContent>
                  <p className="mb-3 text-[11px] text-gray-500">
                    Future-only Turborepo, pnpm, Next, shadcn, Prisma, SQLite, and agent layout notes.
                  </p>
                  <a
                    href="/docs/CAMTASIA_COMMAND_HUB_V2_STACK.md"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline" className="h-7 text-[10px] font-mono border-gray-600 bg-transparent">
                      Open stack doc
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </a>
                </TechCardContent>
              </TechCard>

              <TechCard variant="default" cornerAccent={true} className="border-gray-700">
                <TechCardHeader>
                  <TechCardTitle className="text-xs">AI Ops</TechCardTitle>
                </TechCardHeader>
                <TechCardContent>
                  <p className="mb-3 text-[11px] text-gray-500">Existing operations hub.</p>
                  <Link href="/ai-hub">
                    <Button size="sm" variant="outline" className="h-7 text-[10px] font-mono border-gray-600 bg-transparent">
                      Open AI Ops
                    </Button>
                  </Link>
                </TechCardContent>
              </TechCard>

              <TechCard variant="default" cornerAccent={true} className="border-gray-700">
                <TechCardHeader>
                  <TechCardTitle className="text-xs">Twin</TechCardTitle>
                </TechCardHeader>
                <TechCardContent>
                  <p className="mb-3 text-[11px] text-gray-500">Existing Operator Twin workspace.</p>
                  <Link href="/operator-twin">
                    <Button size="sm" variant="outline" className="h-7 text-[10px] font-mono border-gray-600 bg-transparent">
                      Open Twin
                    </Button>
                  </Link>
                </TechCardContent>
              </TechCard>
            </div>
          </TechPanel>

          {/* Account Rails */}
          <TechPanel
            title="ACCOUNT RAILS"
            subtitle="KEY-PRESENCE ONLY · CONNECT = DEEP LINK · NO PASSWORDS IN REPO"
            cornerAccent={true}
            borderAccent={true}
            id="account-rails"
          >
            {error && (
              <p className="mb-3 font-mono text-xs text-amber-400">IDS refresh: {error}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(rails.length ? rails : PLACEHOLDER_RAILS).map((rail) => (
                <TechCard key={rail.id} variant="default" cornerAccent={true} className="border-gray-700">
                  <TechCardHeader>
                    <TechCardTitle className="flex items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-2">
                        <KeyRound className="w-3.5 h-3.5 text-gray-400" />
                        {rail.name}
                      </span>
                      <Badge
                        variant="outline"
                        className={`font-mono text-[10px] ${statusBadgeClass(rail.status)}`}
                      >
                        {rail.status}
                      </Badge>
                    </TechCardTitle>
                  </TechCardHeader>
                  <TechCardContent>
                    <p className="text-[11px] text-gray-500 font-mono mb-3 min-h-[2.5rem]">{rail.detail}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-gray-600">
                        key: {rail.keyPresent ? "present" : "absent"}
                      </span>
                      <a href={rail.connectHref} target="_blank" rel="noopener noreferrer">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px] font-mono border-gray-600 bg-transparent"
                        >
                          {rail.connectLabel}
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                      </a>
                    </div>
                  </TechCardContent>
                </TechCard>
              ))}
            </div>
            <p className="mt-3 font-mono text-[10px] text-gray-600">
              Operator signs in via secure vendor forms later. No credentials invented or stored here.
            </p>
          </TechPanel>

          {/* IDS / High Security */}
          <div id="ids" className="scroll-mt-4">
            <TechPanel
              title="INTRUSION DETECTION · HIGH SECURITY"
              subtitle="HONEST LOCAL SIGNALS · LIVE HOST ONLY"
              cornerAccent={true}
              borderAccent={true}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                <div className="rounded-sm border border-gray-700 bg-black/50 p-3 space-y-2">
                  <div className="flex items-center gap-2 font-mono text-xs text-gray-300">
                    <Activity className="h-3.5 w-3.5" /> PROCESS
                  </div>
                  <div className="font-mono text-[11px] text-gray-500 space-y-1">
                    <div>uptime: {ids?.uptimeSec ?? "—"}s</div>
                    <div>pid: {ids?.process?.pid ?? "—"}</div>
                    <div>node: {ids?.process?.node ?? "—"}</div>
                    <div>rss: {ids?.process?.rssMb ?? "—"} MB</div>
                    <div>
                      .env.local:{" "}
                      <span className={ids?.envLocalPresent ? "text-emerald-400" : "text-amber-400"}>
                        {ids?.envLocalPresent == null ? "—" : ids.envLocalPresent ? "present" : "missing"}
                      </span>{" "}
                      <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400">
                        live
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="rounded-sm border border-gray-700 bg-black/50 p-3 space-y-2">
                  <div className="flex items-center gap-2 font-mono text-xs text-gray-300">
                    <Shield className="h-3.5 w-3.5" /> HOLD FLAGS
                  </div>
                  <div className="font-mono text-[11px] text-gray-500 space-y-1">
                    {ids?.holdFlags ? (
                      Object.entries(ids.holdFlags).map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-2">
                          <span>{k}</span>
                          <span className={v ? "text-emerald-400" : "text-gray-600"}>{String(v)}</span>
                        </div>
                      ))
                    ) : (
                      <div>awaiting refresh…</div>
                    )}
                    <div className="pt-1 flex justify-between">
                      <span>failed API auth</span>
                      <span className="text-amber-300">{ids?.auth?.failedApiAuthCount ?? 0}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-sm border border-gray-700 bg-black/50 p-3 space-y-2">
                  <div className="flex items-center gap-2 font-mono text-xs text-gray-300">
                    <AlertTriangle className="h-3.5 w-3.5" /> MODULE HOOKS
                  </div>
                  <div className="font-mono text-[11px] text-gray-500 space-y-1">
                    {(ids?.modules ?? []).map((m) => (
                      <div key={m.id} className="flex justify-between gap-2">
                        <span className="truncate">{m.label}</span>
                        <span className={m.available ? "text-emerald-400" : "text-gray-600"}>
                          {m.available ? "ok" : "miss"}/{m.kind}
                        </span>
                      </div>
                    ))}
                    {!ids?.modules?.length && <div>awaiting refresh…</div>}
                  </div>
                </div>
              </div>

              <div className="mb-3 font-mono text-[11px] text-gray-500">
                Last scan: {ids?.lastScan?.summary ?? "—"}{" "}
                {ids?.lastScan && (
                  <Badge variant="outline" className="ml-1 text-[9px] border-emerald-500/30 text-emerald-400">
                    {ids.lastScan.kind}
                  </Badge>
                )}
              </div>

              <div className="rounded-sm border border-gray-700 bg-black/60 p-3 max-h-64 overflow-auto">
                <div className="mb-2 font-mono text-xs text-gray-300 tracking-wider">EVENT FEED</div>
                {events.length === 0 && (
                  <div className="font-mono text-[11px] text-gray-600">No events yet — refresh IDS.</div>
                )}
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="border-b border-gray-800/80 py-1.5 font-mono text-[11px] flex flex-wrap gap-x-3 gap-y-1"
                  >
                    <span className="text-gray-600 shrink-0">{ev.ts?.slice(11, 19) ?? ""}</span>
                    <span className={`shrink-0 uppercase ${severityClass(ev.severity)}`}>{ev.severity}</span>
                    <span className="text-gray-500 shrink-0">{ev.source}</span>
                    <span className="text-gray-400 flex-1 min-w-[12rem]">{ev.message}</span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] ${
                        ev.kind === "live"
                          ? "border-emerald-500/30 text-emerald-400"
                          : "border-violet-500/30 text-violet-300"
                      }`}
                    >
                      {ev.kind}
                    </Badge>
                  </div>
                ))}
              </div>

              {ids?.legend && (
                <p className="mt-3 font-mono text-[10px] text-gray-600">
                  live = {ids.legend.live}{ids.legend.unavailable ? ` · unavailable = ${ids.legend.unavailable}` : ""}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/network-security">
                  <Button size="sm" variant="outline" className="h-7 text-[10px] font-mono border-gray-600 bg-transparent">
                    Network Security
                  </Button>
                </Link>
                <Link href="/self-healing">
                  <Button size="sm" variant="outline" className="h-7 text-[10px] font-mono border-gray-600 bg-transparent">
                    Self-Healing (retired theater)
                  </Button>
                </Link>
                <Link href="/threat-analysis">
                  <Button size="sm" variant="outline" className="h-7 text-[10px] font-mono border-gray-600 bg-transparent">
                    Threat Analysis
                  </Button>
                </Link>
                <Link href="/api/security/ids/status">
                  <Button size="sm" variant="outline" className="h-7 text-[10px] font-mono border-gray-600 bg-transparent">
                    GET /api/security/ids/status
                  </Button>
                </Link>
              </div>
            </TechPanel>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Shown before first successful fetch so rails layout is never empty. */
const PLACEHOLDER_RAILS: AccountRail[] = [
  "OpenAI",
  "xAI / Grok",
  "Venice",
  "v0",
  "Ollama",
  "Supabase",
  "OneDrive",
  "GitHub",
  "Vercel",
].map((name, i) => ({
  id: `ph-${i}`,
  name,
  keyPresent: false,
  status: "connect-pending",
  detail: "Loading status…",
  connectHref: "#",
  connectLabel: "Connect",
}))
