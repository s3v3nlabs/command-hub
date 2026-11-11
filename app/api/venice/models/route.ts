export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { egressAwareFetch } from "@/lib/privacy/egress"
import fs from "fs"
import path from "path"

/**
 * GET /api/venice/models
 * Lists Venice models using Operator-owned VENICE_API_KEY (server-side only).
 * Never returns the key. Never logs response bodies.
 *
 * Note: Venice GET /models is public; keyPresent is from env.
 * keyAuthOk probes an authenticated endpoint (rate_limits) when key is set.
 */

const VENICE_API_BASE = process.env.VENICE_API_URL || "https://api.venice.ai/api/v1"
const CHARACTERS_DIR = path.join(process.cwd(), "data", "venice-characters")

function hasKey(): boolean {
  const v = process.env.VENICE_API_KEY
  return typeof v === "string" && v.trim().length > 0
}

function redact(s: string): string {
  return s
    .replace(/sk-[a-zA-Z0-9_-]+/g, "[redacted]")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "[redacted-jwt]")
}

function listLocalCharacterPacks(): string[] {
  try {
    if (!fs.existsSync(CHARACTERS_DIR)) return []
    return fs
      .readdirSync(CHARACTERS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith("."))
      .map((d) => d.name)
      .sort()
  } catch {
    return []
  }
}

async function probeKeyAuth(key: string): Promise<{ ok: boolean; detail: string }> {
  try {
    const res = await egressAwareFetch(`${VENICE_API_BASE}/api_keys/rate_limits`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
    })
    if (res.ok) return { ok: true, detail: "rate_limits ok" }
    if (res.status === 401 || res.status === 403) {
      return { ok: false, detail: `key auth failed (HTTP ${res.status})` }
    }
    // Some keys may lack this route but still chat — treat non-401 as soft-ok
    return { ok: true, detail: `rate_limits HTTP ${res.status} (non-auth)` }
  } catch (err) {
    return {
      ok: false,
      detail: err instanceof Error ? redact(err.message).slice(0, 120) : "auth probe failed",
    }
  }
}

export async function GET(req: Request) {
  const keyPresent = hasKey()
  const packs = listLocalCharacterPacks()
  const url = new URL(req.url)
  const type = url.searchParams.get("type") || "text"

  let keyAuthOk: boolean | null = null
  let keyAuthDetail: string | null = null
  if (keyPresent) {
    const probe = await probeKeyAuth(process.env.VENICE_API_KEY as string)
    keyAuthOk = probe.ok
    keyAuthDetail = probe.detail
  } else {
    keyAuthOk = false
    keyAuthDetail = "VENICE_API_KEY absent"
  }

  if (!keyPresent) {
    // Still attempt public models list so UI can show catalog + honest key-missing status
  }

  const headers: Record<string, string> = { Accept: "application/json" }
  if (keyPresent) {
    headers.Authorization = `Bearer ${process.env.VENICE_API_KEY as string}`
  }

  try {
    const res = await egressAwareFetch(
      `${VENICE_API_BASE}/models?type=${encodeURIComponent(type)}`,
      { method: "GET", headers },
    )

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          keyPresent,
          keyAuthOk,
          keyAuthDetail,
          modelsReachable: false,
          models: [],
          characterPacks: packs,
          error: redact(`Venice HTTP ${res.status}`),
          lattice_sync: false,
          hold: "HOLD_VYRNA_UNSYNC",
        },
        { status: 502 },
      )
    }

    const data = (await res.json()) as {
      data?: Array<{
        id?: string
        owned_by?: string
        model_spec?: { name?: string; beta?: boolean; offline?: boolean }
      }>
      type?: string
    }

    const models = (data.data || [])
      .map((m) => ({
        id: m.id || "",
        name: m.model_spec?.name || m.id || "unknown",
        beta: Boolean(m.model_spec?.beta),
        offline: Boolean(m.model_spec?.offline),
        owned_by: m.owned_by || "venice",
      }))
      .filter((m) => m.id)

    return NextResponse.json({
      ok: true,
      keyPresent,
      keyAuthOk,
      keyAuthDetail,
      modelsReachable: true,
      models,
      count: models.length,
      type: data.type || type,
      defaultModel: process.env.VENICE_OPS_MODEL || models[0]?.id || null,
      characterPacks: packs,
      charactersNote: "Characters Phase 2 — LOCAL PACKs under data/venice-characters; GET /api/venice/characters; no marketplace scrape",
      note: keyPresent
        ? keyAuthOk
          ? "Operator key present and auth probe ok"
          : "Operator key present but auth probe failed — chat may return 401"
        : "VENICE_API_KEY absent — models catalog may still be public; chat disabled",
      lattice_sync: false,
      hold: "HOLD_VYRNA_UNSYNC",
    })
  } catch (err) {
    const message =
      err instanceof Error ? redact(err.message).slice(0, 200) : "venice models fetch failed"
    return NextResponse.json(
      {
        ok: false,
        keyPresent,
        keyAuthOk,
        keyAuthDetail,
        modelsReachable: false,
        models: [],
        characterPacks: packs,
        error: message,
        lattice_sync: false,
        hold: "HOLD_VYRNA_UNSYNC",
      },
      { status: 502 },
    )
  }
}
