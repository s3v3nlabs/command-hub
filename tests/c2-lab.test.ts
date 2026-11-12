import { describe, it, expect, afterAll } from "vitest"
import fs from "fs"
import path from "path"
import os from "os"
import {
  createBeacon,
  advancePhase,
  queueTask,
  listBeacons,
  killChainView,
  deleteBeacon,
  KILL_CHAIN_PHASES,
} from "@/lib/offsec/c2/store"
import { isLabHost, runLabVerb } from "@/lib/offsec/lab-exec"

const FILE = path.join(process.cwd(), "data", "offsec", "c2", "beacons.json")
const made: string[] = []
afterAll(() => {
  for (const id of made) deleteBeacon(id)
  try {
    if (fs.existsSync(FILE) && !listBeacons().length) fs.unlinkSync(FILE)
  } catch {
    /* ignore */
  }
})

describe("lab-exec", () => {
  it("accepts localhost and RFC1918, rejects public IPs", () => {
    expect(isLabHost("localhost")).toBe(true)
    expect(isLabHost("127.0.0.1")).toBe(true)
    expect(isLabHost("10.0.0.5")).toBe(true)
    expect(isLabHost("192.168.1.10")).toBe(true)
    expect(isLabHost("172.16.0.2")).toBe(true)
    expect(isLabHost(os.hostname())).toBe(true)
    expect(isLabHost("8.8.8.8")).toBe(false)
    expect(isLabHost("example.com")).toBe(false)
  })
  it("runs whoami for real and returns stdout", async () => {
    const r = await runLabVerb("whoami")
    expect(r.ok).toBe(true)
    expect(r.exitCode).toBe(0)
    expect(r.stdout.trim().length).toBeGreaterThan(0)
    expect(r.argv[0]).toBe("whoami")
  })
  it("rejects unknown verbs and non-SELECT osquery", async () => {
    const u = await runLabVerb("rm-rf")
    expect(u.ok).toBe(false)
    expect(u.error).toMatch(/unknown verb/i)
    const bad = await runLabVerb("osquery", "DROP TABLE users")
    expect(bad.ok).toBe(false)
    expect(bad.error).toMatch(/SELECT|mutating/i)
  })
})

describe("c2 lab store (real execution)", () => {
  it("creates a lab session only for lab hosts", () => {
    const r = createBeacon({ label: "hub-session", labHost: "localhost", scopeId: "scope-x" })
    expect(r.ok).toBe(true)
    if (r.ok) {
      made.push(r.beacon.id)
      expect(r.beacon.status).toBe("dormant")
      expect(r.beacon.labHost).toBe("localhost")
    }
    const denied = createBeacon({ label: "wan", labHost: "8.8.8.8", scopeId: "scope-x" })
    expect(denied.ok).toBe(false)
  })
  it("advances kill-chain phase", () => {
    const r = createBeacon({ label: "lab-2", labHost: "127.0.0.1", scopeId: "s" })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    made.push(r.beacon.id)
    const a = advancePhase(r.beacon.id, "exploitation")
    expect(a.ok).toBe(true)
    if (a.ok) expect(a.beacon.phase).toBe("exploitation")
  })
  it("queues a task that actually executes whoami", async () => {
    const r = createBeacon({ label: "lab-3", labHost: "localhost", scopeId: "s" })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    made.push(r.beacon.id)
    const t = await queueTask(r.beacon.id, { verb: "whoami", phase: "command-and-control" })
    expect(t.ok).toBe(true)
    if (t.ok && "task" in t) {
      expect(t.task.status).toBe("done")
      expect(t.task.exitCode).toBe(0)
      expect((t.task.stdout || "").trim().length).toBeGreaterThan(0)
      expect(t.result.ok).toBe(true)
    }
  })
  it("rejects invalid phase", () => {
    const r = createBeacon({ label: "lab-4", labHost: "localhost", scopeId: "s" })
    if (!r.ok) return
    made.push(r.beacon.id)
    // @ts-expect-error invalid phase on purpose
    const a = advancePhase(r.beacon.id, "not-a-phase")
    expect(a.ok).toBe(false)
  })
  it("killChainView groups by phase across all 7 phases", () => {
    const view = killChainView()
    expect(view.map((v) => v.phase)).toEqual([...KILL_CHAIN_PHASES])
  })
})
