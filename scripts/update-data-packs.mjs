#!/usr/bin/env node
/**
 * Refresh the cached geo data packs in public/data-packs/ from their public sources.
 *   node scripts/update-data-packs.mjs            # all packs
 *   node scripts/update-data-packs.mjs usgs-earthquakes noaa-alerts
 * Writes <id>.geojson plus manifest.json (name, source, license, updated, size, feature count).
 * Fails soft per pack: a pack that can't be fetched keeps its previous cached copy.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { PACKS, fetchPack } from "../lib/data-packs/packs.mjs"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const dir = path.join(root, "public", "data-packs")
fs.mkdirSync(dir, { recursive: true })
const manifestPath = path.join(dir, "manifest.json")
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : { packs: [] }
const prev = new Map((manifest.packs || []).map((p) => [p.id, p]))

const wanted = process.argv.slice(2)
const ids = PACKS.map((p) => p.id).filter((id) => !wanted.length || wanted.includes(id))
// Countries first: other packs are placed on its centroids.
ids.sort((a, b) => (a === "natural-earth-countries" ? -1 : b === "natural-earth-countries" ? 1 : 0))

let countries = null
const cpath = path.join(dir, "natural-earth-countries.geojson")
if (fs.existsSync(cpath)) countries = JSON.parse(fs.readFileSync(cpath, "utf8"))

let failed = 0
for (const id of ids) {
  const meta = PACKS.find((p) => p.id === id)
  try {
    const fc = await fetchPack(id, { countries })
    const body = JSON.stringify(fc)
    fs.writeFileSync(path.join(dir, `${id}.geojson`), body)
    if (id === "natural-earth-countries") countries = fc
    prev.set(id, { ...meta, file: `/data-packs/${id}.geojson`, updated: new Date().toISOString(), features: fc.features.length, bytes: Buffer.byteLength(body) })
    console.log(`✓ ${id}: ${fc.features.length} features, ${(Buffer.byteLength(body) / 1024).toFixed(0)} KB`)
  } catch (e) {
    failed++
    console.error(`✗ ${id}: ${e.message} (kept previous cache)`)
  }
}

const out = {
  note: "Cached public datasets for the map modules. Refresh with: node scripts/update-data-packs.mjs",
  generated: new Date().toISOString(),
  packs: PACKS.map((p) => prev.get(p.id)).filter(Boolean),
}
fs.writeFileSync(manifestPath, JSON.stringify(out, null, 2) + "\n")
const total = out.packs.reduce((s, p) => s + (p.bytes || 0), 0)
console.log(`manifest: ${out.packs.length} packs, ${(total / 1024).toFixed(0)} KB total`)
process.exit(failed && failed === ids.length ? 1 : 0)
