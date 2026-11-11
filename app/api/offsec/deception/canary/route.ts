export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { fingerprintFrom, triggerCanary } from "@/lib/offsec/deception/store"

/**
 * Canary trigger endpoint. Intentionally UNAUTHENTICATED so a planted token can
 * fire the instant an attacker uses it anywhere. It performs no privileged action
 * and returns a believable-but-inert response; the real effect is a Heimdall alarm.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t") || ""
  const fp = fingerprintFrom({
    ua: request.headers.get("user-agent") || "",
    tooling: request.headers.get("x-requested-with") || "",
  })
  if (token) triggerCanary(token, { fingerprint: fp, source: request.headers.get("x-forwarded-for") || "" })
  // Inert, believable response — do not reveal it is a canary.
  return new NextResponse("OK\n", { status: 200, headers: { "content-type": "text/plain" } })
}
