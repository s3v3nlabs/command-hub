export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { HOLD } from "@/lib/voice/status"

/**
 * POST /api/voice/tts — LMNT TTS when configured; else 503 STUB.
 * Privacy Fortress: do not log request text / transcripts in plaintext.
 * Never invent audio. Never clone Grok voice.
 */

const LMNT_SPEECH = "https://api.lmnt.com/v1/ai/speech"
const MAX_CHARS = 500

function lmntKey(): string | null {
  const v = process.env.LMNT_API_KEY?.trim()
  return v && v.length > 0 ? v : null
}

export async function POST(req: NextRequest) {
  const key = lmntKey()
  if (!key) {
    return NextResponse.json(
      {
        ok: false,
        stub: true,
        status: "STUB",
        error: "LMNT_API_KEY not configured · TTS seat NOT_CFG",
        hold: HOLD,
        lattice_sync: false,
        hint: "Set LMNT_API_KEY in .env.local (never commit). Browser TTS is available on /voice.",
      },
      { status: 503 },
    )
  }

  let body: { text?: string; voice?: string }
  try {
    body = (await req.json()) as { text?: string; voice?: string }
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid JSON body", hold: HOLD, lattice_sync: false },
      { status: 400 },
    )
  }

  const text = typeof body.text === "string" ? body.text.trim() : ""
  if (!text) {
    return NextResponse.json(
      { ok: false, error: "text required", hold: HOLD, lattice_sync: false },
      { status: 400 },
    )
  }
  if (text.length > MAX_CHARS) {
    return NextResponse.json(
      {
        ok: false,
        error: `text exceeds ${MAX_CHARS} chars`,
        hold: HOLD,
        lattice_sync: false,
      },
      { status: 400 },
    )
  }

  // Operator-owned female seat default — never a Grok / xAI clone id
  const voice =
    typeof body.voice === "string" && body.voice.trim()
      ? body.voice.trim().slice(0, 64)
      : "leah"

  try {
    const res = await fetch(LMNT_SPEECH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": key,
      },
      body: JSON.stringify({
        text,
        voice,
        format: "mp3",
      }),
    })

    if (!res.ok) {
      // Do not echo upstream body (may contain request fragments)
      return NextResponse.json(
        {
          ok: false,
          error: `LMNT upstream HTTP ${res.status}`,
          hold: HOLD,
          lattice_sync: false,
        },
        { status: 502 },
      )
    }

    const audio = await res.arrayBuffer()
    return new NextResponse(audio, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("content-type") || "audio/mpeg",
        "Cache-Control": "no-store",
        "X-Voice-Seat": "lmnt",
        "X-Lattice-Sync": "false",
        "X-Hold": HOLD,
      },
    })
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "LMNT request failed",
        hold: HOLD,
        lattice_sync: false,
      },
      { status: 502 },
    )
  }
}

/** Honest GET so Operators can probe without inventing audio */
export async function GET() {
  const configured = Boolean(lmntKey())
  return NextResponse.json({
    ok: true,
    method: "POST",
    configured,
    status: configured ? "READY" : "STUB",
    hold: HOLD,
    lattice_sync: false,
    note: configured
      ? "POST { text, voice? } → audio · key never printed · text not logged"
      : "LMNT_API_KEY absent · POST returns 503 STUB · use browser TTS on /voice",
  })
}
