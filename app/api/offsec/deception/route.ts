export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import {
  createCanary,
  fingerprintFrom,
  listCanaries,
  listDecoys,
  listEvents,
  listProfiles,
  listSamples,
  recordDecoyHit,
} from "@/lib/offsec/deception/store"
import { readEyesOnly, isHeimdallKeyConfigured } from "@/lib/heimdall/eyes-only"
import { GLYPH_SKIN_DISCLAIMER, toGlyphstream } from "@/lib/heimdall/glyph-skin"

export async function GET(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "offsec:deception", requireInSecureMode: true })
  if (denied) return denied
  const sp = request.nextUrl.searchParams
  if (sp.get("eyesOnly") === "1") {
    const token = request.headers.get("x-heimdall-token") || request.headers.get("authorization")?.replace(/^Bearer /i, "") || null
    const r = readEyesOnly(token, Number(sp.get("limit")) || 100)
    return NextResponse.json({ ok: true, ...r, glyphSkinDisclaimer: GLYPH_SKIN_DISCLAIMER })
  }
  return NextResponse.json({
    ok: true,
    heimdallKeyConfigured: isHeimdallKeyConfigured(),
    decoys: listDecoys(),
    canaries: listCanaries().map((c) => ({ ...c, tokenGlyph: toGlyphstream(c.token) })),
    profiles: listProfiles(),
    samples: listSamples(),
    events: listEvents(Number(sp.get("limit")) || 100),
    glyphSkinDisclaimer: GLYPH_SKIN_DISCLAIMER,
  })
}

export async function POST(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "offsec:deception", requireInSecureMode: true })
  if (denied) return denied
  const body = await request.json().catch(() => ({}))
  const action = String(body.action || "")

  // Simulated attacker interaction with a decoy (e.g. a test harness or a real
  // honeypot front-end reporting a hit). This records an attack EVENT; it does
  // not expose a real host USB/serial stack — only the emulated interface surface.
  if (action === "decoy_hit") {
    const fp = fingerprintFrom({ ua: request.headers.get("user-agent") || "", tooling: body.tooling })
    const ev = recordDecoyHit(String(body.decoyId || ""), {
      fingerprint: fp,
      tooling: body.tooling,
      source: body.source,
      meta: body.meta,
    })
    return NextResponse.json({ ok: true, event: ev, fingerprint: fp })
  }

  if (action === "create_canary") {
    const c = createCanary({ label: String(body.label || "canary"), placement: String(body.placement || ""), engagementId: body.engagementId })
    return NextResponse.json({ ok: true, canary: { ...c, tokenGlyph: toGlyphstream(c.token) } })
  }

  return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 })
}
