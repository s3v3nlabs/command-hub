/**
 * Discrete Fourier analysis of an attack-event time series.
 * Pure JS radix-2 Cooley–Tukey when N is a power of 2; otherwise DFT.
 * Identifies dominant periodic components — MODEL hints, not certainties.
 */

import type { AttackEvent, FourierPeak, FourierResult } from "./types"

function nextPow2(n: number): number {
  let p = 1
  while (p < n) p <<= 1
  return p
}

function fft(re: number[], im: number[]): void {
  const n = re.length
  // bit-reverse
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      ;[re[i], re[j]] = [re[j], re[i]]
      ;[im[i], im[j]] = [im[j], im[i]]
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len
    const wlenRe = Math.cos(ang)
    const wlenIm = Math.sin(ang)
    for (let i = 0; i < n; i += len) {
      let wRe = 1
      let wIm = 0
      for (let j = 0; j < len / 2; j++) {
        const uRe = re[i + j]
        const uIm = im[i + j]
        const vRe = re[i + j + len / 2] * wRe - im[i + j + len / 2] * wIm
        const vIm = re[i + j + len / 2] * wIm + im[i + j + len / 2] * wRe
        re[i + j] = uRe + vRe
        im[i + j] = uIm + vIm
        re[i + j + len / 2] = uRe - vRe
        im[i + j + len / 2] = uIm - vIm
        const nextWRe = wRe * wlenRe - wIm * wlenIm
        wIm = wRe * wlenIm + wIm * wlenRe
        wRe = nextWRe
      }
    }
  }
}

/** Bin events into a uniform histogram of `bins` samples spanning [tMin, tMax]. */
export function eventsToSeries(events: AttackEvent[], bins = 64): { series: number[]; dt: number } {
  if (!events.length) return { series: Array.from({ length: bins }, () => 0), dt: 1 }
  const ts = events.map((e) => e.t)
  const tMin = Math.min(...ts)
  const tMax = Math.max(...ts)
  const span = Math.max(1, tMax - tMin)
  const series = Array.from({ length: bins }, () => 0)
  for (const e of events) {
    const idx = Math.min(bins - 1, Math.floor(((e.t - tMin) / span) * bins))
    series[idx] += e.weight ?? 1
  }
  return { series, dt: span / bins }
}

export function analyzeFourier(events: AttackEvent[], bins = 64): FourierResult {
  const { series, dt } = eventsToSeries(events, bins)
  const n = nextPow2(Math.max(8, series.length))
  const re = Array.from({ length: n }, (_, i) => series[i] || 0)
  const im = Array.from({ length: n }, () => 0)
  // remove DC mean for clearer peaks
  const mean = re.reduce((a, b) => a + b, 0) / n
  for (let i = 0; i < n; i++) re[i] -= mean
  fft(re, im)

  const spectrum: Array<{ frequency: number; magnitude: number }> = []
  const half = n / 2
  for (let k = 1; k < half; k++) {
    const mag = Math.sqrt(re[k] * re[k] + im[k] * im[k]) / n
    const freq = k / (n * dt) // cycles per time-unit
    spectrum.push({ frequency: Number(freq.toFixed(6)), magnitude: Number(mag.toFixed(6)) })
  }
  spectrum.sort((a, b) => b.magnitude - a.magnitude)
  const peaks: FourierPeak[] = spectrum.slice(0, 5).map((s) => ({
    frequency: s.frequency,
    magnitude: s.magnitude,
    periodHint: s.frequency > 0 ? Number((1 / s.frequency).toFixed(3)) : undefined,
  }))

  return {
    sampleCount: events.length,
    peaks,
    spectrum: spectrum.slice(0, 32),
    note: "Dominant Fourier components of the binned attack time series. Period hints are modeled under uniform binning — not a guarantee of periodicity.",
  }
}
