/**
 * Mesh job scheduler — pick best free peer by remaining quota + role.
 * Combo-lock: do not dual-schedule the same Operator seat.
 * Jobs/pods are perishable; identities are not.
 * scheduleJob is a no-op until creds (dry-run by default).
 * HOLD_VYRNA_UNSYNC · lattice_sync: false
 */

import fs from "fs"
import path from "path"
import { randomUUID } from "crypto"
import { HOLD, rejectForbidden, scanBodyForBurnerIntent } from "./policy"
import {
  listProviders,
  getProvider,
  type MeshProvider,
  type MeshProviderId,
  type MeshRole,
  envKeysPresentFor,
} from "./providers"
import { readLedger, scoreRemaining, getEntry } from "./quotaLedger"

export type MeshJobStatus = "dry-run" | "queued" | "locked" | "rejected" | "noop-awaiting-creds"

export type MeshJob = {
  id: string
  providerId: MeshProviderId
  role: MeshRole
  title: string
  status: MeshJobStatus
  comboLocked: boolean
  createdAt: string
  destroyReminder: string
  note: string
  hold: typeof HOLD
  lattice_sync: false
  forbidsBurnerAccounts: true
}

type LockFile = {
  version: 1
  locks: Record<string, { jobId: string; lockedAt: string; role: string }>
  jobs: MeshJob[]
  hold: typeof HOLD
  lattice_sync: false
}

const MESH_DIR =
  process.env.S3V3N_MESH_DIR || path.join(process.cwd(), "data", "mesh")
const LOCK_FILE = path.join(MESH_DIR, "scheduler-locks.json")

function ensure(): void {
  fs.mkdirSync(MESH_DIR, { recursive: true, mode: 0o700 })
}

function readLocks(): LockFile {
  ensure()
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const raw = JSON.parse(fs.readFileSync(LOCK_FILE, "utf8")) as LockFile
      if (raw && typeof raw.locks === "object") {
        return {
          version: 1,
          locks: raw.locks || {},
          jobs: Array.isArray(raw.jobs) ? raw.jobs : [],
          hold: HOLD,
          lattice_sync: false,
        }
      }
    }
  } catch {
    /* seed */
  }
  return { version: 1, locks: {}, jobs: [], hold: HOLD, lattice_sync: false }
}

function writeLocks(data: LockFile): void {
  ensure()
  fs.writeFileSync(
    LOCK_FILE,
    JSON.stringify(
      {
        version: 1,
        locks: data.locks,
        jobs: data.jobs.slice(-100),
        hold: HOLD,
        lattice_sync: false,
      },
      null,
      2,
    ) + "\n",
    { mode: 0o600 },
  )
}

export function listLocks(): LockFile {
  return readLocks()
}

export function releaseLock(providerId: string): { ok: boolean; released: boolean } {
  const data = readLocks()
  const had = Boolean(data.locks[providerId])
  delete data.locks[providerId]
  writeLocks(data)
  return { ok: true, released: had }
}

export function pickBestPeer(role: MeshRole): {
  ok: boolean
  provider?: MeshProvider
  score?: number
  reason: string
  candidates: Array<{ id: string; score: number; locked: boolean; envKeysPresent: string[] }>
} {
  const locks = readLocks()
  const ledger = readLedger()
  const candidates = listProviders()
    .filter((p) => p.roles.includes(role) || role === "any")
    .map((p) => {
      const entry = ledger.entries.find((e) => e.providerId === p.id)
      const locked = Boolean(locks.locks[p.id])
      return {
        provider: p,
        score: scoreRemaining(entry),
        locked,
        envKeysPresent: envKeysPresentFor(p),
      }
    })
    .sort((a, b) => {
      if (a.locked !== b.locked) return a.locked ? 1 : -1
      return b.score - a.score
    })

  const open = candidates.filter((c) => !c.locked)
  if (open.length === 0) {
    return {
      ok: false,
      reason: "All matching seats combo-locked or none match role",
      candidates: candidates.map((c) => ({
        id: c.provider.id,
        score: c.score,
        locked: c.locked,
        envKeysPresent: c.envKeysPresent,
      })),
    }
  }

  const best = open[0]
  return {
    ok: true,
    provider: best.provider,
    score: best.score,
    reason:
      best.score > 0
        ? `Best free peer by remaining quota for role=${role}`
        : `Best unlocked peer for role=${role} (quota unset — Operator should edit ledger)`,
    candidates: candidates.map((c) => ({
      id: c.provider.id,
      score: c.score,
      locked: c.locked,
      envKeysPresent: c.envKeysPresent,
    })),
  }
}

