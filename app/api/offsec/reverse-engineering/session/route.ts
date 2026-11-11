export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { bindSession, clearSession, getSession } from "@/lib/offsec/re-workbench/session"
import { resolveTarget } from "@/lib/offsec/re-workbench/targets"
import { markReaOpened, reaCallTool, reaConfig, resetReaClient } from "@/lib/offsec/re-workbench/rea-client"
import { ensureReaOpen } from "@/lib/offsec/re-workbench/analyze"
import type { EngineId } from "@/lib/offsec/re-workbench/types"

const ENGINES: EngineId[] = ["rea", "radare2", "ghidra"]

async function closeRea() {
  if (reaConfig().mode === "none") return
  try {
    await reaCallTool("close_binary", {})
    markReaOpened(null)
  } catch {
    resetReaClient()
  }
}

/** Bind ONE engine to ONE target. Changing either requires rebind:true (never silent). */
export async function POST(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "offsec:re", requireInSecureMode: true })
  if (denied) return denied
  const body = await request.json().catch(() => ({}))
  const engine = String(body.engine || "") as EngineId
  if (!ENGINES.includes(engine)) return NextResponse.json({ ok: false, error: "engine must be rea | radare2 | ghidra" }, { status: 400 })
  const resolved = resolveTarget(String(body.targetId || ""))
  if (!resolved) return NextResponse.json({ ok: false, error: "unknown target (upload or pick from the sandboxed area)" }, { status: 404 })

  const reaProvider = engine === "rea" ? String(body.reaProvider || process.env.REA_ANALYSIS_PROVIDER || "").trim() : ""
  if (reaProvider && !/^[a-z0-9_-]{1,40}$/.test(reaProvider)) {
    return NextResponse.json({ ok: false, error: "invalid reaProvider" }, { status: 400 })
  }
  const prev = getSession()
  const r = bindSession(engine, resolved.target.sha256, { rebind: !!body.rebind, reaProvider: reaProvider || undefined })
  if (!r.ok) return NextResponse.json(r, { status: 409 })
  if (r.rebound && prev?.engine === "rea") await closeRea()

  // REA: (re)open the binary in the live REA process — also after a hub/REA restart.
  const evidence = engine === "rea" ? await ensureReaOpen(r.session, resolved.absPath, r.rebound) : null
  return NextResponse.json({ ok: true, session: r.session, rebound: r.rebound, evidence })
}

export async function DELETE(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "offsec:re", requireInSecureMode: true })
  if (denied) return denied
  if (getSession()?.engine === "rea") await closeRea()
  clearSession()
  return NextResponse.json({ ok: true })
}
