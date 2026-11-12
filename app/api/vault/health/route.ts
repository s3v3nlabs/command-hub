export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { vaultHealth, vaultBaseUrl } from "@/lib/vault/client"

export async function GET() {
  const result = await vaultHealth()
  const status = result.ok ? 200 : 503
  return NextResponse.json(
    { ...result, service: vaultBaseUrl() },
    { status },
  )
}
