export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import {
  ackLegal,
  createLayout,
  deleteLayout,
  getLayout,
  listLayouts,
  saveLayout,
} from "@/lib/cctv/store"
import type { CctvLayout } from "@/lib/cctv/types"
import { fromCensys, fromShodan, fromUrl } from "@/lib/cctv/recon-import"
import { emptyTileMeta } from "@/lib/cctv/types"
import { randomUUID } from "crypto"

/** Metadata + layout CRUD. Display is allowed; connect gate is separate. */
export async function GET(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "cctv:layouts", requireInSecureMode: true })
  if (denied) return denied
  const sp = request.nextUrl.searchParams
  const id = sp.get("id")
  if (id) {
    const layout = getLayout(id)
    if (!layout) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 })
    return NextResponse.json({ ok: true, layout })
  }
  const engagementId = sp.get("engagementId") || undefined
  return NextResponse.json({ ok: true, layouts: listLayouts(engagementId) })
}

export async function POST(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "cctv:layouts", requireInSecureMode: true })
  if (denied) return denied
  const body = await request.json().catch(() => ({}))
  const action = String(body.action || "create")

  if (action === "create") {
    const r = createLayout({
      name: body.name,
      engagementId: body.engagementId,
      cols: body.cols,
      rows: body.rows,
    })
    if (!r.ok) return NextResponse.json(r, { status: 400 })
    return NextResponse.json(r)
  }

  if (action === "save") {
    if (!body.layout?.id) return NextResponse.json({ ok: false, error: "layout required" }, { status: 400 })
    const r = saveLayout(body.layout as CctvLayout)
    if (!r.ok) return NextResponse.json(r, { status: 404 })
    return NextResponse.json(r)
  }

  if (action === "delete") {
    const ok = deleteLayout(String(body.id || ""))
    return NextResponse.json({ ok })
  }

  if (action === "ack_legal") {
    const layout = ackLegal(String(body.id || ""))
    if (!layout) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 })
    return NextResponse.json({ ok: true, layout })
  }

  if (action === "add_from_recon") {
    const layout = getLayout(String(body.layoutId || ""))
    if (!layout) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 })
    const source = String(body.source || "manual")
    let meta =
      source === "shodan" && body.host
        ? fromShodan(body.host, { engagementId: layout.engagementId, addedBy: body.addedBy })
        : source === "censys" && body.host
          ? fromCensys(body.host, { engagementId: layout.engagementId, addedBy: body.addedBy })
          : body.url
            ? fromUrl(String(body.url), {
                engagementId: layout.engagementId,
                addedBy: body.addedBy,
                title: body.title,
              })
            : emptyTileMeta({
                engagement: {
                  engagementId: layout.engagementId,
                  addedBy: body.addedBy,
                  addedAt: new Date().toISOString(),
                  authorizationStatus: "unconfirmed",
                },
              })
    const title =
      String(body.title || meta.device.vendor || meta.network.ip || meta.network.host || "Camera").slice(0, 120)
    const tile = {
      id: randomUUID(),
      title,
      col: Number(body.col) || layout.tiles.length % layout.cols,
      row: Number(body.row) || Math.floor(layout.tiles.length / layout.cols),
      meta,
    }
    layout.tiles.push(tile)
    const r = saveLayout(layout)
    return NextResponse.json(r)
  }

  return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 })
}
