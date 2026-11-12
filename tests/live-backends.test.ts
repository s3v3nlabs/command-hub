import { describe, it, expect } from "vitest"
import { getSystemSnapshot } from "@/lib/live/sys"
import { getNetworkSnapshot } from "@/lib/live/net"
import { listDir, readFilePreview } from "@/lib/live/fs-browse"
import { execShell } from "@/lib/live/shell"
import { liveOsint, classify } from "@/lib/live/osint"
import { getThreats } from "@/lib/live/threats"
import { listMessages, sendMessage } from "@/lib/live/messages"
import { sqliteQuery, sqliteSchema, vaultStreamsOverview } from "@/lib/live/db"
import { writeNote, readNote } from "@/lib/live/obsidian"
import { getSigint } from "@/lib/live/sigint"
import { getEdrSnapshot } from "@/lib/live/edr"
import { listReports, generateReport } from "@/lib/live/reports"
import { getBeastWagon } from "@/lib/live/beastwagon"
import { lookupLeaks } from "@/lib/live/leaks"

describe("live backends — real data, no fixtures", () => {
  it("sys snapshot is live and has this hostname", async () => {
    const s = await getSystemSnapshot()
    expect(s.ok).toBe(true)
    expect(s.live).toBe(true)
    expect(s.hostname).toBeTruthy()
    expect(s.memory.totalMb).toBeGreaterThan(100)
    expect(s.cpu.count).toBeGreaterThan(0)
    expect(s.backend).toMatch(/live/)
  })

  it("net snapshot runs ss and reports real socket counts", async () => {
    const n = await getNetworkSnapshot()
    expect(n.ok).toBe(true)
    expect(n.live).toBe(true)
    expect(n.activeConnections).toBeGreaterThan(0)
  })

  it("fs browse lists the real repo", () => {
    const listing = listDir(process.cwd())
    expect(listing.ok).toBe(true)
    if (listing.ok) {
      const names = listing.items.map((i) => i.name)
      expect(names).toContain("package.json")
      expect(names).toContain("app")
    }
  })

  it("fs refuses to preview secret files", () => {
    const r = readFilePreview(`${process.cwd()}/.env.local`)
    expect(r.ok).toBe(false)
  })

  it("shell executes whoami for real", async () => {
    const r = await execShell({ command: "whoami", sessionId: "test-live-1" })
    expect(r.live).toBe(true)
    expect(r.exitCode).toBe(0)
    expect(r.stdout.trim().length).toBeGreaterThan(0)
  })

  it("shell cd persists and ls is real", async () => {
    const cd = await execShell({ command: "cd " + process.cwd(), sessionId: "test-live-2" })
    expect(cd.ok).toBe(true)
    const ls = await execShell({ command: "ls package.json", sessionId: "test-live-2" })
    expect(ls.ok).toBe(true)
    expect(ls.stdout).toMatch(/package\.json/)
  })

  it("windows flavor translates dir to real ls", async () => {
    const cd = await execShell({ command: `cd ${process.cwd()}`, sessionId: "test-win-1", flavor: "windows" })
    expect(cd.ok).toBe(true)
    const r = await execShell({ command: "dir", sessionId: "test-win-1", flavor: "windows" })
    expect(r.live).toBe(true)
    expect(r.stdout).toMatch(/package\.json/)
  })

  it("sqlite is a real database and accepts SELECT", async () => {
    const schema = await sqliteSchema()
    expect(schema.ok).toBe(true)
    const q = await sqliteQuery("SELECT name FROM sqlite_master WHERE type='table'")
    expect(q.ok).toBe(true)
    const names = ((q.result as { rows: Array<Array<string>> }).rows || []).map((r) => r[0])
    expect(names).toContain("hub_events")
  })

  it("encrypted messages persist and decrypt", () => {
    const sent = sendMessage({ body: "ping from live test", from: "S3v3n@SingularityDefense", channel: "test" })
    expect(sent.ok).toBe(true)
    const list = listMessages("test")
    expect(list.live).toBe(true)
    expect(list.messages.some((m) => m.body === "ping from live test")).toBe(true)
  })

  it("obsidian vault write and read are real", () => {
    const w = writeNote("live-test.md", "# live\n\nwritten by the realification pass.\n")
    expect(w.ok).toBe(true)
    const r = readNote("live-test.md")
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.content).toMatch(/realification/)
  })

  it("threats include a live KEV catalog or an honest error", async () => {
    const t = await getThreats(10)
    expect(t.ok).toBe(true)
    expect(t.live).toBe(true)
    expect(t.kev.source).toBeTruthy()
  }, 25_000)

  it("leaks lookup for a domain hits a live catalog (not a hardcoded map)", async () => {
    const r = await lookupLeaks("adobe.com")
    expect(r.ok).toBe(true)
    expect(r.live).toBe(true)
    expect(r.backend).toMatch(/HIBP|XposedOrNot|live/)
    if (r.breaches.length) {
      expect(r.breaches.every((b) => /Have I Been Pwned|XposedOrNot|HIBP/i.test(b.source))).toBe(true)
    }
  }, 20_000)

  it("osint classify + DNS for example.com is live", async () => {
    expect(classify("example.com").kind).toBe("domain")
    const r = await liveOsint("example.com")
    expect((r as { ok: boolean }).ok).toBe(true)
    const dns = (r as { dns?: { records?: Array<{ type: string; value: string }> } }).dns
    expect((dns?.records || []).some((rec) => rec.type === "A" || rec.type === "AAAA")).toBe(true)
  }, 30_000)

  it("sigint returns real procfs counters", async () => {
    const s = await getSigint()
    expect(s.ok).toBe(true)
    expect(s.bands.length).toBeGreaterThan(0)
    expect(s.bands.some((b) => b.value !== null && b.value !== undefined)).toBe(true)
  }, 15_000)

  it("edr snapshot is live and lists real processes", async () => {
    const e = await getEdrSnapshot()
    expect(e.ok).toBe(true)
    expect(e.live).toBe(true)
    expect(e.processes.length).toBeGreaterThan(0)
    expect(e.backend).toMatch(/live/)
  })

  it("beastwagon is labelled as host telemetry, not a fake car", async () => {
    const b = await getBeastWagon()
    expect(b.ok).toBe(true)
    expect(b.vehicleAttached).toBe(false)
    expect(b.label).toMatch(/HOST WAGON/)
    expect(b.cpu.count).toBeGreaterThan(0)
  })

  it("reports can be generated from a live snapshot", async () => {
    const g = await generateReport()
    expect(g.ok).toBe(true)
    if (g.ok) {
      expect(g.bytes).toBeGreaterThan(100)
      expect(g.preview).toMatch(/Command Hub host report/)
    }
    const list = await listReports()
    expect(list.reports.length).toBeGreaterThan(0)
  })

  it("vault streams overview points at a real sqlite file", async () => {
    const v = await vaultStreamsOverview()
    expect(v.ok).toBe(true)
    expect(v.sqlite.exists).toBe(true)
    expect(v.sqlite.size).toBeGreaterThan(0)
  })
})
