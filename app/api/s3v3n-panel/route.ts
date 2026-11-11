export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { createHash } from "crypto"
import { persistPanelEvidence, runS3v3nPanel } from "@/lib/selfHealing/S3v3nPanel"
import { probeOllama, OLLAMA_BASE } from "@/lib/ai/ops-router"

/**
 * Local Ship-as-API equivalent for S3v3n Panel of Experts.
 * POST { prompt, preferSeat?, includeOwnedCloud?, sessionId? }
 * Never logs prompt/response bodies. Never exposes upstream secrets.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const prompt = typeof body?.prompt === "string" ? body.prompt : ""
    if (!prompt.trim()) {
      return NextResponse.json({ ok: false, error: "prompt is required" }, { status: 400 })
    }

    const preferSeat = typeof body?.preferSeat === "string" ? body.preferSeat : undefined
    const includeOwnedCloud =
      body?.includeOwnedCloud === undefined ? true : Boolean(body.includeOwnedCloud)

    const result = await runS3v3nPanel(prompt, { preferSeat, includeOwnedCloud })

    // Optional evidence: hash only (no body)
    const promptHash = createHash("sha256").update(prompt).digest("hex").slice(0, 16)
    const evidencePath = persistPanelEvidence(result, { promptHash })

    return NextResponse.json({
      ok: result.ok,
      source: result.source,
      privacyMode: result.privacyMode,
      responses: result.responses,
      leaderboard: result.leaderboard,
      aggregate: result.aggregate,
      adapters: result.adapters,
      sessionId: typeof body?.sessionId === "string" ? body.sessionId : undefined,
      evidence: evidencePath ? { path: evidencePath, promptHash } : undefined,
      lattice_sync: false,
      hold: "HOLD_VYRNA_UNSYNC",
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "s3v3n-panel failed"
    return NextResponse.json(
      {
        ok: false,
        error: message
          .replace(/sk-[a-zA-Z0-9_-]+/g, "[redacted]")
          .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
          .slice(0, 300),
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  const ollama = await probeOllama(1500)
  return NextResponse.json({
    ok: true,
    service: "s3v3n-panel",
    seats: [
      "twin-rag",
      "ollama",
      "axios",
      "ghostlight-vault",
      "venice",
      "groq",
      "xai",
      "openai",
    ],
    localSeats: {
      ollama: {
        online: ollama.online,
        base: OLLAMA_BASE,
        tags: ollama.tags,
        detail: ollama.detail,
        status: ollama.online ? "online" : "offline",
      },
    },
    privacyModes: ["PRIVATE_LOCAL", "PRIVATE_VENICE", "MOCK_ZERO_EGRESS"],
    note: "POST { prompt } for fan-out. Prefer local seats; refuse scrape/spoof.",
    privacyFortress: "/privacy",
    privacyStatus: "/api/privacy/status",
    lattice_sync: false,
    hold: "HOLD_VYRNA_UNSYNC",
  })
}
