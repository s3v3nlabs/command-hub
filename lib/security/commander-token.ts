/**
 * Commander token — the ONE server-side approval primitive for Commander-gated autonomy.
 *
 * token = base64url(JSON{ v:1, act, tgt, ref, exp, nonce }) + "." + HMAC-SHA256(secret, payload)
 *   act   canonical action (trim, lower-case, collapsed whitespace)
 *   tgt   target the action applies to (lane, patch hash, path, …) — bound, not free text
 *   ref   optional reference the approval depends on (e.g. a passed replay id)
 *   exp   expiry, ms epoch (max COMMANDER_TOKEN_MAX_TTL_MS, default 15 min)
 *   nonce random; each nonce verifies ONCE per process (replay rejected)
 * Secret: COMMANDER_TOKEN_SECRET (≥ 32 chars). No secret → every verify fails closed.
 * Pattern follows lib/caller/core.mjs confirmation tokens. Server-only (node:crypto).
 *
 * Author: Christian Wilford (s3v3n), Founder, Singular/ty Defense Solutions, LLC.
 */
import crypto from "node:crypto"

export type CommanderClaims = { v: 1; act: string; tgt: string; ref: string | null; exp: number; nonce: string }
export type CommanderVerify = { ok: true; claims: CommanderClaims } | { ok: false; error: string }

const USED = new Map<string, number>() // nonce → exp

export function canonicalAction(a: string): string {
  return String(a ?? "").normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ")
}

function secret(): string | null {
  const s = process.env.COMMANDER_TOKEN_SECRET?.trim() || ""
  return s.length >= 32 ? s : null
}

function maxTtl(): number {
  return Number(process.env.COMMANDER_TOKEN_MAX_TTL_MS) || 15 * 60 * 1000
}

function mac(key: string, payload: string): string {
  return crypto.createHmac("sha256", key).update(payload).digest("base64url")
}

export function commanderTokenConfigured(): boolean {
  return secret() != null
}

/** Mint a token (server-side, after the Commander authenticated). Throws when no secret is configured. */
export function mintCommanderToken(p: { action: string; target: string; ref?: string | null; ttlMs?: number }, now = Date.now()): string {
  const key = secret()
  if (!key) throw new Error("commander_token_secret_not_configured")
  const ttl = Math.min(Math.max(1, p.ttlMs ?? maxTtl()), maxTtl())
  const claims: CommanderClaims = { v: 1, act: canonicalAction(p.action), tgt: String(p.target), ref: p.ref ?? null, exp: now + ttl, nonce: crypto.randomBytes(16).toString("hex") }
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url")
  return `${payload}.${mac(key, payload)}`
}

/**
 * Verify + consume. Fails closed on: no secret, malformed, bad MAC (constant-time), expired,
 * TTL beyond max, action/target/ref mismatch, nonce reuse.
 */
export function verifyCommanderToken(
  token: string | null | undefined,
  expect: { action: string; target: string; ref?: string | null },
  now = Date.now(),
  opts: { consume?: boolean } = {},
): CommanderVerify {
  const key = secret()
  if (!key) return { ok: false, error: "commander_token_secret_not_configured" }
  if (typeof token !== "string" || !token.includes(".")) return { ok: false, error: "malformed" }
  const [payload, sig] = token.split(".", 2)
  const want = Buffer.from(mac(key, payload))
  const got = Buffer.from(sig ?? "")
  if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return { ok: false, error: "bad_signature" }
  let c: CommanderClaims
  try {
    c = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))
  } catch {
    return { ok: false, error: "malformed" }
  }
  const keys = Object.keys(c).sort().join(",")
  if (keys !== "act,exp,nonce,ref,tgt,v" || c.v !== 1) return { ok: false, error: "unexpected_fields" }
  if (typeof c.exp !== "number" || c.exp <= now) return { ok: false, error: "expired" }
  if (c.exp - now > maxTtl()) return { ok: false, error: "ttl_too_long" }
  if (c.act !== canonicalAction(expect.action)) return { ok: false, error: "action_mismatch" }
  if (c.tgt !== String(expect.target)) return { ok: false, error: "target_mismatch" }
  if ((c.ref ?? null) !== (expect.ref ?? null)) return { ok: false, error: "ref_mismatch" }
  for (const [n, e] of USED) if (e <= now) USED.delete(n)
  if (USED.has(c.nonce)) return { ok: false, error: "nonce_reused" }
  if (opts.consume !== false) USED.set(c.nonce, c.exp)
  return { ok: true, claims: c }
}
