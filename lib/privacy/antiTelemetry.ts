/**
 * Anti-telemetry helpers for S3v3n / reclaim UI.
 * Defensive only: strip analytics, refuse body logging, block known beacon patterns.
 * No offense / no malware / no unauthorized access tooling.
 */

const ANALYTICS_HOST_FRAGMENTS = [
  "google-analytics",
  "googletagmanager",
  "analytics.google",
  "segment.io",
  "segment.com",
  "mixpanel",
  "amplitude",
  "sentry.io",
  "fullstory",
  "hotjar",
  "clarity.ms",
  "posthog",
  "heap.io",
  "newrelic",
  "datadoghq",
  "bugsnag",
  "logrocket",
] as const

const BODY_KEYS = [
  "prompt",
  "response",
  "messages",
  "content",
  "text",
  "body",
  "transcript",
  "completion",
] as const

/** True when URL looks like a third-party analytics / beacon endpoint. */
export function isAnalyticsUrl(url: string): boolean {
  const lower = url.toLowerCase()
  return ANALYTICS_HOST_FRAGMENTS.some((f) => lower.includes(f))
}

/** Strip known analytics keys from a shallow config / headers object (ADD-ONLY sanitize). */
export function stripAnalyticsHeaders(
  headers: Record<string, string> | undefined,
): Record<string, string> {
  if (!headers) return {}
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(headers)) {
    const key = k.toLowerCase()
    if (key.startsWith("x-analytics") || key === "x-client-data" || key.includes("telemetry")) {
      continue
    }
    out[k] = v
  }
  return out
}

/**
 * Safe console logger — never prints prompt/response bodies.
 * Use for panel / API error paths instead of console.log(payload).
 */
export function safeLog(
  level: "info" | "warn" | "error",
  message: string,
  meta?: Record<string, unknown>,
): void {
  const slim: Record<string, unknown> = {}
  if (meta) {
    for (const [k, v] of Object.entries(meta)) {
      const lk = k.toLowerCase()
      if (BODY_KEYS.some((b) => lk.includes(b))) {
        slim[k] = "[redacted-body]"
        continue
      }
      if (typeof v === "string" && v.length > 200) {
        slim[k] = `${v.slice(0, 40)}…[${v.length} chars]`
        continue
      }
      slim[k] = v
    }
  }
  const line = Object.keys(slim).length ? `${message} ${JSON.stringify(slim)}` : message
  if (level === "error") console.error(line)
  else if (level === "warn") console.warn(line)
  else console.info(line)
}

/** Refuse writing bodies to shared/analytics sinks — returns false if attempt looks like telemetry. */
export function refuseBodyLogging(target: string, payloadPreview?: string): boolean {
  if (isAnalyticsUrl(target)) return false
  if (payloadPreview && BODY_KEYS.some((b) => payloadPreview.toLowerCase().includes(`"${b}"`))) {
    // Local vault persist is handled separately (encrypted); this blocks network beacons.
    if (/^https?:\/\//i.test(target) && !/127\.0\.0\.1|localhost/i.test(target)) {
      return false
    }
  }
  return true
}

export const TELEMETRY_POLICY = {
  analytics: "OFF" as const,
  bodyLogging: "REFUSED" as const,
  consoleBodies: false,
  networkBeacons: false,
  hold: "HOLD_VYRNA_UNSYNC" as const,
}
