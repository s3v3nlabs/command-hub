export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { ollamaChatSmoke, HOLD } from "@/lib/triadic"

/**
 * POST /api/triadic/ollama-chat — localhost Ollama proxy only.
 * Refuses if Ollama down. Never logs prompt bodies.
 * HOLD_VYRNA_UNSYNC · lattice_sync: false
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      prompt?: string
      model?: string
    }
    // Intentionally do not log body / prompt
    const result = await ollamaChatSmoke({
      prompt: typeof body.prompt === "string" ? body.prompt : undefined,
      model: typeof body.model === "string" ? body.model : undefined,
    })
    return NextResponse.json(result, {
      status: result.ok ? 200 : result.offline ? 503 : 502,
    })
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        status: "OFFLINE",
        text: e instanceof Error ? e.message.slice(0, 200) : "chat failed",
        hold: HOLD,
        lattice_sync: false,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    usage: "POST { prompt?, model? } → localhost Ollama only",
    hold: HOLD,
    lattice_sync: false,
    note: "Never logs prompt bodies. Refuses if Ollama down.",
  })
}
