/** Client-side parser for "Load your own" map data: GeoJSON, JSON arrays, or CSV with lat/lon columns. */
import type { FeatureCollection, GeoFeature } from "./index"

const LAT_KEYS = ["latitude", "lat", "y"]
const LNG_KEYS = ["longitude", "lng", "lon", "long", "x"]
const NAME_KEYS = ["name", "title", "label", "id", "ip", "ip_address", "host"]

function pick(obj: Record<string, any>, keys: string[]) {
  const lower = Object.fromEntries(Object.keys(obj).map((k) => [k.toLowerCase(), k]))
  for (const k of keys) if (lower[k] !== undefined) return obj[lower[k]]
  return undefined
}

function rowToFeature(row: Record<string, any>, i: number): GeoFeature | null {
  const lat = Number(pick(row, LAT_KEYS))
  const lng = Number(pick(row, LNG_KEYS))
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  const sev = String(pick(row, ["severity", "threat_level", "threat", "level"]) ?? "").toLowerCase()
  const weight = Number(pick(row, ["weight", "value", "count", "confidence", "mag"]))
  return {
    type: "Feature",
    properties: {
      ...row,
      name: String(pick(row, NAME_KEYS) ?? `point ${i + 1}`),
      category: "upload",
      severity: ["low", "medium", "high", "critical"].includes(sev) ? sev : "medium",
      weight: Number.isFinite(weight) ? Math.max(0.05, Math.min(1, weight > 1 ? weight / 10 : weight)) : 0.5,
    },
    geometry: { type: "Point", coordinates: [lng, lat] },
  }
}

export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []
  let field = "", row: string[] = [], q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') q = false
      else field += c
    } else if (c === '"') q = true
    else if (c === ",") { row.push(field); field = "" }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++
      row.push(field); field = ""
      if (row.some((x) => x !== "")) rows.push(row)
      row = []
    } else field += c
  }
  row.push(field)
  if (row.some((x) => x !== "")) rows.push(row)
  const [head, ...body] = rows
  if (!head) return []
  const keys = head.map((h) => h.trim())
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])))
}

/** Returns a FeatureCollection or throws with a readable reason. */
export function parseUpload(fileName: string, text: string): FeatureCollection {
  const lower = fileName.toLowerCase()
  if (lower.endsWith(".csv") || lower.endsWith(".tsv")) {
    const rows = lower.endsWith(".tsv") ? parseCsv(text.replace(/\t/g, ",")) : parseCsv(text)
    const features = rows.map(rowToFeature).filter(Boolean) as GeoFeature[]
    if (!features.length) throw new Error("No rows with latitude/longitude columns (lat, lng/lon) were found.")
    return { type: "FeatureCollection", features }
  }
  let data: any
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error("File is not valid JSON, GeoJSON, or CSV.")
  }
  if (data?.type === "FeatureCollection" && Array.isArray(data.features)) {
    return {
      type: "FeatureCollection",
      features: data.features
        .filter((f: any) => f && f.geometry)
        .map((f: any, i: number) => ({
          type: "Feature",
          properties: { name: f.properties?.name ?? f.properties?.title ?? `feature ${i + 1}`, category: "upload", severity: "medium", weight: 0.5, ...(f.properties || {}) },
          geometry: f.geometry,
        })),
    }
  }
  if (data?.type === "Feature" && data.geometry) return parseUpload(fileName, JSON.stringify({ type: "FeatureCollection", features: [data] }))
  const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : Array.isArray(data?.rows) ? data.rows : null
  if (arr) {
    const features = arr.map((r: any, i: number) => (r && typeof r === "object" ? rowToFeature(r, i) : null)).filter(Boolean) as GeoFeature[]
    if (!features.length) throw new Error("JSON array has no objects with latitude/longitude fields.")
    return { type: "FeatureCollection", features }
  }
  throw new Error("Unrecognised JSON shape. Use GeoJSON, or an array of objects with lat/lng fields.")
}
