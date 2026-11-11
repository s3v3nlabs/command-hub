/**
 * Engagement / notes / findings store for the offsec suite.
 * File-backed under data/offsec/ (gitignored). Mirrors the bounty store pattern
 * and reuses the hub's local-first persistence convention. No secrets stored here.
 */

import fs from "fs"
import path from "path"
import { randomUUID } from "crypto"

export type EngagementStatus = "scoping" | "active" | "reporting" | "closed"
export type FindingSeverity = "info" | "low" | "medium" | "high" | "critical"

export interface Finding {
  id: string
  title: string
  severity: FindingSeverity
  phase?: string
  target?: string
  description: string
  evidence?: string
  recommendation?: string
  createdAt: string
}

export interface NoteEntry {
  id: string
  phase?: string
  target?: string
  body: string
  createdAt: string
}

export interface Engagement {
  id: string
  name: string
  client?: string
  scope: string[]
  roe?: string
  authorizedBy?: string
  status: EngagementStatus
  findings: Finding[]
  notes: NoteEntry[]
  createdAt: string
  updatedAt: string
  lattice_sync: false
}

const DIR = path.join(process.cwd(), "data", "offsec")
const FILE = path.join(DIR, "engagements.json")

function ensure(): void {
  fs.mkdirSync(DIR, { recursive: true, mode: 0o700 })
}
function readAll(): Engagement[] {
  try {
    if (!fs.existsSync(FILE)) return []
    const raw = JSON.parse(fs.readFileSync(FILE, "utf8"))
    return (Array.isArray(raw) ? raw : []).map((e: Engagement) => ({ ...e, lattice_sync: false as const }))
  } catch {
    return []
  }
}
function writeAll(list: Engagement[]): void {
  ensure()
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2) + "\n", { mode: 0o600 })
}

export function listEngagements(): Engagement[] {
  return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function createEngagement(input: {
  name: string
  client?: string
  scope?: string[]
  roe?: string
  authorizedBy?: string
}): { ok: true; engagement: Engagement } | { ok: false; error: string } {
  const name = (input.name || "").trim().slice(0, 160)
  if (!name) return { ok: false, error: "name required" }
  const now = new Date().toISOString()
  const engagement: Engagement = {
    id: randomUUID(),
    name,
    client: (input.client || "").slice(0, 160) || undefined,
    scope: (input.scope || []).map((s) => String(s).trim().slice(0, 200)).filter(Boolean).slice(0, 200),
    roe: (input.roe || "").slice(0, 8000) || undefined,
    authorizedBy: (input.authorizedBy || "").slice(0, 160) || undefined,
    status: "scoping",
    findings: [],
    notes: [],
    createdAt: now,
    updatedAt: now,
    lattice_sync: false,
  }
  const all = readAll()
  all.push(engagement)
  writeAll(all)
  return { ok: true, engagement }
}

function mutate(id: string, fn: (e: Engagement) => void): { ok: true; engagement: Engagement } | { ok: false; error: string } {
  const all = readAll()
  const idx = all.findIndex((e) => e.id === id)
  if (idx < 0) return { ok: false, error: "not found" }
  fn(all[idx])
  all[idx].updatedAt = new Date().toISOString()
  writeAll(all)
  return { ok: true, engagement: all[idx] }
}

export function setStatus(id: string, status: EngagementStatus) {
  if (!["scoping", "active", "reporting", "closed"].includes(status)) return { ok: false as const, error: "invalid status" }
  return mutate(id, (e) => (e.status = status))
}

export function addNote(id: string, input: { body: string; phase?: string; target?: string }) {
  const body = (input.body || "").trim().slice(0, 8000)
  if (!body) return { ok: false as const, error: "body required" }
  return mutate(id, (e) =>
    e.notes.unshift({
      id: randomUUID(),
      body,
      phase: input.phase?.slice(0, 40),
      target: input.target?.slice(0, 200),
      createdAt: new Date().toISOString(),
    }),
  )
}

export function addFinding(id: string, input: Partial<Finding> & { title: string }) {
  const title = (input.title || "").trim().slice(0, 200)
  if (!title) return { ok: false as const, error: "title required" }
  const severity: FindingSeverity = (["info", "low", "medium", "high", "critical"] as const).includes(input.severity as FindingSeverity)
    ? (input.severity as FindingSeverity)
    : "medium"
  return mutate(id, (e) =>
    e.findings.unshift({
      id: randomUUID(),
      title,
      severity,
      phase: input.phase?.slice(0, 40),
      target: input.target?.slice(0, 200),
      description: (input.description || "").slice(0, 16000),
      evidence: input.evidence?.slice(0, 16000),
      recommendation: input.recommendation?.slice(0, 8000),
      createdAt: new Date().toISOString(),
    }),
  )
}

export function deleteEngagement(id: string) {
  const all = readAll()
  const next = all.filter((e) => e.id !== id)
  if (next.length === all.length) return { ok: false as const, error: "not found" }
  writeAll(next)
  return { ok: true as const }
}
