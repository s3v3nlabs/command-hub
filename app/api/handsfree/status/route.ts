export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { getHandsFreeStatus, HOLD } from "@/lib/handsfree/status"

/**
 * GET /api/handsfree/status — Hands-free Phase 4 aggregate.
 * HOLD_VYRNA_UNSYNC · lattice_sync: false · no secrets · no prompt logging.
 */
export async function GET() {
  try {
    const status = await getHandsFreeStatus()
    return NextResponse.json(status)
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        service: "handsfree",
        hold: HOLD,
        lattice_sync: false,
        error: e instanceof Error ? e.message.slice(0, 200) : "status failed",
      },
      { status: 500 },
    )
  }
}
