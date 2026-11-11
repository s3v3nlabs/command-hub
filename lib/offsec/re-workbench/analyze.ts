/** Dispatch normalized static ops to the bound engine and shape evidence. */

import { errorEvidence, sanitizeSubject, shapeEvidence } from "./evidence"
import { getCached, putCached } from "./cache"
import { r2Binary, runR2, R2_LIMITATIONS } from "./radare2"
import { ghidraHeadless, runGhidra } from "./ghidra"
import { markReaOpened, reaCallTool, reaConfig, reaOpenedSession, ReaNotConfiguredError } from "./rea-client"
import { INSTALL_GUIDE } from "./engines"
import { OPS_NEEDING_SUBJECT, type EngineId, type EvidenceRecord, type StaticOp, type TargetRecord, type WorkbenchSession } from "./types"

/**
 * Make sure the live REA process has this session's binary open (REA keeps
 * one Program per MCP session; a restarted REA process starts empty).
 * Returns open_binary evidence when it (re)opened, null when already open.
 */
export async function ensureReaOpen(session: WorkbenchSession, absPath: string, force = false): Promise<EvidenceRecord | null> {
  if (reaConfig().mode === "none") {
    return errorEvidence({ provider: "rea", source: "open_binary", targetSha256: session.targetSha256, message: new ReaNotConfiguredError().message, remediation: INSTALL_GUIDE.rea })
  }
  if (!force && reaOpenedSession() === session.id) return null
  try {
    const o = await reaCallTool("open_binary", { path: absPath, ...(session.reaProvider ? { provider_id: session.reaProvider } : {}) })
    const ev = reaPayloadToEvidence({ payload: o.payload, isError: o.isError, kind: "overview", tool: "open_binary", targetSha256: session.targetSha256 })
    markReaOpened(ev.kind === "error" ? null : session.id)
    return ev
  } catch (e) {
    markReaOpened(null)
    return errorEvidence({ provider: "rea", source: "REA MCP tools/call open_binary", targetSha256: session.targetSha256, message: (e as Error).message })
  }
}

const REA_OP_TOOL: Record<StaticOp, string> = {
  overview: "binary_overview",
  functions: "list_procedures",
  strings: "list_strings",
  symbols: "list_names",
  imports: "inspect_pe_imports",
  disasm: "procedure_assembly",
  pseudocode: "procedure_pseudo_code",
  xrefs: "xrefs",
}

/** Interpret a REA tool payload: {result} → evidence data, {error} → honest error. */
export function reaPayloadToEvidence(input: {
  payload: unknown
  isError: boolean
  kind: EvidenceRecord["kind"]
  tool: string
  targetSha256: string
  subject?: string
}): EvidenceRecord {
  const p = input.payload as { result?: unknown; error?: { message?: string; code?: string; remediation?: { action?: string } } }
  const source = `REA MCP tools/call ${input.tool}`
  if (input.isError || (p && typeof p === "object" && p.error)) {
    const err = p?.error
    return errorEvidence({
      provider: "rea",
      source,
      targetSha256: input.targetSha256,
      message: `${err?.code ? err.code + ": " : ""}${err?.message || (typeof input.payload === "string" ? input.payload : "REA returned an error")}`,
      remediation: err?.remediation?.action ? [err.remediation.action] : [],
    })
  }
  const result = p && typeof p === "object" && "result" in p ? p.result : input.payload
  const env = unwrapReaEvidence(result)
  if (env) {
    const prov = env.provider ? `${env.provider.id || "?"}${env.provider.version ? " " + env.provider.version : ""}` : "?"
    return shapeEvidence({
      kind: input.kind,
      provider: "rea",
      source: `${source} → provider ${prov} · ${env.evidence_id}`,
      targetSha256: input.targetSha256,
      subject: input.subject,
      data: env.normalized_result,
      limitations: [...(env.limitations || []).map(String), `REA confidence: ${env.confidence ?? "n/a"} · authority: ${env.authority ?? "n/a"}`],
      meta: {
        rea_evidence_id: env.evidence_id,
        rea_provider: env.provider,
        rea_operation: env.operation,
        rea_parameters: env.parameters,
        rea_confidence: env.confidence,
        rea_authority: env.authority,
      },
    })
  }
  return shapeEvidence({
    kind: input.kind,
    provider: "rea",
    source,
    targetSha256: input.targetSha256,
    subject: input.subject,
    data: result,
    limitations: ["Evidence and limitations as reported by REA; see REA's own `limitations`/`unknowns` fields in the data."],
  })
}

interface ReaEvidenceEnvelope {
  evidence_id: string
  normalized_result: unknown
  limitations?: unknown[]
  provider?: { id?: string; name?: string; version?: string | null }
  operation?: string
  parameters?: unknown
  confidence?: string
  authority?: string
}

/** REA (6.2+) wraps analysis results in an Evidence envelope; unwrap it when present. */
export function unwrapReaEvidence(r: unknown): ReaEvidenceEnvelope | null {
  if (!r || typeof r !== "object" || Array.isArray(r)) return null
  const o = r as Record<string, unknown>
  if (typeof o.evidence_id !== "string" || !("normalized_result" in o)) return null
  return o as unknown as ReaEvidenceEnvelope
}

