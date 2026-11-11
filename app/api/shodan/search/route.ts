import { type NextRequest, NextResponse } from "next/server"
import { needsKey, shodanKey, upstreamError } from "@/lib/shodan/server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const { query, facets, page = 1 } = await request.json().catch(() => ({}) as any)
  const apiKey = shodanKey()
  if (!apiKey) return needsKey()
  try {
    const sp = new URLSearchParams({ key: apiKey, query: String(query || ""), page: String(page) })
    if (Array.isArray(facets) && facets.length) sp.append("facets", facets.join(","))
    const r = await fetch(`https://api.shodan.io/shodan/host/search?${sp}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
    if (!r.ok) throw new Error(`Shodan API error: ${r.status}`)
    return NextResponse.json(await r.json())
  } catch (e) {
    return upstreamError(e)
  }
}
