export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { recordIdsThreat, type IdsSeverity } from "@/lib/security/ids-status"

/**
 * Ingest a detection event from Edge middleware or local tooling.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const severity = (["info", "low", "medium", "high", "critical"].includes(body?.severity)
      ? body.severity
      : "medium") as IdsSeverity
    const source = typeof body?.source === "string" ? body.source.slice(0, 80) : "middleware"
    const message = typeof body?.message === "string" ? body.message.slice(0, 400) : "unspecified"
    const blocked = Boolean(body?.blocked)
    recordIdsThreat({ severity, source, message, blocked })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "ingest failed" },
      { status: 500 },
    )
  }
}
