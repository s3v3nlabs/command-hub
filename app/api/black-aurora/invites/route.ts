export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { noStoreJson } from "@/lib/black-aurora/headers"
import {
  createInvite,
  listInvitesDetailed,
  revokeInvite,
} from "@/lib/black-aurora/invites"
import { getBlackAuroraMode, PUBLIC_REPO_HONESTY } from "@/lib/black-aurora/mode"

/** GET — list invites (admin). */
export async function GET(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "black-aurora-invites" })
  if (denied) {
    denied.headers.set("Cache-Control", "no-store")
    return denied
  }
  return noStoreJson({
    ok: true,
    invites: listInvitesDetailed(),
    mode: getBlackAuroraMode(),
    honesty: PUBLIC_REPO_HONESTY,
    lattice_sync: false,
  })
}

/** POST — create or revoke (admin). */
export async function POST(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "black-aurora-invites" })
  if (denied) {
    denied.headers.set("Cache-Control", "no-store")
    return denied
  }

  const body = await request.json().catch(() => ({}))
  const action = String(body.action || "create")

  if (action === "revoke") {
    const r = revokeInvite(String(body.code || ""))
    return noStoreJson(r, { status: r.ok ? 200 : 404 })
  }

  if (action === "create") {
    const r = createInvite({
      label: body.label,
      instructions: body.instructions,
      expiresInHours: body.expiresInHours == null ? 168 : Number(body.expiresInHours),
      maxUses: body.maxUses == null ? 1 : Number(body.maxUses),
      code: body.code,
    })
    return noStoreJson(r, { status: r.ok ? 201 : 400 })
  }

  return noStoreJson({ ok: false, error: "unknown_action" }, { status: 400 })
}
