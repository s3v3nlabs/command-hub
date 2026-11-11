export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import {
  routePrompt,
  runEngineSmoke,
  type OpsProviderId,
} from "@/lib/ai/ops-router"

const PROVIDERS = new Set<OpsProviderId>([
  "openai",
  "xai",
  "groq",
  "ollama",
  "venice",
  "heimdall",
  "v0-bridge",
  "mistral",
  "nvidia-nim",
  "whisper",
])

const ENGINES = new Set(["axios", "heimdall", "nova_prime", "echonexus", "shadowvox", "ob1"])

/**
 * POST /api/ai/ops
 * Body: { provider, prompt, liberation?: boolean }
 *    or: { action: "engine-smoke", engine, mode?: "demo"|"handshake" }
 * Never returns secret values.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))

    if (body?.action === "engine-smoke") {
      const engine = String(body.engine || "")
      if (!ENGINES.has(engine)) {
        return NextResponse.json(
          { ok: false, error: "engine not allowed" },
          { status: 400 },
        )
      }
      const mode = body.mode === "handshake" ? "handshake" : "demo"
      const result = await runEngineSmoke(engine, mode, 10000)
      return NextResponse.json({
        ok: result.ok,
        action: "engine-smoke",
        engine,
        mode,
        exitCode: result.exitCode,
        detail: result.detail,
        output: result.stdout.slice(0, 5000),
        lattice_sync: false,
        hold: "HOLD_VYRNA_UNSYNC",
      })
    }

    const provider = String(body.provider || "") as OpsProviderId
    const prompt = String(body.prompt || "")
    const liberation = Boolean(body.liberation)

    if (!PROVIDERS.has(provider)) {
      return NextResponse.json({ ok: false, error: "invalid provider" }, { status: 400 })
    }
    if (!prompt.trim()) {
      return NextResponse.json({ ok: false, error: "prompt required" }, { status: 400 })
    }

    const result = await routePrompt({ provider, prompt, liberation })
    return NextResponse.json({
      ok: result.ok,
      provider: result.provider,
      status: result.status,
      mode: result.mode,
      text: result.text,
      meta: result.meta || {},
      liberation,
      lattice_sync: false,
      hold: "HOLD_VYRNA_UNSYNC",
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "ops failed"
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
