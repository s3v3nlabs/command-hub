/**
 * C2 OPERATOR CONSOLE — AUTHORIZED LAB SIMULATION ONLY.
 *
 * This manages SIMULATED beacons/sessions that live entirely inside the hub's
 * own lab. It does NOT implement a real command-and-control channel and never
 * controls third-party hosts. "Tasks" are recorded as simulated intents and
 * resolved locally — no code is executed anywhere. Every mutating action is
 * staged-ladder gated (lib/offsec/scope-ladder) + audited + mirrored to the
 * Heimdall eyes-only log. Lab/simulation framing is enforced in the UI.
 */

import fs from "fs"
import path from "path"
import { randomUUID } from "crypto"
import { appendEyesOnly } from "@/lib/heimdall/eyes-only"

/** Lockheed-Martin cyber kill chain phases (lab nav). */
export const KILL_CHAIN_PHASES = [
  "reconnaissance",
  "weaponization",
  "delivery",
  "exploitation",
  "installation",
  "command-and-control",
  "actions-on-objectives",
] as const
export type KillChainPhase = (typeof KILL_CHAIN_PHASES)[number]

export type BeaconStatus = "dormant" | "active" | "lost" | "retired"

export interface SimTask {
  id: string
  verb: string
  arg?: string
  phase: KillChainPhase
  status: "queued" | "simulated" | "cancelled"
  createdAt: string
  resolvedAt?: string
  note?: string
}

export interface SimBeacon {
  id: string
  label: string
  /** Lab host identifier (NOT a real third-party target). */
  labHost: string
  os: string
  status: BeaconStatus
  phase: KillChainPhase
  checkIns: number
  tasks: SimTask[]
  createdAt: string
  lastSeen: string
  scopeId: string
  simulated: true
  lattice_sync: false
}

const DIR = path.join(process.cwd(), "data", "offsec", "c2")
const FILE = path.join(DIR, "beacons.json")

function ensure() {
  fs.mkdirSync(DIR, { recursive: true, mode: 0o700 })
}
function readAll(): SimBeacon[] {
  try {
    if (!fs.existsSync(FILE)) return []
    const raw = JSON.parse(fs.readFileSync(FILE, "utf8"))
    return (Array.isArray(raw) ? raw : []).map((b: SimBeacon) => ({ ...b, simulated: true as const, lattice_sync: false as const }))
  } catch {
    return []
  }
}
function writeAll(list: SimBeacon[]) {
  ensure()
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2) + "\n", { mode: 0o600 })
}

function audit(event: Record<string, unknown>) {
  appendEyesOnly({ subsystem: "c2-lab", simulated: true, ...event })
}

export function listBeacons(): SimBeacon[] {
  return readAll().sort((a, b) => b.lastSeen.localeCompare(a.lastSeen))
}

export function createBeacon(input: {
  label: string
  labHost: string
  os?: string
  scopeId: string
}): { ok: true; beacon: SimBeacon } | { ok: false; error: string } {
  const label = (input.label || "").trim().slice(0, 120)
  const labHost = (input.labHost || "").trim().slice(0, 160)
  if (!label) return { ok: false, error: "label required" }
  if (!labHost) return { ok: false, error: "labHost required (lab identifier only)" }
  const now = new Date().toISOString()
  const beacon: SimBeacon = {
    id: randomUUID(),
    label,
    labHost,
    os: (input.os || "sim-linux").slice(0, 60),
    status: "dormant",
    phase: "delivery",
    checkIns: 0,
    tasks: [],
    createdAt: now,
    lastSeen: now,
    scopeId: input.scopeId,
    simulated: true,
    lattice_sync: false,
  }
  const all = readAll()
  all.push(beacon)
  writeAll(all)
  audit({ action: "beacon_created", beaconId: beacon.id, labHost, scopeId: input.scopeId })
  return { ok: true, beacon }
}

function mutate(id: string, fn: (b: SimBeacon) => void): { ok: true; beacon: SimBeacon } | { ok: false; error: string } {
  const all = readAll()
  const idx = all.findIndex((b) => b.id === id)
  if (idx < 0) return { ok: false, error: "not_found" }
  fn(all[idx])
  all[idx].lastSeen = new Date().toISOString()
  writeAll(all)
  return { ok: true, beacon: all[idx] }
}

export function advancePhase(id: string, phase: KillChainPhase) {
  if (!KILL_CHAIN_PHASES.includes(phase)) return { ok: false as const, error: "invalid_phase" }
  const r = mutate(id, (b) => {
    b.phase = phase
    b.status = "active"
    b.checkIns += 1
  })
  if (r.ok) audit({ action: "phase_advanced", beaconId: id, phase })
  return r
}

/** Queue a SIMULATED task. Immediately resolves as 'simulated' — nothing executes. */
export function queueTask(id: string, input: { verb: string; arg?: string; phase?: KillChainPhase }) {
  const verb = (input.verb || "").trim().slice(0, 80)
  if (!verb) return { ok: false as const, error: "verb required" }
  const phase: KillChainPhase = KILL_CHAIN_PHASES.includes(input.phase as KillChainPhase)
    ? (input.phase as KillChainPhase)
    : "command-and-control"
  const task: SimTask = {
    id: randomUUID(),
    verb,
    arg: (input.arg || "").slice(0, 400) || undefined,
    phase,
    status: "simulated",
    createdAt: new Date().toISOString(),
    resolvedAt: new Date().toISOString(),
    note: "Simulated in lab — no code executed.",
  }
  const r = mutate(id, (b) => {
    b.tasks.unshift(task)
    b.checkIns += 1
  })
  if (r.ok) audit({ action: "task_simulated", beaconId: id, verb, phase })
  return r.ok ? { ok: true as const, beacon: r.beacon, task } : r
}

export function retireBeacon(id: string) {
  const r = mutate(id, (b) => {
    b.status = "retired"
  })
  if (r.ok) audit({ action: "beacon_retired", beaconId: id })
  return r
}

export function deleteBeacon(id: string) {
  const all = readAll()
  const next = all.filter((b) => b.id !== id)
  if (next.length === all.length) return { ok: false as const, error: "not_found" }
  writeAll(next)
  audit({ action: "beacon_deleted", beaconId: id })
  return { ok: true as const }
}

export function killChainView(): { phase: KillChainPhase; beacons: SimBeacon[] }[] {
  const all = listBeacons()
  return KILL_CHAIN_PHASES.map((phase) => ({ phase, beacons: all.filter((b) => b.phase === phase) }))
}
