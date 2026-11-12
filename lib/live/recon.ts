
/**
 * Live passive recon: DNS, RDAP, crt.sh subdomains, InternetDB, HTTP/TLS.
 * Reuses liveOsint. Optional active nmap is allowed only against lab/local
 * hosts (isLabHost).
 */
import { liveOsint } from "./osint"
import { isLabHost } from "@/lib/offsec/lab-exec"
import { runFile } from "./exec"
import net from "node:net"

export async function liveRecon(target: string, opts: { active?: boolean } = {}) {
  const osint = await liveOsint(target)
  if (!osint || (osint as { ok?: boolean }).ok === false) return osint
  const recs = ((osint as { dns?: { records?: Array<{ type: string; value: string; name: string }> } }).dns?.records) || []
  const dnsRecords = recs.map((r) => ({ type: r.type, name: r.name, value: r.value, ttl: 0 }))
  const certsBlock = (osint as { certificates?: { ok?: boolean; certs?: Array<{ issuer: string; notBefore: string; notAfter: string; nameValue: string; commonName: string }>; subdomains?: string[] } }).certificates
  const subdomains = (certsBlock?.subdomains || []).map((s) => ({
    name: s,
    ip: "",
    status: "active" as const,
    lastSeen: new Date().toISOString(),
  }))
  const certificates = (certsBlock?.certs || []).map((c) => ({
    issuer: c.issuer,
    validFrom: c.notBefore,
    validTo: c.notAfter,
    domains: (c.nameValue || c.commonName || "").split(/[\n,]/).map((x) => x.trim()).filter(Boolean),
  }))
  const idb = ((osint as { internetdb?: Array<{ ok?: boolean; ports?: number[]; cpes?: string[]; vulns?: string[] }> }).internetdb) || []
  const ports: { port: number; service: string; state: string }[] = []
  const technologies: string[] = []
  for (const row of idb) {
    if (!row || !row.ok) continue
    for (const p of row.ports || []) ports.push({ port: p, service: "internetdb", state: "open (InternetDB, passive)" })
    for (const c of row.cpes || []) technologies.push(c)
  }
  const http = (osint as { http?: Array<{ title?: string | null; contentType?: string; status?: number }> }).http || []
  for (const h of http) {
    if (h.title) technologies.push(`title:${h.title}`)
    if (h.contentType) technologies.push(`content-type:${h.contentType}`)
  }

  let active: Record<string, unknown> | null = null
  if (opts.active) {
    const host = String((osint as { host?: string; target?: string }).host || (osint as { target?: string }).target || "")
    if (!isLabHost(host) && !isLabHost(host.split(":")[0]) && !(net.isIP(host) && isLabHost(host))) {
      active = { ok: false, error: "active nmap is restricted to lab/local addresses (isLabHost). Passive results above are complete." }
    } else {
      const r = await runFile("nmap", ["-sT", "-Pn", "-T4", "--top-ports", "50", "-n", host], { timeoutMs: 25_000, maxOut: 40_000 })
      active = { ok: r.ok, argv: r.argv, stdout: r.stdout, stderr: r.stderr, error: r.error, durationMs: r.durationMs }
    }
  }

  return {
    ok: true as const,
    backend: "live OSINT (DNS/RDAP/crt.sh/InternetDB/HTTP) + optional lab nmap",
    live: true,
    generatedAt: new Date().toISOString(),
    domain: (osint as { host?: string; target: string }).host || (osint as { target: string }).target,
    timestamp: new Date().toISOString(),
    dnsRecords,
    subdomains,
    certificates,
    technologies: [...new Set(technologies)],
    ports,
    osint,
    active,
  }
}
