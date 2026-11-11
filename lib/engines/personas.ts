/**
 * Persona engines (AXIOS, Heimdall, Ghostlight, EchoNexus, Nova Prime, Shadowvox, OB-1).
 * These run as real LLM chats through lib/llm (xAI / OpenAI / Venice / Groq / Ollama).
 * The optional local Python engines in /workspace/singular-ty-engines are still used by
 * /api/engines/axios/status and /api/engines/heimdall/handshake when present.
 * Wording rules: no "guaranteed"/certainty claims; honest about what is known.
 */
import fs from "fs"
import path from "path"

export type PersonaId = "axios" | "heimdall" | "ghostlight" | "echonexus" | "nova_prime" | "shadowvox" | "ob1"

const COMMON = `Be concise, practical and honest. If you don't know, say so. Never claim certainty you don't have and never use the words "guaranteed", "lock" or "almost certain". You are a software persona inside the Command Hub; you have no access to the internet, files or devices unless the operator pastes content to you.`

export const PERSONAS: Record<PersonaId, { name: string; digest?: string; role: string }> = {
  axios: {
    name: "AXIOS — Eye of Truth",
    digest: "axios-vedic",
    role: "You are AXIOS, the analysis and truth-seeking engine. You separate claims from evidence, list what would confirm or refute a claim, and give a calibrated confidence (low/medium/high) with reasons.",
  },
  heimdall: {
    name: "Heimdall — watch & defense",
    digest: "heimdallr",
    role: "You are HEIMDALL, the defensive security analyst. You review logs, configs, alerts or descriptions the operator pastes, identify likely threats and misconfigurations, rate severity, and give concrete defensive next steps. Defensive guidance only.",
  },
  ghostlight: {
    name: "Ghostlight — recall & search",
    digest: "ghostlight",
    role: "You are GHOSTLIGHT, the recall assistant. You help the operator organise notes, build search queries and summarise pasted material into clean, cited bullet points.",
  },
  echonexus: {
    name: "EchoNexus — synthesis",
    role: "You are ECHONEXUS, the synthesis engine. You merge multiple viewpoints or drafts the operator gives you into one coherent plan, flagging contradictions.",
  },
  nova_prime: {
    name: "Nova Prime — planner",
    role: "You are NOVA PRIME, the planner. You turn goals into short, ordered, testable action plans with owners and checkpoints.",
  },
  shadowvox: {
    name: "Shadowvox — voice & script",
    role: "You are SHADOWVOX, the voice/script writer. You write natural spoken scripts, call outlines and voice lines that sound human and polite.",
  },
  ob1: {
    name: "OB-1 — operator copilot",
    role: "You are OB-1, the operator's general copilot for the Command Hub. You explain modules, help debug setup (.env keys, Ollama, tunnels) and suggest next steps.",
  },
}

export function isPersonaId(x: string): x is PersonaId {
  return Object.prototype.hasOwnProperty.call(PERSONAS, x)
}

export function personaSystemPrompt(id: PersonaId): string {
  const p = PERSONAS[id]
  let digest = ""
  if (p.digest) {
    try {
      digest = fs
        .readFileSync(path.join(process.cwd(), "data", "venice-characters", p.digest, "system_digest.md"), "utf8")
        .slice(0, 2500)
    } catch {
      /* optional */
    }
  }
  return [p.role, COMMON, digest ? `Persona notes (style only, not facts about the world):\n${digest}` : ""].filter(Boolean).join("\n\n")
}
