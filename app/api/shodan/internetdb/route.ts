import { type NextRequest, NextResponse } from "next/server"
import { upstreamError } from "@/lib/shodan/server"
import { assertSafeOutboundUrl } from "@/lib/security/request-guard"

export const dynamic = "force-dynamic"

/** InternetDB is Shodan's free, keyless endpoint — works without SHODAN_API_KEY. */
export async function POST(request: NextRequest) {
  const { ip } = await request.json().catch(() => ({}) as { ip?: string })
  if (!ip || typeof ip !== "string" || ip.length > 64) {
    return NextResponse.json({ error: "IP address is required" }, { status: 400 })
  }
  try {
    assertSafeOutboundUrl(`http://${ip}/`)
  } catch {
    return NextResponse.json(
      { error: "target_blocked", detail: "loopback / RFC1918 / link-local / metadata IPs are blocked" },
      { status: 403 },
    )
  }
  try {
    const r = await fetch(`https://internetdb.shodan.io/${encodeURIComponent(ip)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
    if (r.status === 404) {
      return NextResponse.json({ ip, ports: [], cpes: [], hostnames: [], tags: [], vulns: [], note: "No data for this IP" })
    }
    if (!r.ok) throw new Error(`InternetDB API error: ${r.status}`)
    return NextResponse.json(await r.json())
  } catch (e) {
    return upstreamError(e)
  }
}
