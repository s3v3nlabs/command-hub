import { type NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { needsKey, shodanKey, upstreamError } from "@/lib/shodan/server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "shodan:dns", requireInSecureMode: true })
  if (denied) return denied

  const body = await request.json().catch(() => ({}) as Record<string, unknown>)
  const hostnames = Array.isArray(body.hostnames)
    ? body.hostnames.map((h: unknown) => String(h).slice(0, 253)).slice(0, 50)
    : String(body.hostname || body.host || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 50)

  if (!hostnames.length) return NextResponse.json({ error: "hostname(s) required" }, { status: 400 })

  const apiKey = shodanKey()
  if (!apiKey) return needsKey()
  try {
    const sp = new URLSearchParams({ key: apiKey, hostnames: hostnames.join(",") })
    const r = await fetch(`https://api.shodan.io/dns/resolve?${sp}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
    if (!r.ok) throw new Error(`Shodan API error: ${r.status}`)
    return NextResponse.json(await r.json())
  } catch (e) {
    return upstreamError(e)
  }
}
