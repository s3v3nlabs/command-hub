export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import crypto from "crypto"
import { pickChatProvider } from "@/lib/llm"
import * as C from "@/lib/caller"
import { startDemoCall } from "@/lib/caller/demo"

/**
 * POST /api/caller/call { to, objective, script?, confirmToken }
 * Requires a confirm token from /api/caller/prepare (explicit operator Confirm).
 * Live mode → Twilio REST (caller ID = TWILIO_FROM_NUMBER only). Otherwise → DEMO simulation.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}) as any)
  if (Array.isArray(body.to)) return NextResponse.json({ ok: false, error: "bulk dialing is not allowed" }, { status: 400 })
  const n = C.normalizeNumber(body.to)
  if (!n.ok) return NextResponse.json({ ok: false, error: n.error }, { status: 400 })
  const objective = typeof body.objective === "string" ? body.objective.trim().slice(0, 1000) : ""
  const script = typeof body.script === "string" ? body.script.trim().slice(0, 4000) : ""
  const v = C.verifyConfirmToken(String(body.confirmToken || ""), n.number, objective)
  if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 403 })
  const live = C.mode() === "live"
  const pol = C.policyCheck(n.number, live)
  if (!pol.ok) return NextResponse.json({ ok: false, error: pol.error }, { status: 409 })

  const id = `call_${Date.now().toString(36)}_${crypto.randomBytes(3).toString("hex")}`
  const llmProvider = await pickChatProvider(process.env.CALLER_LLM_PROVIDER || "auto")
  if (!live) {
    const rec = C.upsertCall({ id, to: n.number, objective, script, mode: "demo", status: "demo-active", llmProvider })
    startDemoCall(rec)
    return NextResponse.json({ ok: true, id, mode: "demo", status: rec.status })
  }
  if (!llmProvider) {
    return NextResponse.json({ ok: false, error: "No AI provider configured for the conversation (set XAI_API_KEY / OPENAI_API_KEY / VENICE_API_KEY / GROQ_API_KEY or run Ollama)" }, { status: 503 })
  }
  C.upsertCall({ id, to: n.number, objective, script, mode: "live", status: "dialing", llmProvider })
  C.appendTranscript(id, { speaker: "system", text: `Dialing ${C.maskNumber(n.number)} from the hub's Twilio number…` })
  try {
    const tw = await C.twilioCreateCall(id, n.number)
    const rec = C.upsertCall({ id, twilioSid: tw.sid, status: tw.status || "queued" })
    return NextResponse.json({ ok: true, id, mode: "live", status: rec.status })
  } catch (e) {
    const msg = (e as Error).message
    C.upsertCall({ id, status: "failed", error: msg })
    C.appendTranscript(id, { speaker: "system", text: `Dial failed: ${msg}` })
    return NextResponse.json({ ok: false, id, error: msg }, { status: 502 })
  }
}
