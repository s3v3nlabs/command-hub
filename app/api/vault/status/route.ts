export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { vaultHealth, vaultStats, vaultBaseUrl, vaultToken } from "@/lib/vault/client"

export async function GET() {
  const health = await vaultHealth()
  const stats = health.ok ? await vaultStats() : null
  return NextResponse.json({
    ok: health.ok,
    degraded: !health.ok,
    reason: health.ok ? undefined : health.reason,
    service: vaultBaseUrl(),
    tokenConfigured: Boolean(vaultToken()),
    health,
    stats: stats && stats.ok ? stats : null,
  })
}
