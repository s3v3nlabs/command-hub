/**
 * DEMO mode: a clearly-labelled simulated call (no phone network involved).
 * The AI side uses the real LLM if one is configured; the "callee" is simulated —
 * scripted lines, or LLM-role-played when a provider exists — and always tagged
 * `simulated-callee` so nothing can be mistaken for a real conversation.
 */
import { chat } from "@/lib/llm"
import { appendTranscript, callSystemPrompt, disclosureLine, getCall, openingTurn, upsertCall, type CallRecord } from "./index"

const timers = new Map<string, NodeJS.Timeout[]>()
const SCRIPTED_CALLEE = [
  "Oh, hi. Yeah, I have a minute — what's this about?",
  "Okay, got it. That sounds fine to me.",
  "Sure, tell them thanks. I think that's everything.",
]

function later(id: string, ms: number, fn: () => void | Promise<void>) {
  const t = setTimeout(() => {
    Promise.resolve(fn()).catch(() => {})
  }, ms)
  timers.set(id, [...(timers.get(id) || []), t])
}

function ended(id: string) {
  const c = getCall(id)
  return !c || c.status !== "demo-active"
}

export function startDemoCall(call: CallRecord) {
  const id = call.id
  appendTranscript(id, { speaker: "system", text: "DEMO MODE — simulated call. No phone call was placed. Add Twilio keys + PUBLIC_BASE_URL for real calls." })
  later(id, 600, () => appendTranscript(id, { speaker: "ai", text: disclosureLine(), meta: { fixed: true } }))
  later(id, 2200, () => appendTranscript(id, { speaker: "ai", text: openingTurn(call) }))

  const history: { role: "user" | "assistant"; content: string }[] = [{ role: "assistant", content: `${disclosureLine()} ${openingTurn(call)}` }]
  let turn = 0
  const step = async () => {
    if (ended(id)) return
    // simulated callee line
    let callee = SCRIPTED_CALLEE[Math.min(turn, SCRIPTED_CALLEE.length - 1)]
    const sim = await chat({
      system:
        "You are role-playing the PERSON RECEIVING a phone call in a software demo. Reply with one short, natural sentence. After 2-3 turns, wrap up politely.",
      messages: history.map((m) => ({ role: m.role === "assistant" ? "user" : "assistant", content: m.content })),
      maxTokens: 80,
      timeoutMs: 15000,
    })
    if (sim.ok && sim.text) callee = sim.text.replace(/\[.*?\]/g, "").trim()
    if (ended(id)) return
    appendTranscript(id, { speaker: "simulated-callee", text: callee, meta: { source: sim.ok ? `llm:${sim.provider}` : "scripted" } })
    history.push({ role: "user", content: callee })

    // AI reply (real LLM if configured, otherwise scripted)
    const reply = await chat({ system: callSystemPrompt(call), messages: history, maxTokens: 120, timeoutMs: 20000 })
    let text = reply.ok ? reply.text : turn >= 2 ? "Thanks so much for your time. Have a great day! [END_CALL]" : "Thanks — I'll pass that along."
    if (ended(id)) return
    const endNow = /\[END_CALL\]/.test(text) || turn >= 3
    const dnc = /\[DNC\]/.test(text)
    text = text.replace(/\[(END_CALL|DNC)\]/g, "").trim()
    appendTranscript(id, { speaker: "ai", text, meta: { llm: reply.ok ? `${reply.provider}:${reply.model}` : "scripted (no AI key)" } })
    history.push({ role: "assistant", content: text })
    turn++
    if (dnc) appendTranscript(id, { speaker: "system", text: "Callee asked not to be called again — would be added to DNC on a real call." })
    if (endNow) {
      later(id, 1200, () => finishDemoCall(id, "completed"))
    } else {
      later(id, 1800, step)
    }
  }
  later(id, 4200, step)
  // hard stop
  later(id, 90_000, () => finishDemoCall(id, "completed"))
}

export function finishDemoCall(id: string, status = "completed") {
  const c = getCall(id)
  if (!c || c.status !== "demo-active") return
  for (const t of timers.get(id) || []) clearTimeout(t)
  timers.delete(id)
  const durationSec = Math.round((Date.now() - Date.parse(c.createdAt)) / 1000)
  upsertCall({ id, status, endedAt: new Date().toISOString(), durationSec })
  appendTranscript(id, { speaker: "system", text: `DEMO call ended (${status}).` })
}
