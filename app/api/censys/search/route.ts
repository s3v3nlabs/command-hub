import { type NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { censysCreds, needsCensysKey, upstreamError, censysAuthHeader } from "@/lib/censys/server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "censys:search", requireInSecureMode: true })
  if (denied) return denied

  const body = await request.json().catch(() => ({}) as Record<string, unknown>)
  const q = String(body.q || body.query || "").slice(0, 2048)
  const perPage = Math.min(Math.max(Number(body.per_page) || 25, 1), 100)
  const cursor = typeof body.cursor === "string" ? body.cursor.slice(0, 512) : ""
  const index = body.index === "certificates" ? "certificates" : "hosts"

  if (!q.trim()) return NextResponse.json({ error: "query required" }, { status: 400 })

  const creds = censysCreds()
  if (!creds) return needsCensysKey()

  try {
    const sp = new URLSearchParams({ q, per_page: String(perPage) })
    if (cursor) sp.set("cursor", cursor)
    const r = await fetch(`https://search.censys.io/api/v2/${index}/search?${sp}`, {
      headers: { Accept: "application/json", Authorization: censysAuthHeader(creds) },
      cache: "no-store",
    })
    if (!r.ok) {
      const t = await r.text().catch(() => "")
      throw new Error(`Censys API error: ${r.status} ${t.slice(0, 160)}`)
    }
    return NextResponse.json(await r.json())
  } catch (e) {
    return upstreamError(e)
  }
}
