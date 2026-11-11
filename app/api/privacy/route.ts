export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { getPrivacyStatus } from "@/lib/privacy/privacyPolicy"

/**
 * ADD-ONLY alias for checklist path /api/privacy (same as /api/privacy/status).
 * HOLD_VYRNA_UNSYNC · lattice_sync: false
 */
export async function GET() {
  try {
    const status = await getPrivacyStatus()
    return NextResponse.json(status)
  } catch (err) {
    const message = err instanceof Error ? err.message : "privacy status failed"
    return NextResponse.json(
      { ok: false, error: message.slice(0, 200), hold: "HOLD_VYRNA_UNSYNC", lattice_sync: false },
      { status: 500 },
    )
  }
}
