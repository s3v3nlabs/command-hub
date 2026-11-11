/**
 * Unified audit timeline across modules. Merges the hub's existing audit/event
 * sources into one chronological feed:
 *   - staged-ladder audit (local-data/scope-audit/audit.jsonl) — authz decisions
 *   - Heimdall IDS ring (local-data/heimdall-ids) — live detections
 *   - deception mesh events (data/offsec/deception/events.jsonl)
 *   - Heimdall eyes-only encrypted log — shown SEALED unless a Heimdall token
 *     is presented (then decrypted). "Only Heimdall crosses the Bifrost."
 *
 * Read-only aggregation. Does not write; the eyes-only log remains the system of
 * record for sensitive actions.
 */

import { readAudit } from "@/lib/offsec/scope-ladder"
import { buildIdsStatus } from "@/lib/security/ids-status"
import { listEvents as listDeceptionEvents } from "@/lib/offsec/deception/store"
import { readEyesOnly } from "@/lib/heimdall/eyes-only"

export type TimelineCategory = "authz" | "detection" | "deception" | "eyes-only"

export interface TimelineEntry {
  ts: string
  source: string
  category: TimelineCategory
  actor?: string
  action: string
  detail?: string
  severity?: string
  allowed?: boolean
  sealed?: boolean
}

export interface TimelineResult {
  entries: TimelineEntry[]
  counts: Record<TimelineCategory, number>
  heimdallAuthorized: boolean
  generatedAt: string
}

export function buildTimeline(opts?: { heimdallToken?: string | null; limit?: number }): TimelineResult {
  const limit = opts?.limit ?? 300
  const entries: TimelineEntry[] = []

  // 1. staged-ladder authz audit
  try {
    for (const a of readAudit(limit)) {
      entries.push({
        ts: a.ts,
        source: "scope-ladder",
        category: "authz",
        actor: a.operator || undefined,
        action: `${a.capability} ${a.allowed ? "ALLOWED" : "DENIED"}`,
        detail: [a.target ? `target=${a.target}` : "", a.reason || ""].filter(Boolean).join(" · "),
        allowed: a.allowed,
      })
    }
  } catch {
    /* ignore */
  }

  // 2. Heimdall IDS ring
  try {
    for (const e of buildIdsStatus().events || []) {
      entries.push({
        ts: e.ts,
        source: `ids:${e.source}`,
        category: "detection",
        action: e.message,
        severity: e.severity,
      })
    }
  } catch {
    /* ignore */
  }

  // 3. deception mesh
  try {
    for (const d of listDeceptionEvents(limit)) {
      entries.push({
        ts: d.ts,
        source: `deception:${d.kind}`,
        category: "deception",
        action: d.message,
        severity: d.severity,
        detail: d.fingerprint ? `fp=${d.fingerprint}` : undefined,
      })
    }
  } catch {
    /* ignore */
  }

  // 4. eyes-only (sealed unless authorized)
  let heimdallAuthorized = false
  try {
    const eo = readEyesOnly(opts?.heimdallToken ?? null, limit)
    heimdallAuthorized = eo.authorized
    for (const rec of eo.records) {
      const r = rec as Record<string, unknown>
      if (r.sealed) {
        entries.push({ ts: String(r.ts || ""), source: "heimdall", category: "eyes-only", action: "sealed record", sealed: true })
      } else {
        entries.push({
          ts: String(r.ts || ""),
          source: `heimdall:${String(r.subsystem || "eyes-only")}`,
          category: "eyes-only",
          action: String(r.action || "event"),
          detail: Object.entries(r)
            .filter(([k]) => !["ts", "subsystem", "action"].includes(k))
            .map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : v}`)
            .join(" · ")
            .slice(0, 400),
          sealed: false,
        })
      }
    }
  } catch {
    /* ignore */
  }

  entries.sort((a, b) => (b.ts || "").localeCompare(a.ts || ""))
  const trimmed = entries.slice(0, limit)
  const counts: Record<TimelineCategory, number> = { authz: 0, detection: 0, deception: 0, "eyes-only": 0 }
  for (const e of trimmed) counts[e.category] += 1

  return { entries: trimmed, counts, heimdallAuthorized, generatedAt: new Date().toISOString() }
}
