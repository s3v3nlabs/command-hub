/** Redact secret-shaped strings from vault snippets before they leave the hub API. */
export function scrubVaultText(text: string, max = 800): string {
  return text
    .replace(/sk-[a-zA-Z0-9_-]{10,}/g, "[redacted]")
    .replace(/-----BEGIN[\s\S]*?-----END[^-]+-----/g, "[redacted-pem]")
    .replace(/\b(wg|wireguard)[^\n]{0,80}/gi, "[redacted-wg]")
    .replace(/\bPSID[=:\s][^\s\n]{4,}/gi, "[redacted-psid]")
    .replace(/\b(api[_-]?key|token|secret|password)\s*[:=]\s*\S+/gi, "$1=[redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, "Bearer [redacted]")
    .slice(0, max)
}

export function scrubHit<T extends Record<string, unknown>>(hit: T): T {
  const out: Record<string, unknown> = { ...hit }
  for (const key of ["snip", "text", "snippet", "title"]) {
    if (typeof out[key] === "string") out[key] = scrubVaultText(out[key] as string, key === "text" ? 4000 : 800)
  }
  return out as T
}
