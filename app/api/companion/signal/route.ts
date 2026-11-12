export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { requireCompanionAuth } from "@/lib/companion/http"
import { listSignalsAfter, pushSignal } from "@/lib/companion/store"
import type { CompanionRole, SignalKind } from "@/lib/companion/types"

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session") || request.nextUrl.searchParams.get("id") || ""
  const after = Number(request.nextUrl.searchParams.get("after") || "0")
  const auth = requireCompanionAuth(request, { sessionId, surface: "companion:signal", needSession: true })
  if (!auth.ok) return auth.response
  const sid = auth.session!.id
  return NextResponse.json({ ok: true, signals: listSignalsAfter(sid, Number.isFinite(after) ? after : 0) })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const sessionId = String(body.sessionId || body.session || "")
  const auth = requireCompanionAuth(request, { sessionId, surface: "companion:signal", needSession: true })
  if (!auth.ok) return auth.response
  const from = (body.from === "phone" || body.from === "hub" ? body.from : auth.role) as CompanionRole
  // A ticket is locked to its role so a phone ticket cannot spoof the hub seat.
  if (auth.via === "ticket" && auth.role && from !== auth.role) {
    return NextResponse.json({ ok: false, error: "role_mismatch" }, { status: 403 })
  }
  const r = pushSignal({
    sessionId: auth.session!.id,
    from,
    kind: String(body.kind || "") as SignalKind,
    payload: body.payload,
  })
  if (!r.ok) return NextResponse.json(r, { status: 400 })
  return NextResponse.json(r)
}
