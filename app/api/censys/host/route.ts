import { type NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { censysCreds, needsCensysKey, upstreamError, censysAuthHeader } from "@/lib/censys/server"
import { assertSafeOutboundUrl } from "@/lib/security/request-guard"

export const dynamic = "force-dynamic"

function looksLikeIp(s: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(s) || /^[0-9a-fA-F:]+$/.test(s)
}

export async function POST(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "censys:host", requireInSecureMode: true })
  if (denied) return denied

  const body = await request.json().catch(() => ({}) as Record<string, unknown>)
  const ip = String(body.ip || body.host || "").trim()
  if (!ip || !looksLikeIp(ip) || ip.length > 64) {
    return NextResponse.json({ error: "valid ip required" }, { status: 400 })
  }

  try {
    assertSafeOutboundUrl(`http://${ip}/`)
  } catch {
    return NextResponse.json(
      { error: "target_blocked", detail: "loopback / RFC1918 / link-local / metadata IPs are blocked" },
      { status: 403 },
    )
  }

  const creds = censysCreds()
  if (!creds) return needsCensysKey()

  try {
    const r = await fetch(`https://search.censys.io/api/v2/hosts/${encodeURIComponent(ip)}`, {
      headers: { Accept: "application/json", Authorization: censysAuthHeader(creds) },
      cache: "no-store",
    })
    if (r.status === 404) return NextResponse.json({ ip, note: "not found", result: null })
    if (!r.ok) throw new Error(`Censys API error: ${r.status}`)
    return NextResponse.json(await r.json())
  } catch (e) {
    return upstreamError(e)
  }
}
