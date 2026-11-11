/**
 * Black Aurora Labs — invite store.
 * File-backed under data/black-aurora/invites.json (gitignored via /data/*).
 * Enforces single-use (default), expiry, and revoke server-side.
 */

import fs from "fs"
import path from "path"
import { randomBytes, createHash } from "crypto"
import type { Invite, InviteAuditEvent, InvitePublicView, VerifyResult } from "./types"
import { getBlackAuroraMode, PUBLIC_REPO_HONESTY } from "./mode"

const DIR = path.join(process.cwd(), "data", "black-aurora")
const FILE = path.join(DIR, "invites.json")

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // no 0/O/1/I
const CODE_LENGTH = 8

function ensure(): void {
  fs.mkdirSync(DIR, { recursive: true, mode: 0o700 })
}

function readAll(): Invite[] {
  try {
    if (!fs.existsSync(FILE)) return []
    const raw = JSON.parse(fs.readFileSync(FILE, "utf8"))
    return Array.isArray(raw) ? (raw as Invite[]) : []
  } catch {
    return []
  }
}

function writeAll(list: Invite[]): void {
  ensure()
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2) + "\n", { mode: 0o600 })
}

function nowIso(): string {
  return new Date().toISOString()
}

function generateCode(): string {
  const bytes = randomBytes(CODE_LENGTH)
  let out = ""
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length]
  }
  return out
}

function generateGrant(): string {
  return randomBytes(24).toString("base64url")
}

