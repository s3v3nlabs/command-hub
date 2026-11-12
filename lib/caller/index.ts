/** Typed re-export of lib/caller/core.mjs (server-only). */
// @ts-ignore — plain ESM module shared with server/caller-bridge
import * as core from "./core.mjs"

export type CallRecord = {
  id: string
  to: string
  objective: string
  script?: string
  mode: "live" | "unconfigured"
  status: string
  twilioSid?: string
  createdAt: string
  updatedAt: string
  endedAt?: string
  durationSec?: number
  error?: string
  llmProvider?: string | null
}
export type TranscriptEntry = { t: string; speaker: "ai" | "callee" | "system"; text: string; meta?: any }

const c: any = core
export const normalizeNumber: (raw: unknown) => { ok: true; number: string } | { ok: false; error: string } = c.normalizeNumber
export const disclosureLine: () => string = c.disclosureLine
export const ownerName: () => string = c.ownerName
export const dailyCap: () => number = c.dailyCap
export const maxCallSeconds: () => number = c.maxCallSeconds
export const twilioConfigured: () => boolean = c.twilioConfigured
export const publicBaseUrl: () => string = c.publicBaseUrl
export const mediaStreamUrl: () => string = c.mediaStreamUrl
export const mode: () => "live" | "unconfigured" = c.mode
export const maskNumber: (n: string) => string = c.maskNumber
export const listDnc: () => Array<{ number: string; reason: string; addedAt: string }> = c.listDnc
export const isDnc: (n: string) => boolean = c.isDnc
export const addDnc: (n: string, reason?: string) => { ok: boolean; error?: string; number?: string } = c.addDnc
export const removeDnc: (n: string) => { ok: boolean; error?: string } = c.removeDnc
export const listCalls: () => CallRecord[] = c.listCalls
export const getCall: (id: string) => CallRecord | null = c.getCall
export const upsertCall: (call: Partial<CallRecord> & { id: string }) => CallRecord = c.upsertCall
export const findCallBySid: (sid: string) => CallRecord | null = c.findCallBySid
export const activeCall: () => CallRecord | null = c.activeCall
export const callsToday: () => number = c.callsToday
export const appendTranscript: (id: string, e: Omit<TranscriptEntry, "t">) => void = c.appendTranscript
export const readTranscript: (id: string) => TranscriptEntry[] = c.readTranscript
export const transcriptPath: (id: string) => string = c.transcriptPath
export const issueConfirmToken: (n: string, objective: string) => { token: string; expiresAt: string } = c.issueConfirmToken
export const verifyConfirmToken: (t: string, n: string, objective: string) => { ok: boolean; error?: string } = c.verifyConfirmToken
export const policyCheck: (n: string, isLive: boolean) => { ok: boolean; error?: string } = c.policyCheck
export const validateTwilioSignature: (url: string, params: Record<string, string>, sig: string) => boolean =
  c.validateTwilioSignature
export const twilioCreateCall: (callId: string, to: string) => Promise<{ sid: string; status: string }> = c.twilioCreateCall
export const twilioHangup: (sid: string) => Promise<unknown> = c.twilioHangup
export const buildTwiml: (callId: string) => string = c.buildTwiml
export const callSystemPrompt: (call: Partial<CallRecord>) => string = c.callSystemPrompt
export const openingTurn: (call: Partial<CallRecord>) => string = c.openingTurn
