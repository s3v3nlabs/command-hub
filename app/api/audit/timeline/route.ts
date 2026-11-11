export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { requireHubAuth, extractHubToken } from "@/lib/security/api-auth"
import { buildTimeline } from "@/lib/audit/timeline"

export async function GET(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "audit:timeline" })
  if (denied) return denied
  // A Heimdall token (header x-heimdall-token or ?heimdall=) unseals eyes-only records.
  const heimdallToken = request.nextUrl.searchParams.get("heimdall") || extractHubToken(request)
  const limit = Math.min(1000, Number(request.nextUrl.searchParams.get("limit")) || 300)
  const result = buildTimeline({ heimdallToken, limit })
  return NextResponse.json({ ok: true, ...result, hold: "HOLD_VYRNA_UNSYNC", lattice_sync: false })
}
