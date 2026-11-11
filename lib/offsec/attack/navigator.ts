/**
 * Live ATT&CK navigator model. Aggregates observed events (Heimdall IDS ring +
 * deception mesh) into per-technique hit counts so the matrix "lights up" as
 * Heimdall observes matching activity. Mapping is best-effort keyword/id based.
 */

import { ATTACK_TACTICS, ATTACK_TECHNIQUES, type AttackTechnique } from "./techniques"
import { mapTextToTechniques } from "@/lib/offsec/report/attack-map"

export interface ObservedEvent {
  ts: string
  source: string
  text: string
  severity?: string
}

export interface TechniqueCell {
  technique: AttackTechnique
  hits: number
  lastSeen?: string
  sources: string[]
}

export interface TacticColumn {
  id: string
  name: string
  techniques: TechniqueCell[]
}

export interface NavigatorModel {
  generatedAt: string
  totalObserved: number
  totalHits: number
  columns: TacticColumn[]
  topTechniques: { id: string; name: string; hits: number }[]
}

export function buildNavigator(events: ObservedEvent[]): NavigatorModel {
  const cells = new Map<string, TechniqueCell>()
  for (const t of ATTACK_TECHNIQUES) cells.set(t.id, { technique: t, hits: 0, sources: [] })

  let totalHits = 0
  for (const ev of events) {
    const matches = mapTextToTechniques(`${ev.source} ${ev.text}`)
    for (const m of matches) {
      const cell = cells.get(m.technique.id)
      if (!cell) continue
      cell.hits += 1
      totalHits += 1
      if (!cell.lastSeen || ev.ts > cell.lastSeen) cell.lastSeen = ev.ts
      if (ev.source && !cell.sources.includes(ev.source)) cell.sources.push(ev.source)
    }
  }

  const columns: TacticColumn[] = ATTACK_TACTICS.map((tac) => ({
    id: tac.id,
    name: tac.name,
    techniques: ATTACK_TECHNIQUES.filter((t) => t.tactics.includes(tac.id)).map((t) => cells.get(t.id)!),
  }))

  const topTechniques = Array.from(cells.values())
    .filter((c) => c.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 10)
    .map((c) => ({ id: c.technique.id, name: c.technique.name, hits: c.hits }))

  return {
    generatedAt: new Date().toISOString(),
    totalObserved: events.length,
    totalHits,
    columns,
    topTechniques,
  }
}
