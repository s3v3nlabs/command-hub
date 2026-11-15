export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { authorizeHeal, recordReplay } from "@/lib/selfHealing/HealGate"

/**
 * POST /api/self-healing
 *   { stage: "replay", proposal }                          → { replayId, patchHash, passed, checks }
 *   { stage: "heal", action, proposal, replayId, commanderToken } → { approved, error? }
 * Replay must pass first; the Commander token must be minted for target "patch:<patchHash>"
 * and ref "<replayId>" (POST /api/commander/token). Hub auth always required.
 * Christian Wilford (s3v3n), Founder, Singular/ty Defense Solutions, LLC.
 */
export async function POST(req: Request) {
  const denied = requireHubAuth(req, { surface: "self-healing", requireInSecureMode: true })
  if (denied) return denied
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!b) return NextResponse.json({ ok: false, error: "json_body_required" }, { status: 400 })
  if (b.stage === "replay") {
    const rec = await recordReplay(b.proposal)
    return NextResponse.json({ ok: true, ...rec })
  }
  if (b.stage === "heal") {
    const r = authorizeHeal({
      action: String(b.action ?? ""),
      proposal: b.proposal,
      replayId: typeof b.replayId === "string" ? b.replayId : null,
      commanderToken: typeof b.commanderToken === "string" ? b.commanderToken : null,
    })
    return NextResponse.json({ ok: r.approved, ...r }, { status: r.approved ? 200 : 403 })
  }
  return NextResponse.json({ ok: false, error: "unknown_stage" }, { status: 400 })
}
