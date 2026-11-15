/**
 * Shared hub API authz helper — FAIL CLOSED (F7, blue-team review).
 * When HUB_API_TOKEN / OPERATOR_API_TOKEN / HEIMDALL_API_KEY is set, require it
 * (constant-time compare).
 * When no token is configured, every surface is denied — unless the operator explicitly opts
 * into a local open lab with HUB_OPEN_LAB=1, which still never opens privileged surfaces
 * (requireInSecureMode) and is ignored under SECURE_MODE.
 * Christian Wilford (s3v3n), Founder, Singular/ty Defense Solutions, LLC.
 */

import crypto from "crypto"
import { NextResponse } from "next/server"
import { recordFailedApiAuth, recordIdsThreat } from "@/lib/security/ids-status"

function configuredToken(): string | null {
  const t =
    process.env.HUB_API_TOKEN?.trim() ||
    process.env.OPERATOR_API_TOKEN?.trim() ||
    process.env.HEIMDALL_API_KEY?.trim() ||
    ""
  if (!t || t.includes("placeholder")) return null
  return t
}

function tokenMatches(presented: string | null, token: string): boolean {
  if (!presented) return false
  const a = crypto.createHash("sha256").update(presented).digest()
  const b = crypto.createHash("sha256").update(token).digest()
  return crypto.timingSafeEqual(a, b)
}

export function isOpenLab(): boolean {
  return (process.env.HUB_OPEN_LAB === "1" || process.env.HUB_OPEN_LAB === "true") && !isSecureMode()
}

export function isSecureMode(): boolean {
  return process.env.SECURE_MODE === "1" || process.env.SECURE_MODE === "true"
}

export function extractHubToken(req: Request): string | null {
  const auth = req.headers.get("authorization") || ""
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim() || null
  return (
    req.headers.get("x-hub-token") ||
    req.headers.get("x-operator-token") ||
    req.headers.get("x-heimdall-token") ||
    null
  )
}

/**
 * Returns a 401/403 NextResponse when the caller is not authorized.
 * Returns null when the request may proceed.
 */
export function requireHubAuth(
  req: Request,
  opts: { surface: string; requireInSecureMode?: boolean } = { surface: "api" },
): NextResponse | null {
  const token = configuredToken()
  const presented = extractHubToken(req)
  const secure = isSecureMode()

  if (token) {
    if (!tokenMatches(presented, token)) {
      recordFailedApiAuth(`${opts.surface}:bad_token`)
      recordIdsThreat({
        severity: "medium",
        source: "api-auth",
        message: `Unauthorized access attempt to ${opts.surface}`,
        blocked: true,
      })
      return NextResponse.json(
        { ok: false, error: "unauthorized", surface: opts.surface },
        { status: 401 },
      )
    }
    return null
  }

  // No token configured → fail closed, except an explicit open lab on non-privileged surfaces
  if (secure || opts.requireInSecureMode || !isOpenLab()) {
    recordFailedApiAuth(`${opts.surface}:secure_mode_no_token`)
    recordIdsThreat({
      severity: "high",
      source: "api-auth",
      message: `SECURE_MODE denied ${opts.surface} (no HUB_API_TOKEN configured)`,
      blocked: true,
    })
    return NextResponse.json(
      {
        ok: false,
        error: "forbidden_secure_mode",
        detail: "Set HUB_API_TOKEN and pass Authorization: Bearer <token> (or HUB_OPEN_LAB=1 for a local lab, non-privileged surfaces only)",
        surface: opts.surface,
      },
      { status: 403 },
    )
  }

  return null
}

/** True when the request may access privileged hub surfaces (token match, or open lab). */
export function isHubAuthorized(req: Request): boolean {
  const token = configuredToken()
  const presented = extractHubToken(req)
  if (token) return tokenMatches(presented, token)
  // No token configured: only an explicit open lab (never under SECURE_MODE).
  return isOpenLab()
}

export function hasConfiguredHubToken(): boolean {
  return configuredToken() !== null
}
