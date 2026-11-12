
/**
 * BeastWagon live telemetry.
 * There is no vehicle CAN bus on this host. The module reports REAL host
 * telemetry (CPU, memory, disk, network, thermal, load, uptime) and, when
 * present, a real GPSD/NMEA feed. The payload is honestly labelled
 * "host wagon" — it is not a pretend car.
 */
import fs from "fs"
import net from "net"
import { getSystemSnapshot } from "./sys"

async function gpsdOnce(): Promise<{ present: boolean; sample?: unknown; error?: string }> {
  // gpsd default port 2947 — try a brief TPV poll. Fail honestly if nothing is there.
  return new Promise((resolve) => {
    const sock = net.connect({ host: "127.0.0.1", port: 2947 })
    const timer = setTimeout(() => {
      sock.destroy()
      resolve({ present: false, error: "gpsd not reachable on 127.0.0.1:2947" })
    }, 1200)
    let buf = ""
    sock.on("connect", () => {
      sock.write('?WATCH={"enable":true,"json":true}\n')
    })
    sock.on("data", (d) => {
      buf += d.toString()
      if (buf.includes("TPV") || buf.length > 4000) {
        clearTimeout(timer)
        sock.destroy()
        resolve({ present: true, sample: buf.slice(0, 4000) })
      }
    })
    sock.on("error", (e) => {
      clearTimeout(timer)
      resolve({ present: false, error: e.message })
    })
  })
}

export async function getBeastWagon() {
  const sys = await getSystemSnapshot()
  const gps = await gpsdOnce()
  const thermal = sys.thermal[0]?.celsius ?? null
  return {
    ok: true as const,
    backend: gps.present ? "host /proc telemetry + GPSD (live)" : "host /proc telemetry (live) — no vehicle bus, no GPSD",
    live: true,
    generatedAt: new Date().toISOString(),
    vehicleAttached: false,
    gpsd: gps,
    label: "HOST WAGON — live host telemetry (not a vehicle)",
    hostname: sys.hostname,
    // fields the visualization historically showed, now bound to real host metrics
    engineRpmProxy: Math.round(sys.cpu.overallPct * 80), // labelled as proxy
    engineRpmProxyNote: "CPU% × 80 — host CPU as engine-load PROXY, not a tachometer",
    speedMbps: Number((sys.network.rxMbps + sys.network.txMbps).toFixed(3)),
    speedNote: "real combined RX+TX Mbps",
    fuelPctProxy: Math.max(0, 100 - sys.memory.pct),
    fuelNote: "available memory % — PROXY, not a fuel tank",
    coolantC: thermal,
    coolantNote: thermal === null ? "no thermal_zone sysfs on this host" : "thermal_zone0, degrees C (live)",
    odometerUptimeSec: sys.uptimeSec,
    load: sys.loadavg,
    cpu: sys.cpu,
    memory: sys.memory,
    disk: sys.disk,
    network: sys.network,
    raw: sys,
  }
}
