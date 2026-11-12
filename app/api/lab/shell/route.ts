export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { listLabVerbs, runLabVerb } from "@/lib/offsec/lab-exec"

/**
 * Operator lab shell — runs allowlisted verbs on THIS hub host.
 * Read-only / diagnostic commands only (the allowlist has no install, rm, or
 * nft-add). Hub auth required. This is the real backend for /linux-terminal.
 */
export async function GET(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "lab:shell" })
  if (denied) return denied
  return NextResponse.json({ ok: true, verbs: listLabVerbs(), host: "localhost" })
}

export async function POST(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "lab:shell", requireInSecureMode: true })
  if (denied) return denied
  const body = await request.json().catch(() => ({}))
  const verb = String(body.verb || body.command || "").trim()
  if (!verb) return NextResponse.json({ ok: false, error: "verb required" }, { status: 400 })
  const result = await runLabVerb(verb, body.arg != null ? String(body.arg) : undefined)
  return NextResponse.json({ ok: result.ok, result }, { status: result.ok || result.stdout ? 200 : 400 })
}
