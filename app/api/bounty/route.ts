export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { createBounty, listBounties, updateBountyStatus, type BountyStatus } from "@/lib/bounty/store"

export async function GET() {
  return NextResponse.json({
    ok: true,
    submissions: listBounties(),
    workflow: ["draft", "review", "submitted"],
    hold: "HOLD_VYRNA_UNSYNC",
    lattice_sync: false,
    note: "Legal business disclosure lane only — no exploit binaries.",
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    if (body?.action === "status") {
      const id = String(body.id || "")
      const status = body.status as BountyStatus
      const r = updateBountyStatus(id, status)
      return NextResponse.json({ ...r, lattice_sync: false }, { status: r.ok ? 200 : 400 })
    }
    const r = createBounty({
      title: String(body?.title || ""),
      summary: String(body?.summary || ""),
      severity: typeof body?.severity === "string" ? body.severity : undefined,
      fromHub: typeof body?.fromHub === "string" ? body.fromHub : "local",
      intelId: typeof body?.intelId === "string" ? body.intelId : undefined,
    })
    return NextResponse.json({ ...r, lattice_sync: false }, { status: r.ok ? 200 : 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "bounty failed"
    return NextResponse.json({ ok: false, error: message.slice(0, 200), lattice_sync: false }, { status: 500 })
  }
}
