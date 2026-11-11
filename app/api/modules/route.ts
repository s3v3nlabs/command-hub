export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { listModules, registerModule, registryStatus } from "@/lib/modules/registry"
import { isModuleManifest } from "@/lib/modules/types"

/**
 * GET — list module manifests
 * POST — register manifest (dev). Validates schema; no code execution.
 */
export async function GET() {
  const modules = listModules({ includeDevOnly: true })
  return NextResponse.json({
    ...registryStatus(),
    modules,
  })
}

export async function POST(req: Request) {
  const isDev =
    process.env.NODE_ENV === "development" || process.env.S3V3N_DEV_CONSOLE === "1"
  if (!isDev) {
    return NextResponse.json(
      { ok: false, error: "Module registration is DEV ONLY", lattice_sync: false },
      { status: 403 },
    )
  }
  try {
    const body = await req.json().catch(() => ({}))
    const raw = body?.manifest ?? body
    if (!isModuleManifest(raw)) {
      return NextResponse.json(
        { ok: false, error: "Invalid ModuleManifest JSON schema", lattice_sync: false },
        { status: 400 },
      )
    }
    const result = registerModule(raw)
    if (!result.ok) {
      return NextResponse.json({ ...result, lattice_sync: false }, { status: 400 })
    }
    return NextResponse.json({
      ok: true,
      manifest: result.manifest,
      hold: "HOLD_VYRNA_UNSYNC",
      lattice_sync: false,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "register failed"
    return NextResponse.json({ ok: false, error: message.slice(0, 200), lattice_sync: false }, { status: 500 })
  }
}
