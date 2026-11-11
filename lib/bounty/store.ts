/**
 * Business bounty / licensed disclosure workflow stub.
 * Legal channel only — no exploit binary generation.
 */

import fs from "fs"
import path from "path"
import { randomUUID, createHash } from "crypto"

export type BountyStatus = "draft" | "review" | "submitted"

export type BountySubmission = {
  id: string
  title: string
  summary: string
  severity?: string
  status: BountyStatus
  fromHub?: string
  intelId?: string
  createdAt: string
  updatedAt: string
  summaryHash: string
  lattice_sync: false
  hold: "HOLD_VYRNA_UNSYNC"
}

const DIR = path.join(process.cwd(), "data", "bounty")
const FILE = path.join(DIR, "submissions.json")

const FORBIDDEN = /(exploit\s*poc|weaponiz|shellcode|ransomware\s*builder)/i

function ensure(): void {
  fs.mkdirSync(DIR, { recursive: true, mode: 0o700 })
}

function readAll(): BountySubmission[] {
  try {
    if (!fs.existsSync(FILE)) return []
    const raw = JSON.parse(fs.readFileSync(FILE, "utf8"))
    return (Array.isArray(raw) ? raw : []).map((s: BountySubmission) => ({
      ...s,
      lattice_sync: false as const,
      hold: "HOLD_VYRNA_UNSYNC" as const,
    }))
  } catch {
    return []
  }
}

function writeAll(list: BountySubmission[]): void {
  ensure()
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2) + "\n", { mode: 0o600 })
}

export function listBounties(): BountySubmission[] {
  return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function createBounty(input: {
  title: string
  summary: string
  severity?: string
  fromHub?: string
  intelId?: string
}): { ok: true; submission: BountySubmission } | { ok: false; error: string } {
  const title = (input.title || "").trim().slice(0, 200)
  const summary = (input.summary || "").trim().slice(0, 8000)
  if (!title || !summary) return { ok: false, error: "title and summary required" }
  if (FORBIDDEN.test(title + " " + summary)) {
    return { ok: false, error: "Rejected: weaponized exploit content not allowed in bounty lane" }
  }
  const now = new Date().toISOString()
  const submission: BountySubmission = {
    id: randomUUID(),
    title,
    summary,
    severity: input.severity,
    status: "draft",
    fromHub: input.fromHub,
    intelId: input.intelId,
    createdAt: now,
    updatedAt: now,
    summaryHash: createHash("sha256").update(summary).digest("hex").slice(0, 16),
    lattice_sync: false,
    hold: "HOLD_VYRNA_UNSYNC",
  }
  const all = readAll()
  all.push(submission)
  writeAll(all)
  return { ok: true, submission }
}

export function updateBountyStatus(
  id: string,
  status: BountyStatus,
): { ok: true; submission: BountySubmission } | { ok: false; error: string } {
  if (!["draft", "review", "submitted"].includes(status)) {
    return { ok: false, error: "invalid status" }
  }
  const all = readAll()
  const idx = all.findIndex((s) => s.id === id)
  if (idx < 0) return { ok: false, error: "not found" }
  all[idx] = {
    ...all[idx],
    status,
    updatedAt: new Date().toISOString(),
    lattice_sync: false,
    hold: "HOLD_VYRNA_UNSYNC",
  }
  writeAll(all)
  return { ok: true, submission: all[idx] }
}
