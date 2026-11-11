import { type NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { needsKey, shodanKey, upstreamError } from "@/lib/shodan/server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "shodan:host", requireInSecureMode: true })
  if (denied) return denied

  const { ip } = await request.json().catch(() => ({}) as any)
  if (!ip || typeof ip !== "string") return NextResponse.json({ error: "IP address is required" }, { status: 400 })
  const apiKey = shodanKey()
  if (!apiKey) return needsKey()
  try {
    const r = await fetch(`https://api.shodan.io/shodan/host/${encodeURIComponent(ip)}?key=${encodeURIComponent(apiKey)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
    if (!r.ok) throw new Error(`Shodan API error: ${r.status}`)
    return NextResponse.json(await r.json())
  } catch (e) {
    return upstreamError(e)
  }
}
