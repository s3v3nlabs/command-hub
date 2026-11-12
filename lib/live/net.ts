
/**
 * Live network / firewall status from ss, ip, and nft/iptables.
 */
import fs from "fs"
import os from "os"
import { runFile } from "./exec"
import { getSystemSnapshot } from "./sys"

function parseSs(stdout: string): Array<{ proto: string; state: string; local: string; peer: string; process?: string }> {
  const rows: Array<{ proto: string; state: string; local: string; peer: string; process?: string }> = []
  for (const line of stdout.split("\n").slice(1)) {
    const parts = line.trim().split(/\s+/)
    if (parts.length < 5) continue
    const proto = parts[0]
    const state = parts[1]
    // ss -tulpn columns vary; local/peer are usually last numeric-looking address columns
    const addrs = parts.filter((p) => p.includes(":") && /[0-9\[]/.test(p))
    const local = addrs[0] || parts[4] || ""
    const peer = addrs[1] || parts[5] || ""
    const proc = (line.match(/users:\(\((.+)\)\)/) || [])[1]
    rows.push({ proto, state, local, peer, process: proc })
  }
  return rows
}

function parseRules(raw: string): { present: boolean; lines: number; preview: string; tool: string } {
  const preview = raw.trim()
  return { present: preview.length > 0 && !/^Error/i.test(preview), lines: preview ? preview.split("\n").length : 0, preview: preview.slice(0, 8000), tool: "" }
}

export async function getNetworkSnapshot() {
  const [ss, ipAddr, ipRoute, nft, ipt, sys] = await Promise.all([
    runFile("ss", ["-tulpn"], { timeoutMs: 4000, maxOut: 48_000 }),
    runFile("ip", ["-br", "addr"], { timeoutMs: 3000 }),
    runFile("ip", ["route"], { timeoutMs: 3000 }),
    runFile("nft", ["-a", "list", "ruleset"], { timeoutMs: 6000, maxOut: 32_000 }),
    runFile("iptables", ["-L", "-n", "-v"], { timeoutMs: 5000, maxOut: 16_000 }),
    getSystemSnapshot(),
  ])
  const sockets = parseSs(ss.stdout || "")
  const listening = sockets.filter((s) => /LISTEN|UNCONN|UNCONN/i.test(s.state) || s.state === "LISTEN")
  const establishedGuess = sockets.filter((s) => /ESTAB/i.test(s.state))
  const nftParsed = parseRules(nft.stdout || nft.stderr || nft.error || "")
  nftParsed.tool = "nftables"
  const iptParsed = parseRules(ipt.stdout || ipt.stderr || ipt.error || "")
  iptParsed.tool = "iptables"
  const firewallActive = (nftParsed.present && nftParsed.lines > 2 && !nft.error) || (iptParsed.present && /policy (DROP|REJECT|ACCEPT)/i.test(iptParsed.preview))

  // crude latency: connect to self
  const selfPing = await runFile("bash", ["-lc", "echo > /dev/tcp/127.0.0.1/3000 && echo ok"], { timeoutMs: 2000 })

  return {
    ok: true as const,
    backend: "ss + ip + nft/iptables (live)",
    generatedAt: new Date().toISOString(),
    hostname: os.hostname(),
    live: true,
    bandwidthMbps: Number((sys.network.rxMbps + sys.network.txMbps).toFixed(3)),
    rxMbps: sys.network.rxMbps,
    txMbps: sys.network.txMbps,
    activeConnections: sockets.length,
    listening: listening.length,
    established: establishedGuess.length,
    packetLossPct: 0, // we do not invent packet-loss; only report if we measured. loopback is 0 when ssh/ss works.
    packetLossMeasured: false,
    packetLossNote: "Packet loss is only reported when an ICMP sample is taken; no sample is taken by default.",
    latencyMs: selfPing.ok ? selfPing.durationMs : null,
    interfaces: (ipAddr.stdout || "").trim() || ipAddr.error,
    routes: (ipRoute.stdout || "").trim() || ipRoute.error,
    sockets: sockets.slice(0, 200),
    firewall: {
      nft: { ...nftParsed, installed: !nft.error?.includes("not installed"), error: nft.error || null },
      iptables: { ...iptParsed, installed: !ipt.error?.includes("not installed"), error: ipt.error || null },
      active: firewallActive,
      label: firewallActive ? "RULES PRESENT (live)" : "NO RULES VISIBLE (live — may lack CAP_NET_ADMIN)",
    },
    rawSs: (ss.stdout || "").trim().slice(0, 12_000) || ss.error,
  }
}

export async function getFirewallLogs(limit = 80) {
  // journalctl if readable, else kernel dmesg, else nft/iptables counters
  const journal = await runFile("journalctl", ["-n", String(limit), "-k", "--no-pager", "-o", "short-iso"], { timeoutMs: 5000, maxOut: 40_000 })
  const dmesg = !journal.ok ? await runFile("dmesg", ["-T"], { timeoutMs: 4000, maxOut: 20_000 }) : null
  const source = journal.ok ? "journalctl -k (live)" : dmesg && (dmesg.stdout || "").trim() ? "dmesg -T (live)" : "unavailable"
  const text = journal.ok ? journal.stdout : dmesg?.stdout || journal.stderr || journal.error || "no logs readable on this host"
  return {
    ok: true as const,
    backend: source,
    generatedAt: new Date().toISOString(),
    live: source !== "unavailable",
    lines: text.trim().split("\n").slice(-limit),
  }
}

/** Read a file if it exists; used for /proc/net stats. */
export function readProcNet(name: string): string | null {
  try {
    return fs.readFileSync(`/proc/net/${name}`, "utf8")
  } catch {
    return null
  }
}
