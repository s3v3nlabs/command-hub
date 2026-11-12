/**
 * Safe remote actions a Device Bridge phone or hub may trigger.
 * Only presence heartbeats and allowlisted in-hub navigations — no shell, no
 * ladder-gated offensive actions, no arbitrary URLs.
 *
 * Credit: Christian Wilford (s3v3n), AI Architect, Offensive Security Enthusiast,
 * Founder of Singular/ty Defense Solutions, LLC.
 */

import { heartbeat } from "@/lib/signalframe/presence"
import { FIELD_MODULES } from "./types"
import { pushSignal, safeHubPath } from "./store"
import type { CompanionRole } from "./types"

export type CompanionAction =
  | { action: "heartbeat"; name?: string; id?: string; workspace?: string }
  | { action: "open"; path: string; sessionId: string; from: CompanionRole }
  | { action: "list_modules" }

export function runCompanionAction(
  body: Record<string, unknown>,
):
  | { ok: true; action: string; [k: string]: unknown }
  | { ok: false; error: string } {
  const action = String(body.action || "")
  if (action === "heartbeat") {
    const r = heartbeat({
      id: typeof body.id === "string" ? body.id : undefined,
      name: String(body.name || "Device Bridge").slice(0, 60),
      workspace: typeof body.workspace === "string" ? body.workspace : "companion",
      cursor: { x: 0, y: 0, view: "companion" },
    })
    if (!r.ok) return r
    return { ok: true, action: "heartbeat", operator: r.operator, online: r.online, lattice_sync: false }
  }
  if (action === "list_modules") {
    return { ok: true, action: "list_modules", modules: FIELD_MODULES }
  }
  if (action === "open") {
    const raw = String(body.path || "")
    const allowed = FIELD_MODULES.find((m) => m.path === raw)
    const path = allowed ? allowed.path : safeHubPath(raw)
    if (!path) return { ok: false, error: "path_not_allowed" }
    const sessionId = String(body.sessionId || "")
    const from = body.from === "hub" || body.from === "phone" ? body.from : "hub"
    if (sessionId) {
      const sig = pushSignal({
        sessionId,
        from,
        kind: "navigate",
        payload: { path },
      })
      if (!sig.ok) return { ok: false, error: sig.error }
    }
    return { ok: true, action: "open", path, url: path }
  }
  return { ok: false, error: "unknown_action" }
}
