export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import {
  meshHubStatus,
  listProviders,
  readLedger,
  updateQuota,
  dryRunSchedule,
  scheduleJob,
  releaseLock,
  listLocks,
  assimilateToTrain,
  rejectForbidden,
  scanBodyForBurnerIntent,
  isForbiddenAction,
  HOLD,
} from "@/lib/mesh"

/**
 * GPU Mesh API — list providers, ledger, dry-run schedule, assimilate stub.
 * POST createBurner / rotateIdentity / etc → 403.
 * Auth = Operator-owned seats only. Never returns secret values.
 * HOLD_VYRNA_UNSYNC · lattice_sync: false
 */

function forbiddenResponse(action: unknown) {
  const v = rejectForbidden(action)
  if (v.ok) return null
  return NextResponse.json(
    {
      ok: false,
      error: v.error,
      reason: v.reason,
      action: typeof action === "string" ? action : String(action),
      forbidsBurnerAccounts: true,
      hold: HOLD,
      lattice_sync: false,
    },
    { status: 403 },
  )
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action") || "status"

  if (isForbiddenAction(action)) {
    return forbiddenResponse(action)!
  }

  if (action === "providers" || action === "list") {
    return NextResponse.json({
      ok: true,
      providers: listProviders(),
      auth: "operator-owned",
      forbidsBurnerAccounts: true,
      hold: HOLD,
      lattice_sync: false,
    })
  }

  if (action === "ledger" || action === "quota") {
    return NextResponse.json({
      ok: true,
      ledger: readLedger(),
      hold: HOLD,
      lattice_sync: false,
    })
  }

  if (action === "locks") {
    return NextResponse.json({
      ok: true,
      locks: listLocks(),
      hold: HOLD,
      lattice_sync: false,
    })
  }

  if (action === "dryRun" || action === "dryRunSchedule") {
    const role = searchParams.get("role") || "train"
    const providerId = searchParams.get("providerId") || undefined
    const result = dryRunSchedule({ role, providerId })
    return NextResponse.json(result, { status: result.ok ? 200 : 400 })
  }

  return NextResponse.json(meshHubStatus())
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const action = typeof body?.action === "string" ? body.action : "status"

    const denied = forbiddenResponse(action)
    if (denied) return denied

    const bodyDenied = scanBodyForBurnerIntent(body)
    if (!bodyDenied.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: bodyDenied.error,
          reason: bodyDenied.reason,
          forbidsBurnerAccounts: true,
          hold: HOLD,
          lattice_sync: false,
        },
        { status: 403 },
      )
    }

    if (action === "status") {
      return NextResponse.json(meshHubStatus())
    }

    if (action === "providers" || action === "list") {
      return NextResponse.json({
        ok: true,
        providers: listProviders(),
        hold: HOLD,
        lattice_sync: false,
      })
    }

    if (action === "ledger" || action === "quota") {
      return NextResponse.json({ ok: true, ledger: readLedger(), hold: HOLD, lattice_sync: false })
    }

    if (action === "updateQuota" || action === "setQuota") {
      const providerId = typeof body.providerId === "string" ? body.providerId : ""
      if (!providerId) {
        return NextResponse.json(
          { ok: false, error: "providerId required", hold: HOLD, lattice_sync: false },
          { status: 400 },
        )
      }
      const result = updateQuota(providerId, {
        remainingHours:
          body.remainingHours === null
            ? null
            : body.remainingHours !== undefined
              ? Number(body.remainingHours)
              : undefined,
        remainingCredits:
          body.remainingCredits === null
            ? null
            : body.remainingCredits !== undefined
              ? Number(body.remainingCredits)
              : undefined,
        notes: typeof body.notes === "string" ? body.notes : undefined,
      })
      return NextResponse.json(
        { ...result, hold: HOLD, lattice_sync: false },
        { status: result.ok ? 200 : 400 },
      )
    }

    if (action === "dryRun" || action === "dryRunSchedule") {
      const result = dryRunSchedule({
        role: typeof body.role === "string" ? body.role : "train",
        providerId: typeof body.providerId === "string" ? body.providerId : undefined,
        title: typeof body.title === "string" ? body.title : undefined,
      })
      return NextResponse.json(result, { status: result.ok ? 200 : 400 })
    }

    if (action === "scheduleJob" || action === "schedule") {
      const result = scheduleJob({
        role: typeof body.role === "string" ? body.role : "train",
        providerId: typeof body.providerId === "string" ? body.providerId : undefined,
        title: typeof body.title === "string" ? body.title : undefined,
        action,
        body,
      })
      const status = result.status || (result.ok ? 200 : 400)
      return NextResponse.json(result, { status })
    }

    if (action === "releaseLock" || action === "unlock") {
      const providerId = typeof body.providerId === "string" ? body.providerId : ""
      if (!providerId) {
        return NextResponse.json(
          { ok: false, error: "providerId required", hold: HOLD, lattice_sync: false },
          { status: 400 },
        )
      }
      return NextResponse.json({
        ...releaseLock(providerId),
        hold: HOLD,
        lattice_sync: false,
        forbidsBurnerAccounts: true,
      })
    }

    if (action === "assimilate") {
      const result = await assimilateToTrain({
        jobId: typeof body.jobId === "string" ? body.jobId : undefined,
        providerId: typeof body.providerId === "string" ? body.providerId : undefined,
        role: typeof body.role === "string" ? body.role : undefined,
        title: typeof body.title === "string" ? body.title : undefined,
        summary: typeof body.summary === "string" ? body.summary : undefined,
        content: typeof body.content === "string" ? body.content : undefined,
        tags: Array.isArray(body.tags) ? body.tags.map(String) : undefined,
        dimmSymbolHint: typeof body.dimmSymbolHint === "string" ? body.dimmSymbolHint : undefined,
      })
      return NextResponse.json(result, { status: result.status || (result.ok ? 200 : 400) })
    }

    return NextResponse.json(
      {
        ok: false,
        error: `Unknown action: ${action}`,
        allowed: [
          "status",
          "providers",
          "ledger",
          "updateQuota",
          "dryRun",
          "scheduleJob",
          "releaseLock",
          "assimilate",
        ],
        forbidden: [
          "createBurner",
          "createAccount",
          "rotateIdentity",
          "farmFreeTier",
          "captchaSolver",
          "emailFarm",
        ],
        hold: HOLD,
        lattice_sync: false,
        forbidsBurnerAccounts: true,
      },
      { status: 400 },
    )
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "mesh error",
        hold: HOLD,
        lattice_sync: false,
      },
      { status: 500 },
    )
  }
}
