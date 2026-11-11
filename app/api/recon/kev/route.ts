import { NextResponse } from "next/server"

// Real, keyless feed: CISA Known Exploited Vulnerabilities catalog.
const KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"

type KevEntry = {
  cveID: string
  vendorProject: string
  product: string
  vulnerabilityName: string
  dateAdded: string
  shortDescription: string
  dueDate: string
  knownRansomwareCampaignUse: string
}

let cache: { at: number; body: unknown } | null = null
const TTL_MS = 60 * 60 * 1000

export async function GET(req: Request) {
  const limit = Math.min(100, Math.max(1, Number(new URL(req.url).searchParams.get("limit")) || 25))
  try {
    if (!cache || Date.now() - cache.at > TTL_MS) {
      const res = await fetch(KEV_URL, { cache: "no-store", signal: AbortSignal.timeout(15000) })
      if (!res.ok) throw new Error(`CISA KEV HTTP ${res.status}`)
      cache = { at: Date.now(), body: await res.json() }
    }
    const data = cache.body as { catalogVersion: string; dateReleased: string; count: number; vulnerabilities: KevEntry[] }
    const items = [...data.vulnerabilities]
      .sort((a, b) => (a.dateAdded < b.dateAdded ? 1 : a.dateAdded > b.dateAdded ? -1 : 0))
      .slice(0, limit)
      .map((v) => ({
        cveId: v.cveID,
        vendor: v.vendorProject,
        product: v.product,
        name: v.vulnerabilityName,
        dateAdded: v.dateAdded,
        dueDate: v.dueDate,
        ransomware: v.knownRansomwareCampaignUse === "Known",
        description: v.shortDescription,
      }))
    return NextResponse.json({
      source: "CISA KEV",
      catalogVersion: data.catalogVersion,
      dateReleased: data.dateReleased,
      total: data.count,
      fetchedAt: new Date(cache.at).toISOString(),
      items,
    })
  } catch (e) {
    return NextResponse.json({ error: `Could not reach the CISA KEV feed: ${(e as Error).message}` }, { status: 502 })
  }
}
