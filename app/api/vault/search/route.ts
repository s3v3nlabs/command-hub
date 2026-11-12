export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { vaultSearch } from "@/lib/vault/client"

export async function GET(req: NextRequest) {
  const denied = requireHubAuth(req, { surface: "vault-search" })
  if (denied) return denied
  const url = req.nextUrl
  const query = (url.searchParams.get("q") || url.searchParams.get("query") || "").trim()
  if (!query) {
    return NextResponse.json({ ok: false, error: "query required", count: 0, hits: [] }, { status: 400 })
  }
  const limit = Number(url.searchParams.get("limit") || 20)
  const result = await vaultSearch({
    query,
    limit: Number.isFinite(limit) ? limit : 20,
    role: url.searchParams.get("role") || undefined,
    conversation_id: url.searchParams.get("conversation_id") || undefined,
    since: url.searchParams.get("since") || undefined,
    until: url.searchParams.get("until") || undefined,
  })
  const status = result.ok ? 200 : result.degraded ? 503 : 400
  return NextResponse.json(result, { status })
}

export async function POST(req: NextRequest) {
  const denied = requireHubAuth(req, { surface: "vault-search" })
  if (denied) return denied
  let body: Record<string, unknown> = {}
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    body = {}
  }
  const query = String(body.q || body.query || "").trim()
  if (!query) {
    return NextResponse.json({ ok: false, error: "query required", count: 0, hits: [] }, { status: 400 })
  }
  const result = await vaultSearch({
    query,
    limit: typeof body.limit === "number" ? body.limit : Number(body.limit || 20),
    role: body.role ? String(body.role) : undefined,
    conversation_id: body.conversation_id ? String(body.conversation_id) : undefined,
    since: body.since ? String(body.since) : undefined,
    until: body.until ? String(body.until) : undefined,
  })
  const status = result.ok ? 200 : result.degraded ? 503 : 400
  return NextResponse.json(result, { status })
}
