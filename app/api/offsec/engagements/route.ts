export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import {
  listEngagements,
  createEngagement,
  setStatus,
  addNote,
  addFinding,
  deleteEngagement,
  type EngagementStatus,
} from "@/lib/offsec/engagements-store"

export async function GET() {
  return NextResponse.json({ ok: true, engagements: listEngagements(), lattice_sync: false })
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const action = String(body?.action || "create")
    const id = String(body?.id || "")
    let r:
      | { ok: true; engagement?: unknown }
      | { ok: false; error: string }
      | { ok: true }
    switch (action) {
      case "status":
        r = setStatus(id, body?.status as EngagementStatus)
        break
      case "note":
        r = addNote(id, { body: body?.body, phase: body?.phase, target: body?.target })
        break
      case "finding":
        r = addFinding(id, body?.finding || {})
        break
      case "delete":
        r = deleteEngagement(id)
        break
      default:
        r = createEngagement({
          name: body?.name,
          client: body?.client,
          scope: Array.isArray(body?.scope) ? body.scope : typeof body?.scope === "string" ? body.scope.split(/[\n,]/) : [],
          roe: body?.roe,
          authorizedBy: body?.authorizedBy,
        })
    }
    return NextResponse.json({ ...r, lattice_sync: false }, { status: r.ok ? 200 : 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "engagement op failed"
    return NextResponse.json({ ok: false, error: message.slice(0, 200), lattice_sync: false }, { status: 500 })
  }
}
