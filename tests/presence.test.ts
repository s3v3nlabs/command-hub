import { describe, it, expect, afterAll } from "vitest"
import fs from "fs"
import path from "path"
import { heartbeat, listOnline, leave, postNote, listNotes, presenceStatus } from "@/lib/signalframe/presence"

const DIR = path.join(process.cwd(), "local-data", "signalframe-presence")
afterAll(() => {
  try {
    fs.rmSync(DIR, { recursive: true, force: true })
  } catch {
    /* ignore */
  }
})

describe("multi-operator presence", () => {
  it("registers operators and reports multi-operator honestly", () => {
    const a = heartbeat({ name: "Alice" })
    const b = heartbeat({ name: "Bob" })
    expect(a.ok && b.ok).toBe(true)
    const online = listOnline()
    expect(online.length).toBeGreaterThanOrEqual(2)
    expect(presenceStatus().multiOperator).toBe(true)
  })
  it("keeps a stable id across heartbeats and updates cursor", () => {
    const a = heartbeat({ name: "Carol" })
    if (!a.ok) throw new Error("fail")
    const id = a.operator.id
    const a2 = heartbeat({ id, name: "Carol", cursor: { x: 100, y: 200 } })
    expect(a2.ok).toBe(true)
    if (a2.ok) {
      expect(a2.operator.id).toBe(id)
      expect(a2.operator.cursor).toEqual({ x: 100, y: 200 })
    }
    expect(leave(id)).toBe(true)
  })
  it("posts and lists engagement notes scoped by engagement", () => {
    postNote({ engagementId: "eng-1", from: "Alice", body: "found creds in repo" })
    postNote({ engagementId: "eng-2", from: "Bob", body: "other engagement" })
    const n1 = listNotes("eng-1")
    expect(n1.length).toBe(1)
    expect(n1[0].body).toMatch(/creds/)
  })
  it("requires name / engagement / body", () => {
    expect(heartbeat({ name: "" }).ok).toBe(false)
    expect(postNote({ engagementId: "", from: "x", body: "y" }).ok).toBe(false)
    expect(postNote({ engagementId: "e", from: "x", body: "" }).ok).toBe(false)
  })
})
