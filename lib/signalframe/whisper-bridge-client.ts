/**
 * WhisperMesh multi-tab bus bridge (client).
 * Transports: BroadcastChannel ("signalframe-whisper") + optional SSE /api/signalframe/bus/stream
 * HOLD_VYRNA_UNSYNC · lattice_sync: false · LOCAL MULTI-TAB only (not live mesh)
 * Privacy Fortress: never console.log message bodies — meta / ids / lengths only.
 */

export const WHISPER_BC_NAME = "signalframe-whisper"
export const WHISPER_SSE_PATH = "/api/signalframe/bus/stream"

export type WhisperBridgeChannel = "whisper" | "team" | "system"

export type WhisperBridgeEvent = {
  type: "whisper" | "team" | "system" | "bridge-hello"
  id: string
  channel: WhisperBridgeChannel
  from: string
  body: string
  createdAt: string
  lattice_sync: false
  hold: "HOLD_VYRNA_UNSYNC"
  source: "broadcast" | "sse" | "local"
  tabId: string
  bodyLen?: number
}

export type WhisperBridgeStatus = {
  channelConnected: boolean
  sseConnected: boolean
  lastEventAt: string | null
  lastEventId: string | null
  eventCount: number
  tabId: string
  transport: "broadcast" | "sse" | "both" | "none"
  lattice_sync: false
  hold: "HOLD_VYRNA_UNSYNC"
  badge: "LOCAL MULTI-TAB"
  note: string
}

type Listener = (ev: WhisperBridgeEvent) => void

const TAB_ID =
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID().slice(0, 8)
    : `tab-${Date.now().toString(36)}`

let bc: BroadcastChannel | null = null
let es: EventSource | null = null
let started = false
let lastEventAt: string | null = null
let lastEventId: string | null = null
let eventCount = 0
let sseConnected = false
const seenIds = new Set<string>()
const listeners = new Set<Listener>()

function metaLog(msg: string): void {
  console.log(`⟐ whisper-bridge · ${msg} · lattice_sync: false`)
}

function transportLabel(): WhisperBridgeStatus["transport"] {
  const bcOk = Boolean(bc)
  if (bcOk && sseConnected) return "both"
  if (bcOk) return "broadcast"
  if (sseConnected) return "sse"
  return "none"
}

export function getWhisperBridgeStatus(): WhisperBridgeStatus {
  return {
    channelConnected: Boolean(bc),
    sseConnected,
    lastEventAt,
    lastEventId,
    eventCount,
    tabId: TAB_ID,
    transport: transportLabel(),
    lattice_sync: false,
    hold: "HOLD_VYRNA_UNSYNC",
    badge: "LOCAL MULTI-TAB",
    note: "Same-origin multi-tab fanout only. Not live Vyrna / mesh lattice sync.",
  }
}

function remember(id: string): boolean {
  if (!id) return false
  if (seenIds.has(id)) return false
  seenIds.add(id)
  if (seenIds.size > 400) {
    const first = seenIds.values().next().value
    if (first) seenIds.delete(first)
  }
  return true
}

function emit(ev: WhisperBridgeEvent, fromRemote: boolean): void {
  if (!remember(ev.id) && fromRemote) return
  lastEventAt = new Date().toISOString()
  lastEventId = ev.id
  eventCount += 1
  for (const fn of listeners) {
    try {
      fn(ev)
    } catch {
      /* ignore listener errors */
    }
  }
}

function normalizeIncoming(raw: unknown, source: WhisperBridgeEvent["source"]): WhisperBridgeEvent | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as Record<string, unknown>
  const body = typeof r.body === "string" ? r.body : ""
  const channel =
    r.channel === "team" || r.channel === "system" || r.channel === "whisper"
      ? (r.channel as WhisperBridgeChannel)
      : "whisper"
  const id =
    typeof r.id === "string" && r.id
      ? r.id
      : `ev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const from = typeof r.from === "string" ? r.from.slice(0, 64) : "peer"
  const tabId = typeof r.tabId === "string" ? r.tabId : "unknown"
  // Ignore our own BroadcastChannel echoes
  if (source === "broadcast" && tabId === TAB_ID) return null
  return {
    type: channel === "system" ? "system" : channel === "team" ? "team" : "whisper",
    id,
    channel,
    from,
    body,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : new Date().toISOString(),
    lattice_sync: false,
    hold: "HOLD_VYRNA_UNSYNC",
    source,
    tabId,
    bodyLen: body.length,
  }
}

/** Publish a whisper/team/system event to other same-origin tabs (BroadcastChannel). */
export function publishWhisperBridgeEvent(input: {
  id?: string
  channel?: WhisperBridgeChannel
  from?: string
  body: string
  createdAt?: string
}): WhisperBridgeEvent | null {
  if (typeof window === "undefined") return null
  ensureBroadcast()
  const body = typeof input.body === "string" ? input.body : ""
  const channel = input.channel || "whisper"
  const ev: WhisperBridgeEvent = {
    type: channel === "system" ? "system" : channel === "team" ? "team" : "whisper",
    id: input.id || `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    channel,
    from: (input.from || "operator").slice(0, 64),
    body,
    createdAt: input.createdAt || new Date().toISOString(),
    lattice_sync: false,
    hold: "HOLD_VYRNA_UNSYNC",
    source: "local",
    tabId: TAB_ID,
    bodyLen: body.length,
  }
  remember(ev.id)
  lastEventAt = new Date().toISOString()
  lastEventId = ev.id
  eventCount += 1
  try {
    bc?.postMessage({
      ...ev,
      source: "broadcast",
      // peers receive via BC; include body for UI — never console.log it
    })
    metaLog(`publish · id=${ev.id.slice(0, 8)} · ch=${ev.channel} · len=${ev.bodyLen} · via=broadcast`)
  } catch {
    metaLog("publish failed (BroadcastChannel)")
  }
  return ev
}

