
/**
 * Live SIGINT / signal-band backend.
 * Primary: real /proc/net counters + a short tcpdump snap when permitted.
 * RF: rtl_test / rtl_power / iw dev scan when those tools and devices exist.
 * Never invents a radio spectrum.
 */
import fs from "fs"
import os from "os"
import { runFile } from "./exec"
import { getSystemSnapshot } from "./sys"

function read(p: string): string | null {
  try {
    return fs.readFileSync(p, "utf8")
  } catch {
    return null
  }
}

function snmpCounters() {
  const raw = read("/proc/net/snmp")
  const out: Record<string, Record<string, number>> = {}
  if (!raw) return out
  const lines = raw.split("\n").filter(Boolean)
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const keys = lines[i].trim().split(/\s+/)
    const vals = lines[i + 1].trim().split(/\s+/)
    const proto = keys[0].replace(":", "")
    out[proto] = {}
    for (let k = 1; k < keys.length && k < vals.length; k++) out[proto][keys[k]] = Number(vals[k])
  }
  return out
}

function wireless(): Array<{ iface: string; raw: string }> {
  const raw = read("/proc/net/wireless")
  if (!raw) return []
  const rows: Array<{ iface: string; raw: string }> = []
  for (const line of raw.split("\n").slice(2)) {
    if (!line.trim()) continue
    const iface = line.trim().split(/[:\s]+/)[0]
    rows.push({ iface, raw: line.trim() })
  }
  return rows
}

export async function getSigint() {
  const sys = await getSystemSnapshot()
  const tcpdump = await runFile("timeout", ["3", "tcpdump", "-c", "16", "-nn", "-i", "any"], { timeoutMs: 6000, maxOut: 24_000 })
  const iw = await runFile("iw", ["dev"], { timeoutMs: 3000 })
  const rtl = await runFile("rtl_test", ["-t"], { timeoutMs: 3000 })
  const snmp = snmpCounters()
  const tcp = snmp.Tcp || {}
  const udp = snmp.Udp || {}
  const ip = snmp.Ip || {}

  const bands = [
    {
      id: "tcp-in",
      label: "TCP InSegs (host stack, live)",
      value: tcp.InSegs ?? null,
      unit: "segments (cumulative)",
      source: "/proc/net/snmp Tcp.InSegs",
    },
    {
      id: "tcp-out",
      label: "TCP OutSegs (host stack, live)",
      value: tcp.OutSegs ?? null,
      unit: "segments (cumulative)",
      source: "/proc/net/snmp Tcp.OutSegs",
    },
    {
      id: "udp-in",
      label: "UDP InDatagrams (host stack, live)",
      value: udp.InDatagrams ?? null,
      unit: "datagrams (cumulative)",
      source: "/proc/net/snmp Udp.InDatagrams",
    },
    {
      id: "ip-in",
      label: "IP InReceives (host stack, live)",
      value: ip.InReceives ?? null,
      unit: "packets (cumulative)",
      source: "/proc/net/snmp Ip.InReceives",
    },
    {
      id: "rx-mbps",
      label: "RX throughput (live sample)",
      value: sys.network.rxMbps,
      unit: "Mbps",
      source: "/proc/net/dev delta",
    },
    {
      id: "tx-mbps",
      label: "TX throughput (live sample)",
      value: sys.network.txMbps,
      unit: "Mbps",
      source: "/proc/net/dev delta",
    },
  ]

  return {
    ok: true as const,
    backend: "procfs SNMP + tcpdump snap + optional RTL-SDR/iw (live)",
    live: true,
    generatedAt: new Date().toISOString(),
    hostname: os.hostname(),
    bands,
    wireless: wireless(),
    tcpdump: {
      ok: tcpdump.ok,
      durationMs: tcpdump.durationMs,
      stdout: (tcpdump.stdout || "").trim() || null,
      stderr: (tcpdump.stderr || tcpdump.error || "").trim() || null,
      note: tcpdump.ok
        ? "real packet snap on this host"
        : "tcpdump did not run (missing binary, missing CAP_NET_RAW, or no packets) — no packets were invented",
    },
    iw: iw.ok ? iw.stdout.trim() : { installed: !iw.error?.includes("not installed"), error: iw.error || iw.stderr },
    rtlSdr: rtl.ok
      ? { present: true, output: rtl.stdout.trim().slice(0, 4000) }
      : { present: false, error: rtl.error || rtl.stderr, note: "No RTL-SDR device/tool on this host. RF spectrum is not simulated." },
    snmp,
  }
}
