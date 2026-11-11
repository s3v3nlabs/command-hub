export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { captureSample } from "@/lib/offsec/deception/store"

/**
 * Capture a payload dropped on a decoy. Bytes are hashed, quarantined inert
 * (never executed), and metadata extracted. Detonation/analysis must run inside
 * the F1 sandbox boundary, NOT on this host — this endpoint only captures.
 */
export async function POST(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "offsec:deception:capture", requireInSecureMode: true })
  if (denied) return denied

  const ct = request.headers.get("content-type") || ""
  let buffer: Buffer
  let filename: string | undefined
  let mime: string | undefined
  let decoyId: string | undefined
  let engagementId: string | undefined

  if (ct.includes("multipart/form-data")) {
    const form = await request.formData()
    const file = form.get("file")
    if (!(file instanceof Blob)) return NextResponse.json({ ok: false, error: "file required" }, { status: 400 })
    buffer = Buffer.from(await file.arrayBuffer())
    filename = (file as File).name
    mime = file.type
    decoyId = (form.get("decoyId") as string) || undefined
    engagementId = (form.get("engagementId") as string) || undefined
  } else {
    const body = await request.json().catch(() => ({}))
    const b64 = String(body.base64 || body.data || "")
    if (!b64) return NextResponse.json({ ok: false, error: "base64 or multipart file required" }, { status: 400 })
    buffer = Buffer.from(b64, "base64")
    filename = body.filename
    mime = body.mime
    decoyId = body.decoyId
    engagementId = body.engagementId
  }

  if (!buffer.length) return NextResponse.json({ ok: false, error: "empty payload" }, { status: 400 })
  if (buffer.length > 64 * 1024 * 1024) return NextResponse.json({ ok: false, error: "payload too large (>64MB)" }, { status: 413 })

  const sample = captureSample({ buffer, filename, mime, decoyId, engagementId })
  return NextResponse.json({ ok: true, sample })
}
