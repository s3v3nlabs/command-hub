import { NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { censysCreds, needsCensysKey, upstreamError, censysAuthHeader } from "@/lib/censys/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const denied = requireHubAuth(request, { surface: "censys:status", requireInSecureMode: true })
  if (denied) return denied

  const creds = censysCreds()
  if (!creds) return needsCensysKey()
  try {
    const r = await fetch("https://search.censys.io/api/v2/account", {
      headers: { Accept: "application/json", Authorization: censysAuthHeader(creds) },
      cache: "no-store",
    })
    if (!r.ok) throw new Error(`Censys API error: ${r.status}`)
    return NextResponse.json({ ...(await r.json()), configured: true })
  } catch (e) {
    return upstreamError(e)
  }
}
