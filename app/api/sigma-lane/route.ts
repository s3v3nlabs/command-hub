export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import {
  statusSnapshot,
  orchestrate,
  learnFromTask,
  retune,
  listLanes,
  isLaneId,
  setLane,
  getLaneState,
  recallSymbols,
  symbolicMemoryStatus,
  detectDrift,
  pulseStatus,
  hemisphereStatus,
  callosumBridge,
  type LaneId,
} from "@/lib/sigma-lane"

/**
 * Sigma Lane API — status + set lane + recall symbols.
 * Never logs request/response bodies as telemetry.
 * HOLD_VYRNA_UNSYNC · lattice_sync: false.
 */

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action") || "status"

  if (action === "pulse") {
    return NextResponse.json({
      ok: true,
      pulse: pulseStatus(),
      hemispheres: hemisphereStatus(),
        hemisphereBadges: hemisphereStatus().badges,
      hold: "HOLD_VYRNA_UNSYNC",
      lattice_sync: false,
    })
  }

  if (action === "lanes") {
    return NextResponse.json({
      ok: true,
      lanes: listLanes().map((l) => ({
        id: l.id,
        mode: l.mode,
        band: l.band,
        hz: l.hz,
        description: l.description,
      })),
      hold: "HOLD_VYRNA_UNSYNC",
      lattice_sync: false,
    })
  }

  if (action === "recall") {
    const glyph = searchParams.get("glyph") || undefined
    const lane = searchParams.get("lane")
    const laneId = isLaneId(lane) ? lane : undefined
    const symbols = recallSymbols({ glyph, laneId, limit: 12 })
    return NextResponse.json({
      ok: true,
      symbols: symbols.map((s) => ({
        id: s.id,
        glyph: s.glyph,
        lesson: s.lesson.slice(0, 500),
        laneId: s.laneId,
        tags: s.tags,
        createdAt: s.createdAt,
      })),
      memory: symbolicMemoryStatus(),
      hold: "HOLD_VYRNA_UNSYNC",
      lattice_sync: false,
    })
  }

  return NextResponse.json({
    ...statusSnapshot(),
    memory: symbolicMemoryStatus(),
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const action = typeof body?.action === "string" ? body.action : "status"

    if (action === "set_lane" || action === "retune") {
      const lane = body?.laneId ?? body?.lane ?? body?.target
      if (!isLaneId(lane)) {
        return NextResponse.json({ ok: false, error: "laneId required (focus|build|empathy|defense|creative|comms|crown)" }, { status: 400 })
      }
      const result = action === "retune" ? retune(lane as LaneId) : { ok: true as const, ...setLane(lane as LaneId), deltaT: 0 as const }
      return NextResponse.json({
        ...result,
        state: getLaneState(),
        hold: "HOLD_VYRNA_UNSYNC",
        lattice_sync: false,
      })
    }

    if (action === "recall") {
      const glyph = typeof body?.glyph === "string" ? body.glyph : undefined
      const laneId = isLaneId(body?.laneId) ? (body.laneId as LaneId) : undefined
      const symbols = recallSymbols({ glyph, laneId, limit: 12 })
      return NextResponse.json({
        ok: true,
        symbols,
        memory: symbolicMemoryStatus(),
        hold: "HOLD_VYRNA_UNSYNC",
        lattice_sync: false,
      })
    }

    if (action === "detect_drift") {
      const text = typeof body?.text === "string" ? body.text : typeof body?.task === "string" ? body.task : ""
      // Do not echo full text back — only meter
      const reading = detectDrift(text || " ")
      return NextResponse.json({
        ok: true,
        drift: {
          score: reading.score,
          severity: reading.severity,
          deltaT: reading.deltaT,
          hits: reading.hits.map((h) => h.cue),
          suggestedLane: reading.suggestedLane,
          note: reading.note,
          neutralized: reading.neutralized,
        },
        state: getLaneState(),
        hold: "HOLD_VYRNA_UNSYNC",
        lattice_sync: false,
      })
    }

    if (action === "learn" || action === "store_symbol") {
      const r = learnFromTask({
        glyph: typeof body?.glyph === "string" ? body.glyph : "",
        lesson: typeof body?.lesson === "string" ? body.lesson : "",
        laneId: isLaneId(body?.laneId) ? body.laneId : undefined,
        tags: Array.isArray(body?.tags) ? body.tags.filter((t: unknown) => typeof t === "string") : undefined,
      })
      return NextResponse.json({ ...r, memory: symbolicMemoryStatus(), lattice_sync: false })
    }

    if (action === "pulse" || action === "callosum") {
      const task = typeof body?.task === "string" ? body.task : "pulse"
      const bridged = callosumBridge(task)
      return NextResponse.json({
        ok: true,
        action,
        ...bridged,
        hemispheres: hemisphereStatus(),
        hemisphereBadges: hemisphereStatus().badges,
        pulseStatus: pulseStatus(),
        principle: "SYMBOLIC_FAST_ALWAYS",
      })
    }

    if (action === "orchestrate") {
      const task = typeof body?.task === "string" ? body.task : ""
      if (!task) {
        return NextResponse.json({ ok: false, error: "task required" }, { status: 400 })
      }
      const result = orchestrate({
        task,
        laneId: isLaneId(body?.laneId) ? body.laneId : undefined,
        forceToken: body?.forceToken === true,
        glyph: typeof body?.glyph === "string" ? body.glyph : undefined,
      })
      // Strip full lessons in response if huge — keep compact
      return NextResponse.json({
        ok: result.ok,
        path: result.path,
        laneId: result.laneId,
        hzCombo: result.hzCombo,
        deltaT: result.deltaT,
        drift: {
          severity: result.drift.severity,
          deltaT: result.drift.deltaT,
          suggestedLane: result.drift.suggestedLane,
          note: result.drift.note,
        },
        symbols: result.symbols.map((s) => ({ id: s.id, glyph: s.glyph, lesson: s.lesson.slice(0, 200), laneId: s.laneId })),
        symbolicCount: result.symbolicCount,
        symbolicPlan: result.symbolicPlan,
        tokenFallbackHint: result.tokenFallbackHint,
        hold: result.hold,
        lattice_sync: false,
        echoNexusRole: result.echoNexusRole,
        pulse: result.pulse
          ? {
              shardDepth: result.pulse.shardDepth,
              fibIndex: result.pulse.fibIndex,
              backoffMs: result.pulse.backoffMs,
              phaseLocked: result.pulse.phaseLocked,
              phaseError: result.pulse.phaseError,
              noise: result.pulse.noise,
              poolKey: result.pulse.pool.key,
              tick: result.pulse.tick,
            }
          : null,
        hemispheres: result.hemispheres,
        principle: result.principle || "SYMBOLIC_FAST_ALWAYS",
      })
    }

    return NextResponse.json({ ...statusSnapshot(), memory: symbolicMemoryStatus() })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "sigma-lane error", lattice_sync: false },
      { status: 500 },
    )
  }
}
