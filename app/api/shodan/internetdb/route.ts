import { type NextRequest, NextResponse } from "next/server"
import { upstreamError } from "@/lib/shodan/server"

export const dynamic = "force-dynamic"

/** InternetDB is Shodan's free, keyless endpoint — works without SHODAN_API_KEY. */
export async function POST(request: NextRequest) {
  const { ip } = await request.json().catch(() => ({}) as any)
  if (!ip || typeof ip !== "string") return NextResponse.json({ error: "IP address is required" }, { status: 400 })
  try {
    const r = await fetch(`https://internetdb.shodan.io/${encodeURIComponent(ip)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
    if (r.status === 404) return NextResponse.json({ ip, ports: [], cpes: [], hostnames: [], tags: [], vulns: [], note: "No data for this IP" })
    if (!r.ok) throw new Error(`InternetDB API error: ${r.status}`)
    return NextResponse.json(await r.json())
  } catch (e) {
    return upstreamError(e)
  }
}