function ensureBroadcast(): void {
  if (typeof window === "undefined") return
  if (bc) return
  if (typeof BroadcastChannel === "undefined") {
    metaLog("BroadcastChannel unavailable")
    return
  }
  try {
    bc = new BroadcastChannel(WHISPER_BC_NAME)
    bc.onmessage = (msg) => {
      const ev = normalizeIncoming(msg.data, "broadcast")
      if (!ev) return
      metaLog(`recv BC · id=${ev.id.slice(0, 8)} · ch=${ev.channel} · len=${ev.bodyLen ?? 0} · fromTab=${ev.tabId}`)
      emit(ev, true)
    }
    metaLog(`BroadcastChannel open · name=${WHISPER_BC_NAME} · tab=${TAB_ID}`)
  } catch {
    bc = null
    metaLog("BroadcastChannel open failed")
  }
}

function startSse(channel: WhisperBridgeChannel | "all" = "whisper"): void {
  if (typeof window === "undefined") return
  if (typeof EventSource === "undefined") {
    metaLog("EventSource unavailable")
    return
  }
  if (es) return
  const since = encodeURIComponent(new Date(Date.now() - 5000).toISOString())
  const url = `${WHISPER_SSE_PATH}?channel=${channel}&since=${since}`
  try {
    es = new EventSource(url)
    es.onopen = () => {
      sseConnected = true
      metaLog("SSE connected · LOCAL MULTI-TAB")
    }
    es.onerror = () => {
      sseConnected = false
      // EventSource auto-reconnects; keep status honest
    }
    es.addEventListener("message", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data)
        const ev = normalizeIncoming(data, "sse")
        if (!ev) return
        metaLog(`recv SSE · id=${ev.id.slice(0, 8)} · ch=${ev.channel} · len=${ev.bodyLen ?? 0}`)
        emit(ev, true)
      } catch {
        /* ignore bad frames */
      }
    })
    es.addEventListener("bus", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data)
        const ev = normalizeIncoming(data, "sse")
        if (!ev) return
        metaLog(`recv SSE bus · id=${ev.id.slice(0, 8)} · ch=${ev.channel} · len=${ev.bodyLen ?? 0}`)
        emit(ev, true)
      } catch {
        /* ignore */
      }
    })
    es.addEventListener("hello", () => {
      sseConnected = true
      metaLog("SSE hello · lattice_sync: false")
    })
  } catch {
    es = null
    sseConnected = false
    metaLog("SSE start failed")
  }
}

export function subscribeWhisperBridge(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Start multi-tab bridge. Idempotent.
 * Binds window.signalframe.bridge.status() when possible.
 */
export function startWhisperBridge(opts?: { sse?: boolean; channel?: WhisperBridgeChannel | "all" }): WhisperBridgeStatus {
  if (typeof window === "undefined") {
    return getWhisperBridgeStatus()
  }
  if (!started) {
    started = true
    ensureBroadcast()
    if (opts?.sse !== false) {
      startSse(opts?.channel || "whisper")
    }
    bindSignalFrameBridgeApi()
    metaLog(`started · transport=${transportLabel()} · badge=LOCAL MULTI-TAB`)
  }
  return getWhisperBridgeStatus()
}

export function stopWhisperBridge(): void {
  try {
    bc?.close()
  } catch {
    /* ignore */
  }
  bc = null
  try {
    es?.close()
  } catch {
    /* ignore */
  }
  es = null
  sseConnected = false
  started = false
  metaLog("stopped")
}

function bindSignalFrameBridgeApi(): void {
  if (typeof window === "undefined") return
  const w = window as unknown as {
    signalframe?: Record<string, unknown>
  }
  if (!w.signalframe) {
    w.signalframe = {}
  }
  const prevStatus = w.signalframe.status
  w.signalframe.bridge = {
    status: () => getWhisperBridgeStatus(),
    publish: (body: string, channel?: WhisperBridgeChannel) =>
      publishWhisperBridgeEvent({ body, channel: channel || "whisper", from: "signalframe.bridge" }),
    start: () => startWhisperBridge(),
    stop: () => stopWhisperBridge(),
  }
  // Soft-augment status() if it exists so Operator sees bridge in one call
  if (typeof prevStatus === "function") {
    w.signalframe.status = () => {
      const base = (prevStatus as () => unknown)()
      return {
        ...(typeof base === "object" && base ? base : { status: base }),
        bridge: getWhisperBridgeStatus(),
        lattice_sync: false,
        hold: "HOLD_VYRNA_UNSYNC",
      }
    }
  }
}

declare global {
  interface Window {
    signalframe?: Record<string, unknown> & {
      bridge?: {
        status: () => WhisperBridgeStatus
        publish: (body: string, channel?: WhisperBridgeChannel) => WhisperBridgeEvent | null
        start: () => WhisperBridgeStatus
        stop: () => void
      }
    }
  }
}
