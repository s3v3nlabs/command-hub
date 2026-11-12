/**
 * Browser helpers for the Device Bridge: signaling, WebRTC, telemetry, PWA.
 * Runs only in client components.
 */

import type { CompanionRole, CompanionSession, CompanionTelemetry, SignalEnvelope } from "@/lib/companion/types"

export const ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }]

const TOKEN_KEY = "companion-hub-token"
const TICKET_KEY = "companion-ticket"
const SESSION_KEY = "companion-session-id"
const ROLE_KEY = "companion-role"
const LABEL_KEY = "companion-label"

export function loadToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) || ""
  } catch {
    return ""
  }
}
export function saveToken(token: string): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export function loadSeat(): { ticket: string; sessionId: string; role: CompanionRole } | null {
  try {
    const ticket = sessionStorage.getItem(TICKET_KEY) || ""
    const sessionId = sessionStorage.getItem(SESSION_KEY) || ""
    const role = (sessionStorage.getItem(ROLE_KEY) || "") as CompanionRole
    if (ticket && sessionId && (role === "phone" || role === "hub")) return { ticket, sessionId, role }
  } catch {
    /* ignore */
  }
  return null
}

export function saveSeat(seat: { ticket: string; sessionId: string; role: CompanionRole } | null): void {
  try {
    if (!seat) {
      sessionStorage.removeItem(TICKET_KEY)
      sessionStorage.removeItem(SESSION_KEY)
      sessionStorage.removeItem(ROLE_KEY)
      return
    }
    sessionStorage.setItem(TICKET_KEY, seat.ticket)
    sessionStorage.setItem(SESSION_KEY, seat.sessionId)
    sessionStorage.setItem(ROLE_KEY, seat.role)
  } catch {
    /* ignore */
  }
}

export function loadLabel(): string {
  try {
    return localStorage.getItem(LABEL_KEY) || ""
  } catch {
    return ""
  }
}
export function saveLabel(label: string): void {
  try {
    if (label) localStorage.setItem(LABEL_KEY, label)
  } catch {
    /* ignore */
  }
}

export function isSecureMediaContext(): boolean {
  return typeof window !== "undefined" && window.isSecureContext
}

export function authHeaders(token: string, ticket?: string): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" }
  if (token) h.Authorization = `Bearer ${token}`
  if (ticket) h["x-companion-ticket"] = ticket
  return h
}

export async function companionFetch(
  url: string,
  opts: { method?: string; body?: unknown; token?: string; ticket?: string } = {},
): Promise<{ status: number; json: Record<string, unknown> }> {
  const res = await fetch(url, {
    method: opts.method || "GET",
    headers: authHeaders(opts.token || "", opts.ticket),
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
  return { status: res.status, json }
}

export function openEventSource(sessionId: string, ticket: string, after = 0): EventSource {
  const qs = new URLSearchParams({ session: sessionId, ticket, after: String(after) })
  return new EventSource(`/api/companion/events?${qs.toString()}`)
}

export function attachSignalHandlers(
  es: EventSource,
  onSignal: (kind: string, msg: SignalEnvelope | Record<string, unknown>) => void,
): () => void {
  const kinds = ["offer", "answer", "ice", "hangup", "media-state", "navigate", "presence", "session", "hello"]
  const listeners: Array<[string, (e: MessageEvent) => void]> = []
  for (const kind of kinds) {
    const fn = (e: MessageEvent) => {
      let data: SignalEnvelope | Record<string, unknown> = {}
      try {
        data = JSON.parse(e.data)
      } catch {
        return
      }
      onSignal(kind, data)
    }
    es.addEventListener(kind, fn as EventListener)
    listeners.push([kind, fn])
  }
  return () => {
    for (const [kind, fn] of listeners) es.removeEventListener(kind, fn as EventListener)
  }
}

export async function postSignal(opts: {
  sessionId: string
  ticket: string
  token?: string
  from: CompanionRole
  kind: string
  payload: unknown
}): Promise<boolean> {
  const { status, json } = await companionFetch("/api/companion/signal", {
    method: "POST",
    token: opts.token,
    ticket: opts.ticket,
    body: { sessionId: opts.sessionId, from: opts.from, kind: opts.kind, payload: opts.payload },
  })
  return status === 200 && json.ok === true
}

export async function collectTelemetry(label?: string): Promise<CompanionTelemetry> {
  const nav = navigator as Navigator & {
    getBattery?: () => Promise<{ level: number; charging: boolean }>
    connection?: { type?: string; effectiveType?: string; downlink?: number; rtt?: number }
  }
  const out: CompanionTelemetry = { ts: new Date().toISOString(), label }
  try {
    if (nav.getBattery) {
      const b = await nav.getBattery()
      out.battery = { level: b.level, charging: b.charging }
    }
  } catch {
    /* Battery API absent or denied */
  }
  if (nav.connection) {
    out.network = {
      type: nav.connection.type,
      effectiveType: nav.connection.effectiveType,
      downlink: nav.connection.downlink,
      rtt: nav.connection.rtt,
    }
  }
  try {
    if (nav.geolocation) {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        nav.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 15000,
        })
      })
      out.geo = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        altitude: pos.coords.altitude ?? undefined,
        heading: pos.coords.heading ?? undefined,
        speed: pos.coords.speed ?? undefined,
      }
    }
  } catch {
    /* geolocation denied or unavailable — honest omit */
  }
  return out
}

export function summarizeSession(s: CompanionSession): string {
  const bits: string[] = [s.label]
  if (s.media.phoneCam) bits.push("cam")
  if (s.media.phoneMic) bits.push("mic")
  if (s.lastTelemetry?.battery) {
    bits.push(`${Math.round(s.lastTelemetry.battery.level * 100)}%`)
  }
  return bits.join(" · ")
}
