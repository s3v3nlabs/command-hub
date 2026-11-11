/**
 * Encrypted-capable operator prefs + learned notes for Dev Operator AI.
 * Persist encrypted via Privacy Fortress when S3V3N_PANEL_PERSIST is on.
 */

import fs from "fs"
import path from "path"
import { encryptAtRest, decryptAtRest, isEncryptionAvailable, type EncryptedBlob } from "@/lib/privacy/localCrypto"

const DIR =
  process.env.S3V3N_DEV_OPERATOR_DIR ||
  path.join(process.cwd(), "data", "dev-operator")
const PREFS_FILE = path.join(DIR, "prefs.json")
const NOTES_FILE = path.join(DIR, "learned-notes.jsonl")

export type OperatorPrefs = {
  tone?: string
  focusAreas?: string[]
  preferLocalPanel?: boolean
  autoProposal?: boolean
  updatedAt?: string
}

function ensure(): void {
  fs.mkdirSync(DIR, { recursive: true, mode: 0o700 })
}

function persistOn(): boolean {
  return process.env.S3V3N_PANEL_PERSIST === "1" || process.env.S3V3N_PANEL_PERSIST === "true"
}

export function loadPrefs(): OperatorPrefs {
  try {
    ensure()
    if (!fs.existsSync(PREFS_FILE)) return { preferLocalPanel: true, autoProposal: true }
    const raw = JSON.parse(fs.readFileSync(PREFS_FILE, "utf8"))
    if (raw?.enc && raw?.blob) {
      const pt = decryptAtRest(raw.blob as EncryptedBlob)
      if (pt) return JSON.parse(pt) as OperatorPrefs
      return {}
    }
    return raw as OperatorPrefs
  } catch {
    return {}
  }
}

export function savePrefs(prefs: OperatorPrefs): { ok: true; encrypted: boolean } {
  ensure()
  const next = { ...loadPrefs(), ...prefs, updatedAt: new Date().toISOString() }
  if (persistOn() && isEncryptionAvailable()) {
    const blob = encryptAtRest(JSON.stringify(next))
    if (blob) {
      fs.writeFileSync(PREFS_FILE, JSON.stringify({ v: 1, enc: true, blob }, null, 2), { mode: 0o600 })
      return { ok: true, encrypted: true }
    }
  }
  fs.writeFileSync(PREFS_FILE, JSON.stringify(next, null, 2), { mode: 0o600 })
  return { ok: true, encrypted: false }
}

export function appendLearnedNote(note: string, meta?: { source?: string }): { ok: true; encrypted: boolean } | { ok: false; error: string } {
  const text = (note || "").trim().slice(0, 4000)
  if (!text) return { ok: false, error: "empty note" }
  ensure()
  const entry = {
    ts: new Date().toISOString(),
    source: meta?.source || "dev-operator",
    note: text,
    lattice_sync: false as const,
    hold: "HOLD_VYRNA_UNSYNC" as const,
  }
  if (persistOn() && isEncryptionAvailable()) {
    const blob = encryptAtRest(JSON.stringify(entry))
    if (blob) {
      fs.appendFileSync(NOTES_FILE, JSON.stringify({ v: 1, enc: true, blob, ts: entry.ts }) + "\n", { mode: 0o600 })
      return { ok: true, encrypted: true }
    }
  }
  fs.appendFileSync(NOTES_FILE, JSON.stringify(entry) + "\n", { mode: 0o600 })
  return { ok: true, encrypted: false }
}

export function recentLearnedNotes(limit = 12): string[] {
  try {
    if (!fs.existsSync(NOTES_FILE)) return []
    const lines = fs.readFileSync(NOTES_FILE, "utf8").split("\n").filter(Boolean).slice(-limit)
    const out: string[] = []
    for (const line of lines) {
      try {
        const row = JSON.parse(line)
        if (row.enc && row.blob) {
          const pt = decryptAtRest(row.blob)
          if (pt) {
            const e = JSON.parse(pt)
            out.push(String(e.note || "").slice(0, 400))
          }
        } else if (row.note) {
          out.push(String(row.note).slice(0, 400))
        }
      } catch {
        /* skip */
      }
    }
    return out
  } catch {
    return []
  }
}
