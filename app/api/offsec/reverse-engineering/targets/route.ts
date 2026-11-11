export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { deleteTarget, listTargets, storeUpload, MAX_UPLOAD_BYTES } from "@/lib/offsec/re-workbench/targets"

export async function GET(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "offsec:re", requireInSecureMode: true })
  if (denied) return denied
  return NextResponse.json({ ok: true, targets: listTargets(), maxUploadBytes: MAX_UPLOAD_BYTES() })
}

/** Upload a binary/APK/firmware image into the sandboxed analysis area (stored 0600, never executed). */
export async function POST(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "offsec:re", requireInSecureMode: true })
  if (denied) return denied
  const form = await request.formData().catch(() => null)
  const file = form?.get("file")
  if (!file || typeof file === "string") return NextResponse.json({ ok: false, error: "multipart field 'file' required" }, { status: 400 })
  if (file.size > MAX_UPLOAD_BYTES()) return NextResponse.json({ ok: false, error: "file too large (RE_MAX_UPLOAD_MB)" }, { status: 413 })
  try {
    const t = storeUpload(file.name, Buffer.from(await file.arrayBuffer()))
    return NextResponse.json({ ok: true, target: t })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "offsec:re", requireInSecureMode: true })
  if (denied) return denied
  return NextResponse.json({ ok: deleteTarget(request.nextUrl.searchParams.get("id") || "") })
}
