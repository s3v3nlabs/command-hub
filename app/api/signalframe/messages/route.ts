export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import {
  listTeamMessages,
  postTeamMessage,
  teamBusStatus,
  type TeamChannel,
} from "@/lib/signalframe/team-bus"

/**
 * Signalframe team messaging API.
 * Never logs message bodies (Privacy Fortress).
 */

export async function GET(req: Request) {
  const url = new URL(req.url)
  const channelParam = url.searchParams.get("channel") || "all"
  const limit = Number(url.searchParams.get("limit") || "50")
  const channel =
    channelParam === "team" || channelParam === "whisper" || channelParam === "system" || channelParam === "all"
      ? (channelParam as TeamChannel | "all")
      : "all"
  const messages = listTeamMessages({ channel, limit })
  return NextResponse.json({
    ...teamBusStatus(),
    ok: true,
    messages,
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    // Do not console.log body — Privacy Fortress
    const result = postTeamMessage({
      channel: body?.channel,
      body: typeof body?.body === "string" ? body.body : typeof body?.message === "string" ? body.message : "",
      from: typeof body?.from === "string" ? body.from : "operator",
    })
    if (!result.ok) {
      return NextResponse.json({ ...result, lattice_sync: false }, { status: 400 })
    }
    return NextResponse.json({
      ok: true,
      id: result.id,
      channel: result.channel,
      encrypted: result.encrypted,
      bodyHash: result.bodyHash,
      hold: "HOLD_VYRNA_UNSYNC",
      lattice_sync: false,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "post failed"
    return NextResponse.json(
      { ok: false, error: message.slice(0, 200), lattice_sync: false },
      { status: 500 },
    )
  }
}
