/**
 * Auth + SSE helpers for /api/companion/*.
 * Session join and media/signaling require hub auth (or a session ticket issued
 * after a successful join). Read-only status is softer.
 */

import { NextResponse } from "next/server"
import { isHubAuthorized, requireHubAuth } from "@/lib/security/api-auth"
import {
  extractCompanionTicket,
  resolveTicket,
  getSession,
} from "./store"
import type { CompanionRole, CompanionSession, CompanionTicket } from "./types"

export type CompanionAuth =
  | { ok: true; via: "hub-token" | "open-lab"; session?: CompanionSession; role?: CompanionRole }
  | { ok: true; via: "ticket"; session: CompanionSession; role: CompanionRole; ticket: CompanionTicket }
  | { ok: false; response: NextResponse }

/**
 * Privileged companion access. Accepts:
 *  - a valid session ticket (SSE and follow-up signaling — EventSource cannot set Authorization)
 *  - a valid HUB_API_TOKEN / open-lab (no token, SECURE_MODE off)
 */
export function requireCompanionAuth(
  req: Request,
  opts: { sessionId?: string | null; surface?: string; needSession?: boolean } = {},
): CompanionAuth {
  const surface = opts.surface || "companion"
  const ticketRaw = extractCompanionTicket(req)
  if (ticketRaw) {
    const r = resolveTicket(ticketRaw)
    if (!r.ok) {
      return {
        ok: false,
        response: NextResponse.json({ ok: false, error: r.error, surface }, { status: 401 }),
      }
    }
    if (opts.sessionId && r.session.id !== opts.sessionId) {
      return {
        ok: false,
        response: NextResponse.json({ ok: false, error: "ticket_session_mismatch", surface }, { status: 403 }),
      }
    }
    return { ok: true, via: "ticket", session: r.session, role: r.ticket.role, ticket: r.ticket }
  }

  const denied = requireHubAuth(req, { surface, requireInSecureMode: true })
  if (denied) return { ok: false, response: denied }

  if (opts.needSession || opts.sessionId) {
    const id = opts.sessionId
    if (!id) {
      return {
        ok: false,
        response: NextResponse.json({ ok: false, error: "session_required", surface }, { status: 400 }),
      }
    }
    const session = getSession(id)
    if (!session) {
      return {
        ok: false,
        response: NextResponse.json({ ok: false, error: "not_found", surface }, { status: 404 }),
      }
    }
    return { ok: true, via: isHubAuthorized(req) ? "hub-token" : "open-lab", session, role: "hub" }
  }

  return { ok: true, via: isHubAuthorized(req) ? "hub-token" : "open-lab" }
}

export function sseResponse(
  req: Request,
  onStart: (send: (event: string, data: unknown, id?: string) => void) => () => void,
): Response {
  const encoder = new TextEncoder()
  let cleanup: (() => void) | undefined
  let ping: ReturnType<typeof setInterval> | undefined
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown, id?: string) => {
        let chunk = ""
        if (id) chunk += `id: ${id}\n`
        chunk += `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        try {
          controller.enqueue(encoder.encode(chunk))
        } catch {
          /* closed */
        }
      }
      send("hello", { ok: true, ts: new Date().toISOString() })
      cleanup = onStart(send)
      ping = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping ${Date.now()}\n\n`))
        } catch {
          /* closed */
        }
      }, 15000)
      const close = () => {
        if (ping) clearInterval(ping)
        ping = undefined
        try {
          cleanup?.()
        } catch {
          /* ignore */
        }
        cleanup = undefined
        try {
          controller.close()
        } catch {
          /* already closed */
        }
      }
      req.signal.addEventListener("abort", close)
    },
    cancel() {
      if (ping) clearInterval(ping)
      try {
        cleanup?.()
      } catch {
        /* ignore */
      }
    },
  })
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
