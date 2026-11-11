/**
 * Hive intel packets — BIG finding → hive learn → patch/defend drafts.
 * No exploit payloads. HOLD_VYRNA_UNSYNC · lattice_sync: false always.
 */

import fs from "fs"
import path from "path"
import { randomUUID, createHash } from "crypto"
import { postTeamMessage } from "@/lib/signalframe/team-bus"
import { encryptAtRest, isEncryptionAvailable } from "@/lib/privacy/localCrypto"
import { learnFromHiveIntel } from "@/lib/dev-operator/learn"
import { emitFromHiveIntel } from "@/lib/train/teacher"

export type IntelSeverity = "info" | "low" | "medium" | "high" | "critical"

export type IntelPacket = {
  id: string
  severity: IntelSeverity
  title: string
  summary: string
  indicators?: string[]
  patchHints?: string[]
  defenseHints?: string[]
  bountyEligible?: boolean
  lattice_sync: false
  fromHub: string
  ts: string
  hold: "HOLD_VYRNA_UNSYNC"
}

const PROPOSALS_DIR = path.join(process.cwd(), "modules", "proposals")
const LEARN_DIR =
  process.env.S3V3N_HIVE_LEARN_DIR ||
  path.join(process.cwd(), "data", "hive", "learn")
const INTEL_LOG = path.join(process.cwd(), "data", "hive", "intel.jsonl")

const FORBIDDEN = /(exploit\s*poc|weaponiz|payload\s*crash|rce\s*shellcode|keylog|ransomware)/i

export function isIntelPacket(value: unknown): value is Omit<IntelPacket, "id" | "ts" | "lattice_sync" | "hold"> & Partial<IntelPacket> {
  if (!value || typeof value !== "object") return false
  const v = value as Record<string, unknown>
  if (typeof v.title !== "string" || !v.title.trim()) return false
  if (typeof v.summary !== "string" || !v.summary.trim()) return false
  const sev = String(v.severity || "info").toLowerCase()
  if (!["info", "low", "medium", "high", "critical"].includes(sev)) return false
  const blob = `${v.title} ${v.summary} ${(v.patchHints || []).toString()} ${(v.defenseHints || []).toString()}`
  if (FORBIDDEN.test(blob)) return false
  return true
}

function ensureDirs(): void {
  fs.mkdirSync(PROPOSALS_DIR, { recursive: true, mode: 0o755 })
  fs.mkdirSync(LEARN_DIR, { recursive: true, mode: 0o700 })
  fs.mkdirSync(path.dirname(INTEL_LOG), { recursive: true, mode: 0o700 })
}

export function normalizeIntel(input: Record<string, unknown>, fromHubFallback = "local"): IntelPacket {
  const severity = (String(input.severity || "info").toLowerCase() as IntelSeverity)
  return {
    id: typeof input.id === "string" && input.id ? input.id : randomUUID(),
    severity: ["info", "low", "medium", "high", "critical"].includes(severity) ? severity : "info",
    title: String(input.title || "").slice(0, 200),
    summary: String(input.summary || "").slice(0, 4000),
    indicators: Array.isArray(input.indicators)
      ? input.indicators.map(String).slice(0, 40)
      : undefined,
    patchHints: Array.isArray(input.patchHints)
      ? input.patchHints.map(String).slice(0, 20)
      : undefined,
    defenseHints: Array.isArray(input.defenseHints)
      ? input.defenseHints.map(String).slice(0, 20)
      : undefined,
    bountyEligible: Boolean(input.bountyEligible),
    lattice_sync: false,
    fromHub: String(input.fromHub || fromHubFallback).slice(0, 64),
    ts: typeof input.ts === "string" ? input.ts : new Date().toISOString(),
    hold: "HOLD_VYRNA_UNSYNC",
  }
}

/** Twin/RAG learn note — encrypted when Privacy Fortress persist available. Never stores exploit payloads. */
export function ingestLearnNote(packet: IntelPacket): { path: string; encrypted: boolean } {
  ensureDirs()
  const note = {
    kind: "hive-intel-learn",
    id: packet.id,
    severity: packet.severity,
    title: packet.title,
    summary: packet.summary,
    indicators: packet.indicators,
    defenseHints: packet.defenseHints,
    patchHints: packet.patchHints,
    fromHub: packet.fromHub,
    ts: packet.ts,
    lattice_sync: false,
    hold: "HOLD_VYRNA_UNSYNC",
  }
  const fname = `learn-${packet.ts.slice(0, 10)}-${packet.id.slice(0, 8)}.json`
  const dest = path.join(LEARN_DIR, fname)
  const persistOn = process.env.S3V3N_PANEL_PERSIST === "1" || process.env.S3V3N_PANEL_PERSIST === "true"
  if (persistOn && isEncryptionAvailable()) {
    const blob = encryptAtRest(JSON.stringify(note))
    if (blob) {
      fs.writeFileSync(dest + ".enc.json", JSON.stringify({ v: 1, enc: true, blob, meta: { id: packet.id, severity: packet.severity, title: packet.title, ts: packet.ts } }, null, 2), { mode: 0o600 })
      return { path: dest + ".enc.json", encrypted: true }
    }
  }
  fs.writeFileSync(dest, JSON.stringify(note, null, 2), { mode: 0o600 })
  return { path: dest, encrypted: false }
}

