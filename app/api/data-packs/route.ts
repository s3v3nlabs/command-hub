import { NextResponse } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"
import { PACKS } from "@/lib/data-packs"

export const dynamic = "force-dynamic"

/** Manifest of cached geo data packs (public/data-packs/manifest.json), merged with pack metadata. */
export async function GET() {
  let cached: any = { packs: [] }
  try {
    cached = JSON.parse(await fs.readFile(path.join(process.cwd(), "public", "data-packs", "manifest.json"), "utf8"))
  } catch {}
  const byId = new Map((cached.packs || []).map((p: any) => [p.id, p]))
  return NextResponse.json({
    generated: cached.generated || null,
    packs: PACKS.map((p) => ({ ...p, ...((byId.get(p.id) as object) || {}), cached: byId.has(p.id) })),
  })
}
