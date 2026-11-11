/**
 * Geo data packs: small, license-clean public datasets for the map modules.
 * Shared by scripts/update-data-packs.mjs (writes public/data-packs/) and
 * app/api/data-packs (live refresh with cached fallback). Plain ESM, no deps.
 *
 * Every pack normalises to a GeoJSON FeatureCollection. Point features carry
 * `name`, `category`, `weight` (0..1) and `severity` (low|medium|high|critical)
 * so all map renderers can colour/size them the same way.
 */

const UA = "command-hub-data-packs/1.0 (+https://github.com/s3v3nlabs/command-hub)"

const round = (n, d = 3) => Math.round(n * 10 ** d) / 10 ** d

function roundCoords(c, d) {
  return typeof c[0] === "number" ? [round(c[0], d), round(c[1], d)] : c.map((x) => roundCoords(x, d))
}

// Approximate geographic centres of US states + DC/PR (public-domain reference values).
export const US_STATE_CENTROIDS = {
  AL: [-86.8, 32.8], AK: [-152.3, 64.2], AZ: [-111.7, 34.3], AR: [-92.4, 34.9], CA: [-119.5, 37.2],
  CO: [-105.5, 39.0], CT: [-72.7, 41.6], DE: [-75.5, 39.0], FL: [-81.7, 28.6], GA: [-83.4, 32.7],
  HI: [-157.0, 20.8], ID: [-114.6, 44.4], IL: [-89.2, 40.0], IN: [-86.3, 39.9], IA: [-93.5, 42.1],
  KS: [-98.4, 38.5], KY: [-85.3, 37.5], LA: [-91.9, 31.1], ME: [-69.2, 45.4], MD: [-76.8, 39.0],
  MA: [-71.8, 42.3], MI: [-85.4, 44.3], MN: [-94.3, 46.3], MS: [-89.7, 32.7], MO: [-92.5, 38.4],
  MT: [-109.6, 47.0], NE: [-99.8, 41.5], NV: [-116.6, 39.3], NH: [-71.6, 43.7], NJ: [-74.7, 40.2],
  NM: [-106.1, 34.4], NY: [-75.5, 42.9], NC: [-79.4, 35.6], ND: [-100.5, 47.5], OH: [-82.8, 40.3],
  OK: [-97.5, 35.6], OR: [-120.6, 43.9], PA: [-77.8, 40.9], RI: [-71.5, 41.7], SC: [-80.9, 33.9],
  SD: [-100.2, 44.4], TN: [-86.3, 35.9], TX: [-99.3, 31.5], UT: [-111.7, 39.3], VT: [-72.7, 44.1],
  VA: [-78.8, 37.5], WA: [-120.4, 47.4], WV: [-80.6, 38.6], WI: [-89.8, 44.6], WY: [-107.6, 43.0],
  DC: [-77.0, 38.9], PR: [-66.5, 18.2], GU: [144.8, 13.4], VI: [-64.8, 18.3], AS: [-170.7, -14.3],
}

// Rough centres of NWS marine forecast areas (UGC prefixes that aren't states).
export const NWS_MARINE_CENTROIDS = {
  PK: [-150.0, 58.0], PH: [-157.5, 21.0], PZ: [-125.0, 40.0], PM: [145.5, 15.0], PS: [-171.0, -14.0],
  GM: [-89.0, 27.5], AM: [-76.0, 32.0], AN: [-71.0, 41.5],
  LS: [-87.5, 47.5], LM: [-87.0, 43.5], LH: [-82.5, 44.8], LE: [-81.2, 42.2], LO: [-77.8, 43.6], LC: [-82.7, 42.5],
}

