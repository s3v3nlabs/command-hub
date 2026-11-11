export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { listRuns, recordRun, replayRun, deleteRun, type ReplayEventInput } from "@/lib/offsec/replay/replay"

const EXAMPLE_EVENTS: ReplayEventInput[] = [
  { label: "SQLi probe", kind: "http", method: "GET", path: "/api/items", search: "id=1' OR 1=1--", expectDetection: true, expectTechnique: "T1190" },
  { label: "Path traversal", kind: "http", method: "GET", path: "/download", search: "file=../../etc/passwd", expectDetection: true },
  { label: "XSS probe", kind: "http", method: "POST", path: "/comment", body: "<script>alert(1)</script>", expectDetection: true },
  { label: "Brute force signal", kind: "signal", text: "repeated failed logins / password spray", expectTechnique: "T1110" },
  { label: "Benign request", kind: "http", method: "GET", path: "/health", expectDetection: false },
]

export async function GET(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "offsec:replay" })
  if (denied) return denied
  return NextResponse.json({ ok: true, runs: listRuns(), exampleEvents: EXAMPLE_EVENTS, hold: "HOLD_VYRNA_UNSYNC", lattice_sync: false })
}

export async function POST(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "offsec:replay", requireInSecureMode: true })
  if (denied) return denied
  const body = await request.json().catch(() => ({}))
  const action = String(body.action || "")

  if (action === "record") {
    const events: ReplayEventInput[] = Array.isArray(body.events) && body.events.length ? body.events : EXAMPLE_EVENTS
    const r = recordRun({ name: body.name, description: body.description, events })
    return NextResponse.json(r, { status: r.ok ? 200 : 400 })
  }
  if (action === "replay") {
    const r = replayRun(String(body.id || ""))
    return NextResponse.json(r, { status: r.ok ? 200 : 404 })
  }
  if (action === "delete") {
    return NextResponse.json({ ok: deleteRun(String(body.id || "")) })
  }
  return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 })
}
