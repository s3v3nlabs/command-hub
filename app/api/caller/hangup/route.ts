export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import * as C from "@/lib/caller"
import { finishDemoCall } from "@/lib/caller/demo"

/** POST /api/caller/hangup { id } — end a live (Twilio) or demo call. */
export async function POST(req: Request) {
  const { id } = await req.json().catch(() => ({}) as any)
  const call = typeof id === "string" ? C.getCall(id) : null
  if (!call) return NextResponse.json({ ok: false, error: "call not found" }, { status: 404 })
  if (call.mode === "demo") {
    finishDemoCall(call.id, "ended-by-operator")
    return NextResponse.json({ ok: true })
  }
  try {
    if (call.twilioSid) await C.twilioHangup(call.twilioSid)
    C.upsertCall({ id: call.id, status: "completed", endedAt: new Date().toISOString() })
    C.appendTranscript(call.id, { speaker: "system", text: "Call ended by operator." })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 })
  }
}
