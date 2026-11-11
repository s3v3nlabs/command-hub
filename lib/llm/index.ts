/**
 * Typed entry point for the shared AI provider core (lib/llm/core.mjs).
 * Server-only: import from API routes, never from client components.
 */
// @ts-ignore — plain ESM module with JSDoc types
import * as coreModule from "./core.mjs"
const core: any = coreModule

export type ChatMessage = { role: "system" | "user" | "assistant" | string; content: string }
export type ChatProviderId = "openai" | "xai" | "venice" | "groq" | "ollama"
export type ChatResult = {
  ok: boolean
  provider: ChatProviderId | null
  model: string | null
  text: string
  error?: string
  needsKey?: boolean
}

export const chat: (opts: {
  provider?: ChatProviderId | "auto"
  model?: string
  messages: ChatMessage[]
  system?: string
  maxTokens?: number
  temperature?: number
  strictProvider?: boolean
  timeoutMs?: number
}) => Promise<ChatResult> = core.chat

export const providerStatus: () => Promise<{
  chat: Array<{ id: ChatProviderId; label: string; configured: boolean; needs: string | null; model: string }>
  stt: Array<{ id: string; label: string; configured: boolean; needs: string | null }>
  tts: Array<{ id: string; label: string; configured: boolean; needs: string | null }>
  embed: Array<{ id: string; label: string; configured: boolean; needs: string | null }>
  ollamaModels: string[]
}> = core.providerStatus

export const pickChatProvider: (preferred?: string) => Promise<ChatProviderId | null> = core.pickChatProvider
export const embed: (
  texts: string[],
  opts?: { provider?: "auto" | "openai" | "ollama" | "local" },
) => Promise<{ provider: string; model: string; vectors: number[][] }> = core.embed
export const localEmbed: (text: string) => number[] = core.localEmbed
export const cosine: (a: number[], b: number[]) => number = core.cosine
export const redact: (s: string) => string = core.redact
export const probeOllama: (timeoutMs?: number) => Promise<{ up: boolean; models: string[] }> = core.probeOllama
export const synthesizeMulaw: (
  text: string,
  opts?: { provider?: string },
) => Promise<{ ok: boolean; provider: string | null; mulaw?: Buffer; error?: string; needsKey?: boolean }> =
  core.synthesizeMulaw
export const transcribeMulaw: (
  mulaw: Buffer,
  opts?: { provider?: string; language?: string },
) => Promise<{ ok: boolean; provider: string | null; text: string; error?: string; needsKey?: boolean }> =
  core.transcribeMulaw
