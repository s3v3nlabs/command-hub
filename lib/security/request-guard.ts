/**
 * Request-level Heimdall / IDS guard.
 * Detects common OWASP attack signatures on inbound /api traffic,
 * records them into the local IDS event ring, and optionally blocks.
 *
 * HOLD_VYRNA_UNSYNC — honest local signals only.
 */

import path from "path"
import { recordIdsThreat, type IdsSeverity } from "@/lib/security/ids-status"

export type GuardVerdict = {
  blocked: boolean
  reasons: string[]
  severity: IdsSeverity
}

const PATH_TRAVERSAL =
  /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c|%252e%252e%252f|\.\.%2f|\.\.%5c)/i
const CMD_INJECTION =
  /(;|\||`|\$\(|&&|\n|\r|\$\{)\s*(rm|cat|curl|wget|bash|sh|python|perl|nc|ncat|powershell|cmd\.exe|adb\s)/i
const SSRF_INTERNAL =
  /(?:^|[^\d])(127\.0\.0\.1|0\.0\.0\.0|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|169\.254\.\d{1,3}\.\d{1,3}|\[?::1\]?|localhost|metadata\.google\.internal|169\.254\.169\.254)/i
const XSS_PROBE =
  /(<\s*script[\s>]|javascript\s*:|onerror\s*=|onload\s*=|<\s*img[\s>]+[^>]*on\w+\s*=)/i
const SQLI_PROBE =
  /(\bunion\b\s+\bselect\b|\bor\b\s+1\s*=\s*1|\bdrop\b\s+\btable\b|;?\s*--|\/\*!\d+)/i
const PROTOTYPE_POLLUTION = /(__proto__|constructor\s*\[|prototype\s*\[)/i

export function inspectRequest(input: {
  method: string
  pathname: string
  search: string
  bodySnippet?: string
}): GuardVerdict {
  const hay = `${input.pathname}?${input.search}\n${input.bodySnippet || ""}`
  const reasons: string[] = []
  let severity: IdsSeverity = "info"

  const bump = (s: IdsSeverity, reason: string) => {
    reasons.push(reason)
    const order: IdsSeverity[] = ["info", "low", "medium", "high", "critical"]
    if (order.indexOf(s) > order.indexOf(severity)) severity = s
  }

  if (PATH_TRAVERSAL.test(hay)) bump("high", "path_traversal_signature")
  if (CMD_INJECTION.test(hay)) bump("critical", "command_injection_signature")
  if (SSRF_INTERNAL.test(hay) && /url|target|host|endpoint|proxy|fetch/i.test(hay)) {
    bump("high", "ssrf_internal_target_signature")
  }
  if (XSS_PROBE.test(hay)) bump("medium", "xss_probe_signature")
  if (SQLI_PROBE.test(hay)) bump("high", "sqli_probe_signature")
  if (PROTOTYPE_POLLUTION.test(hay)) bump("high", "prototype_pollution_signature")

  if (/^\/api\/adb\//i.test(input.pathname) && input.method !== "GET") {
    bump("high", "adb_mutating_api_probe")
  }
  if (/^\/api\/dimm-drive/i.test(input.pathname) && /destroy/i.test(hay)) {
    bump("critical", "dimm_destroy_probe")
  }

  const blocked =
    reasons.includes("command_injection_signature") ||
    reasons.includes("path_traversal_signature") ||
    reasons.includes("ssrf_internal_target_signature") ||
    reasons.includes("dimm_destroy_probe") ||
    ((process.env.SECURE_MODE === "1" || process.env.SECURE_MODE === "true") && reasons.length > 0)

  if (reasons.length > 0) {
    recordIdsThreat({
      severity,
      source: "heimdall-request-guard",
      message: `Detected [${reasons.join(", ")}] on ${input.method} ${input.pathname}`,
      blocked,
      meta: { method: input.method, pathname: input.pathname },
    })
  }

  return { blocked, reasons, severity }
}

/** Jail a user-supplied relative path under a base directory. Throws on escape. */
export function jailPath(baseDir: string, rel: string): string {
  if (!rel || rel.includes("\0")) throw new Error("path_escape_blocked")
  const cleaned = String(rel).replace(/^\/+/, "").replace(/\\/g, "/")
  if (cleaned.includes("..") || cleaned.startsWith("/")) throw new Error("path_escape_blocked")
  const root = path.resolve(baseDir)
  const abs = path.resolve(root, cleaned)
  if (!abs.startsWith(root + path.sep) && abs !== root) throw new Error("path_escape_blocked")
  return abs
}

/** Block SSRF to link-local / loopback / RFC1918 / cloud metadata. */
export function assertSafeOutboundUrl(raw: string, allowHosts?: string[]): void {
  let u: URL
  try {
    u = new URL(raw)
  } catch {
    throw new Error("invalid_url")
  }
  if (!["http:", "https:"].includes(u.protocol)) throw new Error("url_scheme_blocked")
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, "")
  if (allowHosts && allowHosts.length > 0) {
    const ok = allowHosts.some(
      (h) => host === h.toLowerCase() || host.endsWith("." + h.toLowerCase()),
    )
    if (!ok) throw new Error("url_host_not_allowlisted")
    return
  }
  if (
    host === "localhost" ||
    host === "metadata.google.internal" ||
    host.endsWith(".internal") ||
    host === "0.0.0.0"
  ) {
    throw new Error("ssrf_blocked")
  }
  const m = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (m) {
    const a = Number(m[1])
    const b = Number(m[2])
    if (
      a === 127 ||
      a === 10 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 192 && b === 168) ||
      (a === 172 && b >= 16 && b <= 31)
    ) {
      throw new Error("ssrf_blocked")
    }
  }
  if (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80")) {
    throw new Error("ssrf_blocked")
  }
}
