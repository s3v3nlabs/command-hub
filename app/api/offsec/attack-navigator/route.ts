export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { buildIdsStatus } from "@/lib/security/ids-status"
import { listEvents as listDeceptionEvents } from "@/lib/offsec/deception/store"
import { buildNavigator, type ObservedEvent } from "@/lib/offsec/attack/navigator"

export async function GET(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "offsec:attack-navigator" })
  if (denied) return denied

  const observed: ObservedEvent[] = []
  try {
    for (const e of buildIdsStatus().events || []) {
      observed.push({ ts: e.ts, source: `ids:${e.source}`, text: e.message, severity: e.severity })
    }
  } catch {
    /* ids ring unavailable */
  }
  try {
    for (const d of listDeceptionEvents(300)) {
      observed.push({ ts: d.ts, source: `deception:${d.kind}`, text: d.message, severity: d.severity })
    }
  } catch {
    /* deception store unavailable */
  }

  const model = buildNavigator(observed)
  return NextResponse.json({ ok: true, ...model, hold: "HOLD_VYRNA_UNSYNC", lattice_sync: false })
}
