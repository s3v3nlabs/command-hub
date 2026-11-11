export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"

/**
 * Server proxy for BuildShip AI Panel of Experts (shipped REST URL).
 * Never exposes BUILDSHIP_PANEL_URL to the client.
 *
 * POST { prompt: string, sessionId?: string }
 */
export async function POST(req: Request) {
  const panelUrl = process.env.BUILDSHIP_PANEL_URL
  if (!panelUrl) {
    return NextResponse.json(
      {
        error: "panel URL not configured",
        message: "Set BUILDSHIP_PANEL_URL to enable live BuildShip panel",
        success: false,
      },
      { status: 503 },
    )
  }

  try {
    const body = await req.json()
    const prompt = typeof body?.prompt === "string" ? body.prompt : ""
    if (!prompt.trim()) {
      return NextResponse.json({ error: "prompt is required", success: false }, { status: 400 })
    }
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : undefined

    const headers: Record<string, string> = {
      "content-type": "application/json",
    }
    const secret = process.env.BUILDSHIP_PANEL_SECRET
    if (secret) {
      headers.authorization = `Bearer ${secret}`
    }

    const upstream = await fetch(panelUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ prompt, sessionId }),
    })

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "")
      return NextResponse.json(
        {
          error: `BuildShip panel HTTP ${upstream.status}`,
          detail: text.slice(0, 500),
          success: false,
        },
        { status: 502 },
      )
    }

    const data = await upstream.json()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in panel route:", error)
    return NextResponse.json(
      {
        error: "An error occurred calling the BuildShip panel",
        success: false,
      },
      { status: 500 },
    )
  }
}
