export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import * as C from "@/lib/caller"

/** GET /api/caller/history[?id=] — local call log (and one transcript when id given). */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id")
  if (id) return NextResponse.json({ call: C.getCall(id), transcript: C.readTranscript(id) })
  return NextResponse.json({ calls: C.listCalls().slice(0, 100) })
}
