export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import * as C from "@/lib/caller"

/**
 * POST /api/caller/prepare { to, objective } → validation + a short-lived confirm token.
 * The UI shows a confirm modal; only an explicit Confirm sends the token to /api/caller/call.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}) as any)
  if (Array.isArray(body.to)) return NextResponse.json({ ok: false, error: "one number per call — bulk dialing is not allowed" }, { status: 400 })
  const n = C.normalizeNumber(body.to)
  if (!n.ok) return NextResponse.json({ ok: false, error: n.error }, { status: 400 })
  const objective = typeof body.objective === "string" ? body.objective.trim().slice(0, 1000) : ""
  if (objective.length < 5) return NextResponse.json({ ok: false, error: "describe the call objective (at least a few words)" }, { status: 400 })
  const live = C.mode() === "live"
  const pol = C.policyCheck(n.number, live)
  if (!pol.ok) return NextResponse.json({ ok: false, error: pol.error }, { status: 409 })
  const tok = C.issueConfirmToken(n.number, objective)
  return NextResponse.json({
    ok: true,
    to: n.number,
    mode: C.mode(),
    disclosure: C.disclosureLine(),
    from: live ? C.maskNumber(process.env.TWILIO_FROM_NUMBER || "") : null,
    callsToday: C.callsToday(),
    dailyCap: C.dailyCap(),
    confirmToken: tok.token,
    expiresAt: tok.expiresAt,
  })
}
