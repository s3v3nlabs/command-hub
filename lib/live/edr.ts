
/**
 * Live EDR-style telemetry from this host.
 * Primary backend is osqueryi when the binary is present; otherwise a real
 * procfs collector (processes, listening ports, file-integrity hashes of a
 * watched path set). Labelled honestly as whichever backend actually ran.
 */
import fs from "fs"
import path from "path"
import os from "os"
import crypto from "crypto"
import { runFile } from "./exec"

const WATCH = [
  path.join(process.cwd(), "package.json"),
  path.join(process.cwd(), "middleware.ts"),
  path.join(process.cwd(), "next.config.mjs"),
  path.join(process.cwd(), ".env.example"),
]
const BASELINE = path.join(process.cwd(), "local-data", "edr", "baseline.json")

async function osquery(sql: string) {
  return runFile("osqueryi", ["--json", sql], { timeoutMs: 8000, maxOut: 200_000 })
}

function hashFile(p: string): { path: string; sha256?: string; size?: number; error?: string; mtime?: string } {
  try {
    const buf = fs.readFileSync(p)
    return { path: p, sha256: crypto.createHash("sha256").update(buf).digest("hex"), size: buf.length, mtime: fs.statSync(p).mtime.toISOString() }
  } catch (e) {
    return { path: p, error: e instanceof Error ? e.message : String(e) }
  }
}

function fileIntegrity() {
  const current = WATCH.map(hashFile)
  let baseline: typeof current | null = null
  try {
    baseline = JSON.parse(fs.readFileSync(BASELINE, "utf8"))
  } catch {
    baseline = null
  }
  fs.mkdirSync(path.dirname(BASELINE), { recursive: true, mode: 0o700 })
  if (!baseline) {
    fs.writeFileSync(BASELINE, JSON.stringify(current, null, 2), { mode: 0o600 })
    return { initialized: true, changes: [] as Array<{ path: string; before?: string; after?: string }>, current }
  }
  const changes: Array<{ path: string; before?: string; after?: string }> = []
  const prev = new Map(baseline.map((b) => [b.path, b]))
  for (const c of current) {
    const p = prev.get(c.path)
    if (!p) changes.push({ path: c.path, after: c.sha256 })
    else if (p.sha256 !== c.sha256) changes.push({ path: c.path, before: p.sha256, after: c.sha256 })
  }
  // do not auto-update baseline; operator can POST reset
  return { initialized: false, changes, current }
}

function procfsProcesses(limit = 40) {
  const rows: Array<{ pid: number; name: string; exe: string | null; rssKb: number; cmdline: string; uid?: number }> = []
  let names: string[] = []
  try {
    names = fs.readdirSync("/proc").filter((n) => /^\d+$/.test(n))
  } catch {
    return rows
  }
  for (const pid of names) {
    try {
      const comm = fs.readFileSync(`/proc/${pid}/comm`, "utf8").trim()
      const cmdline = fs.readFileSync(`/proc/${pid}/cmdline`, "utf8").replace(/\0/g, " ").trim()
      let exe: string | null = null
      try {
        exe = fs.readlinkSync(`/proc/${pid}/exe`)
      } catch {
        exe = null
      }
      let rssKb = 0
      const status = fs.readFileSync(`/proc/${pid}/status`, "utf8")
      const m = status.match(/VmRSS:\s+(\d+)/)
      const u = status.match(/Uid:\s+(\d+)/)
      if (m) rssKb = Number(m[1])
      rows.push({ pid: Number(pid), name: comm, exe, rssKb, cmdline: cmdline.slice(0, 300), uid: u ? Number(u[1]) : undefined })
    } catch {
      /* gone */
    }
  }
  rows.sort((a, b) => b.rssKb - a.rssKb)
  return rows.slice(0, limit)
}

export async function getEdrSnapshot() {
  const oqSys = await osquery("SELECT hostname, cpu_brand, physical_memory, hardware_vendor, hardware_model FROM system_info")
  const osqueryLive = oqSys.ok && !oqSys.error
  const backend = osqueryLive
    ? "EDR backend: osquery (live) + file integrity"
    : "EDR backend: host procfs collector (live) — osqueryi not installed on this host; file integrity included"

  let osqueryData: Record<string, unknown> | null = null
  if (osqueryLive) {
    const [procs, listen, users] = await Promise.all([
      osquery("SELECT pid, name, path, uid, resident_size FROM processes ORDER BY resident_size DESC LIMIT 40"),
      osquery("SELECT pid, port, protocol, address FROM listening_ports WHERE port != 0 LIMIT 80"),
      osquery("SELECT uid, gid, username, directory, shell FROM users LIMIT 40"),
    ])
    const parse = (r: typeof oqSys) => {
      try {
        return JSON.parse(r.stdout)
      } catch {
        return { raw: r.stdout, error: r.error }
      }
    }
    osqueryData = {
      system: parse(oqSys),
      processes: parse(procs),
      listening: parse(listen),
      users: parse(users),
    }
  }

  const integrity = fileIntegrity()
  const processes = procfsProcesses()
  const listen = await runFile("ss", ["-lntup"], { timeoutMs: 4000 })

  return {
    ok: true as const,
    backend,
    live: true,
    generatedAt: new Date().toISOString(),
    hostname: os.hostname(),
    osqueryInstalled: osqueryLive,
    osquery: osqueryData,
    processes,
    listening: (listen.stdout || listen.error || "").trim().split("\n").slice(0, 80),
    fileIntegrity: integrity,
    watched: WATCH,
  }
}

export function resetIntegrityBaseline() {
  const current = WATCH.map(hashFile)
  fs.mkdirSync(path.dirname(BASELINE), { recursive: true, mode: 0o700 })
  fs.writeFileSync(BASELINE, JSON.stringify(current, null, 2), { mode: 0o600 })
  return { ok: true as const, reset: true, current }
}
