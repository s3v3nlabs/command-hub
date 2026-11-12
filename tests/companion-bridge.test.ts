import { afterEach, beforeEach, describe, expect, it } from "vitest"
import os from "os"
import path from "path"
import fs from "fs"
import { isHubAuthorized, isSecureMode, extractHubToken } from "@/lib/security/api-auth"
import { runCompanionAction } from "@/lib/companion/actions"
import {
  _resetCompanionStoreForTests,
  createSession,
  endSession,
  extractCompanionTicket,
  getSession,
  joinSession,
  listSessions,
  listSignalsAfter,
  publicStatus,
  pushSignal,
  recordTelemetry,
  resolveTicket,
  safeHubPath,
  subscribeSignals,
} from "@/lib/companion/store"

const tmp = path.join(os.tmpdir(), "companion-test-" + process.pid)

describe("companion store", () => {
  const prev = { ...process.env }
  beforeEach(() => {
    process.env.COMPANION_DATA_DIR = tmp
    fs.rmSync(tmp, { recursive: true, force: true })
    _resetCompanionStoreForTests()
    delete process.env.HUB_API_TOKEN
    delete process.env.OPERATOR_API_TOKEN
    delete process.env.HEIMDALL_API_KEY
    delete process.env.SECURE_MODE
  })
  afterEach(() => {
    _resetCompanionStoreForTests()
    fs.rmSync(tmp, { recursive: true, force: true })
    process.env = { ...prev }
  })

  it("creates a session and issues a raw ticket that hashes back", () => {
    const r = createSession({ role: "phone", label: "Jerry's Pixel" })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.session.label).toBe("Jerry's Pixel")
    expect(r.session.id.startsWith("db_")).toBe(true)
    expect(r.session.lattice_sync).toBe(false)
    expect(r.ticket.length).toBe(64)
    const resolved = resolveTicket(r.ticket)
    expect(resolved.ok).toBe(true)
    if (resolved.ok) {
      expect(resolved.session.id).toBe(r.session.id)
      expect(resolved.ticket.role).toBe("phone")
    }
  })

  it("rejects a garbage ticket and a ticket after end", () => {
    const r = createSession({ role: "phone", label: "x" })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(resolveTicket("not-a-ticket").ok).toBe(false)
    expect(endSession(r.session.id)).toBe(true)
    expect(resolveTicket(r.ticket).ok).toBe(false)
    expect(getSession(r.session.id)).toBeNull()
  })

  it("hub join issues a new ticket and takes the seat", () => {
    const phone = createSession({ role: "phone", label: "bodycam" })
    expect(phone.ok).toBe(true)
    if (!phone.ok) return
    const hub = joinSession({ sessionId: phone.session.id, role: "hub" })
    expect(hub.ok).toBe(true)
    if (!hub.ok) return
    expect(hub.ticket).not.toBe(phone.ticket)
    expect(hub.session.hubJoinedAt).toBeTruthy()
    expect(resolveTicket(hub.ticket).ok).toBe(true)
    // phone ticket still valid (different role)
    expect(resolveTicket(phone.ticket).ok).toBe(true)
    // second hub join revokes the previous hub ticket
    const hub2 = joinSession({ sessionId: phone.session.id, role: "hub" })
    expect(hub2.ok).toBe(true)
    if (!hub2.ok) return
    expect(resolveTicket(hub.ticket).ok).toBe(false)
    expect(resolveTicket(hub2.ticket).ok).toBe(true)
  })

  it("pushes SDP/ICE signals and fans them out to subscribers", () => {
    const r = createSession({ role: "phone", label: "p" })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const seen: string[] = []
    const un = subscribeSignals(r.session.id, (s) => seen.push(s.kind))
    const offer = pushSignal({
      sessionId: r.session.id,
      from: "phone",
      kind: "offer",
      payload: { type: "offer", sdp: "v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\n" },
    })
    expect(offer.ok).toBe(true)
    const ice = pushSignal({
      sessionId: r.session.id,
      from: "phone",
      kind: "ice",
      payload: { candidate: "candidate:1 1 UDP 1 127.0.0.1 9 typ host", sdpMid: "0", sdpMLineIndex: 0 },
    })
    expect(ice.ok).toBe(true)
    expect(seen).toEqual(["offer", "ice"])
    const after = listSignalsAfter(r.session.id, 0)
    expect(after.map((s) => s.kind)).toEqual(["offer", "ice"])
    un()
  })

  it("rejects oversized or malicious navigate payloads", () => {
    const r = createSession({ role: "hub", label: "h" })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const bad = pushSignal({
      sessionId: r.session.id,
      from: "hub",
      kind: "navigate",
      payload: { path: "https://evil.example/phish" },
    })
    expect(bad.ok).toBe(false)
    const also = pushSignal({
      sessionId: r.session.id,
      from: "hub",
      kind: "navigate",
      payload: { path: "//evil.example" },
    })
    expect(also.ok).toBe(false)
    const ok = pushSignal({
      sessionId: r.session.id,
      from: "hub",
      kind: "navigate",
      payload: { path: "/intelligence/cctv" },
    })
    expect(ok.ok).toBe(true)
  })

  it("sanitizes telemetry and rejects missing sessions", () => {
    const r = createSession({ role: "phone", label: "p" })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const tel = recordTelemetry(r.session.id, {
      geo: { lat: 95, lon: -200, accuracy: -5 }, // clamped
      battery: { level: 1.4, charging: true },
      network: { type: "wifi", effectiveType: "4g", downlink: 12, rtt: 40 },
    })
    expect(tel.ok).toBe(true)
    if (!tel.ok) return
    expect(tel.telemetry.geo?.lat).toBe(90)
    expect(tel.telemetry.geo?.lon).toBe(-180)
    expect(tel.telemetry.geo?.accuracy).toBe(0)
    expect(tel.telemetry.battery?.level).toBe(1)
    expect(tel.telemetry.battery?.charging).toBe(true)
    expect(recordTelemetry("nope", {}).ok).toBe(false)
  })

  it("lists only live sessions and publicStatus is honest", () => {
    createSession({ role: "phone", label: "a" })
    const st = publicStatus()
    expect(st.ok).toBe(true)
    expect(st.httpsRequired).toBe(true)
    expect(st.liveSessionCount).toBe(1)
    expect(st.limits.turn).toMatch(/No TURN/)
    expect(st.features.remoteActions).toContain("heartbeat")
    expect(listSessions({ liveOnly: true })).toHaveLength(1)
  })

  it("extractCompanionTicket prefers the header, then the query", () => {
    const a = new Request("http://x/api/companion/events?ticket=from-query", {
      headers: { "x-companion-ticket": "from-header" },
    })
    expect(extractCompanionTicket(a)).toBe("from-header")
    const b = new Request("http://x/api/companion/events?ticket=from-query")
    expect(extractCompanionTicket(b)).toBe("from-query")
    expect(extractCompanionTicket(new Request("http://x/"))).toBeNull()
  })
})

