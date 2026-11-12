export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { vaultConversation } from "@/lib/vault/client"

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = requireHubAuth(req, { surface: "vault-conversation" })
  if (denied) return denied
  const { id } = await ctx.params
  if (!id) {
    return NextResponse.json({ ok: false, error: "id required" }, { status: 400 })
  }
  const limit = Number(req.nextUrl.searchParams.get("limit") || 400) || 400
  const result = await vaultConversation(id, limit)
  return NextResponse.json(result, { status: result.ok ? 200 : result.degraded ? 503 : 404 })
}
