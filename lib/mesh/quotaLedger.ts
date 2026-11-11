/**
 * Local JSON quota ledger — Operator-reported remaining hours/credits.
 * Manual or env-fed. Never scrapes provider UIs for ToS evasion.
 * HOLD_VYRNA_UNSYNC · lattice_sync: false · no secrets stored
 */

import fs from "fs"
import path from "path"
import { HOLD } from "./policy"
import type { MeshProviderId } from "./providers"
import { MESH_PROVIDERS } from "./providers"

export type QuotaEntry = {
  providerId: MeshProviderId
  remainingHours: number | null
  remainingCredits: number | null
  unitLabel: string
  /** ISO timestamp of last Operator edit / env sync */
  updatedAt: string
  source: "manual" | "env" | "seed"
  notes?: string
}

export type QuotaLedger = {
  version: 1
  hold: typeof HOLD
  lattice_sync: false
  forbidsBurnerAccounts: true
  entries: QuotaEntry[]
  updatedAt: string
}

const LEDGER_DIR =
  process.env.S3V3N_MESH_DIR || path.join(process.cwd(), "data", "mesh")
const LEDGER_FILE = path.join(LEDGER_DIR, "quota-ledger.json")

const ENV_HOUR_MAP: Partial<Record<MeshProviderId, string>> = {
  kaggle: "MESH_QUOTA_KAGGLE_HOURS",
  colab: "MESH_QUOTA_COLAB_HOURS",
  "huggingface-zerogpu": "MESH_QUOTA_HF_ZEROGPU_HOURS",
  paperspace: "MESH_QUOTA_PAPERSPACE_HOURS",
  lightning: "MESH_QUOTA_LIGHTNING_HOURS",
  modal: "MESH_QUOTA_MODAL_CREDITS",
  runpod: "MESH_QUOTA_RUNPOD_CREDITS",
  vastai: "MESH_QUOTA_VASTAI_CREDITS",
}

function ensure(): void {
  fs.mkdirSync(LEDGER_DIR, { recursive: true, mode: 0o700 })
}

function seedEntries(): QuotaEntry[] {
  const now = new Date().toISOString()
  return MESH_PROVIDERS.map((p) => {
    const envKey = ENV_HOUR_MAP[p.id]
    const envVal = envKey ? process.env[envKey] : undefined
    const n = envVal != null && envVal !== "" ? Number(envVal) : NaN
    const isCredits = p.tier === "credits" || p.tier === "payg" || p.tier === "spot"
    return {
      providerId: p.id,
      remainingHours: !isCredits && Number.isFinite(n) ? n : isCredits ? null : null,
      remainingCredits: isCredits && Number.isFinite(n) ? n : null,
      unitLabel: isCredits ? "credits" : "hours",
      updatedAt: now,
      source: Number.isFinite(n) ? "env" : "seed",
      notes: "Operator-editable; never auto-scraped",
    }
  })
}

export function readLedger(): QuotaLedger {
  ensure()
  try {
    if (fs.existsSync(LEDGER_FILE)) {
      const raw = JSON.parse(fs.readFileSync(LEDGER_FILE, "utf8")) as QuotaLedger
      if (raw && Array.isArray(raw.entries)) {
        return {
          version: 1,
          hold: HOLD,
          lattice_sync: false,
          forbidsBurnerAccounts: true,
          entries: raw.entries,
          updatedAt: raw.updatedAt || new Date().toISOString(),
        }
      }
    }
  } catch {
    /* fall through to seed */
  }
  const seeded: QuotaLedger = {
    version: 1,
    hold: HOLD,
    lattice_sync: false,
    forbidsBurnerAccounts: true,
    entries: seedEntries(),
    updatedAt: new Date().toISOString(),
  }
  writeLedger(seeded)
  return seeded
}

export function writeLedger(ledger: QuotaLedger): void {
  ensure()
  const clean: QuotaLedger = {
    version: 1,
    hold: HOLD,
    lattice_sync: false,
    forbidsBurnerAccounts: true,
    entries: ledger.entries.map((e) => ({
      providerId: e.providerId,
      remainingHours: e.remainingHours,
      remainingCredits: e.remainingCredits,
      unitLabel: e.unitLabel,
      updatedAt: e.updatedAt,
      source: e.source,
      notes: e.notes,
    })),
    updatedAt: new Date().toISOString(),
  }
  fs.writeFileSync(LEDGER_FILE, JSON.stringify(clean, null, 2) + "\n", { mode: 0o600 })
}

export function updateQuota(
  providerId: string,
  patch: { remainingHours?: number | null; remainingCredits?: number | null; notes?: string },
): { ok: true; entry: QuotaEntry; ledger: QuotaLedger } | { ok: false; error: string } {
  const ledger = readLedger()
  const idx = ledger.entries.findIndex((e) => e.providerId === providerId)
  if (idx < 0) return { ok: false, error: `Unknown provider: ${providerId}` }
  const prev = ledger.entries[idx]
  const next: QuotaEntry = {
    ...prev,
    remainingHours:
      patch.remainingHours !== undefined ? patch.remainingHours : prev.remainingHours,
    remainingCredits:
      patch.remainingCredits !== undefined ? patch.remainingCredits : prev.remainingCredits,
    notes: patch.notes !== undefined ? patch.notes : prev.notes,
    updatedAt: new Date().toISOString(),
    source: "manual",
  }
  ledger.entries[idx] = next
  writeLedger(ledger)
  return { ok: true, entry: next, ledger: readLedger() }
}

export function getEntry(providerId: string): QuotaEntry | undefined {
  return readLedger().entries.find((e) => e.providerId === providerId)
}

export function scoreRemaining(entry: QuotaEntry | undefined): number {
  if (!entry) return 0
  if (entry.remainingHours != null && Number.isFinite(entry.remainingHours)) {
    return Math.max(0, entry.remainingHours)
  }
  if (entry.remainingCredits != null && Number.isFinite(entry.remainingCredits)) {
    return Math.max(0, entry.remainingCredits)
  }
  return 0
}
