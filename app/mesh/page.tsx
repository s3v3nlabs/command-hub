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
  Shield,
  Radio,
  ExternalLink,
  Lock,
  Unlock,
  Activity,
  AlertTriangle,
} from "lucide-react"

type Provider = {
  id: string
  moduleId: string
  name: string
  docsUrl: string
  auth: string
  forbidsBurnerAccounts: boolean
  quotaHint: string
  roles: string[]
  tier: string
  status: string
  execution?: string
  envKeyHints: string[]
  envKeysPresent?: string[]
  notes: string
}

type QuotaEntry = {
  providerId: string
  remainingHours: number | null
  remainingCredits: number | null
  unitLabel: string
  updatedAt: string
  source: string
  notes?: string
}

type MeshPayload = {
  ok?: boolean
  providers?: Provider[]
  ledger?: { entries?: QuotaEntry[] }
  locks?: { seats?: string[]; recentJobs?: Array<{ id: string; providerId: string; status: string }> }
  forbidsBurnerAccounts?: boolean
  perishableMeans?: string
  hold?: string
  error?: string
}

function quotaValue(e?: QuotaEntry): number {
  if (!e) return 0
  if (e.remainingHours != null && Number.isFinite(e.remainingHours)) return Math.max(0, e.remainingHours)
  if (e.remainingCredits != null && Number.isFinite(e.remainingCredits)) return Math.max(0, e.remainingCredits)
  return 0
}

function quotaMax(e?: QuotaEntry): number {
  const v = quotaValue(e)
  if (v <= 0) return 40
  return Math.max(40, Math.ceil(v * 1.25))
}

