
/**
 * Live threat feed: CISA KEV (real HTTP), local IDS events, listening ports,
 * and process anomalies from /proc. Never returns canned incident theater.
 */
import fs from "fs"
import os from "os"
import { liveFetch } from "./http"
import { getIdsStatus } from "@/lib/security/ids-status"
import { runFile } from "./exec"

const KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
const KEV_CACHE = `${process.cwd()}/local-data/live/kev.json`

interface KevItem {
  cveID: string
  vendorProject: string
  product: string
  vulnerabilityName: string
  dateAdded: string
  shortDescription: string
  requiredAction: string
  dueDate: string
  knownRansomwareCampaignUse: string
  notes?: string
}

async function loadKev(): Promise<{ ok: boolean; count: number; catalogVersion?: string; dateReleased?: string; items: KevItem[]; source: string; error?: string }> {
  const r = await liveFetch(KEV_URL, { timeoutMs: 15_000, maxBytes: 4_000_000 })
  if (r.ok && r.json && typeof r.json === "object") {
    const j = r.json as { count?: number; catalogVersion?: string; dateReleased?: string; vulnerabilities?: KevItem[] }
    const items = Array.isArray(j.vulnerabilities) ? j.vulnerabilities : []
    try {
      fs.mkdirSync(`${process.cwd()}/local-data/live`, { recursive: true, mode: 0o700 })
      fs.writeFileSync(KEV_CACHE, JSON.stringify({ at: new Date().toISOString(), j }), { mode: 0o600 })
    } catch {
      /* ignore cache write */
    }
    return { ok: true, count: j.count || items.length, catalogVersion: j.catalogVersion, dateReleased: j.dateReleased, items, source: "CISA KEV (live HTTP)" }
  }
  // fall back to on-disk cache from a previous successful fetch — still real data, labelled as cache
  try {
    const cached = JSON.parse(fs.readFileSync(KEV_CACHE, "utf8")) as { at: string; j: { count?: number; catalogVersion?: string; dateReleased?: string; vulnerabilities?: KevItem[] } }
    const items = cached.j.vulnerabilities || []
    return {
      ok: true,
      count: cached.j.count || items.length,
      catalogVersion: cached.j.catalogVersion,
      dateReleased: cached.j.dateReleased,
      items,
      source: `CISA KEV (local cache from ${cached.at}; live fetch failed: ${r.error || r.status})`,
    }
  } catch {
    return { ok: false, count: 0, items: [], source: "CISA KEV unavailable", error: r.error || `HTTP ${r.status}` }
  }
}

function procAnomalies(): Array<{ id: string; type: string; source: string; severity: string; status: string; timestamp: string; message: string }> {
  const out: Array<{ id: string; type: string; source: string; severity: string; status: string; timestamp: string; message: string }> = []
  const ts = new Date().toISOString()
  try {
    const pids = fs.readdirSync("/proc").filter((n) => /^\d+$/.test(n))
    for (const pid of pids) {
      try {
        const exe = fs.readlinkSync(`/proc/${pid}/exe`)
        if (exe.includes(" (deleted)")) {
          const comm = fs.readFileSync(`/proc/${pid}/comm`, "utf8").trim()
          out.push({
            id: `proc-deleted-${pid}`,
            type: "Deleted binary still running",
            source: `/proc/${pid}`,
            severity: "High",
            status: "Observed",
            timestamp: ts,
            message: `pid ${pid} (${comm}) exe=${exe}`,
          })
        }
      } catch {
        /* ESRCH / permission */
      }
    }
  } catch {
    /* /proc unreadable */
  }
  return out.slice(0, 40)
}

export async function getThreats(limit = 25) {
  const [kev, ids, listen, anomalies] = await Promise.all([
    loadKev(),
    Promise.resolve(getIdsStatus()),
    runFile("ss", ["-lntup"], { timeoutMs: 4000 }),
    Promise.resolve(procAnomalies()),
  ])

  const threats: Array<{
    id: string
    type: string
    source: string
    severity: "Critical" | "High" | "Medium" | "Low" | "Info"
    status: string
    timestamp: string
    message?: string
  }> = []

  for (const ev of ids.events || []) {
    threats.push({
      id: ev.id,
      type: ev.source || "IDS",
      source: ev.source,
      severity: ev.severity === "critical" ? "Critical" : ev.severity === "high" ? "High" : ev.severity === "medium" ? "Medium" : ev.severity === "low" ? "Low" : "Info",
      status: "Logged",
      timestamp: ev.ts,
      message: ev.message,
    })
  }
  for (const a of anomalies) {
    threats.push({
      id: a.id,
      type: a.type,
      source: a.source,
      severity: a.severity as "High",
      status: a.status,
      timestamp: a.timestamp,
      message: a.message,
    })
  }

  // newest KEV entries as catalog awareness — labelled as catalog, not as "this host is exploited"
  const newest = (kev.items || [])
    .slice()
    .sort((a, b) => String(b.dateAdded).localeCompare(String(a.dateAdded)))
    .slice(0, 8)
  for (const k of newest) {
    threats.push({
      id: k.cveID,
      type: "CISA KEV catalog",
      source: `${k.vendorProject} ${k.product}`,
      severity: k.knownRansomwareCampaignUse === "Known" ? "Critical" : "High",
      status: "Catalog (not a host detection)",
      timestamp: k.dateAdded,
      message: k.vulnerabilityName || k.shortDescription,
    })
  }

  threats.sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))

  return {
    ok: true as const,
    backend: "CISA KEV + Heimdall IDS + /proc anomalies (live)",
    live: true,
    generatedAt: new Date().toISOString(),
    hostname: os.hostname(),
    kev: {
      ok: kev.ok,
      source: kev.source,
      count: kev.count,
      catalogVersion: kev.catalogVersion,
      dateReleased: kev.dateReleased,
      error: kev.error || null,
      newest: newest.map((k) => ({ cve: k.cveID, name: k.vulnerabilityName, dateAdded: k.dateAdded, product: `${k.vendorProject} ${k.product}` })),
    },
    ids: {
      eventCount: (ids.events || []).length,
      failedApiAuthCount: ids.auth?.failedApiAuthCount ?? 0,
      mode: ids.mode,
    },
    listeningPreview: (listen.stdout || listen.error || "").trim().slice(0, 4000),
    threats: threats.slice(0, limit),
    activeCount: threats.filter((t) => t.status === "Observed" || t.status === "Logged").length,
  }
}
