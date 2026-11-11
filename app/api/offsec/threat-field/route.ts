export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { buildThreatField } from "@/lib/offsec/threat-engine"
import type { ThreatFieldInput } from "@/lib/offsec/threat-engine"

/**
 * Threat-field engine. Returns modeled Nash / Fourier / Monte-Carlo results.
 * Read-only math — no outbound network calls. Auth-gated in SECURE_MODE.
 */
export async function GET(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "offsec:threat-field", requireInSecureMode: true })
  if (denied) return denied
  const report = buildThreatField()
  return NextResponse.json({ ok: true, report })
}

export async function POST(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "offsec:threat-field", requireInSecureMode: true })
  if (denied) return denied
  const body = (await request.json().catch(() => ({}))) as ThreatFieldInput
  const trials = body.trials != null ? Math.min(Math.max(Number(body.trials) || 800, 50), 5000) : undefined
  const horizon = body.horizon != null ? Math.min(Math.max(Number(body.horizon) || 48, 5), 500) : undefined
  const seed = body.seed != null ? Number(body.seed) || 20261111 : undefined
  const report = buildThreatField({
    zones: Array.isArray(body.zones) ? body.zones.slice(0, 64) : undefined,
    events: Array.isArray(body.events) ? body.events.slice(0, 5000) : undefined,
    attackerActions: body.attackerActions,
    defenderActions: body.defenderActions,
    payoff: body.payoff,
    trials,
    horizon,
    seed,
  })
  return NextResponse.json({ ok: true, report })
}
