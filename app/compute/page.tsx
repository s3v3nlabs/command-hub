"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  Activity,
  Cpu,
  Gauge,
  RefreshCw,
  Server,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Circle,
  XCircle,
  Play,
  Ban,
  Flame,
  BookOpen,
  HardDrive,
} from "lucide-react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

type BackendState = {
  health: string
  inFlight: number
  totalRequests: number
  totalErrors: number
  ewmaLatencyMs: number | null
  lastLatencyMs: number | null
  models: string[]
  warmed: boolean
  lastError: string | null
  circuitOpenedAt: number | null
}

type Backend = {
  id: string
  kind: string
  baseUrl: string
  label: string
  maxConcurrency: number
  costWeight: number
  defaultModel?: string
  apiKeyPresent: boolean
  state: BackendState
}

type Job = {
  id: string
  kind: string
  label: string
  status: string
  createdAt: number
  progress: number
  error: string | null
  backendId: string | null
}

type Perf = {
  id: string
  title: string
  hubControl: string
  enabled?: boolean
  summary: string
  guidance: string[]
  appliesTo: string[]
}

type Pool = {
  ok?: boolean
  backends: Backend[]
  reachableCount: number
  configuredCount: number
  policy: string
  degradation: string
  jobs: { queued: number; running: number; concurrency: number; recent: Job[] }
  metrics: {
    requestsTotal: number
    errorsTotal: number
    avgLatencyMs: number | null
    p95LatencyMs: number | null
    throughputPerMin: number
  }
  performance: Perf[]
}

function healthIcon(h: string) {
  if (h === "healthy") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
  if (h === "degraded") return <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
  if (h === "circuit-open") return <Ban className="h-3.5 w-3.5 text-rose-400" />
  if (h === "down") return <XCircle className="h-3.5 w-3.5 text-rose-500" />
  return <Circle className="h-3.5 w-3.5 text-zinc-500" />
}

function statusBadge(s: string) {
  const color =
    s === "succeeded"
      ? "text-emerald-400 border-emerald-500/40"
      : s === "failed" || s === "cancelled"
        ? "text-rose-400 border-rose-500/40"
        : s === "running"
          ? "text-sky-400 border-sky-500/40"
          : "text-zinc-400 border-zinc-600"
  return (
    <span className={`rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${color}`}>
      {s}
    </span>
  )
}

