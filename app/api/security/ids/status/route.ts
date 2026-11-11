export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { buildIdsStatus, getAccountRails } from "@/lib/security/ids-status"

/**
 * GET /api/security/ids/status
 * Honest local IDS signals + Account Rails key-presence (booleans only).
 * Never returns secret values. HOLD_VYRNA_UNSYNC.
 */
export async function GET() {
  try {
    const ids = buildIdsStatus()
    const accountRails = getAccountRails()
    return NextResponse.json({
      ...ids,
      accountRails,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "ids status failed"
    return NextResponse.json(
      { ok: false, error: message.replace(/sk-[a-zA-Z0-9_-]+/g, "[redacted]") },
      { status: 500 },
    )
  }
}
