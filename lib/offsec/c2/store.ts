/**
 * C2 OPERATOR CONSOLE — real lab sessions against the hub host / isolated lab.
 *
 * Beacons are operator sessions bound to a lab host (localhost / RFC1918 /
 * *.lab.local). Tasks run allowlisted commands via child_process (lib/offsec/lab-exec)
 * and store real stdout/stderr/exit codes. Nothing is canned or simulated.
 *
 * Authorization is enforced by the scope ladder (lib/offsec/scope-ladder) at the
 * API layer: Stage 1 C2_LAB_ENABLED, Stage 2 active in-window scope that
 * authorizes the lab host, Stage 3 attestation. This module executes only after
 * that gate has already passed. No third-party / non-lab host is accepted.
 */

import fs from "fs"
import path from "path"
import { randomUUID } from "crypto"
import { appendEyesOnly } from "@/lib/heimdall/eyes-only"
import { isLabHost, listLabVerbs, runLabVerb, type LabExecResult } from "@/lib/offsec/lab-exec"

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

export type TaskStatus = "queued" | "running" | "done" | "failed" | "cancelled"

export interface LabTask {
  id: string
  verb: string
  arg?: string
  phase: KillChainPhase
  status: TaskStatus
  createdAt: string
  resolvedAt?: string
  note?: string
  stdout?: string
  stderr?: string
  exitCode?: number | null
  durationMs?: number
  argv?: string[]
  timedOut?: boolean
  hostname?: string
}

export interface LabBeacon {
  id: string
  label: string
  /** Lab host identifier — must pass isLabHost(). */
  labHost: string
  os: string
  status: BeaconStatus
  phase: KillChainPhase
  checkIns: number
  tasks: LabTask[]
  createdAt: string
  lastSeen: string
  scopeId: string
}

const DIR = path.join(process.cwd(), "data", "offsec", "c2")
const FILE = path.join(DIR, "beacons.json")

function ensure() {
  fs.mkdirSync(DIR, { recursive: true, mode: 0o700 })
}
function readAll(): LabBeacon[] {
  try {
    if (!fs.existsSync(FILE)) return []
    const raw = JSON.parse(fs.readFileSync(FILE, "utf8"))
    return (Array.isArray(raw) ? raw : []).map((b: LabBeacon & { simulated?: boolean }) => {
      const { simulated: _drop, lattice_sync: _ls, ...rest } = b as LabBeacon & {
        simulated?: boolean
        lattice_sync?: boolean
      }
      return {
        ...rest,
        tasks: (rest.tasks || []).map((t) => {
          const raw = t as LabTask & { status: string }
          const status: TaskStatus = raw.status === "done" || raw.status === "failed" || raw.status === "running" || raw.status === "queued" || raw.status === "cancelled"
            ? raw.status
            : "done"
          return { ...t, status }
        }),
      }
    })
  } catch {
    return []
  }
}
function writeAll(list: LabBeacon[]) {
  ensure()
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2) + "\n", { mode: 0o600 })
}

function audit(event: Record<string, unknown>) {
  appendEyesOnly({ subsystem: "c2-lab", ...event })
}

export function listBeacons(): LabBeacon[] {
  return readAll().sort((a, b) => b.lastSeen.localeCompare(a.lastSeen))
}

export function listVerbs() {
  return listLabVerbs()
}

export function createBeacon(input: {
  label: string
  labHost: string
  os?: string
  scopeId: string
}): { ok: true; beacon: LabBeacon } | { ok: false; error: string } {
  const label = (input.label || "").trim().slice(0, 120)
  const labHost = (input.labHost || "").trim().slice(0, 160)
  if (!label) return { ok: false, error: "label required" }
  if (!labHost) return { ok: false, error: "labHost required (lab identifier only)" }
  if (!isLabHost(labHost)) {
    return {
      ok: false,
      error: `labHost "${labHost}" is not a local/lab address (localhost, RFC1918, *.lab.local, or this hostname)`,
    }
  }
  const now = new Date().toISOString()
  const beacon: LabBeacon = {
    id: randomUUID(),
    label,
    labHost,
    os: (input.os || process.platform).slice(0, 60),
    status: "dormant",
    phase: "delivery",
    checkIns: 0,
    tasks: [],
    createdAt: now,
    lastSeen: now,
    scopeId: input.scopeId,
  }
  const all = readAll()
  all.push(beacon)
  writeAll(all)
  audit({ action: "beacon_created", beaconId: beacon.id, labHost, scopeId: input.scopeId })
  return { ok: true, beacon }
}

function mutate(id: string, fn: (b: LabBeacon) => void): { ok: true; beacon: LabBeacon } | { ok: false; error: string } {
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

/**
 * Queue a task and EXECUTE it for real against the lab host.
 * Returns the beacon with the completed (or failed) task attached.
 */
export async function queueTask(
  id: string,
  input: { verb: string; arg?: string; phase?: KillChainPhase },
): Promise<
  | { ok: true; beacon: LabBeacon; task: LabTask; result: LabExecResult }
  | { ok: false; error: string }
> {
  const verb = (input.verb || "").trim().slice(0, 80)
  if (!verb) return { ok: false, error: "verb required" }
  const phase: KillChainPhase = KILL_CHAIN_PHASES.includes(input.phase as KillChainPhase)
    ? (input.phase as KillChainPhase)
    : "command-and-control"

  const existing = readAll().find((b) => b.id === id)
  if (!existing) return { ok: false, error: "not_found" }
  if (!isLabHost(existing.labHost)) {
    return { ok: false, error: `beacon labHost "${existing.labHost}" is not a lab/local address — refused` }
  }
  if (existing.status === "retired") return { ok: false, error: "beacon is retired" }

  const task: LabTask = {
    id: randomUUID(),
    verb,
    arg: (input.arg || "").slice(0, 400) || undefined,
    phase,
    status: "running",
    createdAt: new Date().toISOString(),
  }
  mutate(id, (b) => {
    b.tasks.unshift(task)
    b.status = "active"
    b.checkIns += 1
  })

  const result = await runLabVerb(verb, input.arg)
  const final: LabTask = {
    ...task,
    status: result.ok ? "done" : "failed",
    resolvedAt: new Date().toISOString(),
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
    durationMs: result.durationMs,
    argv: result.argv,
    timedOut: result.timedOut,
    hostname: result.hostname,
    note: result.error || (result.ok ? `exit ${result.exitCode} in ${result.durationMs}ms` : "execution failed"),
  }
  const r = mutate(id, (b) => {
    const i = b.tasks.findIndex((t) => t.id === task.id)
    if (i >= 0) b.tasks[i] = final
    else b.tasks.unshift(final)
  })
  audit({
    action: "task_executed",
    beaconId: id,
    verb,
    phase,
    ok: result.ok,
    exitCode: result.exitCode,
    durationMs: result.durationMs,
  })
  if (!r.ok) return r
  return { ok: true, beacon: r.beacon, task: final, result }
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

export function killChainView(): { phase: KillChainPhase; beacons: LabBeacon[] }[] {
  const all = listBeacons()
  return KILL_CHAIN_PHASES.map((phase) => ({ phase, beacons: all.filter((b) => b.phase === phase) }))
}
