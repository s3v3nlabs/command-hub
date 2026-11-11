import { type NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { needsKey, shodanKey, upstreamError } from "@/lib/shodan/server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "shodan:count", requireInSecureMode: true })
  if (denied) return denied

  const body = await request.json().catch(() => ({}) as Record<string, unknown>)
  const query = String(body.query || body.q || "").slice(0, 2048)
  if (!query.trim()) return NextResponse.json({ error: "query required" }, { status: 400 })

  const apiKey = shodanKey()
  if (!apiKey) return needsKey()
  try {
    const sp = new URLSearchParams({ key: apiKey, query })
    if (Array.isArray(body.facets) && body.facets.length) {
      sp.append("facets", body.facets.map(String).slice(0, 20).join(","))
    }
    const r = await fetch(`https://api.shodan.io/shodan/host/count?${sp}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
    if (!r.ok) throw new Error(`Shodan API error: ${r.status}`)
    return NextResponse.json(await r.json())
  } catch (e) {
    return upstreamError(e)
  }
}
