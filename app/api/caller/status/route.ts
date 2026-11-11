export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import * as C from "@/lib/caller"
import { readTwilioWebhook } from "@/lib/caller/twilio-request"

/** Twilio status callback (initiated / ringing / answered / completed). */
export async function POST(req: Request) {
  const { ok, params, url } = await readTwilioWebhook(req)
  if (!ok) return new Response("invalid signature", { status: 403 })
  const id = url.searchParams.get("callId") || ""
  const call = C.getCall(id) || (params.CallSid ? C.findCallBySid(params.CallSid) : null)
  if (!call) return NextResponse.json({ ok: true })
  const status = params.CallStatus || "unknown"
  const done = ["completed", "busy", "failed", "no-answer", "canceled"].includes(status)
  C.upsertCall({
    id: call.id,
    status,
    ...(done ? { endedAt: new Date().toISOString(), durationSec: Number(params.CallDuration || 0) } : {}),
  })
  C.appendTranscript(call.id, { speaker: "system", text: `Twilio status: ${status}` })
  return NextResponse.json({ ok: true })
}
