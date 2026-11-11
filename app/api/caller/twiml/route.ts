export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import * as C from "@/lib/caller"
import { readTwilioWebhook } from "@/lib/caller/twilio-request"

/** Twilio voice webhook → TwiML (fixed disclosure via <Say>, then <Connect><Stream> to the bridge). */
export async function POST(req: Request) {
  const { ok, url } = await readTwilioWebhook(req)
  if (!ok) return new Response("invalid signature", { status: 403 })
  const id = url.searchParams.get("callId") || ""
  const call = C.getCall(id)
  if (!call || call.mode !== "live") {
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>', { headers: { "Content-Type": "text/xml" } })
  }
  return new Response(C.buildTwiml(id), { headers: { "Content-Type": "text/xml" } })
}
