/**
 * Dev Operator → autonomous DEFENSE proposals.
 *
 * Watches Heimdall (IDS ring + deception mesh), clusters observed attack
 * patterns, and drafts DEFENSIVE hardening proposals for operator review.
 *
 * STRICTLY DEFENSIVE + HONEST:
 *   - proposals are NEVER auto-applied — they are drafts the operator reviews
 *   - no exploit / PoC / offensive payload generation
 *   - respects HOLD_VYRNA_UNSYNC (lattice_sync never claimed)
 *   - respects HOLD_VYRNA_UNSYNC gate: when process.env.HOLD_VYRNA_UNSYNC is
 *     forced off is NOT possible — the hub holds it; this module only reads.
 *   - rule-based + deterministic (no fabricated findings); if a local model is
 *     wired it may enrich, but absence degrades honestly to the rule set.
 */

import { buildIdsStatus } from "@/lib/security/ids-status"
import { listEvents as listDeceptionEvents } from "@/lib/offsec/deception/store"
import { mapTextToTechniques } from "@/lib/offsec/report/attack-map"

export interface DefenseProposal {
  id: string
  title: string
  severity: "info" | "low" | "medium" | "high" | "critical"
  pattern: string
  observedCount: number
  lastSeen?: string
  techniques: string[]
  rationale: string
  /** Defensive change sketch (markdown) — proposal only, operator-applied. */
  suggestedChange: string
  autoApplied: false
}

interface Rule {
  id: string
  match: RegExp
  title: string
  severity: DefenseProposal["severity"]
  technique?: string
  rationale: string
  suggestedChange: string
}

// Signature/pattern -> DEFENSIVE proposal. Defensive remediations only.
const RULES: Rule[] = [
  {
    id: "sqli",
    match: /sqli|sql injection|union\s+select|or\s+1\s*=\s*1/i,
    title: "Harden against SQL injection",
    severity: "high",
    technique: "T1190",
    rationale: "SQLi-style signatures observed against the hub's surfaces.",
    suggestedChange:
      "- Use parameterized queries / prepared statements everywhere (no string concatenation).\n- Add server-side input validation + allowlist types.\n- Confirm `lib/security/request-guard.ts` SQLI_PROBE still covers the observed payloads; extend if new variants appear.\n- Consider a WAF rule for the affected routes.",
  },
  {
    id: "path-traversal",
    match: /path_traversal|\.\.\/|%2e%2e/i,
    title: "Close path-traversal exposure",
    severity: "high",
    technique: "T1083",
    rationale: "Path-traversal signatures observed.",
    suggestedChange:
      "- Route all file access through `jailPath(base, rel)` (lib/security/request-guard.ts).\n- Reject any path containing `..`, null bytes, or absolute prefixes.\n- Serve downloads by allowlisted id, not raw filename.",
  },
  {
    id: "cmd-injection",
    match: /command_injection|cmd_injection|;\s*(rm|cat|curl|wget|bash|sh)\b/i,
    title: "Eliminate command-injection vectors",
    severity: "critical",
    technique: "T1059",
    rationale: "Command-injection signatures observed.",
    suggestedChange:
      "- Replace shell string interpolation with `execFile`/`spawn` and argument arrays.\n- Allowlist permitted commands + arguments.\n- Never pass user input to a shell; validate + escape.",
  },
  {
    id: "xss",
    match: /xss|<script|onerror=|javascript:/i,
    title: "Add XSS output encoding + CSP",
    severity: "medium",
    technique: "T1059",
    rationale: "XSS probe signatures observed.",
    suggestedChange:
      "- Context-aware output encoding for all rendered user input.\n- Add a strict Content-Security-Policy (no inline scripts; nonce-based).\n- Sanitize rich text server-side.",
  },
  {
    id: "brute-force",
    match: /brute|password spray|failed login|credential stuffing/i,
    title: "Add rate limiting + lockout for auth",
    severity: "high",
    technique: "T1110",
    rationale: "Brute-force / password-spray patterns observed.",
    suggestedChange:
      "- Per-IP + per-account rate limiting with exponential backoff.\n- Account lockout + alerting on spray thresholds.\n- Prefer passkeys/MFA; log auth failures to the audit timeline.",
  },
  {
    id: "cred-dump",
    match: /mimikatz|lsass|credential dump|ntds/i,
    title: "Protect credential stores",
    severity: "high",
    technique: "T1003",
    rationale: "Credential-dumping indicators observed.",
    suggestedChange:
      "- Enable Credential Guard / restrict LSASS access on lab hosts.\n- Rotate exposed secrets; move secrets to the vault, never env plaintext.\n- Add detection for suspicious access to credential stores.",
  },
  {
    id: "ssrf",
    match: /ssrf|169\.254\.169\.254|metadata\.google/i,
    title: "Enforce SSRF guard on outbound fetches",
    severity: "high",
    technique: "T1190",
    rationale: "SSRF-to-internal patterns observed.",
    suggestedChange:
      "- Route every outbound fetch through `assertSafeOutboundUrl()`.\n- Block RFC1918 / link-local / metadata targets.\n- Pin allowlisted egress hosts where possible.",
  },
  {
    id: "unauth-api",
    match: /unauthorized|secure_mode|bad_token|auth/i,
    title: "Tighten API authentication",
    severity: "medium",
    rationale: "Unauthorized API access attempts observed.",
    suggestedChange:
      "- Set `HUB_API_TOKEN` and require Bearer on all mutating routes.\n- Enable `SECURE_MODE=1` in exposed deployments.\n- Review which routes are reachable without auth.",
  },
  {
    id: "decoy",
    match: /decoy|canary|tarpit|honeypot/i,
    title: "Tune deception + fingerprint blocking",
    severity: "low",
    rationale: "Attackers engaged deception decoys/canaries.",
    suggestedChange:
      "- Increase tarpit delays on hot decoys.\n- Promote repeat attacker fingerprints to a blocklist.\n- Review captured samples; submit to VT (opt-in) for enrichment.",
  },
]

