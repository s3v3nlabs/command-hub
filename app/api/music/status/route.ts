export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { getMusicStatus, HOLD } from "@/lib/music/status"

/**
 * GET /api/music/status — Music Hub aggregate.
 * HOLD_VYRNA_UNSYNC · lattice_sync: false · no secrets · no OAuth.
 */
export async function GET() {
  try {
    return NextResponse.json(getMusicStatus())
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        service: "music",
        error: e instanceof Error ? e.message.slice(0, 200) : "status failed",
        hold: HOLD,
        lattice_sync: false,
      },
      { status: 500 },
    )
  }
}
