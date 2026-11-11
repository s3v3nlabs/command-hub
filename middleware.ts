import { NextResponse, type NextRequest } from "next/server"

/**
 * Edge middleware: security headers + lightweight attack-signature gate.
 * Detection events are POSTed to /api/security/ids/ingest (Node) so Heimdall IDS can persist them.
 * Full request-body inspection happens in Node route guards (Edge cannot read all bodies safely).
 */

const PATH_TRAVERSAL =
  /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c|%252e%252e%252f|\.\.%2f|\.\.%5c)/i
const XSS_PROBE = /(<\s*script[\s>]|javascript\s*:|onerror\s*=|onload\s*=)/i
const SQLI_PROBE = /(\bunion\b\s+\bselect\b|\bdrop\b\s+\btable\b)/i

function securityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Content-Type-Options", "nosniff")
  res.headers.set("X-Frame-Options", "DENY")
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  res.headers.set("X-DNS-Prefetch-Control", "off")
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next/dev needs eval; tighten in prod later
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss: http://127.0.0.1:* http://localhost:*",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  )
  if (process.env.NODE_ENV === "production") {
    res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
  }
  return res
}

function fireIngest(req: NextRequest, payload: Record<string, unknown>) {
  try {
    const url = new URL("/api/security/ids/ingest", req.nextUrl.origin)
    // fire-and-forget; Edge fetch to same origin
    void fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {})
  } catch {
    /* ignore */
  }
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  let hay = pathname + search
  try {
    hay = decodeURIComponent(hay)
  } catch {
    /* keep raw */
  }
  const reasons: string[] = []

  if (PATH_TRAVERSAL.test(hay)) reasons.push("path_traversal_signature")
  if (XSS_PROBE.test(hay)) reasons.push("xss_probe_signature")
  if (SQLI_PROBE.test(hay)) reasons.push("sqli_probe_signature")

  if (reasons.length > 0 && pathname.startsWith("/api/")) {
    fireIngest(req, {
      severity: reasons.includes("path_traversal_signature") ? "high" : "medium",
      source: "heimdall-edge-middleware",
      message: `Detected [${reasons.join(", ")}] on ${req.method} ${pathname}`,
      blocked: true,
    })
    const res = NextResponse.json(
      { ok: false, error: "blocked_by_heimdall", reasons },
      { status: 403 },
    )
    return securityHeaders(res)
  }

  return securityHeaders(NextResponse.next())
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|data-packs/).*)"],
}
