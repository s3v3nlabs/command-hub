export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { chat, type ChatProviderId } from "@/lib/llm"
import { PERSONAS, isPersonaId, personaSystemPrompt } from "@/lib/engines/personas"

/**
 * POST /api/engines/:engine/chat  { messages:[{role,content}], provider? }
 * GET  /api/engines/:engine/chat  → persona info
 * Real LLM call (xAI / OpenAI / Venice / Groq / Ollama). 503 + needsKey when none configured.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ engine: string }> }) {
  const { engine } = await ctx.params
  if (!isPersonaId(engine)) return NextResponse.json({ ok: false, error: "unknown engine", engines: Object.keys(PERSONAS) }, { status: 404 })
  return NextResponse.json({ ok: true, id: engine, name: PERSONAS[engine].name })
}

export async function POST(req: Request, ctx: { params: Promise<{ engine: string }> }) {
  const { engine } = await ctx.params
  if (!isPersonaId(engine)) return NextResponse.json({ ok: false, error: "unknown engine" }, { status: 404 })
  const body = await req.json().catch(() => ({}) as any)
  const msgs = Array.isArray(body.messages) ? body.messages : typeof body.prompt === "string" ? [{ role: "user", content: body.prompt }] : []
  const messages = msgs
    .filter((m: any) => m && typeof m.content === "string")
    .slice(-20)
    .map((m: any) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content).slice(0, 8000) }))
  if (!messages.length) return NextResponse.json({ ok: false, error: "messages required" }, { status: 400 })
  const res = await chat({
    messages,
    system: personaSystemPrompt(engine),
    provider: (body.provider as ChatProviderId) || "auto",
  })
  return NextResponse.json({ ...res, engine, name: PERSONAS[engine].name }, { status: res.ok ? 200 : res.needsKey ? 503 : 502 })
}