export const PACKS = [
  {
    id: "natural-earth-countries",
    name: "Natural Earth countries (1:110m)",
    description: "Simplified country polygons with ISO codes, continent and population estimate. Also used to place country-level data.",
    kind: "polygons",
    source: "https://github.com/nvkelso/natural-earth-vector",
    sourceUrl: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson",
    license: "Public domain (Natural Earth)",
    live: false,
  },
  {
    id: "usgs-earthquakes",
    name: "USGS earthquakes M2.5+ (past 7 days)",
    description: "Every M2.5+ earthquake worldwide in the last week. Weight scales with magnitude.",
    kind: "points",
    source: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php",
    sourceUrl: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson",
    license: "Public domain (U.S. Geological Survey)",
    live: true,
  },
  {
    id: "feodo-c2-by-country",
    name: "abuse.ch Feodo Tracker botnet C2s (by country)",
    description: "Botnet C2 servers on the Feodo Tracker recommended blocklist, aggregated to country centroids (country-level location only; no IP geolocation).",
    kind: "points",
    source: "https://feodotracker.abuse.ch/blocklist/",
    sourceUrl: "https://feodotracker.abuse.ch/downloads/ipblocklist.json",
    license: "CC0 (abuse.ch)",
    live: true,
  },
  {
    id: "noaa-alerts",
    name: "NOAA / NWS active weather alerts (US)",
    description: "Active National Weather Service alerts. Alerts with a polygon keep it; zone-based alerts are placed at the state or marine-area centre (approximate location).",
    kind: "mixed",
    source: "https://www.weather.gov/documentation/services-web-api",
    sourceUrl: "https://api.weather.gov/alerts/active?status=actual&message_type=alert",
    license: "Public domain (U.S. National Weather Service)",
    live: true,
  },
]

export function getPack(id) {
  return PACKS.find((p) => p.id === id) || null
}

async function getJson(url, accept = "application/json") {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: accept }, signal: AbortSignal.timeout(30000) })
  if (!res.ok) throw new Error(`${new URL(url).host} HTTP ${res.status}`)
  return res.json()
}

export function normalizeCountries(raw) {
  return {
    type: "FeatureCollection",
    features: raw.features.map((f) => {
      const p = f.properties
      const iso2 = p.ISO_A2_EH && p.ISO_A2_EH !== "-99" ? p.ISO_A2_EH : p.ISO_A2
      return {
        type: "Feature",
        properties: {
          name: p.NAME,
          iso_a2: iso2,
          iso_a3: p.ISO_A3_EH && p.ISO_A3_EH !== "-99" ? p.ISO_A3_EH : p.ISO_A3,
          continent: p.CONTINENT,
          pop_est: p.POP_EST,
          label_lng: round(p.LABEL_X, 2),
          label_lat: round(p.LABEL_Y, 2),
          category: "country",
        },
        geometry: { type: f.geometry.type, coordinates: roundCoords(f.geometry.coordinates, 2) },
      }
    }),
  }
}

export function normalizeQuakes(raw) {
  const sev = (m) => (m >= 6.5 ? "critical" : m >= 5.5 ? "high" : m >= 4.5 ? "medium" : "low")
  return {
    type: "FeatureCollection",
    features: raw.features
      .filter((f) => f.geometry && typeof f.properties.mag === "number")
      .map((f) => ({
        type: "Feature",
        properties: {
          name: `M${f.properties.mag.toFixed(1)} ${f.properties.place || ""}`.trim(),
          category: "earthquake",
          mag: f.properties.mag,
          time: new Date(f.properties.time).toISOString(),
          depth_km: round(f.geometry.coordinates[2] ?? 0, 1),
          url: f.properties.url,
          tsunami: f.properties.tsunami === 1,
          weight: Math.min(1, Math.max(0.05, (f.properties.mag - 2.5) / 5)),
          severity: sev(f.properties.mag),
        },
        geometry: { type: "Point", coordinates: [round(f.geometry.coordinates[0]), round(f.geometry.coordinates[1])] },
      })),
  }
}

