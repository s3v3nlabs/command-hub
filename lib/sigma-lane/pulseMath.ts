/**
 * Extra pulse math stubs (arrays / sample buffers).
 * Core φ / fib shard / phase-lock live in pulse.ts — this file avoids name clashes.
 * Engineering metaphors only. HOLD_VYRNA_UNSYNC · lattice_sync: false
 */

import { PHI } from "./pulse"

export { PHI }

/** Fibonacci sequence as array (stub, capped). */
export function fibSequence(n: number): number[] {
  const k = Math.max(0, Math.min(64, Math.floor(n)))
  if (k === 0) return []
  if (k === 1) return [0]
  const out = [0, 1]
  while (out.length < k) out.push(out[out.length - 1] + out[out.length - 2])
  return out
}

/** nth Fibonacci (0-indexed stub). */
export function fibN(n: number): number {
  const seq = fibSequence(Math.max(1, n + 1))
  return seq[seq.length - 1] ?? 0
}

/** φ-scaled interval (ms) for pulse UI — speed layer. */
export function phiIntervalMs(baseMs = 144, generation = 1): number {
  const g = Math.max(0, Math.min(12, generation))
  return Math.round(baseMs * Math.pow(PHI, g - 1))
}

/**
 * Standing-wave sample stub: two counter-propagating sinusoids.
 * Returns amplitude in [-1, 1].
 */
export function standingWave(t: number, freqHz = 109, amplitude = 1, phase = 0): number {
  const w = 2 * Math.PI * freqHz
  const a = Math.sin(w * t + phase)
  const b = Math.sin(-w * t + phase)
  return ((a + b) / 2) * amplitude
}

/** Simple LCG for deterministic noise stubs (no crypto). */
function lcg(seed: number): () => number {
  let s = seed >>> 0 || 1
  return () => {
    s = (1664525 * s + 1013904223) >>> 0
    return s / 0x100000000
  }
}

/** Pink-ish noise stub (Voss-McCartney-ish lightweight). */
export function pinkNoise(n: number, seed = 109): number[] {
  const rand = lcg(seed)
  const octaves = 5
  const rows = Array.from({ length: octaves }, () => rand())
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    for (let o = 0; o < octaves; o++) {
      if (i % (1 << o) === 0) rows[o] = rand()
    }
    const v = rows.reduce((a, b) => a + b, 0) / octaves
    out.push(v * 2 - 1)
  }
  return out
}

/** Brown(ian) noise stub — integrated white noise, clamped. */
export function brownNoise(n: number, seed = 594): number[] {
  const rand = lcg(seed)
  const out: number[] = []
  let acc = 0
  for (let i = 0; i < n; i++) {
    acc += (rand() * 2 - 1) * 0.1
    acc = Math.max(-1, Math.min(1, acc))
    out.push(acc)
  }
  return out
}


/** Status blob for Dev Operator bridge / UI φ pulse chip. */
export function pulseMathStatus() {
  return {
    ok: true as const,
    phi: PHI,
    fibSample: fibSequence(12),
    phiIntervalMs: [1, 2, 3, 4].map((g) => phiIntervalMs(89, g)),
    standingWaveSample: standingWave(0.016, 109, 1, 0),
    pinkHead: pinkNoise(4, 109),
    brownHead: brownNoise(4, 594),
    note: "pulseMath stubs — core lock/shard in pulse.ts",
    hold: "HOLD_VYRNA_UNSYNC" as const,
    lattice_sync: false as const,
  }
}