export function generateDefenseProposals(limit = 300): { proposals: DefenseProposal[]; observed: number; hold: "HOLD_VYRNA_UNSYNC" } {
  const texts: { text: string; ts: string }[] = []
  try {
    for (const e of buildIdsStatus().events || []) texts.push({ text: `${e.source} ${e.message}`, ts: e.ts })
  } catch {
    /* ignore */
  }
  try {
    for (const d of listDeceptionEvents(limit)) texts.push({ text: `${d.kind} ${d.message}`, ts: d.ts })
  } catch {
    /* ignore */
  }

  const proposals: DefenseProposal[] = []
  for (const rule of RULES) {
    const hits = texts.filter((t) => rule.match.test(t.text))
    if (!hits.length) continue
    const lastSeen = hits.map((h) => h.ts).sort().slice(-1)[0]
    const techSet = new Set<string>()
    if (rule.technique) techSet.add(rule.technique)
    for (const h of hits.slice(0, 20)) for (const m of mapTextToTechniques(h.text)) techSet.add(m.technique.id)
    proposals.push({
      id: `defense-${rule.id}`,
      title: rule.title,
      severity: rule.severity,
      pattern: rule.id,
      observedCount: hits.length,
      lastSeen,
      techniques: Array.from(techSet),
      rationale: `${rule.rationale} (${hits.length} matching event${hits.length === 1 ? "" : "s"}).`,
      suggestedChange: rule.suggestedChange,
      autoApplied: false,
    })
  }
  const order = { critical: 5, high: 4, medium: 3, low: 2, info: 1 }
  proposals.sort((a, b) => (order[b.severity] - order[a.severity]) || b.observedCount - a.observedCount)
  return { proposals, observed: texts.length, hold: "HOLD_VYRNA_UNSYNC" }
}

export function proposalToMarkdown(p: DefenseProposal): string {
  return [
    `# Defense proposal: ${p.title}`,
    "",
    `- Severity: **${p.severity}**`,
    `- Observed pattern: \`${p.pattern}\` ×${p.observedCount}${p.lastSeen ? ` (last ${p.lastSeen})` : ""}`,
    `- ATT&CK: ${p.techniques.join(", ") || "—"}`,
    "",
    `## Rationale`,
    "",
    p.rationale,
    "",
    `## Suggested defensive change (review before applying — NOT auto-applied)`,
    "",
    p.suggestedChange,
    "",
    `> Defensive only · HOLD_VYRNA_UNSYNC · lattice_sync: false`,
  ].join("\n")
}
