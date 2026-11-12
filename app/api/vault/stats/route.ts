export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { vaultStats } from "@/lib/vault/client"

export async function GET(req: NextRequest) {
  const denied = requireHubAuth(req, { surface: "vault-stats" })
  if (denied) return denied
  const result = await vaultStats()
  return NextResponse.json(result, { status: result.ok ? 200 : 503 })
}
