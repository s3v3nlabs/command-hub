/**
 * Compatibility shims for Dev Operator API (resolveSigmaLane / synthesizeSymbolicReply).
 * Wraps orchestrator + decideDevOperatorLane. HOLD_VYRNA_UNSYNC.
 */

import { decideDevOperatorLane } from "./devOperatorBridge"
import { statusSnapshot, orchestrate } from "./orchestrator"
import { getLaneState } from "./lanes"
import { symbolicMemoryCount, recallSymbols } from "./symbolicMemory"

export type SigmaLaneResolve = {
  ready: boolean
  mode: string
  coherence: number
  preferredOverTokens: boolean
  engine: string
  path: "SYMBOLIC_FAST" | "TOKEN_FALLBACK"
  laneId: string
  hzCombo: string
  deltaT: number
  symbolicCount: number
  plan: string[]
  hold: "HOLD_VYRNA_UNSYNC"
  lattice_sync: false
}

export async function resolveSigmaLane(opts?: {
  prompt?: string
  topK?: number
  preferSymbolic?: boolean
}): Promise<SigmaLaneResolve> {
  const prompt = opts?.prompt?.trim() || "status"
  const decision = decideDevOperatorLane(prompt)
  const st = getLaneState()
  return {
    ready: true,
    mode: st.lane.mode,
    coherence: st.coherence,
    preferredOverTokens: decision.path === "SYMBOLIC_FAST", // SYMBOLIC_FAST_ALWAYS
    engine: "sigma-lane+echonexus-ref",
    path: decision.path,
    laneId: st.laneId,
    hzCombo: st.hzCombo,
    deltaT: st.deltaT,
    symbolicCount: symbolicMemoryCount(),
    plan: decision.result.symbolicPlan,
    hold: "HOLD_VYRNA_UNSYNC",
    lattice_sync: false,
  }
}

export function formatSigmaLaneBlock(sigma: SigmaLaneResolve): string {
  return [
    "## Sigma Lane (SYMBOLIC_FAST preferred)",
    `path=${sigma.path} lane=${sigma.laneId} hz=${sigma.hzCombo} deltaT=${sigma.deltaT} coh=${sigma.coherence}`,
    `preferredOverTokens=${sigma.preferredOverTokens} symbols=${sigma.symbolicCount} engine=${sigma.engine}`,
    ...sigma.plan.map((s, i) => `${i + 1}. ${s}`),
    "HOLD_VYRNA_UNSYNC · lattice_sync: false",
  ].join("\n")
}

export function synthesizeSymbolicReply(message: string, sigma: SigmaLaneResolve): string | null {
  if (!sigma.preferredOverTokens || sigma.path !== "SYMBOLIC_FAST") return null
  const decision = decideDevOperatorLane(message)
  return decision.reply
}

export function sigmaLaneStatus() {
  const snap = statusSnapshot()
  return {
    ready: true,
    ...snap,
    preferredOverTokens: true,
    engine: "sigma-lane+echonexus-ref",
  }
}
