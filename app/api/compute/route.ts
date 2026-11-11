export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import {
  getPoolStatus,
  refreshPoolHealth,
  routeChat,
  warmBackend,
  setDefaultPolicy,
  getDefaultPolicy,
  submitJob,
  getJob,
  cancelJob,
  listJobs,
  jobStats,
  setJobConcurrency,
  getSpeculativeEnabled,
  setSpeculativeEnabled,
  getWarmOnStart,
  setWarmOnStart,
  HOLD,
} from "@/lib/compute"
import type { RouterPolicy, JobKind } from "@/lib/compute"

/**
 * Compute / AI Acceleration API.
 * GET  — pool status, jobs, metrics, performance guidance
 * POST — chat | health | warm | submit_job | cancel_job | set
 * Never logs prompt bodies or secrets. HOLD_VYRNA_UNSYNC · lattice_sync: false.
 */

function statusPayload() {
  const stats = jobStats()
  return getPoolStatus(listJobs(25), stats)
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action") || "status"

  if (action === "job") {
    const id = searchParams.get("id") || ""
    const job = getJob(id)
    if (!job) {
      return NextResponse.json({ ok: false, error: "job not found", hold: HOLD, lattice_sync: false }, { status: 404 })
    }
    return NextResponse.json({ ok: true, job, hold: HOLD, lattice_sync: false })
  }

  if (action === "jobs") {
    return NextResponse.json({
      ok: true,
      jobs: listJobs(50),
      stats: jobStats(),
      hold: HOLD,
      lattice_sync: false,
    })
  }

  if (action === "health") {
    const backends = await refreshPoolHealth()
    return NextResponse.json({
      ok: true,
      backends,
      reachableCount: backends.filter(
        (b) => b.state.health === "healthy" || b.state.health === "degraded",
      ).length,
      hold: HOLD,
      lattice_sync: false,
    })
  }

  // Probe backends so the dashboard is not stuck on "unknown" health.
  await refreshPoolHealth()

  // Optional warm-on-start (once per process when flag set and never warmed)
  if (getWarmOnStart()) {
    const snap = statusPayload()
    const anyWarmed = snap.backends.some((b) => b.state.warmed)
    if (!anyWarmed && snap.reachableCount > 0) {
      // Fire-and-forget — do not block status
      void warmBackend()
    }
  }

  return NextResponse.json(statusPayload())
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const action = typeof body.action === "string" ? body.action : "status"

    const MUTATING = new Set(["chat", "warm", "submit_job", "cancel_job", "set"])
    if (MUTATING.has(action)) {
      const denied = requireHubAuth(req, { surface: `compute:${action}`, requireInSecureMode: true })
      if (denied) return denied
    }

    if (action === "status") {
      return NextResponse.json(statusPayload())
    }

    if (action === "health") {
      const backends = await refreshPoolHealth()
      return NextResponse.json({
        ok: true,
        backends,
        hold: HOLD,
        lattice_sync: false,
      })
    }

    if (action === "warm") {
      const backendId = typeof body.backendId === "string" ? body.backendId : undefined
      const r = await warmBackend(backendId)
      return NextResponse.json({ ...r, hold: HOLD, lattice_sync: false })
    }

    if (action === "chat") {
      const messages = Array.isArray(body.messages)
        ? (body.messages as { role: string; content: string }[])
        : typeof body.prompt === "string"
          ? [{ role: "user", content: body.prompt }]
          : []
      if (messages.length === 0) {
        return NextResponse.json(
          { ok: false, error: "messages or prompt required", hold: HOLD, lattice_sync: false },
          { status: 400 },
        )
      }
      const policy =
        typeof body.policy === "string"
          ? (body.policy as RouterPolicy)
          : getSpeculativeEnabled()
            ? "speculative"
            : getDefaultPolicy()
      const r = await routeChat({
        messages,
        model: typeof body.model === "string" ? body.model : undefined,
        system: typeof body.system === "string" ? body.system : undefined,
        maxTokens: typeof body.maxTokens === "number" ? body.maxTokens : undefined,
        temperature: typeof body.temperature === "number" ? body.temperature : undefined,
        timeoutMs: typeof body.timeoutMs === "number" ? body.timeoutMs : undefined,
        preferBackendId: typeof body.preferBackendId === "string" ? body.preferBackendId : undefined,
        speculativeCount: typeof body.speculativeCount === "number" ? body.speculativeCount : undefined,
        policy,
      })
      return NextResponse.json(r)
    }

    if (action === "submit_job") {
      const kind = (typeof body.kind === "string" ? body.kind : "custom") as JobKind
      const allowed: JobKind[] = ["chat", "enrich", "analyze", "scan", "warm", "custom", "cpu-bound"]
      if (!allowed.includes(kind)) {
        return NextResponse.json(
          { ok: false, error: `invalid kind; allowed: ${allowed.join(", ")}`, hold: HOLD, lattice_sync: false },
          { status: 400 },
        )
      }
      const job = submitJob({
        kind,
        label: typeof body.label === "string" ? body.label : undefined,
        payload: body.payload && typeof body.payload === "object" ? (body.payload as Record<string, unknown>) : {},
        priority: typeof body.priority === "number" ? body.priority : 0,
      })
      return NextResponse.json({ ok: true, job, hold: HOLD, lattice_sync: false })
    }

    if (action === "cancel_job") {
      const id = typeof body.id === "string" ? body.id : ""
      const job = cancelJob(id)
      if (!job) {
        return NextResponse.json({ ok: false, error: "job not found", hold: HOLD, lattice_sync: false }, { status: 404 })
      }
      return NextResponse.json({ ok: true, job, hold: HOLD, lattice_sync: false })
    }

    if (action === "set") {
      if (typeof body.policy === "string") {
        const allowed = ["least-loaded", "round-robin", "latency-aware", "cost-aware", "speculative"]
        if (!allowed.includes(body.policy)) {
          return NextResponse.json(
            { ok: false, error: `invalid policy; allowed: ${allowed.join(", ")}`, hold: HOLD, lattice_sync: false },
            { status: 400 },
          )
        }
        setDefaultPolicy(body.policy as RouterPolicy)
      }
      if (typeof body.speculative === "boolean") setSpeculativeEnabled(body.speculative)
      if (typeof body.warmOnStart === "boolean") setWarmOnStart(body.warmOnStart)
      if (typeof body.jobConcurrency === "number") setJobConcurrency(body.jobConcurrency)
      return NextResponse.json({
        ok: true,
        policy: getDefaultPolicy(),
        speculative: getSpeculativeEnabled(),
        warmOnStart: getWarmOnStart(),
        jobConcurrency: jobStats().concurrency,
        hold: HOLD,
        lattice_sync: false,
      })
    }

    return NextResponse.json(
      { ok: false, error: `unknown action: ${action}`, hold: HOLD, lattice_sync: false },
      { status: 400 },
    )
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : String(e),
        hold: HOLD,
        lattice_sync: false,
      },
      { status: 500 },
    )
  }
}
