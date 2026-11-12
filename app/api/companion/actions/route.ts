export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { requireCompanionAuth } from "@/lib/companion/http"
import { runCompanionAction } from "@/lib/companion/actions"
import { FIELD_MODULES } from "@/lib/companion/types"

export async function GET(request: NextRequest) {
  const auth = requireCompanionAuth(request, { surface: "companion:actions" })
  if (!auth.ok) return auth.response
  return NextResponse.json({
    ok: true,
    actions: ["heartbeat", "open", "list_modules"],
    modules: FIELD_MODULES,
    hint: "Safe actions only: SignalFrame presence heartbeat, and in-hub module navigation. No shell, no ladder-gated offensive tools.",
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : undefined
  const auth = requireCompanionAuth(request, { sessionId, surface: "companion:actions" })
  if (!auth.ok) return auth.response
  if (auth.via === "ticket" && sessionId && auth.session && auth.session.id !== sessionId) {
    return NextResponse.json({ ok: false, error: "ticket_session_mismatch" }, { status: 403 })
  }
  const r = runCompanionAction({
    ...body,
    sessionId: sessionId || auth.session?.id,
    from: body.from || auth.role || "hub",
  })
  return NextResponse.json(r, { status: r.ok ? 200 : 400 })
}
