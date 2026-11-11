export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { assertBound, getSession } from "@/lib/offsec/re-workbench/session"
import { resolveTarget } from "@/lib/offsec/re-workbench/targets"
import { runStaticOp } from "@/lib/offsec/re-workbench/analyze"
import { STATIC_OPS, type StaticOp } from "@/lib/offsec/re-workbench/types"

/** Read-only static analysis on the session-bound engine. Returns an EvidenceRecord. */
export async function POST(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "offsec:re", requireInSecureMode: true })
  if (denied) return denied
  const body = await request.json().catch(() => ({}))
  const op = String(body.op || "") as StaticOp
  if (!STATIC_OPS.includes(op)) return NextResponse.json({ ok: false, error: `op must be one of ${STATIC_OPS.join(", ")}` }, { status: 400 })
  const session = getSession()
  if (!session) return NextResponse.json({ ok: false, error: "no_session: bind an engine to a target first" }, { status: 409 })
  const resolved = resolveTarget(session.targetSha256)
  if (!resolved) return NextResponse.json({ ok: false, error: "bound target no longer exists" }, { status: 404 })
  const bad = assertBound(session.engine, resolved.target.sha256)
  if (bad) return NextResponse.json({ ok: false, error: bad }, { status: 409 })
  const evidence = await runStaticOp({
    engine: session.engine,
    target: resolved.target,
    absPath: resolved.absPath,
    op,
    subject: body.subject,
    noCache: !!body.noCache,
    session,
  })
  return NextResponse.json({ ok: evidence.kind !== "error", evidence })
}
