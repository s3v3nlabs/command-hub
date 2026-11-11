"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { TechPanel } from "@/components/ui/tech-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Send, RefreshCw, Package, Radio, FileCode, Activity, Gauge, HardDrive, GraduationCap } from "lucide-react"

type ChatItem = { role: "user" | "assistant" | "system"; text: string; source?: string }

export default function DevOperatorPage() {
  const [items, setItems] = useState<ChatItem[]>([
    {
      role: "system",
      text: "Local Dev Operator AI ready. Defensive hub development only — modules, patches, hive intel, Privacy Fortress. HOLD_VYRNA_UNSYNC · lattice_sync: false. No exploit generation.",
    },
  ])
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(false)
  const [meta, setMeta] = useState<{
    modules?: number
    peers?: number
    learn?: {
      lessons_count: number
      intel_ingested: number
      proposals_accepted: number
      chat_turns: number
      last_learn_at: string | null
    }
  } | null>(null)
  const [sigma, setSigma] = useState<{
    laneId?: string
    hzCombo?: string
    deltaT?: number
    coherence?: number
    path?: string
    symbolicCount?: number
    mode?: string
    hemispheres?: {
      left?: { label?: string; active?: boolean; weight?: number; meaning?: string }
      right?: { label?: string; active?: boolean; weight?: number; meaning?: string }
      dominant?: string
      path?: string
    }
    pulseMs?: number
    echoNexusBadge?: string
  } | null>(null)
  const [sigmaBusy, setSigmaBusy] = useState(false)
  const [dimm, setDimm] = useState<{ mounted?: boolean; path?: string; backend?: string; sigil?: number } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const boot = useCallback(async () => {
    const data = await fetch("/api/dev-operator").then((r) => r.json()).catch(() => null)
    if (data?.ok) {
      setMeta({
        modules: data.modules?.length,
        peers: data.hive?.peerCount ?? data.hive?.peers?.length ?? 0,
        learn: data.learn,
      })
    }
    const sg = await fetch("/api/sigma-lane").then((r) => r.json()).catch(() => null)
    if (sg?.ok) {
      setSigma({
        laneId: sg.laneId,
        hzCombo: sg.hzCombo,
        deltaT: sg.deltaT,
        coherence: sg.coherence,
        path: sg.path,
        symbolicCount: sg.symbolicCount ?? sg.memory?.count,
        mode: sg.lane?.mode,
        hemispheres: sg.hemisphereBadges || sg.hemispheres?.badges || sg.hemispheres,
        pulseMs: sg.pulseMs ?? sg.pulse?.backoffMs ?? sg.pulse?.phiIntervalMs?.[1],
        echoNexusBadge: sg.echoNexus?.badge || "PARTIAL",
      })
    }
    const dm = await fetch("/api/dimm-drive").then((r) => r.json()).catch(() => null)
    if (dm) {
      setDimm({
        mounted: dm.mounted || dm.local?.enabled,
        path: dm.local?.path,
        backend: dm.local?.backend,
        sigil: dm.sigilCacheCount,
      })
    }
  }, [])

  useEffect(() => {
    void boot()
  }, [boot])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [items])

  const send = async () => {
    if (!draft.trim() || busy) return
    const msg = draft.trim()
    setDraft("")
    setItems((prev) => [...prev, { role: "user", text: msg }])
    setBusy(true)
    try {
      const res = await fetch("/api/dev-operator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, action: "chat" }),
      })
      const data = await res.json()
      setItems((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data?.reply || data?.error || "no reply",
          source: data?.source,
        },
      ])
      if (data?.sigmaLane) {
        setSigma((prev) => ({
          ...(prev || {}),
          path: data.sigmaLane.path ?? prev?.path,
          laneId: data.sigmaLane.laneId ?? prev?.laneId,
          hzCombo: data.sigmaLane.hzCombo ?? prev?.hzCombo,
          symbolicCount: data.sigmaLane.symbolicCount ?? prev?.symbolicCount,
          hemispheres: data.sigmaLane.hemispheres ?? prev?.hemispheres,
          pulseMs: data.sigmaLane.pulseMs ?? prev?.pulseMs,
        }))
      }
      if (data?.learn) {
        setMeta((m) => ({ ...(m || {}), learn: data.learn }))
      }
    } catch {
      setItems((prev) => [...prev, { role: "assistant", text: "network error" }])
    } finally {
      setBusy(false)
    }
  }

  const quick = async (action: string, extra?: Record<string, unknown>) => {
    setBusy(true)
    try {
      const res = await fetch("/api/dev-operator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      })
      const data = await res.json()
      setItems((prev) => [
        ...prev,
        { role: "system", text: JSON.stringify(data, null, 2).slice(0, 2000), source: action },
      ])
    } finally {
      setBusy(false)
    }
  }

  const LANE_IDS = ["focus", "build", "empathy", "defense", "creative", "comms", "crown"] as const

  const retuneLane = async (laneId: string) => {
    setSigmaBusy(true)
    try {
      const res = await fetch("/api/sigma-lane", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retune", laneId }),
      })
      const data = await res.json()
      if (data?.ok || data?.laneId) {
        const st = data.state || data
        setSigma({
          laneId: st.laneId || laneId,
          hzCombo: st.hzCombo,
          deltaT: st.deltaT ?? 0,
          coherence: st.coherence,
          path: st.path || "SYMBOLIC_FAST",
          symbolicCount: sigma?.symbolicCount,
          mode: st.lane?.mode,
        })
        setItems((prev) => [
          ...prev,
          {
            role: "system",
            text: `Sigma retune → ${laneId} · Δt=0 · ${st.hzCombo || ""} · HOLD_VYRNA_UNSYNC`,
            source: "sigma-lane",
          },
        ])
      }
      await boot()
    } finally {
      setSigmaBusy(false)
    }
  }

  const runSymbolicTask = async () => {
    if (!draft.trim() || sigmaBusy) return
    setSigmaBusy(true)
    try {
      const res = await fetch("/api/sigma-lane", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "orchestrate", task: draft.trim() }),
      })
      const data = await res.json()
      setItems((prev) => [
        ...prev,
        {
          role: "system",
          text: JSON.stringify(
            {
              path: data.path,
              laneId: data.laneId,
              hzCombo: data.hzCombo,
              deltaT: data.deltaT,
              plan: data.symbolicPlan,
              tokenHint: data.tokenFallbackHint,
            },
            null,
            2,
          ).slice(0, 2000),
          source: "sigma-orchestrate",
        },
      ])
      await boot()
    } finally {
      setSigmaBusy(false)
    }
  }

  return (
    <div className="hub-shell flex bg-black">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="DEV OPERATOR AI · learn/adapt · S3v3n / Twin" />
        <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 md:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" className="h-7 border-gray-600 bg-transparent font-mono text-[10px]" onClick={() => void boot()}>
              <RefreshCw className="mr-1 h-3 w-3" /> Status
            </Button>
            <Link href="/modules">
              <Button size="sm" variant="outline" className="h-7 border-cyan-800 bg-transparent font-mono text-[10px] text-cyan-300">
                <Package className="mr-1 h-3 w-3" /> Module Bay
              </Button>
            </Link>
            <Link href="/dimm-drive">
              <Button size="sm" variant="outline" className="h-7 border-violet-800 bg-transparent font-mono text-[10px] text-violet-300">
                <HardDrive className="mr-1 h-3 w-3" /> DIMM Drive
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              className="h-7 border-gray-600 bg-transparent font-mono text-[10px]"
              onClick={() => void quick("hive_status")}
            >
              <Radio className="mr-1 h-3 w-3" /> Hive
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 border-gray-600 bg-transparent font-mono text-[10px]"
              onClick={() =>
                void quick("create_module_stub", {
                  manifest: {
                    id: `ops-${Date.now().toString(36).slice(-4)}`,
                    name: "Ops Stub",
                    version: "0.1.0",
                    description: "Dev Operator generated stub (review before enabling).",
                    permissions: ["ui", "dev"],
                    route: "/modules",
                    enabled: true,
                    lattice_sync: false,
                  },
                })
              }
            >
              <FileCode className="mr-1 h-3 w-3" /> Stub module.json
            </Button>
            <Badge variant="outline" className="border-amber-500/40 text-amber-300">lattice_sync: false</Badge>
            {meta && (
              <span className="font-mono text-[10px] text-gray-500">
                modules:{meta.modules ?? "?"} peers:{meta.peers ?? 0}
              </span>
            )}
            {meta?.learn && (
              <Badge variant="outline" className="border-emerald-700/50 font-mono text-[9px] text-emerald-300">
                lessons:{meta.learn.lessons_count} intel:{meta.learn.intel_ingested} proposals:{meta.learn.proposals_accepted}
                {meta.learn.last_learn_at ? ` · last:${meta.learn.last_learn_at.slice(11, 19)}` : ""}
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-7 border-gray-600 bg-transparent font-mono text-[10px]"
              onClick={() => void quick("correction", { note: "Operator correction: prefer defensive modules + Privacy Fortress persist." })}
            >
              Teach correction
            </Button>
          </div>

          <div id="sigma-lane" className="scroll-mt-4">
            <TechPanel
              title="SIGMA LANE"
              subtitle="SYMBOLIC_FAST FIRST · FREQUENCY STATE MACHINE · HOLD_VYRNA_UNSYNC"
              cornerAccent
              borderAccent
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    sigma?.path === "TOKEN_FALLBACK"
                      ? "border-amber-500/50 font-mono text-[10px] text-amber-300"
                      : "border-emerald-500/50 font-mono text-[10px] text-emerald-300"
                  }
                >
                  {sigma?.path || "SYMBOLIC_FAST"}
                </Badge>
                <Badge variant="outline" className="border-cyan-700/50 font-mono text-[10px] text-cyan-300">
                  lane: {sigma?.laneId || "—"} {sigma?.mode ? `· ${sigma.mode}` : ""}
                </Badge>
                <Badge variant="outline" className="border-violet-700/50 font-mono text-[10px] text-violet-300">
                  {sigma?.hzCombo || "Hz —"}
                </Badge>
                <Badge variant="outline" className="border-gray-600 font-mono text-[10px] text-gray-300">
                  <Gauge className="mr-1 inline h-3 w-3" />
                  Δt={typeof sigma?.deltaT === "number" ? sigma.deltaT.toFixed(2) : "—"}
                  {typeof sigma?.coherence === "number" ? ` · coh=${sigma.coherence.toFixed(2)}` : ""}
                </Badge>
                <Badge variant="outline" className="border-gray-600 font-mono text-[10px] text-gray-400">
                  symbols: {sigma?.symbolicCount ?? 0}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    dimm?.mounted
                      ? "border-violet-500/50 font-mono text-[10px] text-violet-300"
                      : "border-gray-600 font-mono text-[10px] text-gray-500"
                  }
                >
                  <HardDrive className="mr-1 inline h-3 w-3" />
                  DIMM {dimm?.mounted ? dimm.backend || "on" : "off"}
                  {typeof dimm?.sigil === "number" ? ` · sigil:${dimm.sigil}` : ""}
                </Badge>
                <Badge variant="outline" className="border-amber-500/40 text-amber-300">
                  lattice_sync: false
                </Badge>
                <Badge variant="outline" className="border-amber-600/50 font-mono text-[10px] text-amber-300">
                  EchoNexus: {sigma?.echoNexusBadge || "PARTIAL"}
                </Badge>
              </div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  title={sigma?.hemispheres?.left?.meaning || "Left = OO objects"}
                  className={
                    sigma?.hemispheres?.left?.active
                      ? "border-sky-400/60 font-mono text-[10px] text-sky-200"
                      : "border-gray-700 font-mono text-[10px] text-gray-500"
                  }
                >
                  {sigma?.hemispheres?.left?.label || "LEFT · OO"}
                  {typeof sigma?.hemispheres?.left?.weight === "number"
                    ? ` · ${sigma.hemispheres.left.weight.toFixed(2)}`
                    : ""}
                </Badge>
                <Badge
                  variant="outline"
                  title={sigma?.hemispheres?.right?.meaning || "Right = conscious-field symbolic"}
                  className={
                    sigma?.hemispheres?.right?.active
                      ? "border-fuchsia-400/60 font-mono text-[10px] text-fuchsia-200"
                      : "border-gray-700 font-mono text-[10px] text-gray-500"
                  }
                >
                  {sigma?.hemispheres?.right?.label || "RIGHT · FIELD"}
                  {typeof sigma?.hemispheres?.right?.weight === "number"
                    ? ` · ${sigma.hemispheres.right.weight.toFixed(2)}`
                    : ""}
                </Badge>
                <Badge variant="outline" className="border-gray-600 font-mono text-[10px] text-gray-400">
                  dominant: {sigma?.hemispheres?.dominant || "—"}
                </Badge>
                <Badge variant="outline" className="border-emerald-800/50 font-mono text-[10px] text-emerald-300/90">
                  pulse φ {typeof sigma?.pulseMs === "number" ? `${sigma.pulseMs}ms` : "—"}
                </Badge>
                <span className="font-mono text-[9px] text-white/30">
                  Left=OO objects · Right=conscious-field symbolic · path=SYMBOLIC_FAST|TOKEN_FALLBACK
                </span>
              </div>
              <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-white/40">Retune lane</div>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {LANE_IDS.map((id) => (
                  <Button
                    key={id}
                    size="sm"
                    variant="outline"
                    disabled={sigmaBusy}
                    className={`h-7 font-mono text-[10px] ${
                      sigma?.laneId === id
                        ? "border-cyan-500 bg-cyan-950/40 text-cyan-200"
                        : "border-gray-700 bg-transparent text-gray-300"
                    }`}
                    onClick={() => void retuneLane(id)}
                  >
                    <Activity className="mr-1 h-3 w-3" />
                    {id}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={sigmaBusy || !draft.trim()}
                  className="h-7 border-emerald-800 bg-transparent font-mono text-[10px] text-emerald-300"
                  onClick={() => void runSymbolicTask()}
                >
                  Orchestrate symbolic
                </Button>
              </div>
              <p className="font-mono text-[10px] text-gray-500">
                Engineering state machine (not medical). EchoNexus 0.3.2 = glyph/symbolic pack reference only. Prefer
                SYMBOLIC_FAST; tokens only if language needed.
              </p>
            </TechPanel>
          </div>

                    <div id="train-lane" className="scroll-mt-4">
            <TechPanel
              title="TRAIN LANE"
              subtitle="TEACHER→STUDENTS · Σ3D-SYMTRAIN DRY-RUN · OMNIVERSE OPTIONAL"
              cornerAccent
              borderAccent
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-emerald-500/50 font-mono text-[10px] text-emerald-300">
                  <GraduationCap className="mr-1 inline h-3 w-3" />
                  Teacher: Dev Operator
                </Badge>
                <Badge variant="outline" className="border-violet-700/50 font-mono text-[10px] text-violet-300">
                  mesh: dry-run
                </Badge>
                <Badge variant="outline" className="border-gray-600 font-mono text-[10px] text-gray-400">
                  Omniverse: unavailable
                </Badge>
                <Badge variant="outline" className="border-red-900/50 font-mono text-[9px] text-red-300">
                  no burner accounts
                </Badge>
                <Link href="/symtrain" className="font-mono text-[10px] text-cyan-400 underline">
                  Open Train Lane
                </Link>
              </div>
              <p className="font-mono text-[10px] text-gray-500">
                After SYMBOLIC_FAST learn, Teacher auto-emits LessonPack to Axios / Heimdall / Twin / S3v3n panel.
                Free-tier peers = Module Bay plugins on Operator-owned accounts only. Perishable = jobs/pods, never accounts.
              </p>
            </TechPanel>
          </div>

          <TechPanel title="CHAT" subtitle="PRIVATE · NO PROMPT BODY TELEMETRY" cornerAccent borderAccent className="flex min-h-0 flex-1 flex-col">
            <div className="mb-3 max-h-[55vh] flex-1 space-y-3 overflow-auto pr-1">
              {items.map((it, i) => (
                <div
                  key={i}
                  className={`rounded border p-2 font-mono text-[12px] whitespace-pre-wrap ${
                    it.role === "user"
                      ? "border-cyan-900/50 bg-cyan-950/20 text-cyan-100"
                      : it.role === "system"
                        ? "border-gray-800 bg-black/40 text-gray-400"
                        : "border-white/10 bg-white/5 text-gray-200"
                  }`}
                >
                  <div className="mb-1 text-[9px] uppercase tracking-wider text-white/40">
                    {it.role}
                    {it.source ? ` · ${it.source}` : ""}
                  </div>
                  {it.text}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="flex gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    void send()
                  }
                }}
                placeholder="Ask for a module stub, hardening patch proposal, hive intel draft…"
                className="h-20 flex-1 rounded border border-gray-700 bg-black p-2 font-mono text-[12px] text-gray-200"
              />
              <Button disabled={busy || !draft.trim()} onClick={() => void send()} className="self-end font-mono text-[11px]">
                <Send className="mr-1 h-3.5 w-3.5" /> Send
              </Button>
            </div>
          </TechPanel>
        </div>
      </div>
    </div>
  )
}
