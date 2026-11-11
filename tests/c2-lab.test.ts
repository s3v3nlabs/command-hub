import { describe, it, expect, afterAll } from "vitest"
import fs from "fs"
import path from "path"
import {
  createBeacon,
  advancePhase,
  queueTask,
  listBeacons,
  killChainView,
  deleteBeacon,
  KILL_CHAIN_PHASES,
} from "@/lib/offsec/c2/store"

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

describe("c2 lab store (simulation only)", () => {
  it("creates a simulated beacon", () => {
    const r = createBeacon({ label: "lab-win10", labHost: "lab.local/win10", scopeId: "scope-x" })
    expect(r.ok).toBe(true)
    if (r.ok) {
      made.push(r.beacon.id)
      expect(r.beacon.simulated).toBe(true)
      expect(r.beacon.lattice_sync).toBe(false)
      expect(r.beacon.status).toBe("dormant")
    }
  })
  it("advances kill-chain phase", () => {
    const r = createBeacon({ label: "lab-2", labHost: "lab.local/2", scopeId: "s" })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    made.push(r.beacon.id)
    const a = advancePhase(r.beacon.id, "exploitation")
    expect(a.ok).toBe(true)
    if (a.ok) expect(a.beacon.phase).toBe("exploitation")
  })
  it("queues a task that resolves as simulated (nothing executes)", () => {
    const r = createBeacon({ label: "lab-3", labHost: "lab.local/3", scopeId: "s" })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    made.push(r.beacon.id)
    const t = queueTask(r.beacon.id, { verb: "sim-whoami", phase: "command-and-control" })
    expect(t.ok).toBe(true)
    if (t.ok && "task" in t) {
      expect(t.task.status).toBe("simulated")
      expect(t.task.note).toMatch(/no code executed/i)
    }
  })
  it("rejects invalid phase", () => {
    const r = createBeacon({ label: "lab-4", labHost: "lab.local/4", scopeId: "s" })
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
