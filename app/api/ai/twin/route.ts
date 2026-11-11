export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import {
  buildTwinIndex,
  getTwinStatus,
  queryTwin,
  searchTwin,
} from "@/lib/ai/operator-twin"
import type { OpsProviderId } from "@/lib/ai/ops-router"

function scrub(msg: string): string {
  return msg
    .replace(/sk-[a-zA-Z0-9_-]+/g, "[redacted]")
    .replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "[redacted-jwt]")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/gsk_[a-zA-Z0-9_-]+/g, "[redacted]")
    .slice(0, 400)
}

/**
 * GET /api/ai/twin — status (default) or ?action=search&q=
 * POST /api/ai/twin — { action?: "query"|"refresh"|"search", query?, topK?, provider? }
 * Never returns secret values. HOLD_VYRNA_UNSYNC.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const action = url.searchParams.get("action") || "status"
    if (action === "search") {
      const q = url.searchParams.get("q") || url.searchParams.get("query") || ""
      const topK = Math.min(20, Math.max(1, Number(url.searchParams.get("topK") || 6)))
      const status = getTwinStatus()
      if (!status.indexed) buildTwinIndex()
      return NextResponse.json({
        ok: true,
        action: "search",
        query: q,
        sources: searchTwin(q, topK),
        lattice_sync: false,
        hold: "HOLD_VYRNA_UNSYNC",
      })
    }
    return NextResponse.json(getTwinStatus())
  } catch (err) {
    const message = err instanceof Error ? err.message : "twin status failed"
    return NextResponse.json({ ok: false, error: scrub(message) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const action = String(body.action || "query")

    if (action === "refresh") {
      const meta = buildTwinIndex({ force: true })
      return NextResponse.json({
        ok: true,
        action: "refresh",
        meta,
        lattice_sync: false,
        hold: "HOLD_VYRNA_UNSYNC",
      })
    }

    if (action === "search") {
      const q = String(body.query || body.q || "")
      const topK = Math.min(20, Math.max(1, Number(body.topK || 6)))
      const status = getTwinStatus()
      if (!status.indexed) buildTwinIndex()
      return NextResponse.json({
        ok: true,
        action: "search",
        query: q,
        sources: searchTwin(q, topK),
        lattice_sync: false,
        hold: "HOLD_VYRNA_UNSYNC",
      })
    }

    const query = String(body.query || body.prompt || "")
    if (!query.trim()) {
      return NextResponse.json({ ok: false, error: "query required" }, { status: 400 })
    }
    const topK = body.topK != null ? Number(body.topK) : undefined
    const provider = body.provider as OpsProviderId | undefined
    const result = await queryTwin({ query, topK, provider })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "twin query failed"
    return NextResponse.json({ ok: false, error: scrub(message) }, { status: 500 })
  }
}
