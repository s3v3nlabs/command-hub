export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { isHubAuthorized } from "@/lib/security/api-auth"
import { listSessions, publicStatus } from "@/lib/companion/store"

/** Read-only status. Softer auth: public counts always; session summaries when authorized. */
export async function GET(request: NextRequest) {
  const base = publicStatus()
  if (!isHubAuthorized(request)) {
    return NextResponse.json(base)
  }
  const live = listSessions({ liveOnly: true }).map((s) => ({
    id: s.id,
    label: s.label,
    updatedAt: s.updatedAt,
    phoneJoinedAt: s.phoneJoinedAt,
    hubJoinedAt: s.hubJoinedAt,
    media: s.media,
    telemetry: s.lastTelemetry
      ? {
          ts: s.lastTelemetry.ts,
          battery: s.lastTelemetry.battery,
          network: s.lastTelemetry.network,
          hasGeo: !!s.lastTelemetry.geo,
        }
      : undefined,
  }))
  return NextResponse.json({ ...base, authorized: true, sessions: live })
}
