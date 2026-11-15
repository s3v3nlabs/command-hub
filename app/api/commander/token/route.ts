export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { commanderTokenConfigured, mintCommanderToken } from "@/lib/security/commander-token"

/**
 * POST /api/commander/token — the authenticated Commander mints a single-use approval token
 * bound to { action, target, ref? }. Hub auth is always required (requireInSecureMode), and
 * COMMANDER_TOKEN_SECRET must be set; otherwise 403/503 (fail closed).
 * Christian Wilford (s3v3n), Founder, Singular/ty Defense Solutions, LLC.
 */
export async function POST(req: Request) {
  const denied = requireHubAuth(req, { surface: "commander-token", requireInSecureMode: true })
  if (denied) return denied
  if (!commanderTokenConfigured()) return NextResponse.json({ ok: false, error: "commander_token_secret_not_configured" }, { status: 503 })
  const b = (await req.json().catch(() => null)) as { action?: unknown; target?: unknown; ref?: unknown; ttlMs?: unknown } | null
  if (!b || typeof b.action !== "string" || typeof b.target !== "string" || !b.action.trim() || !b.target.trim()) {
    return NextResponse.json({ ok: false, error: "action_and_target_required" }, { status: 400 })
  }
  const token = mintCommanderToken({
    action: b.action,
    target: b.target,
    ref: typeof b.ref === "string" ? b.ref : null,
    ttlMs: typeof b.ttlMs === "number" ? b.ttlMs : undefined,
  })
  return NextResponse.json({ ok: true, token })
}
