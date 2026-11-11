/**
 * Map Shodan / Censys / dork-style recon objects onto CctvTileMeta
 * so the operator does not re-enter fields when sending a cam to a tile.
 */

import { emptyTileMeta, type CctvTileMeta, type StreamProtocol } from "./types"
import { detectProtocol, detectVendor } from "./vendors"

function asArr(v: unknown): string[] {
  if (!v) return []
  if (Array.isArray(v)) return v.map(String).filter(Boolean)
  return [String(v)]
}

function numArr(v: unknown): number[] {
  if (!Array.isArray(v)) return []
  return v.map(Number).filter((n) => Number.isFinite(n))
}

/** Accept a loose Shodan host/search match object. */
export function fromShodan(host: Record<string, unknown>, opts?: { engagementId?: string; addedBy?: string }): CctvTileMeta {
  const ip = String(host.ip_str || host.ip || "")
  const ports = numArr(host.ports)
  const data = Array.isArray(host.data) ? (host.data as Record<string, unknown>[]) : []
  const banners = data.map((d) => String(d.data || d.banner || "").slice(0, 400)).filter(Boolean)
  const product = String(
    (data[0] && ((data[0] as any).product || (data[0] as any).devicetype)) || host.product || "",
  )
  const tags = asArr(host.tags)
  const vulns = asArr(host.vulns)
  const streamPort = ports.find((p) => [554, 8554, 7447].includes(p)) || ports[0]
  const streamUrl = streamPort && ip ? `rtsp://${ip}:${streamPort}/` : undefined
  const protocol: StreamProtocol = streamUrl ? detectProtocol(streamUrl) : "unknown"
  const vendor = detectVendor(product + " " + banners.join(" ")) || detectVendor(streamUrl || "")

  return emptyTileMeta({
    network: {
      ip: ip || undefined,
      host: ip || undefined,
      hostname: asArr(host.hostnames)[0],
      asn: host.asn ? String(host.asn) : undefined,
      org: host.org ? String(host.org) : host.isp ? String(host.isp) : undefined,
      reverseDns: asArr(host.hostnames)[0],
      openPorts: ports.slice(0, 64),
      protocol,
      streamUrl,
    },
    geo: {
      country: host.country_name ? String(host.country_name) : (host.location as any)?.country_name,
      city: (host.location as any)?.city || (typeof host.city === "string" ? host.city : undefined),
      lat: Number((host.location as any)?.latitude ?? host.latitude) || undefined,
      lon: Number((host.location as any)?.longitude ?? host.longitude) || undefined,
    },
    device: {
      vendor: vendor !== "generic" ? vendor : product || undefined,
      model: product || undefined,
      banner: banners[0],
    },
    exposure: {
      shodanTags: tags,
      banner: banners[0],
      cves: vulns.slice(0, 32),
      defaultCredNotes: /camera|webcam|hikvision|dahua|nvr/i.test(product + banners.join(" "))
        ? ["Review vendor default-credential advisories before any authorized test."]
        : [],
      authState: /401|unauthorized|www-authenticate/i.test(banners.join(" ")) ? "auth-required" : "unknown",
      lastSeen: host.last_update ? String(host.last_update) : undefined,
      confidence: 0.55,
      source: "shodan",
    },
    engagement: {
      engagementId: opts?.engagementId,
      addedBy: opts?.addedBy,
      addedAt: new Date().toISOString(),
      authorizationStatus: "unconfirmed",
    },
  })
}

/** Accept a loose Censys host result object. */
export function fromCensys(host: Record<string, unknown>, opts?: { engagementId?: string; addedBy?: string }): CctvTileMeta {
  const ip = String(host.ip || "")
  const services = Array.isArray(host.services) ? (host.services as Record<string, unknown>[]) : []
  const ports = services.map((s) => Number(s.port)).filter((n) => Number.isFinite(n))
  const banners = services
    .map((s) => String((s.banner as string) || (s.service_name as string) || ""))
    .filter(Boolean)
  const loc = (host.location || {}) as Record<string, unknown>
  const auto = (host.autonomous_system || {}) as Record<string, unknown>
  const dns = (host.dns || {}) as Record<string, unknown>
  const rev = (dns.reverse_dns || {}) as Record<string, unknown>
  const coords = (loc.coordinates || {}) as Record<string, unknown>
  const streamPort = ports.find((p) => [554, 8554, 7447, 80, 8080].includes(p)) || ports[0]
  const streamUrl = streamPort && ip ? (streamPort === 554 || streamPort === 8554 ? `rtsp://${ip}:${streamPort}/` : `http://${ip}:${streamPort}/`) : undefined

  return emptyTileMeta({
    network: {
      ip: ip || undefined,
      host: ip || undefined,
      hostname: asArr(rev.names || host.names)[0],
      asn: auto.asn != null ? String(auto.asn) : undefined,
      org: auto.name ? String(auto.name) : undefined,
      reverseDns: asArr(rev.names)[0],
      openPorts: ports.slice(0, 64),
      protocol: streamUrl ? detectProtocol(streamUrl) : "unknown",
      streamUrl,
    },
    geo: {
      country: loc.country ? String(loc.country) : undefined,
      city: loc.city ? String(loc.city) : undefined,
      lat: Number(coords.latitude ?? loc.latitude) || undefined,
      lon: Number(coords.longitude ?? loc.longitude) || undefined,
    },
    device: {
      vendor: detectVendor(banners.join(" ") + " " + (streamUrl || "")),
      banner: banners[0],
    },
    exposure: {
      censysTags: asArr(host.labels || host.tags),
      banner: banners[0],
      cves: [],
      defaultCredNotes: [],
      authState: "unknown",
      confidence: 0.5,
      source: "censys",
    },
    engagement: {
      engagementId: opts?.engagementId,
      addedBy: opts?.addedBy,
      addedAt: new Date().toISOString(),
      authorizationStatus: "unconfirmed",
    },
  })
}

/** Manual / dork URL → tile meta. */
export function fromUrl(url: string, opts?: { engagementId?: string; addedBy?: string; title?: string }): CctvTileMeta {
  const protocol = detectProtocol(url)
  const vendor = detectVendor(url)
  let host: string | undefined
  try {
    const u = new URL(url.replace(/^rtsp:/i, "http:"))
    host = u.hostname
  } catch {
    /* ignore */
  }
  return emptyTileMeta({
    network: {
      host,
      ip: host && /^(\d{1,3}\.){3}\d{1,3}$/.test(host) ? host : undefined,
      protocol,
      streamUrl: url,
    },
    device: { vendor: vendor !== "generic" ? vendor : undefined },
    exposure: { authState: "unknown", confidence: 0.2, source: "dork" },
    engagement: {
      engagementId: opts?.engagementId,
      addedBy: opts?.addedBy,
      addedAt: new Date().toISOString(),
      authorizationStatus: "unconfirmed",
    },
    notes: opts?.title,
  })
}
