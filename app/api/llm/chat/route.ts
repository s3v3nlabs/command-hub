export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { chat, type ChatMessage, type ChatProviderId } from "@/lib/llm"

/**
 * POST /api/llm/chat — unified chat across xAI / OpenAI / Venice / Groq / local Ollama.
 * Body: { messages: [{role, content}], provider?: "auto"|id, model?, system? }
 * Returns 503 + needsKey when nothing is configured (no mock replies).
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ ok: false, error: "messages array is required" }, { status: 400 })
  }
  const messages: ChatMessage[] = body.messages
    .filter((m: any) => m && typeof m.content === "string" && typeof m.role === "string")
    .slice(-30)
    .map((m: any) => ({ role: m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user", content: m.content.slice(0, 8000) }))
  const res = await chat({
    messages,
    provider: (body.provider as ChatProviderId | "auto") || "auto",
    model: typeof body.model === "string" ? body.model : undefined,
    system: typeof body.system === "string" ? body.system.slice(0, 6000) : undefined,
    maxTokens: Math.min(Number(body.maxTokens) || 700, 2000),
  })
  return NextResponse.json(res, { status: res.ok ? 200 : res.needsKey ? 503 : 502 })
}
