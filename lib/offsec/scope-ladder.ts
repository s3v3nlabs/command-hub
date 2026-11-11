/**
 * STAGED-LADDER authorization — the consistent gating standard across the suite
 * (recon, CCTV, hardware/RF, deception, ADB/phone, privacy egress).
 *
 *   Stage 1  capability ships SAFE/LOCKED by default (present, off).
 *   Stage 2  operator creates + ACTIVATES an engagement scope (client,
 *            authorization/SOW/ROE ref, authorized targets, start/end dates,
 *            operator identity). Capability unlocks only with an active,
 *            in-window scope that authorizes the target.
 *   Stage 3  per-action CONFIRM + ATTESTATION ("authorized under scope <id>"),
 *            written to a tamper-evident audit log.
 *
 * File-backed under data/offsec/ (scopes) and local-data/ (audit log), gitignored.
 * This module enforces authorization METADATA + attestation; it does not itself
 * perform any third-party action.
 */

import fs from "fs"
import path from "path"
import { randomUUID, createHash } from "crypto"

export interface EngagementScope {
  id: string
  name: string
  client?: string
  /** Authorization / SOW / ROE reference (doc id, ticket, contract #). */
  authorizationRef: string
  /** Authorized targets: hostnames, IPs, CIDRs, device serials, URLs. */
  authorizedTargets: string[]
  operatorIdentity: string
  /** ISO dates bounding the authorization window. */
  startsAt: string
  endsAt: string
  active: boolean
  createdAt: string
  updatedAt: string
  lattice_sync: false
}

export interface AuditEntry {
  id: string
  ts: string
  scopeId: string | null
  capability: string
  target?: string
  operator?: string
  attestation: string
  allowed: boolean
  reason?: string
  /** hash chain: sha256(prevHash + canonical entry) */
  prevHash: string
  hash: string
}

const SCOPE_DIR = path.join(process.cwd(), "data", "offsec")
const SCOPE_FILE = path.join(SCOPE_DIR, "scopes.json")
const AUDIT_DIR = path.join(process.cwd(), "local-data", "scope-audit")
const AUDIT_FILE = path.join(AUDIT_DIR, "audit.jsonl")

function ensureScopeDir() {
  fs.mkdirSync(SCOPE_DIR, { recursive: true, mode: 0o700 })
}
function ensureAuditDir() {
  fs.mkdirSync(AUDIT_DIR, { recursive: true, mode: 0o700 })
}

export function listScopes(): EngagementScope[] {
  try {
    if (!fs.existsSync(SCOPE_FILE)) return []
    const raw = JSON.parse(fs.readFileSync(SCOPE_FILE, "utf8"))
    return (Array.isArray(raw) ? raw : []).map((s: EngagementScope) => ({ ...s, lattice_sync: false as const }))
  } catch {
    return []
  }
}
function writeScopes(list: EngagementScope[]) {
  ensureScopeDir()
  fs.writeFileSync(SCOPE_FILE, JSON.stringify(list, null, 2) + "\n", { mode: 0o600 })
}

export function getScope(id: string): EngagementScope | null {
  return listScopes().find((s) => s.id === id) || null
}

export function createScope(input: {
  name: string
  client?: string
  authorizationRef: string
  authorizedTargets: string[]
  operatorIdentity: string
  startsAt: string
  endsAt: string
}): { ok: true; scope: EngagementScope } | { ok: false; error: string } {
  const name = (input.name || "").trim().slice(0, 160)
  const authorizationRef = (input.authorizationRef || "").trim().slice(0, 400)
  const operatorIdentity = (input.operatorIdentity || "").trim().slice(0, 160)
  if (!name) return { ok: false, error: "name required" }
  if (!authorizationRef) return { ok: false, error: "authorizationRef required (SOW/ROE/authorization)" }
  if (!operatorIdentity) return { ok: false, error: "operatorIdentity required" }
  const targets = (input.authorizedTargets || [])
    .map((t) => String(t).trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 2000)
  if (!targets.length) return { ok: false, error: "at least one authorized target required" }
  const now = new Date().toISOString()
  const starts = input.startsAt || now
  const ends = input.endsAt || now
  if (new Date(ends).getTime() < new Date(starts).getTime()) {
    return { ok: false, error: "endsAt must be after startsAt" }
  }
  const scope: EngagementScope = {
    id: randomUUID(),
    name,
    client: (input.client || "").slice(0, 160) || undefined,
    authorizationRef,
    authorizedTargets: targets,
    operatorIdentity,
    startsAt: starts,
    endsAt: ends,
    active: false,
    createdAt: now,
    updatedAt: now,
    lattice_sync: false,
  }
  const all = listScopes()
  all.push(scope)
  writeScopes(all)
  return { ok: true, scope }
}

export function setScopeActive(id: string, active: boolean): { ok: true; scope: EngagementScope } | { ok: false; error: string } {
  const all = listScopes()
  const idx = all.findIndex((s) => s.id === id)
  if (idx < 0) return { ok: false, error: "not_found" }
  all[idx].active = !!active
  all[idx].updatedAt = new Date().toISOString()
  writeScopes(all)
  return { ok: true, scope: all[idx] }
}

