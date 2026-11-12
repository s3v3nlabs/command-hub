export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { vaultConversations } from "@/lib/vault/client"

export async function GET(req: NextRequest) {
  const denied = requireHubAuth(req, { surface: "vault-conversations" })
  if (denied) return denied
  const url = req.nextUrl
  const result = await vaultConversations({
    profile: url.searchParams.get("profile") || undefined,
    limit: Number(url.searchParams.get("limit") || 50) || 50,
    offset: Number(url.searchParams.get("offset") || 0) || 0,
  })
  return NextResponse.json(result, { status: result.ok ? 200 : 503 })
}
