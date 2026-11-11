export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { getVoiceStatus, HOLD } from "@/lib/voice/status"

/**
 * GET /api/voice/status — Hub Voice Bus Phase 3 aggregate.
 * HOLD_VYRNA_UNSYNC · lattice_sync: false · no secrets · no transcript logging.
 */
export async function GET() {
  try {
    const status = await getVoiceStatus()
    return NextResponse.json(status)
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        service: "voice",
        error: e instanceof Error ? e.message.slice(0, 200) : "status failed",
        hold: HOLD,
        lattice_sync: false,
      },
      { status: 500 },
    )
  }
}