export function deleteScope(id: string): boolean {
  const all = listScopes()
  const next = all.filter((s) => s.id !== id)
  if (next.length === all.length) return false
  writeScopes(next)
  return true
}

function targetMatches(scope: EngagementScope, target: string): boolean {
  const t = target.trim().toLowerCase()
  if (!t) return false
  return scope.authorizedTargets.some((a) => {
    if (a === t) return true
    // suffix domain match (example.com authorizes sub.example.com)
    if (t.endsWith("." + a)) return true
    // CIDR-ish / prefix match for IPs or url bases
    if (a.endsWith("*") && t.startsWith(a.slice(0, -1))) return true
    if (t.startsWith(a)) return true
    return false
  })
}

export interface LadderCheck {
  allowed: boolean
  stage: 1 | 2 | 3
  reason: string
  scope?: EngagementScope
}

/**
 * Stage 2 + 3 enforcement. A capability calls this before touching a
 * third-party target. `envFlag` is the Stage-1 master switch value.
 */
export function checkLadder(opts: {
  capability: string
  scopeId?: string | null
  target?: string
  attestation?: string
  stage1Enabled: boolean
  operator?: string
}): LadderCheck {
  if (!opts.stage1Enabled) {
    return { allowed: false, stage: 1, reason: "stage1_locked: capability disabled by default; enable its env flag on an authorized host" }
  }
  const scope = opts.scopeId ? getScope(opts.scopeId) : null
  if (!scope) {
    return { allowed: false, stage: 2, reason: "stage2_no_scope: create + activate an engagement scope" }
  }
  if (!scope.active) {
    return { allowed: false, stage: 2, reason: "stage2_scope_inactive: activate the scope", scope }
  }
  const now = Date.now()
  if (now < new Date(scope.startsAt).getTime() || now > new Date(scope.endsAt).getTime()) {
    return { allowed: false, stage: 2, reason: "stage2_out_of_window: current time is outside the authorization window", scope }
  }
  if (opts.target && !targetMatches(scope, opts.target)) {
    return { allowed: false, stage: 2, reason: `stage2_target_not_in_scope: ${opts.target} is not in authorizedTargets`, scope }
  }
  const att = (opts.attestation || "").trim().toLowerCase()
  const wantsScope = att.includes(scope.id.toLowerCase()) || att.includes("authorized under scope")
  if (!att || !wantsScope) {
    return { allowed: false, stage: 3, reason: `stage3_attestation_required: confirm "authorized under scope ${scope.id}"`, scope }
  }
  return { allowed: true, stage: 3, reason: "ok", scope }
}

/** Append an audit entry with a sha256 hash chain. */
export function appendAudit(entry: {
  scopeId: string | null
  capability: string
  target?: string
  operator?: string
  attestation: string
  allowed: boolean
  reason?: string
}): AuditEntry {
  ensureAuditDir()
  let prevHash = "genesis"
  try {
    if (fs.existsSync(AUDIT_FILE)) {
      const lines = fs.readFileSync(AUDIT_FILE, "utf8").trim().split("\n").filter(Boolean)
      if (lines.length) {
        const last = JSON.parse(lines[lines.length - 1]) as AuditEntry
        prevHash = last.hash
      }
    }
  } catch {
    prevHash = "genesis"
  }
  const base = {
    id: randomUUID(),
    ts: new Date().toISOString(),
    scopeId: entry.scopeId,
    capability: entry.capability,
    target: entry.target,
    operator: entry.operator,
    attestation: entry.attestation.slice(0, 400),
    allowed: entry.allowed,
    reason: entry.reason,
    prevHash,
  }
  const hash = createHash("sha256").update(prevHash + JSON.stringify(base)).digest("hex")
  const full: AuditEntry = { ...base, hash }
  fs.appendFileSync(AUDIT_FILE, JSON.stringify(full) + "\n", { mode: 0o600 })
  return full
}

export function readAudit(limit = 200): AuditEntry[] {
  try {
    if (!fs.existsSync(AUDIT_FILE)) return []
    const lines = fs.readFileSync(AUDIT_FILE, "utf8").trim().split("\n").filter(Boolean)
    return lines.slice(-limit).map((l) => JSON.parse(l) as AuditEntry).reverse()
  } catch {
    return []
  }
}

/** Convenience: enforce + audit in one call. Returns null when allowed. */
export function enforceLadder(opts: {
  capability: string
  scopeId?: string | null
  target?: string
  attestation?: string
  stage1Enabled: boolean
  operator?: string
}): { blocked: true; check: LadderCheck } | { blocked: false; check: LadderCheck } {
  const check = checkLadder(opts)
  appendAudit({
    scopeId: opts.scopeId ?? null,
    capability: opts.capability,
    target: opts.target,
    operator: opts.operator,
    attestation: opts.attestation || "",
    allowed: check.allowed,
    reason: check.reason,
  })
  return check.allowed ? { blocked: false, check } : { blocked: true, check }
}
