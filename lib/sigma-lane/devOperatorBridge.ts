/**
 * Dev Operator bridge into Sigma-lane.
 * Call BEFORE any tokenized S3v3n / Twin reply.
 * Prefer SYMBOLIC_FAST; TOKEN_FALLBACK only when orchestrate says so.
 * HOLD_VYRNA_UNSYNC · lattice_sync: false
 */

import { orchestrate, type OrchestrateResult, statusSnapshot, learnFromTask } from "./orchestrator"
import { resolveHemispheres, type HemisphereSnapshot } from "./hemispheres"
import { pulseMathStatus, phiIntervalMs } from "./pulseMath"

export type DevOperatorLaneDecision = {
  hemispheres: HemisphereSnapshot
  pulseMs: number
  preferSymbolic: boolean
  path: OrchestrateResult["path"]
  reply: string | null
  contextBlock: string
  result: OrchestrateResult
  hold: "HOLD_VYRNA_UNSYNC"
  lattice_sync: false
}

/** Run sigma-lane first; return symbolic reply when path is SYMBOLIC_FAST. */
export function decideDevOperatorLane(prompt: string): DevOperatorLaneDecision {
  const result = orchestrate({ task: prompt })
  const preferSymbolic = result.path === "SYMBOLIC_FAST" // addendum: always prefer symbolic when path is SYMBOLIC_FAST

  const contextBlock = [
    "## Sigma-lane (preferred over tokenized LLM)",
    `path=${result.path} lane=${result.laneId} hz=${result.hzCombo} deltaT=${result.deltaT}`,
    `symbols=${result.symbolicCount} drift=${result.drift.severity}`,
    "",
    "### Symbolic plan",
    ...result.symbolicPlan.map((s, i) => `${i + 1}. ${s}`),
    "",
    result.tokenFallbackHint ? `tokenFallbackHint: ${result.tokenFallbackHint}` : "tokenFallback: not required",
    "",
    "HOLD_VYRNA_UNSYNC · lattice_sync: false",
  ].join("\n")

  let reply: string | null = null
  if (preferSymbolic) {
    reply = [
      "⚡ Sigma-lane SYMBOLIC_FAST (preferred over tokenized LLM)",
      `lane=${result.laneId} · hz=${result.hzCombo} · deltaT=${result.deltaT}`,
      "",
      "Symbolic plan:",
      ...result.symbolicPlan.map((s, i) => `${i + 1}. ${s}`),
      "",
      "Defensive next steps:",
      "- Module Bay `/modules` — register or stub module.json",
      "- Proposals under `modules/proposals/` (no silent Ghostlight overwrite)",
      "- BIG intel → POST `/api/hive` kind=intel (learn + whisper)",
      "- Privacy Fortress persist for encrypted lessons",
      "",
      `Intent echo: ${prompt.slice(0, 280)}`,
      "",
      "HOLD_VYRNA_UNSYNC · lattice_sync: false · no exploit generation",
    ].join("\n")
  }

  const hemispheres = resolveHemispheres({ prompt, path: result.path })
  return {
    preferSymbolic,
    path: result.path,
    reply,
    contextBlock,
    result,
    hemispheres,
    pulseMs: phiIntervalMs(89, hemispheres.dominant === "right" ? 3 : 2),
    hold: "HOLD_VYRNA_UNSYNC",
    lattice_sync: false,
  }
}

export function sigmaLaneDevStatus() {
  const hemispheres = resolveHemispheres({})
  return {
    ...statusSnapshot(),
    bridge: "devOperatorBridge.decideDevOperatorLane",
    principle: "SYMBOLIC_FAST_ALWAYS",
    hemispheres,
    pulse: pulseMathStatus(),
    pulseMs: phiIntervalMs(89, 2),
  }
}

/** Optional: store a confirmed lesson glyph into symbolic memory. */
export function rememberDevOperatorLesson(glyph: string, lesson: string, tags?: string[]) {
  return learnFromTask({
    glyph: glyph.slice(0, 64) || "dev-op",
    lesson: lesson.slice(0, 800),
    tags: tags || ["dev-operator"],
  })
}
