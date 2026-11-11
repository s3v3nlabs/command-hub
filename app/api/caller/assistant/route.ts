export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { chat } from "@/lib/llm"
import { disclosureLine } from "@/lib/caller"

/**
 * Grok Bot assistant for the AI Caller: helps draft the call objective + talking points.
 * Prefers xAI Grok (XAI_API_KEY) and falls back to any configured provider.
 */
const SYSTEM = `You are the Grok Bot assistant inside the Command Hub's AI Caller module. You help the operator plan ONE phone call: a clear objective (1-2 sentences) and short talking points.
Rules you must follow and explain if asked:
- Every call opens with this fixed disclosure, which cannot be changed: "${disclosureLine()}"
- The AI never pretends to be human, never hides who it calls for, and never spoofs caller ID.
- No harassment, threats, pranks that deceive, debt-collection pressure, robocall/bulk campaigns, or calls to people who asked not to be contacted.
- Keep scripts polite, brief and natural for speech.
When you propose a draft, end your reply with a block exactly like:
OBJECTIVE: <one or two sentences>
SCRIPT:
- point 1
- point 2`

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}) as any)
  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m: any) => m && typeof m.content === "string")
    .slice(-16)
    .map((m: any) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content).slice(0, 4000) }))
  if (!messages.length) return NextResponse.json({ ok: false, error: "messages required" }, { status: 400 })
  const res = await chat({ provider: (process.env.CALLER_ASSISTANT_PROVIDER as any) || "xai", system: SYSTEM, messages, maxTokens: 600 })
  return NextResponse.json(res, { status: res.ok ? 200 : res.needsKey ? 503 : 502 })
}
