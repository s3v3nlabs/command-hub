/**
 * Best-effort mapping of free-text findings to MITRE ATT&CK techniques.
 * Explicit "T1234" ids in text always win; otherwise keyword matching.
 */

import { ATTACK_TECHNIQUES, getTechnique, type AttackTechnique } from "@/lib/offsec/attack/techniques"

const ID_RE = /\bT\d{4}(?:\.\d{3})?\b/gi

export interface TechniqueMatch {
  technique: AttackTechnique
  reason: "explicit" | "keyword"
  matched: string[]
}

export function mapTextToTechniques(text: string): TechniqueMatch[] {
  const hay = (text || "").toLowerCase()
  const out = new Map<string, TechniqueMatch>()

  // explicit ids
  for (const m of text.match(ID_RE) || []) {
    const base = m.toUpperCase().split(".")[0]
    const tech = getTechnique(m.toUpperCase()) || getTechnique(base)
    if (tech) out.set(tech.id, { technique: tech, reason: "explicit", matched: [m] })
  }

  // keyword matches (do not overwrite explicit)
  for (const tech of ATTACK_TECHNIQUES) {
    if (out.has(tech.id)) continue
    const hits = tech.keywords.filter((k) => hay.includes(k))
    if (hits.length) out.set(tech.id, { technique: tech, reason: "keyword", matched: hits })
  }

  return Array.from(out.values())
}

export function mapFindingToTechniques(finding: {
  title?: string
  description?: string
  phase?: string
  evidence?: string
}): TechniqueMatch[] {
  return mapTextToTechniques(
    [finding.title, finding.phase, finding.description, finding.evidence].filter(Boolean).join("  "),
  )
}
