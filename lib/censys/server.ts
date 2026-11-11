import { NextResponse } from "next/server"

/** Shared helpers for Censys Search API v2 proxy routes. */
export function censysCreds(): { id: string; secret: string } | null {
  const id = process.env.CENSYS_API_ID?.trim() || ""
  const secret = process.env.CENSYS_API_SECRET?.trim() || ""
  if (!id || !secret) return null
  return { id, secret }
}

export function needsCensysKey() {
  return NextResponse.json(
    {
      error: "CENSYS_API_ID / CENSYS_API_SECRET not configured",
      needsKey: ["CENSYS_API_ID", "CENSYS_API_SECRET"],
      configured: false,
    },
    { status: 503 },
  )
}

export function upstreamError(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e)
  return NextResponse.json({ error: msg.slice(0, 300), configured: true }, { status: 502 })
}

export function censysAuthHeader(creds: { id: string; secret: string }): string {
  return "Basic " + Buffer.from(`${creds.id}:${creds.secret}`).toString("base64")
}
