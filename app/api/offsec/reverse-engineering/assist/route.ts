export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { runAssist } from "@/lib/offsec/re-workbench/assist"
import type { EvidenceRecord } from "@/lib/offsec/re-workbench/types"

/** Explain selected evidence with the LOCAL model only. Defensive posture; no weaponized output. */
export async function POST(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "offsec:re", requireInSecureMode: true })
  if (denied) return denied
  const body = await request.json().catch(() => ({}))
  const evidence = (Array.isArray(body.evidence) ? body.evidence : [])
    .filter((e: unknown): e is EvidenceRecord => !!e && typeof e === "object" && typeof (e as EvidenceRecord).id === "string")
    .slice(0, 12)
  const r = await runAssist(evidence, typeof body.question === "string" ? body.question.slice(0, 2000) : undefined)
  return NextResponse.json(r)
}
