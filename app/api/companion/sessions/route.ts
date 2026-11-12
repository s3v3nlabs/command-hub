export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import {
  createSession,
  endSession,
  getSession,
  joinSession,
  listSessions,
} from "@/lib/companion/store"
import { requireCompanionAuth } from "@/lib/companion/http"
import type { CompanionRole } from "@/lib/companion/types"

function roleOf(v: unknown): CompanionRole {
  return v === "hub" ? "hub" : "phone"
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")
  const auth = requireCompanionAuth(request, { sessionId: id, surface: "companion:sessions" })
  if (!auth.ok) return auth.response
  if (id) {
    const session = auth.session || getSession(id)
    if (!session) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 })
    return NextResponse.json({ ok: true, session })
  }
  // Listing every session requires hub auth, not just a single-session ticket.
  if (auth.via === "ticket") {
    return NextResponse.json({ ok: true, sessions: [auth.session] })
  }
  const denied = requireHubAuth(request, { surface: "companion:sessions:list", requireInSecureMode: true })
  if (denied) return denied
  const liveOnly = request.nextUrl.searchParams.get("live") !== "0"
  return NextResponse.json({ ok: true, sessions: listSessions({ liveOnly }) })
}

export async function POST(request: NextRequest) {
  // Creating / joining a session always requires hub auth (issues a ticket).
  const denied = requireHubAuth(request, { surface: "companion:sessions", requireInSecureMode: true })
  if (denied) return denied
  const body = await request.json().catch(() => ({}))
  const action = String(body.action || "create")
  const role = roleOf(body.role)

  if (action === "create") {
    const r = createSession({ label: body.label, role })
    if (!r.ok) return NextResponse.json(r, { status: 400 })
    return NextResponse.json({
      ok: true,
      session: r.session,
      ticket: r.ticket,
      role: r.role,
      hubView: `/companion/hub-view?session=${r.session.id}`,
      bridge: `/companion/bridge?session=${r.session.id}`,
      hint: "Store the ticket on the device; it is not shown again. Pass it as x-companion-ticket or ?ticket= for SSE.",
    })
  }

  if (action === "join") {
    const sessionId = String(body.sessionId || body.id || "")
    if (!sessionId) return NextResponse.json({ ok: false, error: "sessionId required" }, { status: 400 })
    const r = joinSession({ sessionId, role })
    if (!r.ok) return NextResponse.json(r, { status: r.error === "not_found" ? 404 : 400 })
    return NextResponse.json({
      ok: true,
      session: r.session,
      ticket: r.ticket,
      role: r.role,
      hubView: `/companion/hub-view?session=${r.session.id}`,
      bridge: `/companion/bridge?session=${r.session.id}`,
    })
  }

  if (action === "end") {
    const sessionId = String(body.sessionId || body.id || "")
    const ok = endSession(sessionId)
    return NextResponse.json({ ok })
  }

  return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 })
}
