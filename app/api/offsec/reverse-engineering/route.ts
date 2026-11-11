export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { engineStatuses } from "@/lib/offsec/re-workbench/engines"
import { getSession } from "@/lib/offsec/re-workbench/session"
import { listTargets } from "@/lib/offsec/re-workbench/targets"
import { dynamicStage1Enabled } from "@/lib/offsec/re-workbench/policy"

/** Workbench status: engines (honest availability), bound session, targets. */
export async function GET(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "offsec:re", requireInSecureMode: true })
  if (denied) return denied
  const probeRea = request.nextUrl.searchParams.get("probe") === "1"
  return NextResponse.json({
    ok: true,
    engines: await engineStatuses({ probeRea }),
    session: getSession(),
    targets: listTargets(),
    dynamicStage1Enabled: dynamicStage1Enabled(),
    principles: ["evidence over answers", "one provider per session, never silently swapped", "static by default; dynamic is ladder-gated"],
  })
}
