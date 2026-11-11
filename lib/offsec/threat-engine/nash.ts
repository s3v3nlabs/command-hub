/**
 * Mixed-strategy Nash approximation for a finite zero-sum attacker/defender game
 * via fictitious play. Exact for 2x2; iterative for larger matrices.
 *
 * Output is a MODEL of preferred mixed strategies under the supplied payoff
 * matrix — not a prediction that either side will play them.
 */

import type { NashAction, NashResult } from "./types"

function zeros(n: number): number[] {
  return Array.from({ length: n }, () => 0)
}

/** Best-response index for a row player given column mixture q (len = cols). */
function bestRow(payoff: number[][], q: number[]): number {
  let best = 0
  let bestVal = -Infinity
  for (let i = 0; i < payoff.length; i++) {
    let v = 0
    for (let j = 0; j < q.length; j++) v += payoff[i][j] * q[j]
    if (v > bestVal) {
      bestVal = v
      best = i
    }
  }
  return best
}

/** Best-response index for a column player (minimizer) given row mixture p. */
function bestCol(payoff: number[][], p: number[]): number {
  const cols = payoff[0]?.length || 0
  let best = 0
  let bestVal = Infinity
  for (let j = 0; j < cols; j++) {
    let v = 0
    for (let i = 0; i < p.length; i++) v += payoff[i][j] * p[i]
    if (v < bestVal) {
      bestVal = v
      best = j
    }
  }
  return best
}

function normalize(counts: number[]): number[] {
  const s = counts.reduce((a, b) => a + b, 0) || 1
  return counts.map((c) => c / s)
}

function valueOf(payoff: number[][], p: number[], q: number[]): number {
  let v = 0
  for (let i = 0; i < p.length; i++) {
    for (let j = 0; j < q.length; j++) v += p[i] * q[j] * payoff[i][j]
  }
  return v
}

export function solveMixedNash(
  payoff: number[][],
  attacker: NashAction[],
  defender: NashAction[],
  iterations = 4000,
): NashResult {
  const rows = payoff.length
  const cols = payoff[0]?.length || 0
  if (!rows || !cols || attacker.length !== rows || defender.length !== cols) {
    throw new Error("payoff dimensions must match action lists")
  }

  // Fictitious play
  const rowCounts = zeros(rows)
  const colCounts = zeros(cols)
  rowCounts[0] = 1
  colCounts[0] = 1

  for (let t = 0; t < iterations; t++) {
    const q = normalize(colCounts)
    const p = normalize(rowCounts)
    const i = bestRow(payoff, q)
    const j = bestCol(payoff, p)
    rowCounts[i] += 1
    colCounts[j] += 1
  }

  const p = normalize(rowCounts)
  const q = normalize(colCounts)
  const attackerMixed: Record<string, number> = {}
  const defenderMixed: Record<string, number> = {}
  attacker.forEach((a, i) => {
    attackerMixed[a.id] = Number(p[i].toFixed(4))
  })
  defender.forEach((d, j) => {
    defenderMixed[d.id] = Number(q[j].toFixed(4))
  })

  return {
    attackerMixed,
    defenderMixed,
    value: Number(valueOf(payoff, p, q).toFixed(4)),
    iterations,
    note: "Modeled mixed-strategy equilibrium via fictitious play under the supplied payoff matrix. Not a forecast of live play.",
  }
}

export const DEFAULT_ATTACKER: NashAction[] = [
  { id: "recon", label: "Recon / scan" },
  { id: "phish", label: "Initial access (phish)" },
  { id: "exploit", label: "Exploit exposed service" },
  { id: "lateral", label: "Lateral movement" },
]

export const DEFAULT_DEFENDER: NashAction[] = [
  { id: "monitor", label: "Monitor / detect" },
  { id: "patch", label: "Patch / harden" },
  { id: "isolate", label: "Isolate / contain" },
  { id: "hunt", label: "Active hunt" },
]

/** Illustrative payoff: attacker utility. Replace with engagement-specific scores. */
export const DEFAULT_PAYOFF: number[][] = [
  //            monitor  patch  isolate hunt
  /* recon   */ [0.2, 0.4, 0.5, 0.1],
  /* phish   */ [0.5, 0.3, 0.2, 0.35],
  /* exploit */ [0.6, 0.15, 0.25, 0.4],
  /* lateral */ [0.45, 0.25, 0.1, 0.55],
]
