export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { addSigils, clearSigils, searchSigils, sigilStatus } from "@/lib/sigil2vec/store"

/**
 * Sigil2vec embedding index.
 * GET  ?q=text&k=5  → nearest entries (or status when no q)
 * POST { action:"add", items:[{text,tags?}] } | { action:"clear" }
 */
export async function GET(req: Request) {
  const u = new URL(req.url)
  const q = u.searchParams.get("q")
  if (!q) return NextResponse.json({ ok: true, ...sigilStatus() })
  const k = Math.min(Number(u.searchParams.get("k")) || 5, 25)
  return NextResponse.json({ ok: true, ...(await searchSigils(q.slice(0, 2000), k)) })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}) as any)
  if (body.action === "clear") {
    clearSigils()
    return NextResponse.json({ ok: true, cleared: true })
  }
  const items = Array.isArray(body.items) ? body.items.filter((i: any) => i && typeof i.text === "string" && i.text.trim()) : []
  if (!items.length) return NextResponse.json({ ok: false, error: "items[] with text required" }, { status: 400 })
  return NextResponse.json({ ok: true, ...(await addSigils(items.slice(0, 200))) })
}
