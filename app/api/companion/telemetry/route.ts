export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { requireCompanionAuth, sseResponse } from "@/lib/companion/http"
import { getSession, recordTelemetry, subscribeSignals, pushSignal } from "@/lib/companion/store"

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session") || request.nextUrl.searchParams.get("id") || ""
  const auth = requireCompanionAuth(request, { sessionId, surface: "companion:telemetry", needSession: true })
  if (!auth.ok) return auth.response
  const session = auth.session || getSession(sessionId)
  if (!session) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 })

  // Optional SSE of telemetry snapshots (also arrives on /api/companion/events as presence).
  if (request.nextUrl.searchParams.get("stream") === "1") {
    if (auth.via !== "ticket") {
      return NextResponse.json({ ok: false, error: "ticket_required" }, { status: 401 })
    }
    return sseResponse(request, (send) => {
      if (session.lastTelemetry) send("telemetry", session.lastTelemetry)
      return subscribeSignals(session.id, (sig) => {
        if (sig.kind === "presence") {
          const fresh = getSession(session.id)
          if (fresh?.lastTelemetry) send("telemetry", fresh.lastTelemetry, String(sig.seq))
        }
      })
    })
  }

  return NextResponse.json({ ok: true, sessionId: session.id, telemetry: session.lastTelemetry || null })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const sessionId = String(body.sessionId || body.session || "")
  const auth = requireCompanionAuth(request, { sessionId, surface: "companion:telemetry", needSession: true })
  if (!auth.ok) return auth.response
  if (auth.via === "ticket" && auth.role !== "phone") {
    return NextResponse.json({ ok: false, error: "phone_ticket_required" }, { status: 403 })
  }
  const r = recordTelemetry(auth.session!.id, body)
  if (!r.ok) return NextResponse.json(r, { status: 400 })
  // Fan-out a compact presence signal so the hub viewer updates without polling.
  pushSignal({
    sessionId: auth.session!.id,
    from: "phone",
    kind: "presence",
    payload: { ok: true },
  })
  return NextResponse.json({ ok: true, telemetry: r.telemetry })
}
