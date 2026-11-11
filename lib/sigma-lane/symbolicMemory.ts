/**
 * Symbolic glyph / lesson store for Sigma Lane.
 * Prefer Privacy Fortress encrypt-at-rest; bridge to Heimdall storeSymbolicMemory patterns.
 * Never logs glyph bodies to console as telemetry.
 */

import fs from "fs"
import path from "path"
import { createHash } from "crypto"
import {
  encryptAtRest,
  decryptAtRest,
  isEncryptionAvailable,
  type EncryptedBlob,
} from "@/lib/privacy/localCrypto"
import type { LaneId } from "./lanes"

export interface SymbolicEntry {
  id: string
  glyph: string
  lesson: string
  laneId?: LaneId
  tags: string[]
  createdAt: string
  source: "sigma-lane" | "consciousness-bridge" | "operator"
}

type StoredPlain = { v: 1; enc: false; entry: SymbolicEntry }
type StoredEnc = {
  v: 1
  enc: true
  blob: EncryptedBlob
  meta: { id: string; glyphHash: string; laneId?: LaneId; createdAt: string; tags: string[] }
}

function resolveStoreDir(): string {
  // Prefer DIMM Drive symbols/ when mounted (ADD-ONLY coupling)
  try {
    const { preferDimmSubdir } = require("@/lib/dimm-drive") as {
      preferDimmSubdir: (s: "symbols") => string | null
    }
    const dimm = preferDimmSubdir("symbols")
    if (dimm) return dimm
  } catch {
    /* dimm-drive optional */
  }
  if (process.env.S3V3N_SIGMA_MEMORY) return process.env.S3V3N_SIGMA_MEMORY
  return path.join(
    process.env.S3V3N_PRIVACY_VAULT || "/workspace/chatgpt-vault/raw/live_2026-gap/privacy-vault",
    "sigma-lane-memory",
  )
}

const STORE_DIR = resolveStoreDir()
const STORE_FILE = path.join(STORE_DIR, "symbols.jsonl")

function ensureDir(): void {
  fs.mkdirSync(STORE_DIR, { recursive: true, mode: 0o700 })
  try {
    fs.chmodSync(STORE_DIR, 0o700)
  } catch {
    /* ignore */
  }
}

function glyphHash(glyph: string): string {
  return createHash("sha256").update(glyph).digest("hex").slice(0, 16)
}

function bridgeHeimdall(entry: SymbolicEntry): void {
  try {
    if (typeof globalThis !== "undefined" && (globalThis as { window?: unknown }).window) {
      const w = (globalThis as { window?: { Heimdall?: { storeSymbolicMemory?: (d: unknown) => void } } }).window
      w?.Heimdall?.storeSymbolicMemory?.({
        type: "sigma_lane_symbol",
        id: entry.id,
        glyph: entry.glyph,
        laneId: entry.laneId,
        at: entry.createdAt,
        lattice_sync: false,
      })
    }
  } catch {
    /* browser-only bridge; server skips */
  }
}

export function storeSymbol(input: {
  glyph: string
  lesson: string
  laneId?: LaneId
  tags?: string[]
  source?: SymbolicEntry["source"]
}): { ok: true; id: string; encrypted: boolean } | { ok: false; error: string } {
  const glyph = typeof input.glyph === "string" ? input.glyph.trim().slice(0, 128) : ""
  const lesson = typeof input.lesson === "string" ? input.lesson.trim().slice(0, 4000) : ""
  if (!glyph || !lesson) return { ok: false, error: "glyph and lesson required" }
  // Refuse secret-looking payloads
  if (/(api[_-]?key|BEGIN (RSA |OPENSSH )?PRIVATE|seed phrase|password\s*[:=])/i.test(lesson + glyph)) {
    return { ok: false, error: "Rejected: secret-like content not stored in symbolic memory" }
  }

  const entry: SymbolicEntry = {
    id: `sym_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    glyph,
    lesson,
    laneId: input.laneId,
    tags: (input.tags || []).slice(0, 12),
    createdAt: new Date().toISOString(),
    source: input.source ?? "sigma-lane",
  }

  ensureDir()
  let line: string
  let encrypted = false
  if (isEncryptionAvailable()) {
    const blob = encryptAtRest(JSON.stringify(entry))
    if (blob) {
      const row: StoredEnc = {
        v: 1,
        enc: true,
        blob,
        meta: {
          id: entry.id,
          glyphHash: glyphHash(glyph),
          laneId: entry.laneId,
          createdAt: entry.createdAt,
          tags: entry.tags,
        },
      }
      line = JSON.stringify(row)
      encrypted = true
    } else {
      line = JSON.stringify({ v: 1, enc: false, entry } satisfies StoredPlain)
    }
  } else {
    line = JSON.stringify({ v: 1, enc: false, entry } satisfies StoredPlain)
  }

  fs.appendFileSync(STORE_FILE, line + "\n", { mode: 0o600 })
  bridgeHeimdall(entry)
  return { ok: true, id: entry.id, encrypted }
}

function decodeRow(raw: string): SymbolicEntry | null {
  try {
    const row = JSON.parse(raw) as StoredPlain | StoredEnc
    if (row.enc === true) {
      const pt = decryptAtRest(row.blob)
      if (!pt) return null
      return JSON.parse(pt) as SymbolicEntry
    }
    return row.entry
  } catch {
    return null
  }
}

export function recallSymbols(opts?: {
  glyph?: string
  laneId?: LaneId
  tag?: string
  limit?: number
}): SymbolicEntry[] {
  const limit = Math.min(50, opts?.limit ?? 12)
  if (!fs.existsSync(STORE_FILE)) return []
  const lines = fs.readFileSync(STORE_FILE, "utf8").split("\n").filter(Boolean)
  const out: SymbolicEntry[] = []
  for (let i = lines.length - 1; i >= 0 && out.length < limit; i--) {
    const e = decodeRow(lines[i])
    if (!e) continue
    if (opts?.glyph && e.glyph.toLowerCase() !== opts.glyph.toLowerCase()) continue
    if (opts?.laneId && e.laneId !== opts.laneId) continue
    if (opts?.tag && !e.tags.includes(opts.tag)) continue
    out.push(e)
  }
  return out
}

export function symbolicMemoryCount(): number {
  if (!fs.existsSync(STORE_FILE)) return 0
  try {
    return fs.readFileSync(STORE_FILE, "utf8").split("\n").filter(Boolean).length
  } catch {
    return 0
  }
}

export function symbolicMemoryStatus() {
  const onDimm = STORE_DIR.includes("singular-dimm") || STORE_DIR.includes("dimm-drive")
  return {
    count: symbolicMemoryCount(),
    encryptionAvailable: isEncryptionAvailable(),
    storeConfigured: true,
    storeDir: STORE_DIR,
    onDimm,
    hold: "HOLD_VYRNA_UNSYNC" as const,
    lattice_sync: false as const,
    note: "Glyph bodies never logged; encrypt-at-rest when Privacy Fortress key available. Prefers DIMM symbols/ when mounted.",
  }
}
