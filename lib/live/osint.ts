
/**
 * Live OSINT enricher. Every field is the result of a real lookup
 * (Node DNS, RDAP, crt.sh, Shodan InternetDB, ip-api, GitHub public API,
 * HTTP probe). Failures are reported as errors, never replaced with sample data.
 */
import dns from "node:dns/promises"
import net from "node:net"
import tls from "node:tls"
import { liveFetch } from "./http"

export type OsintKind = "domain" | "ip" | "email" | "username" | "url" | "phone" | "unknown"

export function classify(raw: string): { kind: OsintKind; value: string; host?: string } {
  const t = (raw || "").trim()
  if (!t) return { kind: "unknown", value: t }
  if (/^https?:\/\//i.test(t)) {
    try {
      const u = new URL(t)
      return { kind: "url", value: t, host: u.hostname }
    } catch {
      return { kind: "unknown", value: t }
    }
  }
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t)) {
    return { kind: "email", value: t.toLowerCase(), host: t.split("@")[1].toLowerCase() }
  }
  if (net.isIP(t)) return { kind: "ip", value: t }
  if (/^\+?[\d][\d\s\-().]{6,}$/.test(t)) return { kind: "phone", value: t }
  if (/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i.test(t)) return { kind: "domain", value: t.toLowerCase().replace(/\.$/, ""), host: t.toLowerCase().replace(/\.$/, "") }
  if (/^@?[a-zA-Z0-9._-]{2,39}$/.test(t)) return { kind: "username", value: t.replace(/^@/, "") }
  return { kind: "unknown", value: t }
}