export default function MeshPage() {
  const [data, setData] = useState<MeshPayload | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [edits, setEdits] = useState<Record<string, string>>({})

  const refresh = useCallback(async () => {
    const res = await fetch("/api/mesh", { cache: "no-store" })
      .then((r) => r.json())
      .catch(() => null)
    if (res) setData(res)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function post(action: string, extra?: Record<string, unknown>) {
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch("/api/mesh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.status === 403) {
        setMsg(`403 FORBIDDEN: ${json.reason || json.error || "burner/identity abuse blocked"}`)
      } else if (!res.ok || json.ok === false) {
        setMsg(json.error || json.reason || `HTTP ${res.status}`)
      } else {
        setMsg(
          action === "scheduleJob"
            ? `${json.job?.status || "ok"} · ${json.job?.destroyReminder || "destroy job when idle"}`
            : action === "assimilate"
              ? `assimilated lesson ${json.lessonId || "—"}`
              : action === "dryRun"
                ? `dry-run → ${json.job?.providerId || "—"} (${json.job?.role || ""})`
                : "ok",
        )
      }
      await refresh()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "request failed")
    } finally {
      setBusy(false)
    }
  }

  const entries = data?.ledger?.entries || []
  const locked = new Set(data?.locks?.seats || [])

  return (
    <div className="flex min-h-screen bg-black text-gray-100">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header title="GPU Mesh Hub" subtitle="Operator-owned seats · rotate jobs not identities" />
        <div className="flex-1 space-y-4 overflow-auto p-4 md:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-amber-700/80 font-mono text-[10px] text-amber-50">
              MODE: DRY-RUN · scheduleJob = noop-awaiting-creds
            </Badge>
            <Badge variant="outline" className="border-amber-600/60 font-mono text-[10px] text-amber-300">
              providers: STUB (no GPU keys)
            </Badge>
            <Badge variant="outline" className="border-emerald-700/50 font-mono text-[10px] text-emerald-300">
              <Shield className="mr-1 inline h-3 w-3" />
              Auth = your account
            </Badge>
            <Badge variant="outline" className="border-amber-700/50 font-mono text-[10px] text-amber-300">
              <AlertTriangle className="mr-1 inline h-3 w-3" />
              forbidsBurnerAccounts
            </Badge>
            <Badge variant="outline" className="border-violet-700/50 font-mono text-[10px] text-violet-300">
              {data?.hold || "HOLD_VYRNA_UNSYNC"}
            </Badge>
            <Badge variant="outline" className="border-gray-600 font-mono text-[10px] text-gray-400">
              lattice_sync: false
            </Badge>
            <Button
              size="sm"
              variant="outline"
              className="ml-auto font-mono text-[10px]"
              disabled={busy}
              onClick={() => void refresh()}
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              Refresh
            </Button>
          </div>

          <TechPanel title="POLICY" subtitle="Perishable = pods/jobs · never identities" cornerAccent>
            <p className="font-mono text-[11px] text-gray-400">
              {data?.perishableMeans ||
                "Ephemeral pods/jobs — never identities. No burner farms, CAPTCHA solvers, or multi-account quota evasion."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/command-hub" className="font-mono text-[10px] text-cyan-400 hover:underline">
                Command Hub
              </Link>
              <span className="text-gray-600">·</span>
              <Link href="/modules" className="font-mono text-[10px] text-cyan-400 hover:underline">
                Module Bay
              </Link>
              <span className="text-gray-600">·</span>
              <Link href="/dimm-drive" className="font-mono text-[10px] text-cyan-400 hover:underline">
                DIMM Drive
              </Link>
              <span className="text-gray-600">·</span>
              <Link href="/symtrain" className="font-mono text-[10px] text-cyan-400 hover:underline">
                Symtrain / LoRA train-lane
              </Link>
              <span className="text-gray-600">·</span>
              <Link href="/docs/MESH_EFFICIENCY.md" className="font-mono text-[10px] text-cyan-400 hover:underline">
                MESH_EFFICIENCY.md
              </Link>
              <span className="text-gray-600">·</span>
              <span className="font-mono text-[10px] text-gray-500" title="path cite">
                docs/GPU_MESH.md · docs/WHISPERMESH_PROXY_LORA.md
              </span>
            </div>
            <div className="mt-3 rounded border border-amber-900/40 bg-amber-950/20 px-2 py-2 font-mono text-[10px] text-amber-100/90">
              <Badge className="mb-1 bg-amber-700/80 text-[9px] text-amber-50">LoRA: DRY-RUN / STUB</Badge>
              <p>
                Mesh LoRA = SYMTRAIN/DIMM fine-tune lane — <strong>not</strong> WhisperMesh protocol.
                No live LoRA training from this hub until Operator GPU keys. Proxy-chain egress ≠ LoRA.
              </p>
              <Link href="/symtrain" className="mt-1 inline-block text-cyan-400 underline">
                Open Train Lane stub →
              </Link>
            </div>
            {msg && (
              <p className="mt-2 whitespace-pre-wrap font-mono text-[10px] text-amber-200/90">{msg}</p>
            )}
          </TechPanel>

          <TechPanel title="QUICK ACTIONS" subtitle="dryRun · scheduleJob (noop until creds) · assimilate" cornerAccent>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="font-mono text-[10px]"
                disabled={busy}
                onClick={() => void post("dryRun", { role: "train" })}
              >
                <Activity className="mr-1 h-3 w-3" />
                Dry-run train
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="font-mono text-[10px]"
                disabled={busy}
                onClick={() => void post("scheduleJob", { role: "reason", title: "mesh plan stub" })}
              >
                <Radio className="mr-1 h-3 w-3" />
                Schedule (noop)
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="font-mono text-[10px]"
                disabled={busy}
                onClick={() =>
                  void post("assimilate", {
                    providerId: "kaggle",
                    role: "train",
                    title: "Mesh assimilate stub",
                    summary: "Operator-owned seat output → Teacher lesson bus",
                  })
                }
              >
                Assimilate → train
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="font-mono text-[10px]"
                disabled={busy}
                onClick={() => void post("createBurner", { note: "should 403" })}
              >
                Test forbid createBurner
              </Button>
            </div>
          </TechPanel>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(data?.providers || []).map((p) => {
              const entry = entries.find((e) => e.providerId === p.id)
              const val = quotaValue(entry)
              const max = quotaMax(entry)
              const pct = Math.min(100, Math.round((val / max) * 100))
              const isLocked = locked.has(p.id)
              return (
                <TechPanel
                  key={p.id}
                  title={p.name}
                  subtitle={`${p.tier} · ${p.roles.join("/")}`}
                  cornerAccent
                >
                  <div className="mb-2 flex flex-wrap gap-1">
                    <Badge variant="outline" className="border-emerald-700/40 font-mono text-[9px] text-emerald-300">
                      Auth = your account
                    </Badge>
                    <Badge variant="outline" className="border-gray-600 font-mono text-[9px] text-gray-400">
                      STUB · {p.execution || "noop"} · {p.status}
                    </Badge>
                    {isLocked ? (
                      <Badge variant="outline" className="border-amber-600/50 font-mono text-[9px] text-amber-300">
                        <Lock className="mr-1 inline h-2.5 w-2.5" />
                        combo-lock
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-gray-700 font-mono text-[9px] text-gray-500">
                        <Unlock className="mr-1 inline h-2.5 w-2.5" />
                        open
                      </Badge>
                    )}
                  </div>

                  <p className="mb-2 font-mono text-[10px] text-gray-500">{p.quotaHint}</p>

                  <div className="mb-1 flex justify-between font-mono text-[9px] text-gray-500">
                    <span>remaining {entry?.unitLabel || "units"}</span>
                    <span>
                      {val}
                      {entry?.unitLabel === "credits" ? " cr" : " h"}
                    </span>
                  </div>
                  <div className="mb-3 h-2 overflow-hidden rounded bg-gray-900">
                    <div
                      className="h-full rounded bg-gradient-to-r from-cyan-700 to-emerald-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="mb-2 flex gap-2">
                    <input
                      className="w-full rounded border border-gray-800 bg-black px-2 py-1 font-mono text-[10px] text-gray-200"
                      placeholder={`edit ${entry?.unitLabel || "quota"}`}
                      value={edits[p.id] ?? ""}
                      onChange={(ev) => setEdits((s) => ({ ...s, [p.id]: ev.target.value }))}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 font-mono text-[9px]"
                      disabled={busy || edits[p.id] === undefined || edits[p.id] === ""}
                      onClick={() => {
                        const n = Number(edits[p.id])
                        if (!Number.isFinite(n)) {
                          setMsg("quota must be a number")
                          return
                        }
                        const isCredits = entry?.unitLabel === "credits"
                        void post("updateQuota", {
                          providerId: p.id,
                          ...(isCredits ? { remainingCredits: n } : { remainingHours: n }),
                        })
                      }}
                    >
                      Save
                    </Button>
                  </div>

                  <p className="mb-2 font-mono text-[9px] text-gray-600">{p.notes}</p>
                  <p className="mb-2 font-mono text-[9px] text-amber-200/70">
                    Destroy job/pod when idle — keep the Operator identity.
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="font-mono text-[9px]"
                      disabled={busy}
                      onClick={() => void post("dryRun", { providerId: p.id, role: p.roles[0] || "train" })}
                    >
                      dryRun
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="font-mono text-[9px]"
                      disabled={busy}
                      onClick={() =>
                        void post("scheduleJob", {
                          providerId: p.id,
                          role: p.roles[0] || "train",
                          title: `plan ${p.id}`,
                        })
                      }
                    >
                      scheduleJob
                    </Button>
                    {isLocked && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="font-mono text-[9px]"
                        disabled={busy}
                        onClick={() => void post("releaseLock", { providerId: p.id })}
                      >
                        releaseLock
                      </Button>
                    )}
                    <a
                      href={p.docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center font-mono text-[9px] text-cyan-400 hover:underline"
                    >
                      <ExternalLink className="mr-1 h-3 w-3" />
                      docs
                    </a>
                    <Link href="/modules" className="font-mono text-[9px] text-cyan-400 hover:underline">
                      {p.moduleId}
                    </Link>
                  </div>

                  {(p.envKeysPresent?.length || 0) > 0 ? (
                    <p className="mt-2 font-mono text-[9px] text-emerald-500/80">
                      env present: {p.envKeysPresent!.join(", ")} (names only)
                    </p>
                  ) : (
                    <p className="mt-2 font-mono text-[9px] text-gray-600">
                      env creds: none (scheduleJob = noop-awaiting-creds)
                    </p>
                  )}
                </TechPanel>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
