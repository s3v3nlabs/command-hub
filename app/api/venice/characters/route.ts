export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import {
  HOLD,
  CHARACTERS_DIR,
  listCharacterPacks,
  readPackDigest,
  createEmptyPack,
} from "@/lib/venice/characters"

/**
 * GET /api/venice/characters
 *   ?q=axios — filter local packs
 *   ?id=axios-vedic&digest=1 — open local digest markdown
 * POST /api/venice/characters
 *   { id, name?, role?, notes? } — create empty pack under data/venice-characters only
 *
 * LOCAL PACKS ONLY — no marketplace scrape · no api.venice.ai · no secrets.
 */
export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q") || undefined
    const id = req.nextUrl.searchParams.get("id")
    const digest = req.nextUrl.searchParams.get("digest")

    if (id && (digest === "1" || digest === "true")) {
      const result = readPackDigest(id)
      if (!result.ok) {
        return NextResponse.json(
          {
            ok: false,
            error: result.error,
            hold: HOLD,
            lattice_sync: false,
            badge: "LOCAL PACK",
          },
          { status: 404 },
        )
      }
      return NextResponse.json({
        ok: true,
        hold: HOLD,
        lattice_sync: false,
        badge: "LOCAL PACK",
        live_on_venice_cloud: false,
        pack: result.id,
        file: result.file,
        bytes: result.bytes,
        content: result.content,
        venice_pulse:
          "BAYED — paste VENICE_PULSE_SCRIPT when Operator wakes — not auto",
        generatedAt: new Date().toISOString(),
      })
    }

    const packs = listCharacterPacks(q)
    return NextResponse.json({
      ok: true,
      hold: HOLD,
      lattice_sync: false,
      badge: "LOCAL PACK",
      live_on_venice_cloud: false,
      charactersDir: "data/venice-characters",
      charactersDirAbs: CHARACTERS_DIR,
      count: packs.length,
      packs,
      reclaim: "/reclaim",
      fullRecall: "/workspace/venice-vault/packs/FULL_RECALL_2026-09-24/",
      venice_pulse:
        "BAYED — paste VENICE_PULSE_SCRIPT when Operator wakes — not auto",
      note: "Local character packs only. Not live on Venice.ai cloud. No marketplace scrape.",
      generatedAt: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message.slice(0, 200) : "characters list failed"
    return NextResponse.json(
      {
        ok: false,
        hold: HOLD,
        lattice_sync: false,
        error: message.replace(/sk-[a-zA-Z0-9_-]+/g, "[redacted]"),
      },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      id?: string
      name?: string
      role?: string
      notes?: string
    }
    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json(
        {
          ok: false,
          error: "id required (slug)",
          hold: HOLD,
          lattice_sync: false,
        },
        { status: 400 },
      )
    }
    const result = createEmptyPack({
      id: body.id,
      name: typeof body.name === "string" ? body.name : undefined,
      role: typeof body.role === "string" ? body.role : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
    })
    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          hold: HOLD,
          lattice_sync: false,
          badge: "LOCAL PACK",
        },
        { status: result.status },
      )
    }
    return NextResponse.json(
      {
        ok: true,
        hold: HOLD,
        lattice_sync: false,
        badge: "LOCAL PACK",
        live_on_venice_cloud: false,
        pack: result.pack,
        note: "Empty local pack folder written under data/venice-characters only",
        generatedAt: new Date().toISOString(),
      },
      { status: 201 },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message.slice(0, 200) : "create pack failed"
    return NextResponse.json(
      {
        ok: false,
        hold: HOLD,
        lattice_sync: false,
        error: message.replace(/sk-[a-zA-Z0-9_-]+/g, "[redacted]"),
      },
      { status: 500 },
    )
  }
}