export default function ComputePage() {
  const [pool, setPool] = useState<Pool | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [prompt, setPrompt] = useState("Say OK in one word.")
  const [chatOut, setChatOut] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/compute", { cache: "no-store" })
      const j = (await r.json()) as Pool
      setPool(j)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e))
    }
  }, [])

  useEffect(() => {
    void refresh()
    const t = setInterval(() => void refresh(), 5000)
    return () => clearInterval(t)
  }, [refresh])

  async function post(body: Record<string, unknown>) {
    setBusy(true)
    setMsg(null)
    try {
      const r = await fetch("/api/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const j = await r.json()
      if (!r.ok || j.ok === false) {
        setMsg(j.error || j.detail || `HTTP ${r.status}`)
      } else if (body.action === "chat") {
        setChatOut(j.text || j.error || "(empty)")
        setMsg(j.ok ? `via ${j.backendId} · ${j.latencyMs}ms · ${j.policy}` : j.error)
      } else {
        setMsg(JSON.stringify(j).slice(0, 240))
      }
      await refresh()
      return j
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="hub-shell flex bg-black text-[color:var(--ghost-ink)]">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="Compute / AI Acceleration" />
        <main className="hub-shell-scroll ghost-grid-bg min-h-0 flex-1 overflow-auto p-4 space-y-4">
          {/* Honest banner */}
          <div className="rounded border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-100/90">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div>
                <p className="font-medium text-amber-200">Real speedups only — no fake acceleration claims.</p>
                <p className="mt-1 text-xs text-amber-100/70">
                  This module does multi-backend routing (RunPod chaining), bounded job parallelism (TS async +
                  worker_threads — not Kotlin coroutines), warm-pool, speculative race, and circuit-breaker failover.
                  Quantization, GPU offload, KV-cache, and continuous batching live on the model server — documented
                  below, not pretended as hub toggles. There is no &quot;virtualized RAM → extra compute&quot; or
                  &quot;virtual CPU AI brain&quot;. Tiered memory ={" "}
                  <Link href="/dimm-drive" className="underline text-amber-200">
                    DIMM Drive
                  </Link>{" "}
                  + picking a model that fits RAM. See{" "}
                  <Link href="/help" className="underline text-amber-200">
                    docs/COMPUTE.md
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>

          {/* Status strip */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void refresh()}
              className="ghost-btn inline-flex items-center gap-1.5"
              disabled={busy}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => void post({ action: "health" })}
              className="ghost-btn inline-flex items-center gap-1.5"
              disabled={busy}
            >
              <Activity className="h-3.5 w-3.5" />
              Re-probe
            </button>
            <button
              type="button"
              onClick={() => void post({ action: "warm" })}
              className="ghost-btn inline-flex items-center gap-1.5"
              disabled={busy}
            >
              <Flame className="h-3.5 w-3.5" />
              Warm pool
            </button>
            <Link href="/dimm-drive" className="ghost-btn inline-flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5" />
              DIMM Drive
            </Link>
            <Link href="/dev-operator" className="ghost-btn inline-flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5" />
              Dev Operator
            </Link>
            {pool && (
              <span className="ml-auto text-xs text-zinc-400">
                {pool.reachableCount}/{pool.configuredCount} backends · policy{" "}
                <span className="text-zinc-200">{pool.policy}</span> · {pool.degradation}
              </span>
            )}
          </div>
          {msg && (
            <div className="rounded border border-[color:var(--ghost-line)] bg-black/60 px-3 py-2 text-xs text-zinc-300 font-mono">
              {msg}
            </div>
          )}

          {/* Metrics */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Requests",
                value: pool?.metrics.requestsTotal ?? "—",
                icon: Gauge,
              },
              {
                label: "Avg latency",
                value: pool?.metrics.avgLatencyMs != null ? `${pool.metrics.avgLatencyMs} ms` : "—",
                icon: Activity,
              },
              {
                label: "p95 latency",
                value: pool?.metrics.p95LatencyMs != null ? `${pool.metrics.p95LatencyMs} ms` : "—",
                icon: Zap,
              },
              {
                label: "Throughput / min",
                value: pool?.metrics.throughputPerMin ?? "—",
                icon: Server,
              },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded border border-[color:var(--ghost-line)] bg-black/50 p-3"
              >
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <m.icon className="h-3.5 w-3.5" />
                  {m.label}
                </div>
                <div className="mt-1 text-lg font-semibold text-zinc-100">{m.value}</div>
              </div>
            ))}
          </div>

          {/* Backend pool */}
          <section className="rounded border border-[color:var(--ghost-line)] bg-black/40">
            <header className="flex items-center gap-2 border-b border-[color:var(--ghost-line)] px-3 py-2">
              <Server className="h-4 w-4 text-sky-400" />
              <h2 className="text-sm font-semibold">Backend pool</h2>
              <span className="text-[10px] text-zinc-500">RunPod chaining · failover · concurrency caps</span>
            </header>
            <div className="divide-y divide-[color:var(--ghost-line)]">
              {(pool?.backends || []).length === 0 && (
                <div className="p-4 text-sm text-zinc-400">
                  No backends configured. Set <code className="text-zinc-200">LOCAL_LLM_BASE_URL</code> /
                  <code className="text-zinc-200"> OLLAMA_BASE_URL</code> or{" "}
                  <code className="text-zinc-200">COMPUTE_BACKENDS</code>. Default probe target is{" "}
                  <code className="text-zinc-200">http://127.0.0.1:11434</code>.
                </div>
              )}
              {(pool?.backends || []).map((b) => (
                <div key={b.id} className="grid gap-2 p-3 sm:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {healthIcon(b.state.health)}
                      <span className="font-medium text-zinc-100">{b.label}</span>
                      <span className="rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] uppercase text-zinc-400">
                        {b.kind}
                      </span>
                      <span className="rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-400">
                        {b.state.health}
                      </span>
                      {b.state.warmed && (
                        <span className="rounded border border-amber-500/40 px-1.5 py-0.5 text-[10px] text-amber-300">
                          warmed
                        </span>
                      )}
                      {!b.apiKeyPresent && b.kind !== "ollama" && (
                        <span className="rounded border border-rose-500/40 px-1.5 py-0.5 text-[10px] text-rose-300">
                          api key missing
                        </span>
                      )}
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-zinc-500">{b.baseUrl}</div>
                    <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-zinc-400">
                      <span>
                        in-flight {b.state.inFlight}/{b.maxConcurrency}
                      </span>
                      <span>reqs {b.state.totalRequests}</span>
                      <span>err {b.state.totalErrors}</span>
                      <span>cost×{b.costWeight}</span>
                      <span>
                        ewma{" "}
                        {b.state.ewmaLatencyMs != null ? `${Math.round(b.state.ewmaLatencyMs)}ms` : "—"}
                      </span>
                      {b.defaultModel && <span>model {b.defaultModel}</span>}
                    </div>
                    {b.state.models.length > 0 && (
                      <div className="mt-1 text-[11px] text-zinc-500">
                        models: {b.state.models.slice(0, 8).join(", ")}
                        {b.state.models.length > 8 ? "…" : ""}
                      </div>
                    )}
                    {b.state.lastError && (
                      <div className="mt-1 text-[11px] text-rose-400/80">{b.state.lastError}</div>
                    )}
                  </div>
                  <div className="flex items-start gap-1">
                    <button
                      type="button"
                      className="ghost-btn text-[11px]"
                      disabled={busy}
                      onClick={() => void post({ action: "warm", backendId: b.id })}
                    >
                      Warm
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick chat + policy */}
          <div className="grid gap-3 lg:grid-cols-2">
            <section className="rounded border border-[color:var(--ghost-line)] bg-black/40 p-3 space-y-2">
              <header className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-violet-400" />
                <h2 className="text-sm font-semibold">Route a chat (pool)</h2>
              </header>
              <textarea
                className="w-full rounded border border-zinc-700 bg-black/60 p-2 text-sm text-zinc-100"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="ghost-btn inline-flex items-center gap-1.5"
                  disabled={busy || !prompt.trim()}
                  onClick={() => void post({ action: "chat", prompt })}
                >
                  <Play className="h-3.5 w-3.5" />
                  Send via pool
                </button>
                <button
                  type="button"
                  className="ghost-btn inline-flex items-center gap-1.5"
                  disabled={busy || !prompt.trim()}
                  onClick={() => void post({ action: "chat", prompt, policy: "speculative", speculativeCount: 2 })}
                >
                  <Flame className="h-3.5 w-3.5" />
                  Speculative race
                </button>
              </div>
              {chatOut && (
                <pre className="max-h-40 overflow-auto rounded border border-zinc-800 bg-black/70 p-2 text-xs text-zinc-300 whitespace-pre-wrap">
                  {chatOut}
                </pre>
              )}
            </section>

            <section className="rounded border border-[color:var(--ghost-line)] bg-black/40 p-3 space-y-2">
              <header className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-semibold">Router policy</h2>
              </header>
              <div className="flex flex-wrap gap-1.5">
                {(["least-loaded", "latency-aware", "cost-aware", "round-robin", "speculative"] as const).map(
                  (p) => (
                    <button
                      key={p}
                      type="button"
                      className={`ghost-btn text-[11px] ${pool?.policy === p ? "border-emerald-500/50 text-emerald-300" : ""}`}
                      disabled={busy}
                      onClick={() => void post({ action: "set", policy: p })}
                    >
                      {p}
                    </button>
                  ),
                )}
              </div>
              <p className="text-[11px] text-zinc-500">
                cost-aware prefers local Ollama over RunPod. speculative races healthy backends for
                lowest-latency-wins. Circuit breaker auto-sheds failed backends for 30s.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  className="ghost-btn text-[11px]"
                  disabled={busy}
                  onClick={() =>
                    void post({
                      action: "submit_job",
                      kind: "cpu-bound",
                      label: "SHA-256 worker demo",
                      payload: { input: "singular-ty", rounds: 25000 },
                    })
                  }
                >
                  Enqueue CPU worker job
                </button>
                <button
                  type="button"
                  className="ghost-btn text-[11px]"
                  disabled={busy}
                  onClick={() =>
                    void post({
                      action: "submit_job",
                      kind: "chat",
                      label: "Pool chat job",
                      payload: { prompt: "Reply with the single word READY." },
                    })
                  }
                >
                  Enqueue chat job
                </button>
              </div>
            </section>
          </div>

          {/* Job queue */}
          <section className="rounded border border-[color:var(--ghost-line)] bg-black/40">
            <header className="flex items-center gap-2 border-b border-[color:var(--ghost-line)] px-3 py-2">
              <Cpu className="h-4 w-4 text-sky-400" />
              <h2 className="text-sm font-semibold">Job queue</h2>
              <span className="text-[10px] text-zinc-500">
                queued {pool?.jobs.queued ?? 0} · running {pool?.jobs.running ?? 0} · concurrency{" "}
                {pool?.jobs.concurrency ?? "—"}
              </span>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-zinc-500">
                  <tr className="border-b border-[color:var(--ghost-line)]">
                    <th className="px-3 py-2 font-medium">Job</th>
                    <th className="px-3 py-2 font-medium">Kind</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Progress</th>
                    <th className="px-3 py-2 font-medium">Backend</th>
                    <th className="px-3 py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {(pool?.jobs.recent || []).length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-4 text-zinc-500">
                        No jobs yet. Enqueue a CPU worker or chat job above.
                      </td>
                    </tr>
                  )}
                  {(pool?.jobs.recent || []).map((j) => (
                    <tr key={j.id} className="border-b border-[color:var(--ghost-line)]/60">
                      <td className="px-3 py-2">
                        <div className="text-zinc-200">{j.label}</div>
                        <div className="font-mono text-[10px] text-zinc-600">{j.id}</div>
                        {j.error && <div className="text-[10px] text-rose-400">{j.error}</div>}
                      </td>
                      <td className="px-3 py-2 text-zinc-400">{j.kind}</td>
                      <td className="px-3 py-2">{statusBadge(j.status)}</td>
                      <td className="px-3 py-2 text-zinc-400">{Math.round((j.progress || 0) * 100)}%</td>
                      <td className="px-3 py-2 text-zinc-400">{j.backendId || "—"}</td>
                      <td className="px-3 py-2">
                        {(j.status === "queued" || j.status === "running") && (
                          <button
                            type="button"
                            className="ghost-btn text-[10px]"
                            disabled={busy}
                            onClick={() => void post({ action: "cancel_job", id: j.id })}
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Performance guidance */}
          <section className="rounded border border-[color:var(--ghost-line)] bg-black/40">
            <header className="flex items-center gap-2 border-b border-[color:var(--ghost-line)] px-3 py-2">
              <BookOpen className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-semibold">Performance surface</h2>
              <span className="text-[10px] text-zinc-500">
                hub-controlled vs model-server-documented
              </span>
            </header>
            <div className="grid gap-2 p-3 md:grid-cols-2">
              {(pool?.performance || []).map((p) => (
                <div
                  key={p.id}
                  className="rounded border border-zinc-800 bg-black/50 p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-zinc-100">{p.title}</span>
                    <span
                      className={`rounded border px-1.5 py-0.5 text-[10px] uppercase ${
                        p.hubControl === "document-only"
                          ? "border-zinc-600 text-zinc-400"
                          : p.hubControl === "toggle"
                            ? "border-emerald-500/40 text-emerald-300"
                            : "border-sky-500/40 text-sky-300"
                      }`}
                    >
                      {p.hubControl}
                    </span>
                    {typeof p.enabled === "boolean" && (
                      <span className="text-[10px] text-zinc-500">{p.enabled ? "on" : "off"}</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">{p.summary}</p>
                  <ul className="mt-2 space-y-0.5 text-[11px] text-zinc-500">
                    {p.guidance.slice(0, 3).map((g) => (
                      <li key={g}>· {g}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
