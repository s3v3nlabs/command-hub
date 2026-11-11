export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { providerStatus } from "@/lib/llm"
import * as C from "@/lib/caller"

/** GET /api/caller/config — mode, caps, provider readiness. Never returns secret values. */
export async function GET() {
  const p = await providerStatus()
  const from = process.env.TWILIO_FROM_NUMBER || ""
  return NextResponse.json({
    mode: C.mode(),
    twilioConfigured: C.twilioConfigured(),
    publicBaseUrlSet: Boolean(C.publicBaseUrl()),
    mediaStreamUrl: C.mediaStreamUrl() ? C.mediaStreamUrl().replace(/\/\/([^/]+)/, (_m, h) => "//" + h.replace(/^[^.]+/, "•••")) : "",
    fromNumber: from ? C.maskNumber(from) : null,
    owner: C.ownerName(),
    disclosure: C.disclosureLine(),
    dailyCap: C.dailyCap(),
    callsToday: C.callsToday(),
    maxCallSeconds: C.maxCallSeconds(),
    active: C.activeCall(),
    llm: p.chat.filter((x) => x.configured).map((x) => x.label),
    stt: p.stt.filter((x) => x.configured).map((x) => x.label),
    tts: p.tts.filter((x) => x.configured).map((x) => x.label),
  })
}
