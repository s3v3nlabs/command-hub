"use client"

import { useCallback, useEffect, useState, type ComponentType } from "react"
import Link from "next/link"
import {
  AudioLines,
  Shield,
  Network,
  Sparkles,
  Eye,
  ExternalLink,
  RefreshCw,
  FileText,
  Package,
  Radio,
  Loader2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  TechCard,
  TechCardContent,
  TechCardDescription,
  TechCardHeader,
  TechCardTitle,
} from "@/components/ui/tech-card"
import { cn } from "@/lib/utils"

type DocLink = {
  label: string
  path: string
  hubRoute?: string
}

type TechHook = {
  id: string
  href: string
  label: string
}

type SoundCheckStatus = {
  ok: boolean
  product?: string
  codename?: string
  status?: string
  runtime?: boolean
  note?: string
  capability_summary?: string
  holds?: { HOLD_VYRNA_UNSYNC?: boolean; lattice_sync?: boolean }
  docs?: DocLink[]
  tech_hooks?: TechHook[]
  engines_root?: string
  checkedAt?: string
  error?: string
}

/** Business tech modules — commercial surfaces only (no origin mythology). */
const BUSINESS_MODULES: Array<{
  id: string
  title: string
  blurb: string
  href: string
  icon: ComponentType<{ className?: string; size?: number }>
  badge: string
}> = [
  {
    id: "privacy",
    title: "Privacy Fortress",
    blurb: "Anti-telemetry · local crypto · egress posture. Fortress status live in hub.",
    href: "/privacy",
    icon: Shield,
    badge: "LIVE",
  },
  {
    id: "mesh",
    title: "GPU / Provider Mesh",
    blurb: "Operator-owned seats · quota ledger · no burner accounts. Mesh efficiency surface.",
    href: "/mesh",
    icon: Network,
    badge: "LIVE",
  },
  {
    id: "venice",
    title: "Venice",
    blurb: "Bayed overnight · reclaim path preferred. Not a live lattice claim.",
    href: "/venice",
    icon: Sparkles,
    badge: "BAYED",
  },
  {
    id: "reclaim",
    title: "Reclaim · Eye of Truth",
    blurb: "AXIOS · Heimdallr handshake · Ghostlight vault search · FULL_RECALL pack.",
    href: "/reclaim",
    icon: Eye,
    badge: "HOLD",
  },
]