export function dryRunSchedule(opts: {
  role?: MeshRole
  providerId?: string
  title?: string
}): {
  ok: boolean
  job?: MeshJob
  pick?: ReturnType<typeof pickBestPeer>
  error?: string
  hold: typeof HOLD
  lattice_sync: false
} {
  const role = (opts.role || "train") as MeshRole
  let provider = opts.providerId ? getProvider(opts.providerId) : undefined
  const pick = pickBestPeer(role)
  if (!provider) {
    if (!pick.ok || !pick.provider) {
      return { ok: false, pick, error: pick.reason, hold: HOLD, lattice_sync: false }
    }
    provider = pick.provider
  }
  const locks = readLocks()
  if (locks.locks[provider.id]) {
    return {
      ok: false,
      pick,
      error: `Combo-lock: seat ${provider.id} already scheduled (job ${locks.locks[provider.id].jobId})`,
      hold: HOLD,
      lattice_sync: false,
    }
  }
  const envPresent = envKeysPresentFor(provider)
  const job: MeshJob = {
    id: randomUUID(),
    providerId: provider.id,
    role,
    title: (opts.title || `dry-run ${role} @ ${provider.id}`).slice(0, 200),
    status: "dry-run",
    comboLocked: false,
    createdAt: new Date().toISOString(),
    destroyReminder: "Destroy ephemeral pod/notebook/job when idle — never the Operator identity.",
    note: "Dry-run only; no GPU spun. Creds required for live scheduleJob.",
    hold: HOLD,
    lattice_sync: false,
    forbidsBurnerAccounts: true,
  }
  return {
    ok: true,
    job,
    pick: {
      ...pick,
      provider,
      candidates: pick.candidates.length
        ? pick.candidates
        : [
            {
              id: provider.id,
              score: scoreRemaining(getEntry(provider.id)),
              locked: false,
              envKeysPresent: envPresent,
            },
          ],
    },
    hold: HOLD,
    lattice_sync: false,
  }
}

/**
 * scheduleJob — no-op until Operator-owned creds present.
 * Combo-locks the seat so dual-schedule is rejected.
 */
export function scheduleJob(opts: {
  role?: MeshRole
  providerId?: string
  title?: string
  action?: string
  body?: unknown
}): {
  ok: boolean
  job?: MeshJob
  error?: string
  status?: number
  hold: typeof HOLD
  lattice_sync: false
  forbidsBurnerAccounts: true
} {
  const forbidden = rejectForbidden(opts.action)
  if (!forbidden.ok) {
    return {
      ok: false,
      error: forbidden.reason,
      status: 403,
      hold: HOLD,
      lattice_sync: false,
      forbidsBurnerAccounts: true,
    }
  }
  const bodyScan = scanBodyForBurnerIntent(opts.body)
  if (!bodyScan.ok) {
    return {
      ok: false,
      error: bodyScan.reason,
      status: 403,
      hold: HOLD,
      lattice_sync: false,
      forbidsBurnerAccounts: true,
    }
  }

  const dry = dryRunSchedule(opts)
  if (!dry.ok || !dry.job || !dry.pick?.provider) {
    return {
      ok: false,
      error: dry.error || "Unable to schedule",
      status: 400,
      hold: HOLD,
      lattice_sync: false,
      forbidsBurnerAccounts: true,
    }
  }

  const provider = dry.pick.provider
  const envPresent = envKeysPresentFor(provider)
  const data = readLocks()
  if (data.locks[provider.id]) {
    return {
      ok: false,
      error: `Combo-lock active on ${provider.id}`,
      status: 409,
      hold: HOLD,
      lattice_sync: false,
      forbidsBurnerAccounts: true,
    }
  }

  const awaitingCreds = envPresent.length === 0
  const job: MeshJob = {
    ...dry.job,
    id: randomUUID(),
    status: awaitingCreds ? "noop-awaiting-creds" : "queued",
    comboLocked: true,
    note: awaitingCreds
      ? "No-op until Operator-owned env creds present (key names only). Seat combo-locked for planning."
      : "Queued stub — live GPU start deferred (HOLD; no auto-spin). Remember to destroy job when idle.",
  }

  data.locks[provider.id] = {
    jobId: job.id,
    lockedAt: job.createdAt,
    role: String(job.role),
  }
  data.jobs.push(job)
  writeLocks(data)

  return {
    ok: true,
    job,
    hold: HOLD,
    lattice_sync: false,
    forbidsBurnerAccounts: true,
  }
}
