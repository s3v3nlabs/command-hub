export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { tryLivePanel } from "@/lib/selfHealing/BuildShipHarness"

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()
    const q = typeof prompt === "string" ? prompt : ""

    // ADD-ONLY: prefer S3v3n private panel aggregate
    try {
      const { runS3v3nPanel } = await import("@/lib/selfHealing/S3v3nPanel")
      const panel = await runS3v3nPanel(q)
      if (panel.ok && panel.aggregate) {
        return NextResponse.json({
          model: panel.aggregate.model,
          message: panel.aggregate.response,
          success: true,
          isMock: false,
          source: "s3v3n-live",
          privacyMode: panel.privacyMode,
          leaderboard: panel.leaderboard,
        })
      }
    } catch {
      /* fall through — never log bodies */
    }

    // Optional BuildShip if URL configured
    if (process.env.BUILDSHIP_PANEL_URL) {
      try {
        const live = await tryLivePanel(q)
        if (live && live.length > 0) {
          const top = [...live].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))[0]
          return NextResponse.json({
            model: top.model,
            message: top.response,
            success: true,
            isMock: false,
            source: "buildship-live",
            panel: live,
          })
        }
      } catch {
        /* fall through */
      }
    }

    // Real provider (xAI / OpenAI / Venice / Groq / Ollama) via the shared core — no mock replies.
    const { chat } = await import("@/lib/llm")
    const res = await chat({ messages: [{ role: "user", content: q }] })
    if (!res.ok) {
      return NextResponse.json(
        { model: null, message: res.error || "No AI provider available", success: false, isMock: false, source: "none", needsKey: Boolean(res.needsKey) },
        { status: res.needsKey ? 503 : 502 },
      )
    }
    return NextResponse.json({ model: res.model, message: res.text, success: true, isMock: false, source: res.provider })
  } catch (error) {
    console.error("Error in chat route")
    return NextResponse.json(
      {
        message: "An error occurred processing your request",
        success: false,
      },
      { status: 500 },
    )
  }
}
