/** Pure evidence-record shaping (no fs / no engines) — unit tested. */

import { createHash, randomUUID } from "crypto"
import type { EngineId, EvidenceKind, EvidenceRecord } from "./types"

export const MAX_ROWS = 2000
export const MAX_TEXT = 200_000

export function shapeEvidence(input: {
  kind: EvidenceKind
  provider: EngineId
  source: string
  targetSha256: string
  subject?: string
  data: unknown
  limitations?: string[]
  meta?: Record<string, unknown>
}): EvidenceRecord {
  const limitations = [...(input.limitations || [])]
  let truncated = false
  let data = input.data
  if (Array.isArray(data) && data.length > MAX_ROWS) {
    limitations.push(`Truncated to first ${MAX_ROWS} of ${data.length} rows.`)
    data = data.slice(0, MAX_ROWS)
    truncated = true
  } else if (typeof data === "string" && data.length > MAX_TEXT) {
    limitations.push(`Truncated to first ${MAX_TEXT} of ${data.length} characters.`)
    data = data.slice(0, MAX_TEXT)
    truncated = true
  }
  return {
    id: randomUUID(),
    kind: input.kind,
    provider: input.provider,
    source: input.source,
    targetSha256: input.targetSha256,
    subject: input.subject,
    data,
    limitations,
    untrusted: true,
    truncated,
    createdAt: new Date().toISOString(),
    ...(input.meta ? { meta: input.meta } : {}),
  }
}

/** Honest error record — used instead of fabricating output. */
export function errorEvidence(input: {
  provider: EngineId
  source: string
  targetSha256: string
  message: string
  remediation?: string[]
}): EvidenceRecord {
  return shapeEvidence({
    kind: "error",
    provider: input.provider,
    source: input.source,
    targetSha256: input.targetSha256,
    data: { message: input.message, remediation: input.remediation || [] },
    limitations: ["No analysis output was produced; nothing here is inferred."],
  })
}

/** Accept function names or hex/decimal addresses only (no engine command syntax). */
export function sanitizeSubject(raw: unknown): string | null {
  const s = String(raw ?? "").trim()
  if (!s || s.length > 256) return null
  if (/^0x[0-9a-fA-F]{1,16}$/.test(s)) return s.toLowerCase()
  if (/^[0-9]{1,20}$/.test(s)) return s
  // symbol names: letters, digits, _ . : $ @ < > ~ - (C++/ObjC/Swift-ish), no whitespace / ; ! | ` '
  if (/^[A-Za-z_.$@?][A-Za-z0-9_.:$@<>~?-]*$/.test(s)) return s
  return null
}

export function cacheKey(parts: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 32)
}

/** Cheap header sniff — reads bytes only, never runs the file. */
export function sniffFormat(head: Buffer): string {
  if (head.length >= 4 && head[0] === 0x7f && head.toString("latin1", 1, 4) === "ELF") return "elf"
  if (head.length >= 2 && head.toString("latin1", 0, 2) === "MZ") return "pe"
  if (head.length >= 4) {
    const m = head.readUInt32BE(0)
    if ([0xfeedface, 0xfeedfacf, 0xcefaedfe, 0xcffaedfe].includes(m)) return "macho"
    if (m === 0xcafebabe) return "macho-fat-or-java-class"
    if (m === 0x504b0304) return "zip (apk/jar/ipa?)"
    if (m === 0x6465780a) return "dex"
    if (m === 0x0061736d) return "wasm"
    if (m === 0x27051956) return "uimage (firmware)"
    if (m === 0xd00dfeed) return "devicetree / FIT (firmware)"
    if (m === 0x68737173 || m === 0x73717368) return "squashfs (firmware)"
  }
  return "unknown / raw"
}
