import { NextResponse } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"
import { fetchPack, getPack, type FeatureCollection } from "@/lib/data-packs"

export const dynamic = "force-dynamic"

const dir = () => path.join(process.cwd(), "public", "data-packs")
const memo = new Map<string, { at: number; fc: FeatureCollection }>()
const LIVE_TTL_MS = 10 * 60 * 1000

async function readCached(id: string): Promise<FeatureCollection | null> {
  try {
    return JSON.parse(await fs.readFile(path.join(dir(), `${id}.geojson`), "utf8"))
  } catch {
    return null
  }
}

/**
 * GET /api/data-packs/:id          -> cached copy shipped in public/data-packs
 * GET /api/data-packs/:id?live=1   -> fresh copy from the public source (10-min memo), cached fallback
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const pack = getPack(id)
  if (!pack) return NextResponse.json({ error: "unknown pack" }, { status: 404 })
  const wantLive = new URL(req.url).searchParams.get("live") === "1" && pack.live
  if (wantLive) {
    const hit = memo.get(id)
    if (hit && Date.now() - hit.at < LIVE_TTL_MS) {
      return NextResponse.json({ ...hit.fc, meta: { id, mode: "live", fetchedAt: new Date(hit.at).toISOString() } })
    }
    try {
      const countries = id === "feodo-c2-by-country" ? (await readCached("natural-earth-countries")) ?? undefined : undefined
      const fc = await fetchPack(id, { countries })
      memo.set(id, { at: Date.now(), fc })
      return NextResponse.json({ ...fc, meta: { id, mode: "live", fetchedAt: new Date().toISOString() } })
    } catch (e) {
      const cached = await readCached(id)
      if (cached) return NextResponse.json({ ...cached, meta: { id, mode: "cached", liveError: (e as Error).message } })
      return NextResponse.json({ error: (e as Error).message }, { status: 502 })
    }
  }
  const cached = await readCached(id)
  if (!cached) return NextResponse.json({ error: "pack not cached; run node scripts/update-data-packs.mjs" }, { status: 404 })
  return NextResponse.json({ ...cached, meta: { id, mode: "cached" } })
}
