import { NextResponse } from "next/server"
import { needsKey, shodanKey, upstreamError } from "@/lib/shodan/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const apiKey = shodanKey()
  if (!apiKey) return needsKey()
  try {
    const r = await fetch(`https://api.shodan.io/api-info?key=${encodeURIComponent(apiKey)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
    if (!r.ok) throw new Error(`Shodan API error: ${r.status}`)
    return NextResponse.json({ ...(await r.json()), configured: true })
  } catch (e) {
    return upstreamError(e)
  }
}
