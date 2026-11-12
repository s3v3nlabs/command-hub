
/**
 * Live breach-catalog lookups. Domain queries hit the public HIBP breaches
 * endpoint (no API key required — metadata about breached *sites*, not
 * individual accounts). Email queries use XposedOrNot's free API when
 * reachable, and HIBP breachedaccount only when HIBP_API_KEY is set.
 * Never returns a hardcoded breach list.
 */
import { liveFetch } from "./http"

export interface BreachRow {
  id: string
  service: string
  breachDate: string
  leakedData: string[]
  affectedAccounts: number
  verified: boolean
  domain?: string
  description?: string
  source: string
}

function asHibp(b: Record<string, unknown>, source: string): BreachRow {
  return {
    id: String(b.Name || b.Title || b.Domain || "unknown"),
    service: String(b.Title || b.Name || "unknown"),
    breachDate: String(b.BreachDate || b.AddedDate || ""),
    leakedData: Array.isArray(b.DataClasses) ? (b.DataClasses as string[]) : [],
    affectedAccounts: Number(b.PwnCount || 0),
    verified: Boolean(b.IsVerified),
    domain: b.Domain ? String(b.Domain) : undefined,
    description: b.Description ? String(b.Description).replace(/<[^>]+>/g, "").slice(0, 400) : undefined,
    source,
  }
}

export async function lookupLeaks(query: string): Promise<{
  ok: true
  query: string
  kind: "email" | "domain" | "other"
  backend: string
  live: true
  breaches: BreachRow[]
  notes: string[]
  error?: string
}> {
  const q = (query || "").trim()
  const notes: string[] = []
  const breaches: BreachRow[] = []
  const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(q)
  const isDomain = !isEmail && /^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i.test(q)
  const kind = isEmail ? "email" : isDomain ? "domain" : "other"
  const backends: string[] = []

  if (isDomain || isEmail) {
    const domain = isEmail ? q.split("@")[1] : q
    const url = `https://haveibeenpwned.com/api/v3/breaches?domain=${encodeURIComponent(domain)}`
    const r = await liveFetch(url, { timeoutMs: 10_000, headers: { "hibp-api-version": "3" } })
    backends.push("HIBP /breaches?domain= (live, no key)")
    if (r.ok && Array.isArray(r.json)) {
      for (const b of r.json as Array<Record<string, unknown>>) breaches.push(asHibp(b, "Have I Been Pwned domain catalog (live)"))
      if (isEmail) notes.push("HIBP domain catalog lists breaches of that site, not confirmation that this mailbox was involved. An HIBP_API_KEY is required for per-account lookup.")
    } else if (r.status === 404) {
      notes.push(`HIBP has no domain-catalog breaches for ${domain}.`)
    } else {
      notes.push(`HIBP domain catalog: ${r.error || "HTTP " + r.status}`)
    }
  }

  if (isEmail) {
    const key = process.env.HIBP_API_KEY?.trim()
    if (key) {
      const url = `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(q)}?truncateResponse=false`
      const r = await liveFetch(url, { timeoutMs: 10_000, headers: { "hibp-api-key": key, "hibp-api-version": "3" } })
      backends.push("HIBP /breachedaccount (live, key present)")
      if (r.ok && Array.isArray(r.json)) {
        // replace domain-catalog rows with account-specific ones — those are the real answer
        breaches.length = 0
        for (const b of r.json as Array<Record<string, unknown>>) breaches.push(asHibp(b, "Have I Been Pwned account lookup (live)"))
      } else if (r.status === 404) {
        notes.push("HIBP account lookup: this email was not found in the corpus (HTTP 404).")
      } else {
        notes.push(`HIBP account lookup: ${r.error || "HTTP " + r.status}`)
      }
    } else {
      const url = `https://api.xposedornot.com/v1/check-email/${encodeURIComponent(q)}`
      const r = await liveFetch(url, { timeoutMs: 10_000 })
      backends.push("XposedOrNot /v1/check-email (live, no key)")
      if (r.ok && r.json && typeof r.json === "object") {
        const j = r.json as Record<string, unknown>
        const list =
          (Array.isArray(j.breaches) ? j.breaches : null) ||
          (j.Breaches && typeof j.Breaches === "object" && Array.isArray((j.Breaches as { breaches?: unknown }).breaches)
            ? ((j.Breaches as { breaches: unknown[] }).breaches)
            : null) ||
          (Array.isArray((j as { breachedSites?: unknown }).breachedSites) ? (j as { breachedSites: unknown[] }).breachedSites : null)
        if (Array.isArray(list)) {
          for (const item of list) {
            const name = Array.isArray(item) ? String(item[0]) : typeof item === "string" ? item : JSON.stringify(item)
            breaches.push({
              id: name,
              service: name,
              breachDate: "",
              leakedData: [],
              affectedAccounts: 0,
              verified: false,
              source: "XposedOrNot (live)",
            })
          }
        } else {
          notes.push(`XposedOrNot returned HTTP ${r.status} with no breach array. Raw keys: ${Object.keys(j).join(", ")}`)
        }
      } else {
        notes.push(`XposedOrNot: ${r.error || "HTTP " + r.status}. Set HIBP_API_KEY for official per-account lookup.`)
      }
    }
  }

  if (kind === "other") {
    notes.push("Enter an email or a domain. Other strings are not looked up.")
  }

  return {
    ok: true,
    query: q,
    kind,
    backend: backends.join(" + ") || "none",
    live: true,
    breaches,
    notes,
  }
}