/** Auto-draft defense proposal markdown — no exploit payloads. */
export function draftPatchProposal(packet: IntelPacket): string {
  ensureDirs()
  const slug = packet.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "finding"
  const fname = `patch-${packet.ts.slice(0, 10)}-${slug}-${packet.id.slice(0, 6)}.md`
  const dest = path.join(PROPOSALS_DIR, fname)
  const md = `---
id: ${packet.id}
severity: ${packet.severity}
fromHub: ${packet.fromHub}
ts: ${packet.ts}
lattice_sync: false
hold: HOLD_VYRNA_UNSYNC
bountyEligible: ${packet.bountyEligible ? "true" : "false"}
type: defense-proposal
---

# Defense proposal: ${packet.title}

> Auto-draft from hive intel. **No exploit payloads.** Review before applying.
> Does not silently overwrite Ghostlight / Signalframe core files.

## Summary

${packet.summary}

## Indicators (observables only)

${(packet.indicators || []).map((i) => `- ${i}`).join("\n") || "_None listed._"}

## Patch hints (defensive)

${(packet.patchHints || []).map((i) => `- ${i}`).join("\n") || "_Propose hardening / validation / logging / rate-limits._"}

## Defense hints

${(packet.defenseHints || []).map((i) => `- ${i}`).join("\n") || "_Add detection, alert, or containment notes._"}

## Suggested next steps

1. Review under Privacy Fortress — do not paste secrets into chat telemetry.
2. If code change needed: write a **markdown patch proposal** under \`modules/proposals/\` or \`docs/proposals/\` — do not silently overwrite core UI.
3. Optionally open a bounty / licensed disclosure draft on \`/bounty\` if eligible.
4. Alert team via Signalframe whisper (already attempted on ingest).

## Hold

\`HOLD_VYRNA_UNSYNC\` · \`lattice_sync: false\` — not a Vyrna lattice claim.
`
  fs.writeFileSync(dest, md, { mode: 0o644 })
  return dest
}

export function alertTeamWhisper(packet: IntelPacket): void {
  postTeamMessage({
    channel: "whisper",
    from: `hive-intel:${packet.fromHub}`,
    body: `[${packet.severity.toUpperCase()}] ${packet.title} — ${packet.summary.slice(0, 280)} (id=${packet.id.slice(0, 8)} · lattice_sync=false)`,
  })
}

export function appendIntelLog(packet: IntelPacket): void {
  ensureDirs()
  const hash = createHash("sha256").update(packet.summary).digest("hex").slice(0, 16)
  fs.appendFileSync(
    INTEL_LOG,
    JSON.stringify({
      id: packet.id,
      severity: packet.severity,
      title: packet.title,
      summaryHash: hash,
      fromHub: packet.fromHub,
      ts: packet.ts,
      bountyEligible: packet.bountyEligible,
      lattice_sync: false,
      hold: "HOLD_VYRNA_UNSYNC",
    }) + "\n",
    { mode: 0o600 },
  )
}

export function shouldReplicate(packet: IntelPacket): boolean {
  return packet.severity === "high" || packet.severity === "critical"
}

/**
 * Full local ingest pipeline: learn note + whisper alert + patch draft.
 */
export function ingestIntelLocal(packet: IntelPacket): {
  learnPath: string
  proposalPath: string
  encrypted: boolean
} {
  appendIntelLog(packet)
  try {
    learnFromHiveIntel({
      title: packet.title,
      summary: packet.summary,
      severity: packet.severity,
      defenseHints: packet.defenseHints,
      patchHints: packet.patchHints,
      fromHub: packet.fromHub,
    })
  } catch {
    /* learn is best-effort */
  }
  try {
    emitFromHiveIntel({
      title: packet.title,
      summary: packet.summary,
      severity: packet.severity,
      defenseHints: packet.defenseHints,
      autoPush: true,
    })
  } catch {
    /* teacher train lesson best-effort */
  }
  const learn = ingestLearnNote(packet)
  alertTeamWhisper(packet)
  const proposalPath = draftPatchProposal(packet)
  return { learnPath: learn.path, proposalPath, encrypted: learn.encrypted }
}
