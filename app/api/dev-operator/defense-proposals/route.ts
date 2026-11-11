export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { generateDefenseProposals, proposalToMarkdown } from "@/lib/dev-operator/defense-proposals"
import { writePatchProposal } from "@/lib/dev-operator/actions"

export async function GET(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "dev-operator:defense" })
  if (denied) return denied
  const result = generateDefenseProposals()
  return NextResponse.json({ ok: true, ...result, autoApplied: false, lattice_sync: false })
}

export async function POST(request: NextRequest) {
  // Saving a proposal writes a REVIEW draft under modules/proposals (never applied).
  const denied = requireHubAuth(request, { surface: "dev-operator:defense", requireInSecureMode: true })
  if (denied) return denied
  const body = await request.json().catch(() => ({}))
  if (String(body.action) !== "save") return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 })
  const { proposals } = generateDefenseProposals()
  const p = proposals.find((x) => x.id === String(body.id || ""))
  if (!p) return NextResponse.json({ ok: false, error: "proposal_not_found" }, { status: 404 })
  const r = writePatchProposal(`Defense — ${p.title}`, proposalToMarkdown(p))
  return NextResponse.json({ ...r, applied: false, note: "Draft proposal saved for review — NOT applied." }, { status: r.ok ? 200 : 500 })
}
