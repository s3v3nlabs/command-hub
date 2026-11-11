export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { enforceLadder } from "@/lib/offsec/scope-ladder"
import {
  listBeacons,
  killChainView,
  createBeacon,
  advancePhase,
  queueTask,
  retireBeacon,
  deleteBeacon,
  KILL_CHAIN_PHASES,
  type KillChainPhase,
} from "@/lib/offsec/c2/store"

const CAP = "c2-lab-console"
function stage1(): boolean {
  return process.env.C2_LAB_ENABLED === "1" || process.env.C2_LAB_ENABLED === "true"
}

export async function GET(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "offsec:c2" })
  if (denied) return denied
  return NextResponse.json({
    ok: true,
    simulated: true,
    stage1Enabled: stage1(),
    phases: KILL_CHAIN_PHASES,
    beacons: listBeacons(),
    killChain: killChainView(),
    note: "AUTHORIZED LAB SIMULATION ONLY — simulated beacons in the hub's own lab. No real C2, no third-party control.",
    hold: "HOLD_VYRNA_UNSYNC",
    lattice_sync: false,
  })
}

export async function POST(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "offsec:c2", requireInSecureMode: true })
  if (denied) return denied
  const body = await request.json().catch(() => ({}))
  const action = String(body.action || "")
  const operator = String(body.operator || "")
  const scopeId = body.scopeId ? String(body.scopeId) : null
  const attestation = String(body.attestation || "")
  const target = String(body.labHost || body.target || "")

  // Every mutating C2 lab action is staged-ladder gated + audited.
  const gate = enforceLadder({
    capability: `${CAP}:${action || "unknown"}`,
    scopeId,
    target: target || undefined,
    attestation,
    stage1Enabled: stage1(),
    operator,
  })
  if (gate.blocked) {
    return NextResponse.json({ ok: false, blocked: true, ladder: gate.check, simulated: true }, { status: 403 })
  }

  switch (action) {
    case "create": {
      const r = createBeacon({ label: body.label, labHost: target, os: body.os, scopeId: scopeId || "" })
      return NextResponse.json({ ...r, simulated: true }, { status: r.ok ? 200 : 400 })
    }
    case "advance": {
      const r = advancePhase(String(body.id || ""), body.phase as KillChainPhase)
      return NextResponse.json({ ...r, simulated: true }, { status: r.ok ? 200 : 400 })
    }
    case "task": {
      const r = queueTask(String(body.id || ""), { verb: body.verb, arg: body.arg, phase: body.phase })
      return NextResponse.json({ ...r, simulated: true }, { status: r.ok ? 200 : 400 })
    }
    case "retire": {
      const r = retireBeacon(String(body.id || ""))
      return NextResponse.json({ ...r, simulated: true }, { status: r.ok ? 200 : 400 })
    }
    case "delete": {
      const r = deleteBeacon(String(body.id || ""))
      return NextResponse.json({ ...r, simulated: true }, { status: r.ok ? 200 : 400 })
    }
    default:
      return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 })
  }
}
