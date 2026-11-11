export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { getTriadicStatus, HOLD } from "@/lib/triadic"

/**
 * GET /api/triadic/status — aggregate local probes.
 * HOLD_VYRNA_UNSYNC · lattice_sync: false · no secrets.
 */
export async function GET() {
  try {
    const status = await getTriadicStatus()
    return NextResponse.json(status)
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        service: "triadic",
        error: e instanceof Error ? e.message.slice(0, 200) : "status failed",
        hold: HOLD,
        lattice_sync: false,
      },
      { status: 500 },
    )
  }
}
