export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { egressAwareFetch } from "@/lib/privacy/egress"

/**
 * POST /api/venice/chat
 * Body: { messages: Array<{role, content}>, model?: string }
 * Proxies to Venice chat/completions with Operator-owned key.
 * Never logs bodies. Never returns the key.
 */

const VENICE_API_BASE = process.env.VENICE_API_URL || "https://api.venice.ai/api/v1"

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

type ChatMessage = { role: string; content: string }

export async function POST(req: Request) {
  if (!hasKey()) {
    return NextResponse.json(
      {
        ok: false,
        error: "VENICE_API_KEY absent — set Operator-owned key in .env.local (server-side only)",
        lattice_sync: false,
        hold: "HOLD_VYRNA_UNSYNC",
      },
      { status: 503 },
    )
  }

  let body: { messages?: unknown; model?: unknown; max_tokens?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON body" }, { status: 400 })
  }

  const rawMessages = Array.isArray(body.messages) ? body.messages : null
  if (!rawMessages || rawMessages.length === 0) {
    return NextResponse.json({ ok: false, error: "messages array is required" }, { status: 400 })
  }

  const messages: ChatMessage[] = []
  for (const m of rawMessages) {
    if (!m || typeof m !== "object") continue
    const role = typeof (m as ChatMessage).role === "string" ? (m as ChatMessage).role : ""
    const content =
      typeof (m as ChatMessage).content === "string" ? (m as ChatMessage).content : ""
    if (!role || !content.trim()) continue
    if (!["system", "user", "assistant"].includes(role)) continue
    messages.push({ role, content: content.slice(0, 32000) })
  }

  if (!messages.length) {
    return NextResponse.json(
      { ok: false, error: "no valid messages (role+content required)" },
      { status: 400 },
    )
  }

  const model =
    typeof body.model === "string" && body.model.trim()
      ? body.model.trim()
      : process.env.VENICE_OPS_MODEL || "zai-org-glm-5-2"

  const maxTokens =
    typeof body.max_tokens === "number" && body.max_tokens > 0
      ? Math.min(Math.floor(body.max_tokens), 4096)
      : 1024

  const key = process.env.VENICE_API_KEY as string

  try {
    const res = await egressAwareFetch(`${VENICE_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        stream: false,
      }),
    })

    if (!res.ok) {
      let veniceMsg = ""
      try {
        const errBody = (await res.json()) as { error?: string | { message?: string } }
        if (typeof errBody?.error === "string") veniceMsg = errBody.error
        else if (errBody?.error && typeof errBody.error === "object")
          veniceMsg = errBody.error.message || ""
      } catch {
        /* ignore body parse */
      }
      const detail = veniceMsg
        ? redact(`Venice HTTP ${res.status}: ${veniceMsg}`)
        : redact(`Venice HTTP ${res.status}`)
      return NextResponse.json(
        {
          ok: false,
          error: detail.slice(0, 300),
          model,
          lattice_sync: false,
          hold: "HOLD_VYRNA_UNSYNC",
        },
        { status: 502 },
      )
    }

    const data = (await res.json()) as {
      id?: string
      model?: string
      choices?: Array<{ message?: { role?: string; content?: string }; finish_reason?: string }>
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
    }

    const content = data.choices?.[0]?.message?.content || ""
    if (!content) {
      return NextResponse.json(
        {
          ok: false,
          error: "empty Venice response",
          model: data.model || model,
          lattice_sync: false,
          hold: "HOLD_VYRNA_UNSYNC",
        },
        { status: 502 },
      )
    }

    return NextResponse.json({
      ok: true,
      id: data.id,
      model: data.model || model,
      message: {
        role: "assistant",
        content,
      },
      finish_reason: data.choices?.[0]?.finish_reason || null,
      usage: data.usage || null,
      lattice_sync: false,
      hold: "HOLD_VYRNA_UNSYNC",
    })
  } catch (err) {
    const message =
      err instanceof Error ? redact(err.message).slice(0, 200) : "venice chat failed"
    return NextResponse.json(
      {
        ok: false,
        error: message,
        lattice_sync: false,
        hold: "HOLD_VYRNA_UNSYNC",
      },
      { status: 502 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "venice-chat",
    usage: "POST { messages, model? } → Venice chat/completions",
    keyPresent: hasKey(),
    lattice_sync: false,
    hold: "HOLD_VYRNA_UNSYNC",
  })
}
