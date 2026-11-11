export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { listSamples, updateSampleVt } from "@/lib/offsec/deception/store"
import { submitHashLookup, submitSampleUpload, vtKey } from "@/lib/offsec/deception/vt"
import { enforceLadder } from "@/lib/offsec/scope-ladder"
import fs from "fs"
import path from "path"

/**
 * OPT-IN VirusTotal. Hash LOOKUP is low-risk (no sample leaves); sample UPLOAD
 * can tip off an attacker, so it is staged-ladder gated (Stage1 env flag
 * DECEPTION_VT_SUBMIT_ENABLED + Stage2 active scope + Stage3 attestation).
 */
function uploadAllowed(): boolean {
  return process.env.DECEPTION_VT_SUBMIT_ENABLED === "1" || process.env.DECEPTION_VT_SUBMIT_ENABLED === "true"
}

export async function POST(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "offsec:deception:vt", requireInSecureMode: true })
  if (denied) return denied
  if (!vtKey()) return NextResponse.json({ ok: false, error: "vt_key_unconfigured", detail: "Set VT_API_KEY" }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const mode = String(body.mode || "lookup")
  const sha256 = String(body.sha256 || "")
  const sample = listSamples().find((s) => s.sha256 === sha256)
  if (!sample) return NextResponse.json({ ok: false, error: "sample_not_found" }, { status: 404 })

  if (mode === "lookup") {
    const r = await submitHashLookup(sha256)
    if (r.ok) {
      updateSampleVt(sha256, {
        submitted: false,
        positives: r.positives,
        total: r.total,
        permalink: r.permalink,
        note: r.note,
      })
    }
    return NextResponse.json({ ok: r.ok, mode, result: r })
  }

  if (mode === "upload") {
    const ladder = enforceLadder({
      capability: "deception:vt-upload",
      scopeId: body.scopeId || null,
      target: sha256,
      attestation: String(body.attestation || ""),
      stage1Enabled: uploadAllowed(),
      operator: body.operator,
    })
    if (ladder.blocked) {
      return NextResponse.json({ ok: false, error: "ladder_blocked", stage: ladder.check.stage, detail: ladder.check.reason }, { status: 403 })
    }
    const abs = path.join(process.cwd(), sample.quarantinePath)
    if (!fs.existsSync(abs)) return NextResponse.json({ ok: false, error: "quarantine_missing" }, { status: 404 })
    const buffer = fs.readFileSync(abs)
    const r = await submitSampleUpload(buffer, sample.filename || `${sha256}.bin`)
    if (r.ok) {
      updateSampleVt(sha256, { submitted: true, submittedAt: new Date().toISOString(), note: r.note })
    }
    return NextResponse.json({ ok: r.ok, mode, result: r })
  }

  return NextResponse.json({ ok: false, error: "unknown_mode" }, { status: 400 })
}
