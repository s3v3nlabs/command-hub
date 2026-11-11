/**
 * OSINT auto-enrichment. Paste a target (domain/IP/email/username/phone/person),
 * classify it, fan out across the hub's EXISTING OSINT tools (PIVOTS resource
 * launchers + dork recipes), and auto-build an investigative entity graph.
 *
 * HONEST: the hub's OSINT tools are launchers for real resources — they do not
 * silently query third parties or fabricate "findings". This builds the
 * investigation plan (pivot links + dorks) and a ready-to-pursue graph. Live
 * API lookups require operator-supplied keys and are out of scope here.
 */

import { PIVOTS, type EntityType, type Graph, type GraphNode, type GraphEdge } from "@/lib/offsec/graph-model"
import { DORK_RECIPES, type DorkRecipe } from "@/lib/offsec/osint-data"
import { randomUUID } from "crypto"

export function classifyTarget(raw: string): EntityType {
  const t = (raw || "").trim()
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t)) return "email"
  if (/^(\d{1,3})(\.\d{1,3}){3}$/.test(t) || /^[0-9a-f:]+:[0-9a-f:]+$/i.test(t)) return "ip"
  if (/^@?[a-z0-9._-]{2,30}$/i.test(t) && !t.includes(".")) return t.startsWith("@") ? "social" : "username"
  if (/^\+?[\d][\d\s\-().]{6,}$/.test(t)) return "phone"
  if (/^(?!https?:)[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(t.replace(/^https?:\/\//, "").split("/")[0])) return "domain"
  if (/\s/.test(t)) return "person"
  return "note"
}

export interface Pivot {
  label: string
  url: string
}

export interface Enrichment {
  target: string
  type: EntityType
  pivots: Pivot[]
  dorks: { label: string; category: string; query: string; url: string; note?: string }[]
  graph: Graph
  notes: string[]
}

const PIVOT_FALLBACK: Array<{ label: string; url: (v: string) => string }> = []

function pivotsFor(type: EntityType, value: string): Pivot[] {
  const defs = PIVOTS[type] || PIVOT_FALLBACK
  // username/social share launchers
  const extra = type === "social" ? PIVOTS.username || [] : []
  return [...defs, ...extra].map((p) => ({ label: p.label, url: p.url(value) }))
}

function dorksFor(type: EntityType, value: string): Enrichment["dorks"] {
  if (type !== "domain" && type !== "email") return []
  const domain = type === "email" ? value.split("@")[1] : value
  return DORK_RECIPES.map((r: DorkRecipe) => {
    const query = r.query.replace(/\{domain\}/g, domain)
    return {
      label: r.label,
      category: r.category,
      query,
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      note: r.note,
    }
  })
}

function buildGraph(target: string, type: EntityType, pivots: Pivot[], dorks: Enrichment["dorks"]): Graph {
  const cx = 420
  const cy = 300
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const rootId = randomUUID()
  nodes.push({ id: rootId, type, label: target, x: cx, y: cy, pinned: true, meta: { role: "target" } })

  // email -> derive domain node
  if (type === "email" && target.includes("@")) {
    const dom = target.split("@")[1]
    const domId = randomUUID()
    nodes.push({ id: domId, type: "domain", label: dom, x: cx + 180, y: cy - 120, meta: { derivedFrom: "email" } })
    edges.push({ id: randomUUID(), source: rootId, target: domId, label: "domain" })
  }

  const leads = [
    ...pivots.map((p) => ({ label: p.label, url: p.url, kind: "pivot" as const })),
    ...dorks.slice(0, 6).map((d) => ({ label: d.label, url: d.url, kind: "dork" as const })),
  ]
  const n = Math.max(leads.length, 1)
  leads.forEach((lead, i) => {
    const angle = (2 * Math.PI * i) / n
    const r = 200
    const id = randomUUID()
    nodes.push({
      id,
      type: lead.kind === "dork" ? "note" : "document",
      label: lead.label,
      x: Math.round(cx + r * Math.cos(angle)),
      y: Math.round(cy + r * Math.sin(angle)),
      meta: { url: lead.url, kind: lead.kind },
    })
    edges.push({ id: randomUUID(), source: rootId, target: id, label: lead.kind })
  })

  return { nodes, edges }
}

export function buildEnrichment(rawTarget: string): Enrichment | { error: string } {
  const target = (rawTarget || "").trim().slice(0, 200)
  if (!target) return { error: "target required" }
  const type = classifyTarget(target)
  const value = type === "social" ? target.replace(/^@/, "") : target
  const pivots = pivotsFor(type, value)
  const dorks = dorksFor(type, value)
  const graph = buildGraph(target, type, pivots, dorks)
  const notes: string[] = [
    "Launchers open real OSINT resources — no third party is auto-queried.",
    "Authorized engagements only. Report, do not harvest.",
  ]
  if (!pivots.length && !dorks.length) notes.push("No preset launchers for this entity type — add leads manually in the graph.")
  return { target, type, pivots, dorks, graph, notes }
}
