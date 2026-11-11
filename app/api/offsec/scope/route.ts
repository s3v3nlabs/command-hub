export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import {
  createScope,
  deleteScope,
  listScopes,
  readAudit,
  setScopeActive,
} from "@/lib/offsec/scope-ladder"

export async function GET(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "offsec:scope", requireInSecureMode: true })
  if (denied) return denied
  const sp = request.nextUrl.searchParams
  if (sp.get("audit") === "1") {
    return NextResponse.json({ ok: true, audit: readAudit(Number(sp.get("limit")) || 200) })
  }
  return NextResponse.json({ ok: true, scopes: listScopes() })
}

export async function POST(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "offsec:scope", requireInSecureMode: true })
  if (denied) return denied
  const body = await request.json().catch(() => ({}))
  const action = String(body.action || "create")

  if (action === "create") {
    const r = createScope({
      name: body.name,
      client: body.client,
      authorizationRef: body.authorizationRef,
      authorizedTargets: Array.isArray(body.authorizedTargets)
        ? body.authorizedTargets
        : String(body.authorizedTargets || "")
            .split(/[\n,]/)
            .map((s: string) => s.trim())
            .filter(Boolean),
      operatorIdentity: body.operatorIdentity,
      startsAt: body.startsAt,
      endsAt: body.endsAt,
    })
    return NextResponse.json(r, { status: r.ok ? 200 : 400 })
  }
  if (action === "activate" || action === "deactivate") {
    const r = setScopeActive(String(body.id || ""), action === "activate")
    return NextResponse.json(r, { status: r.ok ? 200 : 404 })
  }
  if (action === "delete") {
    return NextResponse.json({ ok: deleteScope(String(body.id || "")) })
  }
  return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 })
}
