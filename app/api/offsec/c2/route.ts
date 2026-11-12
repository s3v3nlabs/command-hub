export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { enforceLadder } from "@/lib/offsec/scope-ladder"
import {
  listBeacons,
  listVerbs,
  killChainView,
  createBeacon,
  advancePhase,
  queueTask,
  retireBeacon,
  deleteBeacon,
  KILL_CHAIN_PHASES,
  type KillChainPhase,
} from "@/lib/offsec/c2/store"
import { isLabHost } from "@/lib/offsec/lab-exec"

const CAP = "c2-lab-console"
function stage1(): boolean {
  return process.env.C2_LAB_ENABLED === "1" || process.env.C2_LAB_ENABLED === "true"
}

export async function GET(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "offsec:c2" })
  if (denied) return denied
  return NextResponse.json({
    ok: true,
    stage1Enabled: stage1(),
    phases: KILL_CHAIN_PHASES,
    verbs: listVerbs(),
    beacons: listBeacons(),
    killChain: killChainView(),
    note: "Real lab sessions. Tasks execute allowlisted commands on localhost / RFC1918 / *.lab.local after the scope ladder allows them. No third-party host is contacted.",
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

  if (target && !isLabHost(target) && action === "create") {
    return NextResponse.json(
      { ok: false, error: `labHost "${target}" is not a local/lab address` },
      { status: 400 },
    )
  }

  const gate = enforceLadder({
    capability: `${CAP}:${action || "unknown"}`,
    scopeId,
    target: target || undefined,
    attestation,
    stage1Enabled: stage1(),
    operator,
  })
  if (gate.blocked) {
    return NextResponse.json({ ok: false, blocked: true, ladder: gate.check }, { status: 403 })
  }

  switch (action) {
    case "create": {
      const r = createBeacon({ label: body.label, labHost: target, os: body.os, scopeId: scopeId || "" })
      return NextResponse.json(r, { status: r.ok ? 200 : 400 })
    }
    case "advance": {
      const r = advancePhase(String(body.id || ""), body.phase as KillChainPhase)
      return NextResponse.json(r, { status: r.ok ? 200 : 400 })
    }
    case "task": {
      const r = await queueTask(String(body.id || ""), { verb: body.verb, arg: body.arg, phase: body.phase })
      return NextResponse.json(r, { status: r.ok ? 200 : 400 })
    }
    case "retire": {
      const r = retireBeacon(String(body.id || ""))
      return NextResponse.json(r, { status: r.ok ? 200 : 400 })
    }
    case "delete": {
      const r = deleteBeacon(String(body.id || ""))
      return NextResponse.json(r, { status: r.ok ? 200 : 400 })
    }
    default:
      return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 })
  }
}
