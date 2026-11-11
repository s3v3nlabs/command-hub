"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { TechPanel } from "@/components/ui/tech-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GraduationCap, RefreshCw, Play, Users, Activity, Box, Cpu } from "lucide-react"

type SymStatus = {
  ok?: boolean
  name?: string
  teacher?: { id: string; label: string }
  teacherId?: string
  roster?: {
    students: Array<{
      studentId: string
      lastLessonId: string | null
      lastAppliedAt: string | null
      applyCount: number
      lastScore?: number
      onlineHint: string
    }>
    lastStrainScores: Record<string, number>
  }
  lastLessons?: Array<{ id: string; title: string; modality: string; createdAt: string; source?: string }>
  lastStrainScores?: Record<string, number>
  omniverse?: { available: boolean; status: string; reason?: string }
  mesh?: string
  dimmPath?: string
  enginesTrainerPresent?: boolean
  quotaMesh?: { operatorOwnedOnly: boolean; burnerAccountsForbidden: boolean; perishableMeans: string }
  freeTierPlugins?: Array<{ id: string; provider: string; moduleBay: string }>
}

export default function SymtrainPage() {
  const [status, setStatus] = useState<SymStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [log, setLog] = useState<string[]>([])

  const pushLog = (line: string) => setLog((prev) => [line, ...prev].slice(0, 12))

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/symtrain", { cache: "no-store" })
      setStatus((await res.json()) as SymStatus)
    } catch (e) {
      pushLog(e instanceof Error ? e.message : "refresh failed")
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const post = async (action: string, body: Record<string, unknown> = {}) => {
    setBusy(true)
    try {
      const res = await fetch("/api/symtrain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      })
      const data = await res.json()
      const id = data.lessonId || data.pack?.id
      pushLog(
        `${action}: ${data.ok === false ? data.error || "fail" : "ok"}` +
          (id ? ` · ${String(id).slice(0, 8)}` : "") +
          (data.strain?.average != null ? ` · avg=${data.strain.average}` : "") +
          (data.assimilated ? ` · assimilated` : ""),
      )
      await refresh()
    } catch (e) {
      pushLog(e instanceof Error ? e.message : "post failed")
    } finally {
      setBusy(false)
    }
  }

  const scores = status?.roster?.lastStrainScores || status?.lastStrainScores || {}

  return (
    <div className="hub-shell flex bg-black text-dark-800">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="Σ3D-SYMTRAIN — TRAIN LANE" />
        <div className="flex flex-wrap items-center gap-2 border-b border-dark-300/40 bg-dark-100/40 px-6 py-2">
          <Badge variant="outline" className="font-mono text-xs border-cyan-500/40 text-cyan-300">/symtrain</Badge>
          <Badge variant="outline" className="font-mono text-xs border-amber-500/40 text-amber-300">HOLD_VYRNA_UNSYNC</Badge>
          <Badge className="bg-amber-700/80 font-mono text-[10px] text-amber-50">MODE: DRY-RUN</Badge>
          <Badge variant="outline" className="font-mono text-xs border-amber-600/50 text-amber-300">Omniverse: STUB</Badge>
          <Badge variant="outline" className="font-mono text-xs border-violet-500/40 text-violet-300">mesh: {status?.mesh || "dry-run"}</Badge>
          <Badge variant="outline" className="font-mono text-xs border-gray-600 text-gray-400">Omniverse: {status?.omniverse?.status || "unavailable"}</Badge>
          <Badge variant="outline" className="font-mono text-xs border-emerald-700/50 text-emerald-300">Teacher: {status?.teacher?.label || "Dev Operator"}</Badge>
          <Badge variant="outline" className="font-mono text-xs border-red-800/50 text-red-300">no burner accounts</Badge>
          <Link href="/dev-operator" className="font-mono text-[10px] text-cyan-400 underline">Dev Operator</Link>
          <Link href="/modules" className="font-mono text-[10px] text-cyan-400 underline">Module Bay</Link>
          <Button size="sm" variant="outline" className="ml-auto h-7 font-mono text-[10px]" onClick={() => void refresh()} disabled={busy}>
            <RefreshCw className="mr-1 h-3 w-3" /> Refresh
          </Button>
        </div>

        <div className="flex-1 space-y-4 overflow-auto p-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <TechPanel title="TEACHER → STUDENTS" subtitle="DEFAULT TEACHER = DEV OPERATOR · ADD-ONLY" cornerAccent borderAccent>
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="border-emerald-500/50 font-mono text-[10px] text-emerald-300">
                  <GraduationCap className="mr-1 inline h-3 w-3" />
                  {status?.teacher?.label || "Dev Operator"}
                </Badge>
                <Badge variant="outline" className="border-gray-600 font-mono text-[10px] text-gray-400">lattice_sync: false</Badge>
              </div>
              <div className="mb-3 space-y-1.5">
                {(status?.roster?.students || []).map((s) => (
                  <div key={s.studentId} className="flex flex-wrap items-center gap-2 rounded border border-gray-800 bg-black/40 px-2 py-1.5 font-mono text-[11px]">
                    <Users className="h-3 w-3 text-cyan-400" />
                    <span className="text-cyan-200">{s.studentId}</span>
                    <span className="text-gray-500">applies:{s.applyCount}</span>
                    <span className="max-w-[140px] truncate text-gray-500">last:{s.lastLessonId ? s.lastLessonId.slice(0, 8) : "—"}</span>
                    {(typeof s.lastScore === "number" || scores[s.studentId] != null) && (
                      <Badge variant="outline" className="border-violet-700/50 text-[9px] text-violet-300">
                        score:{s.lastScore ?? scores[s.studentId]}
                      </Badge>
                    )}
                    <Badge variant="outline" className="border-gray-700 text-[9px] text-gray-500">{s.onlineHint}</Badge>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={busy} className="h-7 border-emerald-800 font-mono text-[10px] text-emerald-300"
                  onClick={() => void post("emitLesson", { title: "Operator train pulse", summary: "Manual Teacher emit: reclaim UI posture + symbolic prefer. Defense only.", autoPush: true, modality: "symbolic" })}>
                  <Play className="mr-1 h-3 w-3" /> Emit + push
                </Button>
                <Button size="sm" variant="outline" disabled={busy || !status?.lastLessons?.[0]?.id} className="h-7 font-mono text-[10px]"
                  onClick={() => void post("pushLessonToStudents", { lessonId: status?.lastLessons?.[0]?.id })}>
                  Push last lesson
                </Button>
                <Button size="sm" variant="outline" disabled={busy} className="h-7 font-mono text-[10px]"
                  onClick={() => void post("setTeacher", { teacherId: "dev-operator" })}>
                  Set Teacher = Dev Operator
                </Button>
              </div>
            </TechPanel>

            <TechPanel title="SYMTRAIN DRY-RUN + QUOTA MESH" subtitle="OPERATOR-OWNED ACCOUNTS ONLY · JOBS/PODS PERISHABLE · NO BURNER ACCOUNTS" cornerAccent borderAccent>
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="border-amber-600/50 font-mono text-[10px] text-amber-300">
                  <Box className="mr-1 inline h-3 w-3" /> Omniverse: {status?.omniverse?.status || "unavailable"}
                </Badge>
                <Badge variant="outline" className="border-gray-600 font-mono text-[10px] text-gray-400">mesh: dry-run</Badge>
                <Badge variant="outline" className="border-gray-600 font-mono text-[10px] text-gray-400">
                  trainer: {status?.enginesTrainerPresent ? "present" : "TS fallback"}
                </Badge>
              </div>
              <p className="mb-2 font-mono text-[10px] text-gray-500">{status?.omniverse?.reason || "Stub until SDK/license."}</p>
              <p className="mb-2 font-mono text-[10px] text-gray-500">DIMM: {status?.dimmPath || "—"}</p>
              <p className="mb-3 font-mono text-[10px] text-red-300/80">
                HARD FORBID: burner / trashable / perishable ACCOUNT farming. Perishable = jobs/pods only. Free-tier peers = Module Bay plugins on Operator-owned accounts.
              </p>
              <div className="mb-3 flex flex-wrap gap-1">
                {(status?.freeTierPlugins || []).map((p) => (
                  <Badge key={p.id} variant="outline" className="border-cyan-900/50 font-mono text-[9px] text-cyan-400">
                    {p.provider} → {p.moduleBay}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={busy} className="h-7 border-cyan-800 font-mono text-[10px] text-cyan-300"
                  onClick={() => void post("dryRunTrain", { title: "Hub dry-run train", modality: "symbolic" })}>
                  <Activity className="mr-1 h-3 w-3" /> dryRunTrain
                </Button>
                <Button size="sm" variant="outline" disabled={busy} className="h-7 font-mono text-[10px]"
                  onClick={() => void post("assimilateJob", { provider: "local-dry-run", summary: "Dry-run job output assimilated into Teacher lesson.", jobId: "local-demo" })}>
                  Assimilate job (demo)
                </Button>
                <Button size="sm" variant="outline" disabled={busy} className="h-7 font-mono text-[10px]"
                  onClick={() => void post("strain", { mode: "symbolic_miss_drill" })}>Strain: miss drill</Button>
                <Button size="sm" variant="outline" disabled={busy} className="h-7 font-mono text-[10px]"
                  onClick={() => void post("strain", { mode: "drift_inject_retune" })}>Strain: drift retune</Button>
                <Button size="sm" variant="outline" disabled={busy} className="h-7 font-mono text-[10px]"
                  onClick={() => void post("strain", { mode: "adversarial_reclaim_quiz" })}>Strain: reclaim quiz</Button>
                <Button size="sm" variant="outline" disabled={busy} className="h-7 font-mono text-[10px]"
                  onClick={() => void post("strain", { mode: "pulse_pink_brown" })}>Strain: pink/brown</Button>
              </div>
            </TechPanel>
          </div>

          <TechPanel title="RECENT LESSONS" subtitle="PRIVACY FORTRESS WHEN PERSIST ON · NO BODY TELEMETRY">
            <div className="space-y-1.5">
              {(status?.lastLessons || []).length === 0 && (
                <p className="font-mono text-[11px] text-gray-500">No lessons yet — run dryRunTrain or Emit.</p>
              )}
              {(status?.lastLessons || []).map((l) => (
                <div key={l.id} className="rounded border border-gray-800 bg-black/30 px-2 py-1.5 font-mono text-[11px] text-gray-300">
                  <span className="text-cyan-300">{l.title}</span>
                  <span className="text-gray-500"> · {l.modality}</span>
                  <span className="text-gray-600"> · {l.source || "—"}</span>
                  <span className="text-gray-600"> · {l.id.slice(0, 8)}</span>
                </div>
              ))}
            </div>
          </TechPanel>

          <TechPanel
            title="MESH LoRA TRAIN-LANE"
            subtitle="DRY-RUN / STUB · NOT WHISPERMESH PROTOCOL · NO LIVE FINE-TUNE"
            cornerAccent
            borderAccent
          >
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge className="bg-amber-700/80 font-mono text-[10px] text-amber-50">DRY-RUN</Badge>
              <Badge variant="outline" className="border-amber-600/50 font-mono text-[10px] text-amber-300">
                <Cpu className="mr-1 inline h-3 w-3" />
                LoRA: STUB
              </Badge>
              <Badge variant="outline" className="border-gray-600 font-mono text-[10px] text-gray-400">
                lattice_sync: false
              </Badge>
              <Badge variant="outline" className="border-violet-700/50 font-mono text-[10px] text-violet-300">
                WhisperMesh may route later
              </Badge>
            </div>
            <p className="mb-2 font-mono text-[11px] text-gray-400">
              Mesh <strong className="text-gray-300">LoRA</strong> is SYMTRAIN / DIMM / GPU-seat{" "}
              <em>model fine-tune</em> design — not WhisperMesh networking / whisper bus.
              This hub surface is honest stub only: no live GPU fine-tune, no fake training progress.
            </p>
            <p className="mb-3 font-mono text-[10px] text-gray-500">
              Use <code className="text-cyan-400">dryRunTrain</code> above for symbolic lessons under DIMM.
              Real LoRA waits on Operator GPU keys / peers (see GPU_MESH).
            </p>
            <div className="flex flex-wrap gap-3 font-mono text-[10px]">
              <Link href="/mesh" className="text-cyan-400 underline">
                /mesh GPU hub
              </Link>
              <span className="text-gray-600">·</span>
              <Link href="/dimm-drive" className="text-cyan-400 underline">
                /dimm-drive
              </Link>
              <span className="text-gray-600">·</span>
              <span className="text-gray-500" title="path cite">
                docs/SYMTRAIN.md
              </span>
              <span className="text-gray-600">·</span>
              <span className="text-gray-500" title="path cite">
                docs/GPU_MESH.md
              </span>
              <span className="text-gray-600">·</span>
              <span className="text-gray-500" title="path cite">
                docs/WHISPERMESH_PROXY_LORA.md
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              className="mt-3 h-7 border-amber-800 font-mono text-[10px] text-amber-200"
              onClick={() => void post("dryRunTrain", { title: "LoRA train-lane stub pulse", modality: "symbolic", source: "lora-stub" })}
            >
              <Activity className="mr-1 h-3 w-3" />
              LoRA stub → dryRunTrain (symbolic only)
            </Button>
          </TechPanel>

          <TechPanel title="ACTION LOG" subtitle="IDS ONLY · NO SECRETS">
            <div className="max-h-40 space-y-1 overflow-auto font-mono text-[10px] text-gray-400">
              {log.length === 0 && <p>Ready.</p>}
              {log.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          </TechPanel>
        </div>
      </div>
    </div>
  )
}
