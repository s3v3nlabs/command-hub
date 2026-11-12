
/**
 * Live host snapshot — /proc, os, df, free, load. Nothing is invented.
 */
import fs from "fs"
import os from "os"
import path from "path"
import { runFile } from "./exec"

const NET_CACHE = path.join(process.cwd(), "local-data", "live", "net-counters.json")

interface NetCounters {
  at: number
  rx: number
  tx: number
}

function readFileSafe(p: string): string | null {
  try {
    return fs.readFileSync(p, "utf8")
  } catch {
    return null
  }
}

function parseMeminfo(raw: string | null): { totalKb: number; availKb: number; freeKb: number; cachedKb: number } {
  const out = { totalKb: 0, availKb: 0, freeKb: 0, cachedKb: 0 }
  if (!raw) return out
  for (const line of raw.split("\n")) {
    const m = line.match(/^(MemTotal|MemAvailable|MemFree|Cached):\s+(\d+)/)
    if (!m) continue
    const v = Number(m[2])
    if (m[1] === "MemTotal") out.totalKb = v
    else if (m[1] === "MemAvailable") out.availKb = v
    else if (m[1] === "MemFree") out.freeKb = v
    else if (m[1] === "Cached") out.cachedKb = v
  }
  return out
}

function parseNetDev(raw: string | null): { rx: number; tx: number; ifaces: Array<{ name: string; rx: number; tx: number }> } {
  const ifaces: Array<{ name: string; rx: number; tx: number }> = []
  let rx = 0
  let tx = 0
  if (!raw) return { rx, tx, ifaces }
  for (const line of raw.split("\n").slice(2)) {
    const parts = line.trim().split(/[:\s]+/).filter(Boolean)
    if (parts.length < 10) continue
    const name = parts[0]
    if (!name || name === "lo") continue
    const r = Number(parts[1]) || 0
    const t = Number(parts[9]) || 0
    ifaces.push({ name, rx: r, tx: t })
    rx += r
    tx += t
  }
  return { rx, tx, ifaces }
}

function bandwidthMbps(): { rxMbps: number; txMbps: number; sampleMs: number } {
  const now = Date.now()
  const raw = readFileSafe("/proc/net/dev")
  const cur = parseNetDev(raw)
  let prev: NetCounters | null = null
  try {
    prev = JSON.parse(fs.readFileSync(NET_CACHE, "utf8")) as NetCounters
  } catch {
    prev = null
  }
  try {
    fs.mkdirSync(path.dirname(NET_CACHE), { recursive: true, mode: 0o700 })
    fs.writeFileSync(NET_CACHE, JSON.stringify({ at: now, rx: cur.rx, tx: cur.tx }), { mode: 0o600 })
  } catch {
    /* ignore */
  }
  if (!prev || now - prev.at < 200 || now - prev.at > 120_000) {
    return { rxMbps: 0, txMbps: 0, sampleMs: 0 }
  }
  const dt = (now - prev.at) / 1000
  const rxMbps = ((cur.rx - prev.rx) * 8) / dt / 1_000_000
  const txMbps = ((cur.tx - prev.tx) * 8) / dt / 1_000_000
  return { rxMbps: Math.max(0, Number(rxMbps.toFixed(3))), txMbps: Math.max(0, Number(txMbps.toFixed(3))), sampleMs: now - prev.at }
}

function cpuPercents(): { overall: number; cores: number[] } {
  const cpus = os.cpus()
  const cores = cpus.map((c) => {
    const t = c.times
    const total = t.user + t.nice + t.sys + t.idle + t.irq
    const busy = total - t.idle
    return total > 0 ? Number(((busy / total) * 100).toFixed(1)) : 0
  })
  const overall = cores.length ? Number((cores.reduce((a, b) => a + b, 0) / cores.length).toFixed(1)) : 0
  return { overall, cores }
}

function thermal(): Array<{ zone: string; type: string; celsius: number }> {
  const dir = "/sys/class/thermal"
  const out: Array<{ zone: string; type: string; celsius: number }> = []
  try {
    for (const name of fs.readdirSync(dir)) {
      if (!name.startsWith("thermal_zone")) continue
      const tempRaw = readFileSafe(path.join(dir, name, "temp"))
      const type = (readFileSafe(path.join(dir, name, "type")) || "unknown").trim()
      if (!tempRaw) continue
      const milli = Number(tempRaw.trim())
      if (!Number.isFinite(milli)) continue
      out.push({ zone: name, type, celsius: Number((milli / 1000).toFixed(1)) })
    }
  } catch {
    /* no thermal sysfs */
  }
  return out
}

export async function getSystemSnapshot() {
  const mem = parseMeminfo(readFileSafe("/proc/meminfo"))
  const load = os.loadavg()
  const cpu = cpuPercents()
  const net = parseNetDev(readFileSafe("/proc/net/dev"))
  const bw = bandwidthMbps()
  const [df, free, uptime, who] = await Promise.all([
    runFile("df", ["-hT"], { timeoutMs: 4000 }),
    runFile("free", ["-h"], { timeoutMs: 3000 }),
    runFile("uptime", ["-p"], { timeoutMs: 2000 }),
    runFile("whoami", [], { timeoutMs: 2000 }),
  ])
  const totalMb = mem.totalKb / 1024
  const availMb = mem.availKb / 1024
  const usedMb = totalMb - availMb
  const memPct = totalMb > 0 ? Number(((usedMb / totalMb) * 100).toFixed(1)) : 0

  // disk used from os
  let disk = { totalBytes: 0, usedBytes: 0, pct: 0 }
  try {
    const st = fs.statfsSync ? fs.statfsSync("/") : null
    if (st) {
      const total = Number(st.blocks) * Number(st.bsize)
      const freeB = Number(st.bavail) * Number(st.bsize)
      disk = {
        totalBytes: total,
        usedBytes: total - freeB,
        pct: total > 0 ? Number((((total - freeB) / total) * 100).toFixed(1)) : 0,
      }
    }
  } catch {
    /* node version may lack statfsSync */
  }

  return {
    ok: true as const,
    backend: "host /proc + os + df/free (live)",
    generatedAt: new Date().toISOString(),
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    release: os.release(),
    node: process.version,
    pid: process.pid,
    operator: "S3v3n@SingularityDefense",
    uptimeSec: Math.round(os.uptime()),
    uptimeHuman: (uptime.stdout || "").trim() || `${Math.round(os.uptime())}s`,
    whoami: (who.stdout || "").trim() || null,
    loadavg: { "1": load[0], "5": load[1], "15": load[2] },
    cpu: {
      overallPct: cpu.overall,
      cores: cpu.cores,
      model: os.cpus()[0]?.model || "unknown",
      count: os.cpus().length,
    },
    memory: {
      totalMb: Number(totalMb.toFixed(1)),
      usedMb: Number(usedMb.toFixed(1)),
      availableMb: Number(availMb.toFixed(1)),
      pct: memPct,
      raw: (free.stdout || "").trim() || null,
    },
    disk,
    df: (df.stdout || "").trim() || df.error || null,
    network: {
      rxBytes: net.rx,
      txBytes: net.tx,
      rxMbps: bw.rxMbps,
      txMbps: bw.txMbps,
      sampleMs: bw.sampleMs,
      ifaces: net.ifaces,
    },
    thermal: thermal(),
    live: true,
  }
}

export type SystemSnapshot = Awaited<ReturnType<typeof getSystemSnapshot>>