async function settle<T>(p: Promise<T>): Promise<{ ok: true; value: T } | { ok: false; error: string }> {
  try {
    return { ok: true, value: await p }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

async function dnsBundle(name: string) {
  const types = ["A", "AAAA", "MX", "TXT", "NS", "CNAME", "SOA", "CAA"] as const
  const entries: Array<{ type: string; name: string; value: string; ttl?: number }> = []
  const errors: Record<string, string> = {}
  await Promise.all(
    types.map(async (type) => {
      try {
        const r = await dns.resolve(name, type as Parameters<typeof dns.resolve>[1])
        const arr = Array.isArray(r) ? r : [r]
        for (const item of arr) {
          if (typeof item === "string") entries.push({ type, name, value: item })
          else if (item && typeof item === "object") {
            const o = item as Record<string, unknown>
            if (type === "MX" && "exchange" in o) entries.push({ type, name, value: `${o.priority} ${o.exchange}` })
            else if (type === "SOA" && "nsname" in o) entries.push({ type, name, value: `${o.nsname} ${o.hostmaster} serial=${o.serial}` })
            else if (type === "CAA" && "issue" in o) entries.push({ type, name, value: String(o.issue || o.iodef || JSON.stringify(o)) })
            else if (type === "TXT") entries.push({ type, name, value: Array.isArray(item) ? (item as string[]).join("") : String(item) })
            else entries.push({ type, name, value: JSON.stringify(item) })
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        if (!/ENODATA|ENOTFOUND|SERVFAIL/i.test(msg)) errors[type] = msg
      }
    }),
  )
  return { records: entries, errors }
}

async function rdap(kind: "domain" | "ip", value: string) {
  const url = kind === "ip" ? `https://rdap.org/ip/${encodeURIComponent(value)}` : `https://rdap.org/domain/${encodeURIComponent(value)}`
  const r = await liveFetch(url, { timeoutMs: 10_000, maxBytes: 400_000 })
  if (!r.ok) return { ok: false as const, error: r.error || `HTTP ${r.status}`, url, ms: r.ms }
  const j = (r.json || {}) as Record<string, unknown>
  const entities = Array.isArray(j.entities) ? (j.entities as Array<Record<string, unknown>>) : []
  const names: string[] = []
  for (const ent of entities) {
    const vcard = ent.vcardArray
    if (Array.isArray(vcard) && Array.isArray(vcard[1])) {
      for (const row of vcard[1] as unknown[]) {
        if (Array.isArray(row) && row[0] === "fn") names.push(String(row[3] ?? ""))
      }
    }
  }
  return {
    ok: true as const,
    url,
    ms: r.ms,
    handle: j.handle || j.ldhName || value,
    name: (j.name || j.ldhName || names[0] || null) as string | null,
    registrar: names[0] || null,
    status: j.status || null,
    events: j.events || null,
    nameservers: Array.isArray(j.nameservers)
      ? (j.nameservers as Array<Record<string, unknown>>).map((n) => n.ldhName || n.unicodeName)
      : [],
    rawSummary: {
      objectClassName: j.objectClassName,
      ldnName: j.ldhName,
      port43: j.port43,
    },
  }
}

async function crtsh(domain: string) {
  const url = `https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`
  const r = await liveFetch(url, { timeoutMs: 15_000, maxBytes: 1_200_000 })
  if (!r.ok) return { ok: false as const, error: r.error || `HTTP ${r.status}`, url, ms: r.ms, certs: [], subdomains: [] }
  const arr = Array.isArray(r.json) ? (r.json as Array<Record<string, unknown>>) : []
  const certs = arr.slice(0, 40).map((c) => ({
    issuer: String(c.issuer_name || ""),
    id: c.id,
    notBefore: String(c.not_before || ""),
    notAfter: String(c.not_after || ""),
    commonName: String(c.common_name || ""),
    nameValue: String(c.name_value || ""),
  }))
  const subs = new Set<string>()
  for (const c of arr) {
    const blob = `${c.common_name || ""}\n${c.name_value || ""}`
    for (const line of blob.split(/[\n,]/)) {
      const s = line.trim().toLowerCase().replace(/^\*\./, "")
      if (s && (s === domain || s.endsWith("." + domain))) subs.add(s)
    }
  }
  return { ok: true as const, url, ms: r.ms, count: arr.length, certs, subdomains: [...subs].sort().slice(0, 200) }
}

async function internetdb(ip: string) {
  const url = `https://internetdb.shodan.io/${encodeURIComponent(ip)}`
  const r = await liveFetch(url, { timeoutMs: 8_000 })
  if (r.status === 404) return { ok: true as const, url, ms: r.ms, empty: true, ports: [] as number[], vulns: [] as string[], cpes: [] as string[], hostnames: [] as string[], tags: [] as string[] }
  if (!r.ok) return { ok: false as const, error: r.error || `HTTP ${r.status}`, url, ms: r.ms }
  const j = (r.json || {}) as Record<string, unknown>
  return {
    ok: true as const,
    url,
    ms: r.ms,
    empty: false,
    ports: Array.isArray(j.ports) ? j.ports : [],
    vulns: Array.isArray(j.vulns) ? j.vulns : [],
    cpes: Array.isArray(j.cpes) ? j.cpes : [],
    hostnames: Array.isArray(j.hostnames) ? j.hostnames : [],
    tags: Array.isArray(j.tags) ? j.tags : [],
  }
}

async function ipGeo(ip: string) {
  const url = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,regionName,city,lat,lon,isp,org,as,asname,query,reverse,proxy,hosting,timezone`
  const r = await liveFetch(url, { timeoutMs: 8_000 })
  if (!r.ok) return { ok: false as const, error: r.error || `HTTP ${r.status}`, url, ms: r.ms }
  const j = (r.json || {}) as Record<string, unknown>
  if (j.status !== "success") return { ok: false as const, error: String(j.message || "ip-api failed"), url, ms: r.ms }
  return { ok: true as const, url, ms: r.ms, ...j }
}

async function githubUser(username: string) {
  const url = `https://api.github.com/users/${encodeURIComponent(username)}`
  const r = await liveFetch(url, { timeoutMs: 8_000, headers: { Accept: "application/vnd.github+json" } })
  if (r.status === 404) return { ok: true as const, found: false, url, ms: r.ms }
  if (!r.ok) return { ok: false as const, error: r.error || `HTTP ${r.status}`, url, ms: r.ms }
  const j = (r.json || {}) as Record<string, unknown>
  return {
    ok: true as const,
    found: true,
    url,
    ms: r.ms,
    login: j.login,
    id: j.id,
    name: j.name,
    company: j.company,
    blog: j.blog,
    location: j.location,
    bio: j.bio,
    publicRepos: j.public_repos,
    followers: j.followers,
    htmlUrl: j.html_url,
    createdAt: j.created_at,
  }
}

async function httpProbe(host: string) {
  const results = []
  for (const scheme of ["https", "http"] as const) {
    const url = `${scheme}://${host}/`
    const r = await liveFetch(url, { timeoutMs: 8_000, maxBytes: 80_000 })
    results.push({
      url,
      ok: r.ok,
      status: r.status,
      ms: r.ms,
      contentType: r.contentType,
      error: r.error || null,
      title: (r.text.match(/<title[^>]*>([^<]{0,200})/i) || [])[1] || null,
      serverHint: null as string | null,
      bodySnippet: r.text.slice(0, 400),
    })
    if (r.ok) break
  }
  return results
}

async function tlsCert(host: string) {
  return new Promise((resolve) => {
    const sock = tls.connect({ host, port: 443, servername: host, timeout: 7000, rejectUnauthorized: false }, () => {
      const cert = sock.getPeerCertificate()
      sock.end()
      resolve({
        ok: true,
        subject: cert.subject,
        issuer: cert.issuer,
        validFrom: cert.valid_from,
        validTo: cert.valid_to,
        fingerprint256: cert.fingerprint256,
        subjectaltname: cert.subjectaltname,
      })
    })
    sock.on("error", (e) => resolve({ ok: false, error: e.message }))
    sock.on("timeout", () => {
      sock.destroy()
      resolve({ ok: false, error: "tls timeout" })
    })
  })
}

async function resolveIps(host: string): Promise<string[]> {
  const ips: string[] = []
  try {
    ips.push(...(await dns.resolve4(host)))
  } catch {
    /* none */
  }
  try {
    ips.push(...(await dns.resolve6(host)))
  } catch {
    /* none */
  }
  return [...new Set(ips)]
}

async function reverse(ip: string): Promise<string[]> {
  try {
    return await dns.reverse(ip)
  } catch {
    return []
  }
}

export async function liveOsint(raw: string) {
  const started = Date.now()
  const classified = classify(raw)
  if (!classified.value) return { ok: false as const, error: "target required" }
  const host = classified.host || (classified.kind === "domain" ? classified.value : classified.kind === "ip" ? classified.value : undefined)
  const out: Record<string, unknown> = {
    ok: true,
    backend: "DNS + RDAP + crt.sh + InternetDB + ip-api + GitHub + HTTP/TLS (live)",
    live: true,
    generatedAt: new Date().toISOString(),
    target: classified.value,
    kind: classified.kind,
    host: host || null,
  }

  const jobs: Promise<void>[] = []

  if (host && classified.kind !== "ip") {
    jobs.push(
      (async () => {
        out.dns = await dnsBundle(host)
      })(),
    )
    jobs.push(
      (async () => {
        out.rdap = await rdap("domain", host)
      })(),
    )
    jobs.push(
      (async () => {
        out.certificates = await crtsh(host)
      })(),
    )
    jobs.push(
      (async () => {
        out.http = await httpProbe(host)
      })(),
    )
    jobs.push(
      (async () => {
        out.tls = await tlsCert(host)
      })(),
    )
    jobs.push(
      (async () => {
        const ips = await resolveIps(host)
        out.ips = ips
        out.ptr = Object.fromEntries(await Promise.all(ips.slice(0, 6).map(async (ip) => [ip, await reverse(ip)])))
        out.internetdb = await Promise.all(ips.filter((ip) => net.isIPv4(ip)).slice(0, 4).map(internetdb))
        out.geo = await Promise.all(ips.filter((ip) => net.isIPv4(ip)).slice(0, 4).map(ipGeo))
      })(),
    )
  }

  if (classified.kind === "ip") {
    jobs.push(
      (async () => {
        out.ptr = { [classified.value]: await reverse(classified.value) }
        out.rdap = await rdap("ip", classified.value)
        out.internetdb = [await internetdb(classified.value)]
        out.geo = [await ipGeo(classified.value)]
      })(),
    )
  }

  if (classified.kind === "username" || classified.kind === "email") {
    const uname = classified.kind === "email" ? classified.value.split("@")[0] : classified.value
    jobs.push(
      (async () => {
        out.github = await githubUser(uname)
      })(),
    )
  }

  if (classified.kind === "email" && host) {
    jobs.push(
      (async () => {
        out.dns = await dnsBundle(host)
        out.rdap = await rdap("domain", host)
        out.certificates = await crtsh(host)
      })(),
    )
  }

  await Promise.all(jobs)
  out.durationMs = Date.now() - started
  return out
}

/**
 * Map a live enrichment into the legacy OSINTDashboard Profile shape
 * without inventing people, phones, or leak rows that we did not look up.
 */
export function asLegacyProfile(enrichment: Record<string, unknown>): {
  id: string
  name: string
  email: string
  phone: string
  location: string
  socialProfiles: { platform: string; username: string; url: string }[]
  leaks: { source: string; date: string; dataType: string; severity: "high" | "medium" | "low" }[]
  aliases: string[]
  liveMeta: Record<string, unknown>
} {
  const kind = String(enrichment.kind || "")
  const target = String(enrichment.target || "")
  const github = enrichment.github as { found?: boolean; name?: string; login?: string; htmlUrl?: string; location?: string; bio?: string } | undefined
  const geoArr = enrichment.geo as Array<{ ok?: boolean; city?: string; regionName?: string; country?: string; isp?: string }> | undefined
  const geo = geoArr?.find((g) => g && g.ok)
  const location = github?.location || (geo ? [geo.city, geo.regionName, geo.country].filter(Boolean).join(", ") : "")
  const certs = enrichment.certificates as { subdomains?: string[] } | undefined
  const internetdb = (enrichment.internetdb as Array<{ vulns?: string[] }> | undefined) || []
  const vulns = internetdb.flatMap((x) => x?.vulns || [])
  const leaks = vulns.slice(0, 12).map((v) => ({
    source: "Shodan InternetDB (live)",
    date: new Date().toISOString().slice(0, 10),
    dataType: v,
    severity: "high" as const,
  }))
  const social: { platform: string; username: string; url: string }[] = []
  if (github?.found && github.login) {
    social.push({ platform: "GitHub", username: github.login, url: String(github.htmlUrl || `https://github.com/${github.login}`) })
  }
  return {
    id: `live:${kind}:${target}`,
    name: github?.name || github?.login || target,
    email: kind === "email" ? target : "",
    phone: "",
    location: location || "(no geo/location returned by live lookup)",
    socialProfiles: social,
    leaks,
    aliases: certs?.subdomains?.slice(0, 12) || [],
    liveMeta: {
      backend: enrichment.backend,
      kind,
      ips: enrichment.ips,
      durationMs: enrichment.durationMs,
      tls: enrichment.tls,
      rdapOk: (enrichment.rdap as { ok?: boolean } | undefined)?.ok ?? null,
    },
  }
}
