export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { getSession } from "@/lib/offsec/re-workbench/session"
import { resolveTarget } from "@/lib/offsec/re-workbench/targets"
import { reaCallTool, reaConfig, reaListTools } from "@/lib/offsec/re-workbench/rea-client"
import { ensureReaOpen, reaPayloadToEvidence } from "@/lib/offsec/re-workbench/analyze"
import { errorEvidence } from "@/lib/offsec/re-workbench/evidence"
import { classifyReaTool, dynamicStage1Enabled, scopeTargetFor } from "@/lib/offsec/re-workbench/policy"
import { argsPathViolation } from "@/lib/offsec/re-workbench/guard"
import { enforceLadder } from "@/lib/offsec/scope-ladder"

/** List REA's live tool catalog with the workbench's static/dynamic classification. */
export async function GET(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "offsec:re", requireInSecureMode: true })
  if (denied) return denied
  if (reaConfig().mode === "none") {
    return NextResponse.json({ ok: false, configured: false, error: "REA MCP server not configured: set REA_MCP_COMMAND or REA_MCP_URL." })
  }
  try {
    const tools = await reaListTools()
    return NextResponse.json({
      ok: true,
      configured: true,
      tools: tools.map((t) => ({ name: t.name, description: (t.description || "").slice(0, 400), inputSchema: t.inputSchema, class: classifyReaTool(t.name) })),
    })
  } catch (e) {
    return NextResponse.json({ ok: false, configured: true, error: (e as Error).message }, { status: 502 })
  }
}

/**
 * Call any REA tool against the session's target. Static allowlisted tools run
 * directly; everything else is DYNAMIC and must pass the staged ladder
 * (RE_DYNAMIC_ENABLED + active scope authorizing sha256:<target> + attestation).
 */
export async function POST(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "offsec:re", requireInSecureMode: true })
  if (denied) return denied
  const body = await request.json().catch(() => ({}))
  const tool = String(body.tool || "")
  if (!/^[a-z0-9_]{2,80}$/.test(tool)) return NextResponse.json({ ok: false, error: "invalid tool name" }, { status: 400 })
  const args = body.args && typeof body.args === "object" && !Array.isArray(body.args) ? (body.args as Record<string, unknown>) : {}
  const session = getSession()
  if (!session || session.engine !== "rea") {
    return NextResponse.json({ ok: false, error: "provider_mismatch: bind the REA engine to a target first (one provider per session)" }, { status: 409 })
  }
  const resolved = resolveTarget(session.targetSha256)
  if (!resolved) return NextResponse.json({ ok: false, error: "bound target no longer exists" }, { status: 404 })
  const pathErr = argsPathViolation(args)
  if (pathErr) return NextResponse.json({ ok: false, error: pathErr }, { status: 400 })

  const cls = classifyReaTool(tool)
  if (cls === "dynamic") {
    const gate = enforceLadder({
      capability: `re:rea:${tool}`,
      scopeId: body.scopeId ? String(body.scopeId) : null,
      target: scopeTargetFor(resolved.target.sha256),
      attestation: String(body.attestation || ""),
      stage1Enabled: dynamicStage1Enabled(),
      operator: body.operator ? String(body.operator).slice(0, 160) : undefined,
    })
    if (gate.blocked) {
      return NextResponse.json(
        {
          ok: false,
          gated: true,
          class: cls,
          stage: gate.check.stage,
          error: gate.check.reason,
          howToUnlock: [
            "Stage 1: set RE_DYNAMIC_ENABLED=1 on an isolated analysis host (VM/sandbox — never your daily driver).",
            `Stage 2: create + activate an engagement scope whose authorizedTargets includes ${scopeTargetFor(resolved.target.sha256)}.`,
            'Stage 3: send scopeId + attestation "authorized under scope <id>". Every attempt is hash-chain audit-logged.',
          ],
        },
        { status: 403 },
      )
    }
  }
  if (tool !== "open_binary" && tool !== "binary_session") {
    const opened = await ensureReaOpen(session, resolved.absPath)
    if (opened?.kind === "error") return NextResponse.json({ ok: false, class: cls, evidence: opened }, { status: 502 })
  }
  try {
    const r = await reaCallTool(tool, args)
    const evidence = reaPayloadToEvidence({ payload: r.payload, isError: r.isError, kind: "rea_tool", tool, targetSha256: resolved.target.sha256, subject: typeof args.procedure === "string" ? args.procedure : undefined })
    if (cls === "dynamic") evidence.limitations.push("DYNAMIC tool: ran under an attested engagement scope; may have launched processes or touched devices.")
    return NextResponse.json({ ok: evidence.kind !== "error", class: cls, evidence })
  } catch (e) {
    return NextResponse.json({ ok: false, class: cls, evidence: errorEvidence({ provider: "rea", source: `REA MCP tools/call ${tool}`, targetSha256: resolved.target.sha256, message: (e as Error).message }) }, { status: 502 })
  }
}