export default function SoundCheckPanel() {
  const [data, setData] = useState<SoundCheckStatus | null>(null)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    setBusy(true)
    try {
      const res = await fetch("/api/soundcheck/status", { cache: "no-store" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData((await res.json()) as SoundCheckStatus)
    } catch (e) {
      setData({
        ok: false,
        status: "STUB",
        runtime: false,
        error: e instanceof Error ? e.message : "status failed",
        holds: { HOLD_VYRNA_UNSYNC: true, lattice_sync: false },
      })
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const isStub = (data?.status ?? "STUB").toUpperCase() === "STUB" || data?.runtime === false

  return (
    <div className="space-y-6 ghostlight-core">
      {/* Product header */}
      <TechCard variant="info" glowEffect className="border-violet-500/30">
        <TechCardHeader>
          <div className="flex items-start gap-3 min-w-0">
            <div className="relative h-12 w-12 shrink-0 rounded-sm border border-dark-400/50 bg-black overflow-hidden flex items-center justify-center">
              <img
                src="/branding/singular-ty-defense-solutions-logo.png"
                alt="Singular/ty Defense Solutions"
                className="h-10 w-10 object-contain"
              />
            </div>
            <div className="min-w-0">
              <TechCardTitle className="flex flex-wrap items-center gap-2">
                <AudioLines className="inline h-4 w-4 text-violet-300" />
                SoundCheck
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] border-amber-500/50 text-amber-300 tracking-widest"
                >
                  STUB
                </Badge>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] border-violet-500/40 text-violet-300"
                >
                  {data?.codename ?? "SHDL"}
                </Badge>
              </TechCardTitle>
              <TechCardDescription className="mt-1 font-mono text-dark-500">
                Singular/ty Defense Solutions · commercial product wedge · not origin story
              </TechCardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="font-mono text-xs shrink-0"
            onClick={() => void refresh()}
            disabled={busy}
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            <span className="ml-1.5">Refresh</span>
          </Button>
        </TechCardHeader>
        <TechCardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="font-mono text-xs border-amber-500/40 text-amber-300">
              HOLD_VYRNA_UNSYNC
            </Badge>
            <Badge variant="outline" className="font-mono text-xs border-rose-500/40 text-rose-300">
              lattice_sync: false
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "font-mono text-xs",
                isStub
                  ? "border-amber-500/40 text-amber-300"
                  : "border-emerald-500/40 text-emerald-300",
              )}
            >
              runtime: {data?.runtime ? "wired" : "none"}
            </Badge>
            <Badge variant="outline" className="font-mono text-xs border-dark-400/40 text-dark-500">
              status: {data?.status ?? "STUB"}
            </Badge>
          </div>
          <p className="text-sm text-dark-600 font-mono leading-relaxed">
            {data?.note ??
              "Commercial product path. Honest stub — no live detector in this hub build."}
          </p>
          {data?.capability_summary && (
            <p className="text-xs text-dark-500 font-mono border-l-2 border-violet-500/40 pl-3">
              {data.capability_summary}
            </p>
          )}
          {data?.error && (
            <p className="text-xs font-mono text-rose-400">status error: {data.error}</p>
          )}
          {data?.checkedAt && (
            <p className="text-[10px] font-mono text-dark-500 tracking-wider">
              checked · {data.checkedAt}
            </p>
          )}
        </TechCardContent>
      </TechCard>

      {/* Product surface + docs */}
      <div className="grid gap-4 md:grid-cols-2">
        <TechCard cornerAccent>
          <TechCardHeader>
            <TechCardTitle>
              <Package className="inline h-4 w-4 mr-2 text-dark-600" />
              Product surface
            </TechCardTitle>
          </TechCardHeader>
          <TechCardContent className="space-y-3 text-sm font-mono text-dark-600">
            <ul className="space-y-2 list-none">
              <li className="flex gap-2">
                <Radio className="h-3.5 w-3.5 mt-0.5 shrink-0 text-violet-400" />
                <span>
                  <span className="text-dark-700">SHDL</span> — planned harmonic / AI voice-clone
                  detection product framing (design only).
                </span>
              </li>
              <li className="flex gap-2">
                <AudioLines className="h-3.5 w-3.5 mt-0.5 shrink-0 text-violet-400" />
                <span>
                  Brand path adjacent to frequency stack notes (109 / 594 / 963) — metaphor /
                  product language, not a live lattice claim.
                </span>
              </li>
              <li className="flex gap-2">
                <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0 text-violet-400" />
                <span>
                  Kept out of free brainstem / termux_engine loop until separately scoped.
                </span>
              </li>
            </ul>
            <p className="text-[10px] text-dark-500 tracking-wider uppercase">
              No secrets · no origin mythology · ADD-ONLY commercial wedge
            </p>
          </TechCardContent>
        </TechCard>

        <TechCard cornerAccent>
          <TechCardHeader>
            <TechCardTitle>
              <FileText className="inline h-4 w-4 mr-2 text-dark-600" />
              Design / docs paths
            </TechCardTitle>
          </TechCardHeader>
          <TechCardContent className="space-y-2">
            {(data?.docs ?? []).length === 0 && (
              <p className="text-xs font-mono text-dark-500">Load status for doc index…</p>
            )}
            {(data?.docs ?? []).map((d) => (
              <div
                key={d.path}
                className="rounded-sm border border-dark-400/30 bg-black/40 px-3 py-2"
              >
                <div className="text-xs font-mono text-dark-700">{d.label}</div>
                <div className="text-[10px] font-mono text-dark-500 break-all mt-0.5">{d.path}</div>
                {d.hubRoute && (
                  <Link
                    href={d.hubRoute}
                    className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-mono text-violet-300 hover:text-violet-200"
                  >
                    Open hub route <ExternalLink className="h-2.5 w-2.5" />
                  </Link>
                )}
              </div>
            ))}
            {data?.engines_root && (
              <p className="text-[10px] font-mono text-dark-500 pt-1">
                engines root · {data.engines_root}
              </p>
            )}
          </TechCardContent>
        </TechCard>
      </div>

      {/* Business tech modules */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="hub-wireframe-title font-mono text-sm font-bold uppercase tracking-widest text-dark-700">
            Singular/ty business tech
          </h2>
          <Badge variant="outline" className="font-mono text-[10px] border-dark-400/40 text-dark-500">
            modules → existing hub routes
          </Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {BUSINESS_MODULES.map((mod) => (
            <Link key={mod.id} href={mod.href} className="group block">
              <TechCard
                cornerAccent
                className="h-full transition-colors group-hover:border-violet-500/40 group-hover:bg-violet-950/10"
              >
                <TechCardHeader>
                  <TechCardTitle className="flex items-center gap-2 text-xs">
                    <mod.icon className="h-3.5 w-3.5 text-violet-300" />
                    {mod.title}
                  </TechCardTitle>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-mono text-[9px] tracking-wider",
                      mod.badge === "LIVE" && "border-emerald-500/40 text-emerald-300",
                      mod.badge === "BAYED" && "border-amber-500/40 text-amber-300",
                      mod.badge === "HOLD" && "border-rose-500/40 text-rose-300",
                    )}
                  >
                    {mod.badge}
                  </Badge>
                </TechCardHeader>
                <TechCardContent>
                  <p className="text-xs font-mono text-dark-500 leading-relaxed">{mod.blurb}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-mono text-violet-300/80 group-hover:text-violet-200">
                    {mod.href} <ExternalLink className="h-2.5 w-2.5" />
                  </span>
                </TechCardContent>
              </TechCard>
            </Link>
          ))}
        </div>
      </div>

      {/* Tech hooks strip */}
      <TechCard variant="outline" className="border-dark-400/30">
        <TechCardHeader>
          <TechCardTitle className="text-xs">Tech hooks</TechCardTitle>
        </TechCardHeader>
        <TechCardContent>
          <div className="flex flex-wrap gap-2">
            {(data?.tech_hooks ?? BUSINESS_MODULES.map((m) => ({ id: m.id, href: m.href, label: m.title }))).map(
              (h) => (
                <Link
                  key={h.id}
                  href={h.href}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-dark-400/40 bg-black/50 px-2.5 py-1.5 text-[10px] font-mono text-dark-600 hover:border-violet-500/40 hover:text-violet-200 transition-colors"
                >
                  {h.label}
                  <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                </Link>
              ),
            )}
            <Link
              href="/signalframe"
              className="inline-flex items-center gap-1.5 rounded-sm border border-dark-400/40 bg-black/50 px-2.5 py-1.5 text-[10px] font-mono text-dark-600 hover:border-violet-500/40 hover:text-violet-200 transition-colors"
            >
              SignalFrame
              <ExternalLink className="h-2.5 w-2.5 opacity-60" />
            </Link>
            <Link
              href="/ai-hub"
              className="inline-flex items-center gap-1.5 rounded-sm border border-dark-400/40 bg-black/50 px-2.5 py-1.5 text-[10px] font-mono text-dark-600 hover:border-violet-500/40 hover:text-violet-200 transition-colors"
            >
              AI Ops Hub
              <ExternalLink className="h-2.5 w-2.5 opacity-60" />
            </Link>
          </div>
        </TechCardContent>
      </TechCard>
    </div>
  )
}
