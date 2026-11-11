export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import {
  getStatus,
  setQuotaGb,
  ensureMounted,
  destroyDimm,
  listTiers,
  sigilCacheCount,
  resolveMountPath,
  meshStatus,
  HOLD,
} from "@/lib/dimm-drive"

/**
 * DIMM Drive API — status / setQuotaGb / ensureMounted / tiers.
 * Never logs secrets. HOLD_VYRNA_UNSYNC · lattice_sync: false.
 */

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action") || "status"

  if (action === "tiers") {
    return NextResponse.json({ ok: true, ...listTiers(), mesh: meshStatus() })
  }

  if (action === "path") {
    return NextResponse.json({
      ok: true,
      path: resolveMountPath(),
      sigilCacheCount: sigilCacheCount(),
      mesh: meshStatus(),
      hold: HOLD,
      lattice_sync: false,
    })
  }

  const status = getStatus()
  return NextResponse.json(status)
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>))
    const action = typeof body?.action === "string" ? body.action : "status"

    const MUTATING = new Set(["setQuotaGb", "set_quota", "ensureMounted", "create", "ensure", "destroy"])
    if (MUTATING.has(action)) {
      const denied = requireHubAuth(req, { surface: `dimm-drive:${action}`, requireInSecureMode: true })
      if (denied) return denied
    }

    if (action === "setQuotaGb" || action === "set_quota") {
      const n = Number(body?.sizeGb ?? body?.quotaGb ?? body?.gb)
      const r = setQuotaGb(n)
      return NextResponse.json(
        { ...r, status: getStatus(), hold: HOLD, lattice_sync: false },
        { status: r.ok ? 200 : 400 },
      )
    }

    if (action === "ensureMounted" || action === "create" || action === "ensure") {
      const n = body?.sizeGb != null ? Number(body.sizeGb) : undefined
      const r = ensureMounted(n)
      return NextResponse.json(r, { status: r.ok ? 200 : 500 })
    }

    if (action === "destroy") {
      const r = destroyDimm()
      return NextResponse.json(r)
    }

    if (action === "tiers") {
      return NextResponse.json({ ok: true, ...listTiers() })
    }

    return NextResponse.json(getStatus())
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "dimm-drive error",
        hold: HOLD,
        lattice_sync: false,
      },
      { status: 500 },
    )
  }
}
