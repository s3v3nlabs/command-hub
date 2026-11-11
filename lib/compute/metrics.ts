/**
 * In-process latency / throughput metrics for the compute pool.
 * Ring buffer of recent samples — no external telemetry. HOLD_VYRNA_UNSYNC.
 */

const MAX_SAMPLES = 500
const samples: { t: number; ms: number; ok: boolean }[] = []
let requestsTotal = 0
let errorsTotal = 0

export function recordLatency(ms: number, ok: boolean): void {
  requestsTotal += 1
  if (!ok) errorsTotal += 1
  samples.push({ t: Date.now(), ms: Math.max(0, ms), ok })
  if (samples.length > MAX_SAMPLES) samples.splice(0, samples.length - MAX_SAMPLES)
}

export function getMetricsSnapshot(): {
  requestsTotal: number
  errorsTotal: number
  avgLatencyMs: number | null
  p95LatencyMs: number | null
  throughputPerMin: number
} {
  const okSamples = samples.filter((s) => s.ok && s.ms > 0)
  let avgLatencyMs: number | null = null
  let p95LatencyMs: number | null = null
  if (okSamples.length > 0) {
    const sum = okSamples.reduce((a, s) => a + s.ms, 0)
    avgLatencyMs = Math.round(sum / okSamples.length)
    const sorted = okSamples.map((s) => s.ms).sort((a, b) => a - b)
    const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))
    p95LatencyMs = sorted[idx] ?? null
  }
  const oneMinAgo = Date.now() - 60_000
  const recent = samples.filter((s) => s.t >= oneMinAgo && s.ok).length
  return {
    requestsTotal,
    errorsTotal,
    avgLatencyMs,
    p95LatencyMs,
    throughputPerMin: recent,
  }
}

export function __resetMetricsForTests(): void {
  samples.length = 0
  requestsTotal = 0
  errorsTotal = 0
}