describe("safeHubPath", () => {
  it("allows in-hub relative paths only", () => {
    expect(safeHubPath("/companion/hub-view")).toBe("/companion/hub-view")
    expect(safeHubPath("/offsec?x=1")).toBe("/offsec?x=1")
    expect(safeHubPath("https://evil.test")).toBeNull()
    expect(safeHubPath("//evil.test")).toBeNull()
    expect(safeHubPath("/foo/../etc/passwd")).toBeNull()
    expect(safeHubPath("javascript:alert(1)")).toBeNull()
    expect(safeHubPath("/x onload=x")).toBeNull()
  })
})

describe("companion actions", () => {
  const prev = { ...process.env }
  beforeEach(() => {
    process.env.COMPANION_DATA_DIR = tmp
    fs.rmSync(tmp, { recursive: true, force: true })
    _resetCompanionStoreForTests()
  })
  afterEach(() => {
    _resetCompanionStoreForTests()
    fs.rmSync(tmp, { recursive: true, force: true })
    process.env = { ...prev }
  })

  it("heartbeats into SignalFrame presence", () => {
    const r = runCompanionAction({ action: "heartbeat", name: "Jerry phone" })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect((r.operator as { name: string }).name).toBe("Jerry phone")
    }
  })

  it("lists field modules and opens only safe paths", () => {
    const list = runCompanionAction({ action: "list_modules" })
    expect(list.ok).toBe(true)
    if (list.ok) expect(Array.isArray(list.modules)).toBe(true)
    expect(runCompanionAction({ action: "open", path: "https://evil.test" }).ok).toBe(false)
    const session = createSession({ role: "phone", label: "p" })
    expect(session.ok).toBe(true)
    if (!session.ok) return
    const open = runCompanionAction({
      action: "open",
      path: "/intelligence/cctv",
      sessionId: session.session.id,
      from: "hub",
    })
    expect(open.ok).toBe(true)
    if (open.ok) expect(open.path).toBe("/intelligence/cctv")
    const nav = listSignalsAfter(session.session.id, 0)
    expect(nav.some((s) => s.kind === "navigate")).toBe(true)
  })

  it("rejects unknown actions", () => {
    expect(runCompanionAction({ action: "shell" }).ok).toBe(false)
    expect(runCompanionAction({ action: "exploit" }).ok).toBe(false)
  })
})

describe("isHubAuthorized", () => {
  const prev = { ...process.env }
  afterEach(() => {
    process.env = { ...prev }
  })
  it("is open in lab, denied in SECURE_MODE without a token, matched when a token is set", () => {
    delete process.env.HUB_API_TOKEN
    delete process.env.OPERATOR_API_TOKEN
    delete process.env.HEIMDALL_API_KEY
    process.env.SECURE_MODE = "0"
    const bare = new Request("http://x/")
    expect(isHubAuthorized(bare)).toBe(true)
    process.env.SECURE_MODE = "1"
    expect(isSecureMode()).toBe(true)
    expect(isHubAuthorized(bare)).toBe(false)
    process.env.SECURE_MODE = "0"
    process.env.HUB_API_TOKEN = "secret-token"
    expect(isHubAuthorized(bare)).toBe(false)
    const ok = new Request("http://x/", { headers: { Authorization: "Bearer secret-token" } })
    expect(isHubAuthorized(ok)).toBe(true)
    expect(extractHubToken(ok)).toBe("secret-token")
    const bad = new Request("http://x/", { headers: { Authorization: "Bearer no" } })
    expect(isHubAuthorized(bad)).toBe(false)
  })
})
