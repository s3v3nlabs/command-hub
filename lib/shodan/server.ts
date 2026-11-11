import { NextResponse } from "next/server"

/** Shared helpers for the Shodan proxy routes. No mock data — callers get an honest status. */
export function shodanKey(): string | null {
  const k = process.env.SHODAN_API_KEY
  return k && k.trim() ? k.trim() : null
}

export function needsKey() {
  return NextResponse.json(
    { error: "SHODAN_API_KEY not configured", needsKey: "SHODAN_API_KEY", configured: false },
    { status: 503 },
  )
}

export function upstreamError(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e)
  return NextResponse.json({ error: msg.slice(0, 300), configured: true }, { status: 502 })
}