export function normalizeFeodo(raw, countries) {
  const byIso = new Map(countries.features.map((f) => [f.properties.iso_a2, f.properties]))
  const groups = new Map()
  for (const r of Array.isArray(raw) ? raw : []) {
    const cc = (r.country || "").toUpperCase()
    if (!cc) continue
    const g = groups.get(cc) || { total: 0, online: 0, malware: new Set(), asns: new Set() }
    g.total++
    if (r.status === "online") g.online++
    if (r.malware) g.malware.add(r.malware)
    if (r.as_name) g.asns.add(r.as_name)
    groups.set(cc, g)
  }
  const max = Math.max(1, ...[...groups.values()].map((g) => g.total))
  const features = []
  for (const [cc, g] of groups) {
    const c = byIso.get(cc)
    if (!c) continue
    features.push({
      type: "Feature",
      properties: {
        name: `${c.name}: ${g.total} C2 (${g.online} online)`,
        category: "botnet-c2",
        country: cc,
        c2_total: g.total,
        c2_online: g.online,
        malware: [...g.malware].sort().join(", "),
        networks: [...g.asns].slice(0, 5).join(", "),
        weight: g.total / max,
        severity: g.online > 0 ? (g.online >= 5 ? "critical" : "high") : "medium",
        location_precision: "country",
      },
      geometry: { type: "Point", coordinates: [c.label_lng, c.label_lat] },
    })
  }
  return { type: "FeatureCollection", features }
}

export function normalizeNoaa(raw) {
  const sevMap = { Extreme: "critical", Severe: "high", Moderate: "medium", Minor: "low" }
  const wMap = { critical: 1, high: 0.75, medium: 0.5, low: 0.25 }
  const features = []
  for (const f of raw.features || []) {
    const p = f.properties || {}
    const severity = sevMap[p.severity] || "low"
    const base = {
      name: p.event || "Alert",
      category: "weather-alert",
      headline: p.headline || "",
      area: (p.areaDesc || "").slice(0, 200),
      nws_severity: p.severity,
      onset: p.onset || p.effective || null,
      expires: p.expires || null,
      severity,
      weight: wMap[severity],
    }
    if (f.geometry) {
      features.push({ type: "Feature", properties: { ...base, location_precision: "polygon" }, geometry: { type: f.geometry.type, coordinates: roundCoords(f.geometry.coordinates, 3) } })
      continue
    }
    const states = new Set(((p.geocode && p.geocode.UGC) || []).map((u) => String(u).slice(0, 2)))
    for (const st of states) {
      const c = US_STATE_CENTROIDS[st] || NWS_MARINE_CENTROIDS[st]
      if (!c) continue
      const precision = US_STATE_CENTROIDS[st] ? "state" : "marine-area"
      features.push({ type: "Feature", properties: { ...base, state: st, location_precision: precision }, geometry: { type: "Point", coordinates: c } })
    }
  }
  // Keep the pack small: cap point features per (event,state).
  const seen = new Set()
  return {
    type: "FeatureCollection",
    features: features.filter((f) => {
      if (f.geometry.type !== "Point") return true
      const k = `${f.properties.name}|${f.properties.state}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    }),
  }
}

/** Fetch + normalise one pack from its live source. `countries` is required for feodo. */
export async function fetchPack(id, { countries } = {}) {
  const pack = getPack(id)
  if (!pack) throw new Error(`unknown pack ${id}`)
  if (id === "natural-earth-countries") return normalizeCountries(await getJson(pack.sourceUrl))
  if (id === "usgs-earthquakes") return normalizeQuakes(await getJson(pack.sourceUrl))
  if (id === "noaa-alerts") return normalizeNoaa(await getJson(pack.sourceUrl, "application/geo+json"))
  if (id === "feodo-c2-by-country") {
    if (!countries) throw new Error("countries pack needed to place Feodo data")
    return normalizeFeodo(await getJson(pack.sourceUrl), countries)
  }
  throw new Error(`no fetcher for ${id}`)
}
