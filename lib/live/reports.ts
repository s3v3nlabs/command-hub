
/**
 * Real reports list: engagement store, audit timeline, IDS events, and
 * markdown reports already on disk under local-data/reports. A new report
 * can be generated from those live sources and written to disk.
 */
import fs from "fs"
import path from "path"
import os from "os"
import { getIdsStatus } from "@/lib/security/ids-status"
import { getSystemSnapshot } from "./sys"

const DIR = path.join(process.cwd(), "local-data", "reports")

function engagementReports(): Array<Record<string, unknown>> {
  const candidates = [
    path.join(process.cwd(), "local-data", "engagements"),
    path.join(process.cwd(), "data", "engagements"),
  ]
  const out: Array<Record<string, unknown>> = []
  for (const dir of candidates) {
    if (!fs.existsSync(dir)) continue
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name)
      try {
        const st = fs.statSync(p)
        if (st.isDirectory()) continue
        out.push({
          id: `eng:${name}`,
          title: name,
          source: dir,
          path: p,
          size: st.size,
          modified: st.mtime.toISOString(),
          type: "engagement-artifact",
        })
      } catch {
        /* skip */
      }
    }
  }
  return out
}

function diskReports() {
  fs.mkdirSync(DIR, { recursive: true, mode: 0o755 })
  const out: Array<Record<string, unknown>> = []
  for (const name of fs.readdirSync(DIR)) {
    const p = path.join(DIR, name)
    try {
      const st = fs.statSync(p)
      if (!st.isFile()) continue
      out.push({
        id: `file:${name}`,
        title: name,
        source: DIR,
        path: p,
        size: st.size,
        modified: st.mtime.toISOString(),
        type: "generated-report",
      })
    } catch {
      /* skip */
    }
  }
  return out
}

export async function listReports() {
  const ids = getIdsStatus()
  const files = [...diskReports(), ...engagementReports()]
  files.sort((a, b) => String(b.modified).localeCompare(String(a.modified)))
  return {
    ok: true as const,
    backend: "local-data/reports + engagements + IDS (live)",
    live: true,
    generatedAt: new Date().toISOString(),
    hostname: os.hostname(),
    reports: files,
    idsEventCount: (ids.events || []).length,
  }
}


export async function generateReport() {
  const [sys, list] = await Promise.all([getSystemSnapshot(), listReports()])
  const ids = getIdsStatus()
  const events = (ids.events || []).slice(0, 20).map((e) => `  - ${e.ts} [${e.severity}] ${e.source}: ${e.message}`)
  const body =
    "# Command Hub host report\n\n" +
    `Generated: ${new Date().toISOString()}\n` +
    `Host: ${sys.hostname}\n` +
    "Operator: S3v3n@SingularityDefense / SLDS\n" +
    "Backend: live host snapshot — nothing in this file is canned.\n\n" +
    "## System\n\n" +
    `- Platform: ${sys.platform} ${sys.release} ${sys.arch}\n` +
    `- Uptime: ${sys.uptimeHuman}\n` +
    `- Load: ${sys.loadavg["1"]} / ${sys.loadavg["5"]} / ${sys.loadavg["15"]}\n` +
    `- CPU: ${sys.cpu.overallPct}% (${sys.cpu.count} cores, ${sys.cpu.model})\n` +
    `- Memory: ${sys.memory.usedMb} / ${sys.memory.totalMb} MB (${sys.memory.pct}%)\n` +
    `- Disk: ${sys.disk.pct}% used\n` +
    `- Network: RX ${sys.network.rxMbps} Mbps / TX ${sys.network.txMbps} Mbps\n\n` +
    "## IDS\n\n" +
    `- Failed API auth count: ${ids.auth?.failedApiAuthCount ?? 0}\n` +
    "- Events:\n" +
    `${events.join("\n") || "  - (none yet)"}\n\n` +
    `## Existing reports on disk: ${list.reports.length}\n`
  fs.mkdirSync(DIR, { recursive: true })
  const name = `host-report-${new Date().toISOString().replace(/[:.]/g, "-")}.md`
  const dest = path.join(DIR, name)
  fs.writeFileSync(dest, body)
  return { ok: true as const, backend: "generated from live snapshot", live: true, path: dest, name, bytes: body.length, preview: body.slice(0, 1500) }
}

export function readReport(name: string) {
  const abs = path.resolve(DIR, path.basename(name))
  if (!abs.startsWith(DIR + path.sep)) return { ok: false as const, error: "path escapes reports dir" }
  try {
    const content = fs.readFileSync(abs, "utf8")
    return { ok: true as const, live: true, path: abs, content, size: content.length }
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : String(e) }
  }
}
