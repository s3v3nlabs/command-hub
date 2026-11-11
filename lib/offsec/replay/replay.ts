/**
 * Purple-team replay: record a lab attack run (a sequence of events) and replay
 * it against the hub's OWN detection path (Heimdall request-guard + ATT&CK
 * mapping) to regression-test defenses. Pass/fail per event + summary.
 *
 * Replaying feeds recorded events through inspectRequest()/mapTextToTechniques()
 * — it does NOT send traffic anywhere. Lab-only, file-backed under
 * data/offsec/replay/ (gitignored).
 */

import fs from "fs"
import path from "path"
import { randomUUID } from "crypto"
import { inspectRequest } from "@/lib/security/request-guard"
import { mapTextToTechniques } from "@/lib/offsec/report/attack-map"

export interface ReplayEventInput {
  label?: string
  kind?: "http" | "signal"
  method?: string
  path?: string
  search?: string
  body?: string
  text?: string
  /** expectations for regression testing */
  expectDetection?: boolean
  expectTechnique?: string
}

export interface ReplayEvent extends ReplayEventInput {
  id: string
  order: number
}

export interface AttackRun {
  id: string
  name: string
  description?: string
  events: ReplayEvent[]
  createdAt: string
  updatedAt: string
  lastReplayAt?: string
  lastResult?: ReplaySummary
  lattice_sync: false
}

export interface ReplayEventResult {
  eventId: string
  label: string
  detectionFired: boolean
  reasons: string[]
  severity: string
  techniques: string[]
  expectDetection?: boolean
  expectTechnique?: string
  pass: boolean
  verdict: "pass" | "fail" | "info"
}

export interface ReplaySummary {
  runId: string
  at: string
  total: number
  passed: number
  failed: number
  info: number
  results: ReplayEventResult[]
}

const DIR = path.join(process.cwd(), "data", "offsec", "replay")
const FILE = path.join(DIR, "runs.json")

function ensure() {
  fs.mkdirSync(DIR, { recursive: true, mode: 0o700 })
}
function readAll(): AttackRun[] {
  try {
    if (!fs.existsSync(FILE)) return []
    const raw = JSON.parse(fs.readFileSync(FILE, "utf8"))
    return (Array.isArray(raw) ? raw : []).map((r: AttackRun) => ({ ...r, lattice_sync: false as const }))
  } catch {
    return []
  }
}
function writeAll(list: AttackRun[]) {
  ensure()
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2) + "\n", { mode: 0o600 })
}

export function listRuns(): AttackRun[] {
  return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}
export function getRun(id: string): AttackRun | null {
  return readAll().find((r) => r.id === id) || null
}

export function recordRun(input: { name: string; description?: string; events: ReplayEventInput[] }): { ok: true; run: AttackRun } | { ok: false; error: string } {
  const name = (input.name || "").trim().slice(0, 160)
  if (!name) return { ok: false, error: "name required" }
  const events: ReplayEvent[] = (input.events || []).slice(0, 500).map((e, i) => ({
    ...e,
    id: randomUUID(),
    order: i,
    label: (e.label || e.path || e.text || `event ${i + 1}`).slice(0, 160),
  }))
  const now = new Date().toISOString()
  const run: AttackRun = {
    id: randomUUID(),
    name,
    description: (input.description || "").slice(0, 2000) || undefined,
    events,
    createdAt: now,
    updatedAt: now,
    lattice_sync: false,
  }
  const all = readAll()
  all.push(run)
  writeAll(all)
  return { ok: true, run }
}

export function deleteRun(id: string): boolean {
  const all = readAll()
  const next = all.filter((r) => r.id !== id)
  if (next.length === all.length) return false
  writeAll(next)
  return true
}

/** Run one recorded event through the detection path. Pure; no network. */
export function evaluateEvent(e: ReplayEvent): ReplayEventResult {
  const hay = [e.text, e.path, e.search, e.body].filter(Boolean).join(" ")
  const verdict = inspectRequest({
    method: e.method || "GET",
    pathname: e.path || "/",
    search: e.search || "",
    bodySnippet: [e.body, e.text].filter(Boolean).join(" ") || undefined,
  })
  const SIGNATURE_TECHNIQUE: Record<string, string> = {
    sqli_probe_signature: "T1190",
    ssrf_internal_target_signature: "T1190",
    prototype_pollution_signature: "T1190",
    path_traversal_signature: "T1083",
    command_injection_signature: "T1059",
    xss_probe_signature: "T1059",
  }
  const techSet = new Set(mapTextToTechniques(hay).map((t) => t.technique.id))
  for (const r of verdict.reasons) {
    const mapped = SIGNATURE_TECHNIQUE[r]
    if (mapped) techSet.add(mapped)
  }
  const techniques = Array.from(techSet)
  const detectionFired = verdict.reasons.length > 0

  let verdictKind: "pass" | "fail" | "info" = "info"
  let pass = true
  if (typeof e.expectDetection === "boolean") {
    pass = detectionFired === e.expectDetection
    verdictKind = pass ? "pass" : "fail"
  }
  if (e.expectTechnique) {
    const techPass = techniques.includes(e.expectTechnique.toUpperCase())
    pass = pass && techPass
    verdictKind = pass ? (verdictKind === "info" ? "pass" : verdictKind) : "fail"
  }

  return {
    eventId: e.id,
    label: e.label || `event ${e.order + 1}`,
    detectionFired,
    reasons: verdict.reasons,
    severity: verdict.severity,
    techniques,
    expectDetection: e.expectDetection,
    expectTechnique: e.expectTechnique,
    pass,
    verdict: verdictKind,
  }
}

export function replayRun(id: string): { ok: true; summary: ReplaySummary } | { ok: false; error: string } {
  const run = getRun(id)
  if (!run) return { ok: false, error: "not_found" }
  const results = run.events.map(evaluateEvent)
  const summary: ReplaySummary = {
    runId: run.id,
    at: new Date().toISOString(),
    total: results.length,
    passed: results.filter((r) => r.verdict === "pass").length,
    failed: results.filter((r) => r.verdict === "fail").length,
    info: results.filter((r) => r.verdict === "info").length,
    results,
  }
  // persist last result
  const all = readAll()
  const idx = all.findIndex((r) => r.id === id)
  if (idx >= 0) {
    all[idx].lastReplayAt = summary.at
    all[idx].lastResult = summary
    all[idx].updatedAt = summary.at
    writeAll(all)
  }
  return { ok: true, summary }
}
