/**
 * Reverse Engineering Workbench — shared types.
 *
 * Design follows REA's ("Reverse Engineer Anything", morluto/rea, MIT) core
 * principles: EVIDENCE OVER ANSWERS (every result is a record that names its
 * source, provider and limitations) and ONE PROVIDER PER SESSION (an engine is
 * bound explicitly and never silently swapped).
 */

export type EngineId = "rea" | "radare2" | "ghidra"

/** Normalized static-analysis operations every engine is asked for. */
export type StaticOp =
  | "overview"
  | "functions"
  | "strings"
  | "symbols"
  | "imports"
  | "disasm"
  | "pseudocode"
  | "xrefs"

export const STATIC_OPS: StaticOp[] = [
  "overview",
  "functions",
  "strings",
  "symbols",
  "imports",
  "disasm",
  "pseudocode",
  "xrefs",
]

/** Ops that need a function name / address argument. */
export const OPS_NEEDING_SUBJECT: StaticOp[] = ["disasm", "pseudocode", "xrefs"]

export type EvidenceKind = StaticOp | "rea_tool" | "assist" | "error"

export interface EvidenceRecord {
  id: string
  kind: EvidenceKind
  /** Which engine produced this record. */
  provider: EngineId
  /** Exact command / MCP tool that produced it (for reproduction). */
  source: string
  /** sha256 of the target bytes this evidence describes. */
  targetSha256: string
  /** Function name / address the record is about, when applicable. */
  subject?: string
  /** Parsed, bounded payload (rows, text, or structured JSON). */
  data: unknown
  /** Honest caveats: heuristics, truncation, engine limits. */
  limitations: string[]
  /** Engine output is attacker-controllable content — never execute or trust it. */
  untrusted: true
  truncated: boolean
  createdAt: string
  cached?: boolean
  /** Upstream provenance, e.g. REA's evidence_id / provider / confidence / authority. */
  meta?: Record<string, unknown>
}

export interface EngineStatus {
  id: EngineId
  label: string
  available: boolean
  /** Short honest state, e.g. "not installed", "configured (stdio)". */
  state: string
  detail: string
  install: string[]
  version?: string
}

export interface TargetRecord {
  id: string // == sha256
  sha256: string
  name: string
  sizeBytes: number
  origin: "upload" | "quarantine"
  /** Repo-relative path inside the sandboxed analysis area. */
  relPath: string
  addedAt: string
  /** Cheap magic sniff: elf/pe/macho/apk-zip/... (no execution). */
  format: string
}

export interface WorkbenchSession {
  id: string
  engine: EngineId
  targetSha256: string
  boundAt: string
  /** REA only: pinned analysis provider (REA `provider_id`), e.g. "ghidra". */
  reaProvider?: string
}
