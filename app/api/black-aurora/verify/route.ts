export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest } from "next/server"
import { noStoreJson } from "@/lib/black-aurora/headers"
import { softCheck, verifyInvite, hashIp } from "@/lib/black-aurora/invites"
import { getBlackAuroraMode, PUBLIC_REPO_HONESTY, SCREENSHOT_HONESTY } from "@/lib/black-aurora/mode"

/**
 * POST { code, redeem?: boolean, redeemedBy? }
 *  - redeem=false (default for drop soft-check): soft validity, no consume
 *  - redeem=true: consume a use + issue downloadGrant
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const code = String(body.code || "")
  const redeem = body.redeem === true || body.redeem === "1"
  const redeemedBy = body.redeemedBy ? String(body.redeemedBy).slice(0, 120) : undefined

  if (!redeem) {
    const soft = softCheck(code)
    return noStoreJson({
      ok: soft.ok,
      reason: soft.reason,
      invite: soft.invite
        ? {
            code: soft.invite.code,
            label: soft.invite.label,
            status: soft.invite.status,
            expiresAt: soft.invite.expiresAt,
          }
        : null,
      mode: getBlackAuroraMode(),
      honesty: PUBLIC_REPO_HONESTY,
    }, { status: soft.ok ? 200 : 404 })
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  void hashIp(ip) // reserved for future audit enrichment

  const result = verifyInvite(code, { redeemedBy })
  if (!result.ok) {
    return noStoreJson(result, { status: 403 })
  }
  return noStoreJson({
    ...result,
    screenshotHonesty: SCREENSHOT_HONESTY,
    lattice_sync: false,
  })
}
