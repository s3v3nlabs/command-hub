export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { buildEnrichment } from "@/lib/offsec/osint/enrich"

export async function POST(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "offsec:osint-enrich" })
  if (denied) return denied
  const body = await request.json().catch(() => ({}))
  const result = buildEnrichment(String(body.target || ""))
  if ("error" in result) return NextResponse.json({ ok: false, ...result }, { status: 400 })
  return NextResponse.json({ ok: true, ...result, hold: "HOLD_VYRNA_UNSYNC", lattice_sync: false })
}
