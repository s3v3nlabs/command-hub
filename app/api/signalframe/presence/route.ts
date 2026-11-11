export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { heartbeat, listOnline, leave, postNote, listNotes, presenceStatus } from "@/lib/signalframe/presence"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const engagementId = url.searchParams.get("engagement") || undefined
  return NextResponse.json({
    ...presenceStatus(),
    online: listOnline(),
    notes: listNotes(engagementId, 100),
  })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const action = String(body.action || "heartbeat")
  if (action === "heartbeat") {
    const r = heartbeat({ id: body.id, name: body.name, color: body.color, workspace: body.workspace, cursor: body.cursor })
    return NextResponse.json({ ...r, hold: "HOLD_VYRNA_UNSYNC", lattice_sync: false }, { status: r.ok ? 200 : 400 })
  }
  if (action === "leave") {
    return NextResponse.json({ ok: leave(String(body.id || "")) })
  }
  if (action === "note") {
    const r = postNote({ engagementId: body.engagementId, from: body.from, body: body.body })
    return NextResponse.json({ ...r, hold: "HOLD_VYRNA_UNSYNC", lattice_sync: false }, { status: r.ok ? 200 : 400 })
  }
  return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 })
}
