export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { requireCompanionAuth, sseResponse } from "@/lib/companion/http"
import { getSession, listSignalsAfter, subscribeSignals } from "@/lib/companion/store"

/**
 * SSE signaling + session snapshots.
 * Auth is via ?ticket= (EventSource cannot set Authorization). A hub token is
 * not accepted on the query string — join first, then use the issued ticket.
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session") || request.nextUrl.searchParams.get("id") || ""
  const after = Number(request.nextUrl.searchParams.get("after") || "0")
  const auth = requireCompanionAuth(request, { sessionId, surface: "companion:events", needSession: true })
  if (!auth.ok) return auth.response
  if (auth.via !== "ticket") {
    return NextResponse.json(
      {
        ok: false,
        error: "ticket_required",
        detail: "EventSource cannot send Authorization. POST /api/companion/sessions to get a ticket, then connect with ?ticket=",
      },
      { status: 401 },
    )
  }
  const sid = auth.session!.id
  const startSeq = Number.isFinite(after) ? after : 0

  return sseResponse(request, (send) => {
    const session = getSession(sid)
    if (session) send("session", session, "session")
    for (const sig of listSignalsAfter(sid, startSeq)) {
      send(sig.kind, sig, String(sig.seq))
    }
    return subscribeSignals(sid, (sig) => {
      send(sig.kind, sig, String(sig.seq))
    })
  })
}
