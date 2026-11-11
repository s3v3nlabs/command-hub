import { describe, it, expect, afterAll } from "vitest"
import fs from "fs"
import path from "path"
import { recordRun, replayRun, listRuns, deleteRun, evaluateEvent } from "@/lib/offsec/replay/replay"

const FILE = path.join(process.cwd(), "data", "offsec", "replay", "runs.json")
const made: string[] = []
afterAll(() => {
  for (const id of made) deleteRun(id)
  try {
    if (fs.existsSync(FILE) && !listRuns().length) fs.unlinkSync(FILE)
  } catch {
    /* ignore */
  }
})

describe("replay engine", () => {
  it("detects a SQLi event and maps it to T1190", () => {
    const r = evaluateEvent({ id: "x", order: 0, label: "sqli", method: "GET", path: "/api", search: "id=1' OR 1=1--", expectDetection: true, expectTechnique: "T1190" })
    expect(r.detectionFired).toBe(true)
    expect(r.techniques).toContain("T1190")
    expect(r.verdict).toBe("pass")
  })
  it("passes a benign event that expects no detection", () => {
    const r = evaluateEvent({ id: "y", order: 1, label: "health", method: "GET", path: "/health", expectDetection: false })
    expect(r.detectionFired).toBe(false)
    expect(r.verdict).toBe("pass")
  })
  it("fails when a detection was expected but did not fire", () => {
    const r = evaluateEvent({ id: "z", order: 2, label: "quiet", method: "GET", path: "/home", expectDetection: true })
    expect(r.detectionFired).toBe(false)
    expect(r.verdict).toBe("fail")
  })
  it("records and replays a run end to end", () => {
    const rec = recordRun({ name: "regression-1", events: [
      { label: "sqli", method: "GET", path: "/a", search: "x=1' OR 1=1--", expectDetection: true },
      { label: "benign", method: "GET", path: "/ok", expectDetection: false },
    ] })
    expect(rec.ok).toBe(true)
    if (!rec.ok) return
    made.push(rec.run.id)
    const rep = replayRun(rec.run.id)
    expect(rep.ok).toBe(true)
    if (rep.ok) {
      expect(rep.summary.total).toBe(2)
      expect(rep.summary.passed).toBe(2)
      expect(rep.summary.failed).toBe(0)
    }
  })
})