function normalizeCode(input: string): string {
  return String(input || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
}

function statusOf(inv: Invite): InvitePublicView["status"] {
  if (inv.revoked) return "revoked"
  if (inv.expiresAt && Date.parse(inv.expiresAt) < Date.now()) return "expired"
  if (inv.uses >= inv.maxUses) return "exhausted"
  return "active"
}

function toPublic(inv: Invite): InvitePublicView {
  return {
    code: inv.code,
    label: inv.label,
    instructions: inv.instructions,
    expiresAt: inv.expiresAt,
    maxUses: inv.maxUses,
    uses: inv.uses,
    revoked: inv.revoked,
    downloads: inv.downloads,
    redeemedBy: inv.redeemedBy,
    redeemedAt: inv.redeemedAt,
    status: statusOf(inv),
  }
}

function pushAudit(inv: Invite, action: InviteAuditEvent["action"], detail?: string): void {
  inv.audit.push({ at: nowIso(), action, detail })
  // Cap audit length
  if (inv.audit.length > 50) inv.audit = inv.audit.slice(-50)
}

export function listInvites(): InvitePublicView[] {
  return readAll()
    .map(toPublic)
    .sort((a, b) => (b.redeemedAt || "").localeCompare(a.redeemedAt || "") || b.code.localeCompare(a.code))
}

/** Admin-only: full records including audit (still no downloadGrant secrets in list UI ideally). */
export function listInvitesDetailed(): Array<InvitePublicView & { audit: InviteAuditEvent[]; hasGrant: boolean }> {
  return readAll()
    .map((inv) => ({
      ...toPublic(inv),
      audit: inv.audit,
      hasGrant: Boolean(inv.downloadGrant),
    }))
    .sort((a, b) => b.code.localeCompare(a.code))
}

export function createInvite(input: {
  label?: string
  instructions?: string
  expiresInHours?: number | null
  maxUses?: number
  code?: string
}): { ok: true; invite: InvitePublicView; code: string } | { ok: false; error: string } {
  const label = String(input.label || "invite").trim().slice(0, 120) || "invite"
  const instructions =
    String(input.instructions || "").trim().slice(0, 8000) ||
    defaultInstructions(label)
  const maxUses = Math.max(1, Math.min(20, Number(input.maxUses) || 1))
  let expiresAt: string | null = null
  if (input.expiresInHours != null && Number(input.expiresInHours) > 0) {
    expiresAt = new Date(Date.now() + Number(input.expiresInHours) * 3600_000).toISOString()
  }

  let code = input.code ? normalizeCode(input.code) : ""
  if (code && (code.length < 6 || code.length > 16)) {
    return { ok: false, error: "code must be 6–16 alphanumeric chars" }
  }

  const list = readAll()
  if (code && list.some((i) => i.code === code)) {
    return { ok: false, error: "code already exists" }
  }
  if (!code) {
    for (let attempt = 0; attempt < 12; attempt++) {
      code = generateCode()
      if (!list.some((i) => i.code === code)) break
    }
  }

  const inv: Invite = {
    code,
    label,
    instructions,
    createdAt: nowIso(),
    expiresAt,
    maxUses,
    uses: 0,
    revoked: false,
    downloadGrant: null,
    downloadGrantExpiresAt: null,
    downloads: 0,
    redeemedBy: null,
    redeemedAt: null,
    audit: [],
  }
  pushAudit(inv, "created", `label=${label}; maxUses=${maxUses}`)
  list.push(inv)
  writeAll(list)
  return { ok: true, invite: toPublic(inv), code }
}

export function revokeInvite(code: string): { ok: true; invite: InvitePublicView } | { ok: false; error: string } {
  const c = normalizeCode(code)
  const list = readAll()
  const inv = list.find((i) => i.code === c)
  if (!inv) return { ok: false, error: "not_found" }
  inv.revoked = true
  inv.downloadGrant = null
  inv.downloadGrantExpiresAt = null
  pushAudit(inv, "revoked")
  writeAll(list)
  return { ok: true, invite: toPublic(inv) }
}

/**
 * Verify a code: enforces not-found / revoked / expired / exhausted.
 * On success: increments uses, issues a short-lived downloadGrant, records redemption.
 */
export function verifyInvite(
  code: string,
  opts?: { redeemedBy?: string },
): VerifyResult {
  const c = normalizeCode(code)
  if (c.length < 6) return { ok: false, error: "invalid code", reason: "invalid" }

  const list = readAll()
  const inv = list.find((i) => i.code === c)
  if (!inv) return { ok: false, error: "token not recognized", reason: "not_found" }

  if (inv.revoked) {
    pushAudit(inv, "denied", "revoked")
    writeAll(list)
    return { ok: false, error: "token revoked", reason: "revoked" }
  }
  if (inv.expiresAt && Date.parse(inv.expiresAt) < Date.now()) {
    pushAudit(inv, "denied", "expired")
    writeAll(list)
    return { ok: false, error: "token expired", reason: "expired" }
  }
  if (inv.uses >= inv.maxUses) {
    pushAudit(inv, "denied", "exhausted")
    writeAll(list)
    return { ok: false, error: "token already used", reason: "exhausted" }
  }

  inv.uses += 1
  inv.redeemedBy = String(opts?.redeemedBy || inv.label || "redeemer").slice(0, 120)
  inv.redeemedAt = nowIso()
  inv.downloadGrant = generateGrant()
  // Grant lives 30 minutes
  inv.downloadGrantExpiresAt = new Date(Date.now() + 30 * 60_000).toISOString()
  pushAudit(inv, "verified", `uses=${inv.uses}/${inv.maxUses}`)
  writeAll(list)

  return {
    ok: true,
    code: inv.code,
    label: inv.label,
    instructions: inv.instructions,
    downloadGrant: inv.downloadGrant,
    mode: getBlackAuroraMode(),
    honesty: PUBLIC_REPO_HONESTY,
  }
}

/**
 * Consume a download grant. Returns the invite if the grant is valid.
 * Increments downloads; clears grant after use (one download per verify).
 */
export function consumeDownloadGrant(
  grant: string,
): { ok: true; invite: Invite } | { ok: false; error: string; reason: string } {
  const g = String(grant || "").trim()
  if (!g) return { ok: false, error: "missing grant", reason: "invalid" }

  const list = readAll()
  const inv = list.find((i) => i.downloadGrant === g)
  if (!inv) return { ok: false, error: "grant not recognized", reason: "not_found" }
  if (inv.revoked) return { ok: false, error: "token revoked", reason: "revoked" }
  if (inv.downloadGrantExpiresAt && Date.parse(inv.downloadGrantExpiresAt) < Date.now()) {
    inv.downloadGrant = null
    inv.downloadGrantExpiresAt = null
    pushAudit(inv, "denied", "grant_expired")
    writeAll(list)
    return { ok: false, error: "download grant expired — re-verify", reason: "expired" }
  }

  inv.downloads += 1
  inv.downloadGrant = null
  inv.downloadGrantExpiresAt = null
  pushAudit(inv, "downloaded", `downloads=${inv.downloads}`)
  writeAll(list)
  return { ok: true, invite: inv }
}

/** Test/helper: peek without mutating (used by tests + drop page soft-check). */
export function peekInvite(code: string): InvitePublicView | null {
  const c = normalizeCode(code)
  const inv = readAll().find((i) => i.code === c)
  return inv ? toPublic(inv) : null
}

/** Soft validity check without consuming a use (for /drop/[token] preview). */
export function softCheck(code: string): {
  ok: boolean
  reason?: string
  invite?: InvitePublicView
} {
  const c = normalizeCode(code)
  if (c.length < 6) return { ok: false, reason: "invalid" }
  const inv = readAll().find((i) => i.code === c)
  if (!inv) return { ok: false, reason: "not_found" }
  const st = statusOf(inv)
  if (st !== "active") return { ok: false, reason: st, invite: toPublic(inv) }
  return { ok: true, invite: toPublic(inv) }
}

export function defaultInstructions(label: string): string {
  return [
    `Welcome, ${label}.`,
    "",
    "You have been invited to the Singular/ty Command Hub (Black Aurora Labs portal).",
    "",
    "1. After this screen unlocks, download the gated source bundle (git bundle or tarball).",
    "2. Extract / clone from the bundle on your machine:",
    "     git clone command-hub.bundle command-hub",
    "     # or: tar -xzf command-hub.tar.gz",
    "3. Follow INSTALL.md inside the tree (Node 20+, npm install, cp .env.example .env.local).",
    "4. This invite is single-use by default. Do not share the code.",
    "",
    "Honesty: a public GitHub repo cannot be locked behind a code for `git clone`.",
    "This portal gates a server-side bundle download. True clone-gating requires a private repo.",
  ].join("\n")
}

/** Hash an IP for audit (no raw IP stored). */
export function hashIp(ip: string | null): string | undefined {
  if (!ip) return undefined
  return createHash("sha256").update(ip).digest("hex").slice(0, 16)
}

/** Exposed for tests — wipe store. */
export function __resetInvitesForTests(): void {
  ensure()
  writeAll([])
}

export function __invitesFilePath(): string {
  return FILE
}

export { normalizeCode, CODE_LENGTH }