export async function runStaticOp(opts: {
  engine: EngineId
  target: TargetRecord
  absPath: string
  op: StaticOp
  subject?: string
  noCache?: boolean
  /** Required for engine "rea" so the binary can be (re)opened in the live REA process. */
  session?: WorkbenchSession
}): Promise<EvidenceRecord> {
  const { engine, target, absPath, op } = opts
  const sha = target.sha256
  let subject: string | undefined
  if (OPS_NEEDING_SUBJECT.includes(op)) {
    const s = sanitizeSubject(opts.subject)
    if (!s) {
      return errorEvidence({ provider: engine, source: op, targetSha256: sha, message: "A valid function name or 0x address is required for this operation." })
    }
    subject = s
  }
  const key = { op, subject: subject || "" }
  if (!opts.noCache) {
    const hit = getCached(sha, engine, key)
    if (hit) return hit
  }

  let ev: EvidenceRecord
  if (engine === "radare2") {
    const bin = r2Binary()
    if (!bin) {
      return errorEvidence({ provider: engine, source: op, targetSha256: sha, message: "analysis engine not installed: radare2", remediation: INSTALL_GUIDE.radare2 })
    }
    const r = await runR2(bin, absPath, op, subject)
    ev = r.ok
      ? shapeEvidence({ kind: op, provider: engine, source: r.source, targetSha256: sha, subject, data: r.data, limitations: R2_LIMITATIONS[op] })
      : errorEvidence({ provider: engine, source: r.source, targetSha256: sha, message: r.error })
  } else if (engine === "ghidra") {
    const gh = ghidraHeadless()
    if (!gh) {
      return errorEvidence({ provider: engine, source: op, targetSha256: sha, message: "analysis engine not installed: Ghidra", remediation: INSTALL_GUIDE.ghidra })
    }
    const fnMode = OPS_NEEDING_SUBJECT.includes(op)
    const rawKey = { ghidraRaw: fnMode ? "function" : "summary", subject: subject || "" }
    let raw = opts.noCache ? null : (getCached(sha, engine, rawKey)?.data as Record<string, unknown> | undefined) ?? null
    let source = `analyzeHeadless … HubExportEvidence.java ${fnMode ? "function " + subject : "summary"} (cached)`
    if (!raw) {
      const r = await runGhidra(gh, absPath, fnMode ? "function" : "summary", subject)
      if (!r.ok) return errorEvidence({ provider: engine, source: r.source, targetSha256: sha, message: r.error })
      raw = r.data
      source = r.source
      putCached(sha, engine, rawKey, shapeEvidence({ kind: op, provider: engine, source, targetSha256: sha, data: raw }))
    }
    const pick: Record<StaticOp, unknown> = {
      overview: { program: raw.program, language: raw.language, compiler: raw.compiler, imageBase: raw.imageBase, executableFormat: raw.executableFormat, functionCount: Array.isArray(raw.functions) ? raw.functions.length : undefined },
      functions: raw.functions,
      strings: raw.strings,
      symbols: raw.symbols,
      imports: raw.imports,
      disasm: raw.assembly,
      pseudocode: raw.pseudocode ?? `(decompiler produced no output: ${String(raw.decompileError || "unknown")})`,
      xrefs: raw.xrefs,
    }
    const lim =
      op === "pseudocode"
        ? ["Ghidra decompiler output is a reconstruction; types/names are inferred and may be wrong."]
        : ["Export capped at 5000 rows per list."]
    ev = shapeEvidence({ kind: op, provider: engine, source, targetSha256: sha, subject, data: pick[op], limitations: lim })
  } else {
    if (reaConfig().mode === "none") {
      return errorEvidence({ provider: "rea", source: op, targetSha256: sha, message: new ReaNotConfiguredError().message, remediation: INSTALL_GUIDE.rea })
    }
    if (op === "imports" && target.format !== "pe") {
      return errorEvidence({
        provider: "rea",
        source: op,
        targetSha256: sha,
        message: "REA's import tool (inspect_pe_imports) applies to PE files only. For ELF/Mach-O use the REA tool panel (e.g. list_names, inspect_native_exports) or the radare2 engine.",
      })
    }
    if (opts.session) {
      const opened = await ensureReaOpen(opts.session, absPath)
      if (opened?.kind === "error") return opened
    }
    const tool = REA_OP_TOOL[op]
    const args: Record<string, unknown> =
      op === "imports" ? { path: absPath } : op === "xrefs" ? { address: subject } : subject ? { procedure: subject } : {}
    try {
      const r = await reaCallTool(tool, args)
      ev = reaPayloadToEvidence({ payload: r.payload, isError: r.isError, kind: op, tool, targetSha256: sha, subject })
    } catch (e) {
      return errorEvidence({ provider: "rea", source: `REA MCP tools/call ${tool}`, targetSha256: sha, message: (e as Error).message })
    }
  }
  putCached(sha, engine, key, ev)
  return ev
}
