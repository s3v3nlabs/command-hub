export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { loadRegistryIndex, readInstallState, setInstallState } from "@/lib/modules/registry-index"

export async function GET() {
  const loaded = await loadRegistryIndex()
  const state = readInstallState()
  return NextResponse.json({
    ok: loaded.ok,
    source: loaded.source,
    url: loaded.url || null,
    signature: loaded.signature,
    index: loaded.index,
    state,
    hold: "HOLD_VYRNA_UNSYNC",
    lattice_sync: false,
    error: loaded.error,
  })
}

export async function POST(request: NextRequest) {
  // Mutations are operator-gated (dev/ops). Installing is metadata only — never executes code.
  const denied = requireHubAuth(request, { surface: "marketplace", requireInSecureMode: true })
  if (denied) return denied
  const body = await request.json().catch(() => ({}))
  const action = String(body.action || "")
  const id = String(body.id || "")
  if (!["install", "uninstall", "enable", "disable"].includes(action)) {
    return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 })
  }
  const r = setInstallState(id, action as "install" | "uninstall" | "enable" | "disable")
  return NextResponse.json(r, { status: r.ok ? 200 : 400 })
}
