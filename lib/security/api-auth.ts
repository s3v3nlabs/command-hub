/**
 * Shared hub API authz helper.
 * When HUB_API_TOKEN / OPERATOR_API_TOKEN is set, require it.
 * When SECURE_MODE=1 and no token is configured, deny high-risk mutating routes
 * rather than silently allowing them.
 */

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
    if (!presented || presented !== token) {
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

  // No token configured
  if (secure || opts.requireInSecureMode) {
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
        detail: "Set HUB_API_TOKEN and pass Authorization: Bearer <token>",
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
  if (token) return !!presented && presented === token
  // SECURE_MODE with no token configured: not authorized for privileged surfaces.
  if (isSecureMode()) return false
  return true
}

export function hasConfiguredHubToken(): boolean {
  return configuredToken() !== null
}
