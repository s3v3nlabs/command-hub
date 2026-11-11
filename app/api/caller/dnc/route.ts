export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import * as C from "@/lib/caller"

/** Do-not-call list. GET list · POST { number, reason? } add · DELETE { number } remove. */
export async function GET() {
  return NextResponse.json({ dnc: C.listDnc() })
}
export async function POST(req: Request) {
  const { number, reason } = await req.json().catch(() => ({}) as any)
  const r = C.addDnc(String(number || ""), reason)
  return NextResponse.json(r, { status: r.ok ? 200 : 400 })
}
export async function DELETE(req: Request) {
  const { number } = await req.json().catch(() => ({}) as any)
  const r = C.removeDnc(String(number || ""))
  return NextResponse.json(r, { status: r.ok ? 200 : 400 })
}
