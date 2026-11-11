/** Entity-graph model for the investigative graph (our aesthetic, not Maltego's). */

export type EntityType =
  | "person"
  | "username"
  | "email"
  | "phone"
  | "domain"
  | "ip"
  | "org"
  | "social"
  | "location"
  | "document"
  | "note"

export interface GraphNode {
  id: string
  type: EntityType
  label: string
  x: number
  y: number
  pinned?: boolean
  meta?: Record<string, string>
}
export interface GraphEdge {
  id: string
  source: string
  target: string
  label?: string
}
export interface Graph {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export const ENTITY_TYPES: Array<{ id: EntityType; label: string; glyph: string }> = [
  { id: "person", label: "Person", glyph: "☗" },
  { id: "username", label: "Username", glyph: "@" },
  { id: "email", label: "Email", glyph: "✉" },
  { id: "phone", label: "Phone", glyph: "☎" },
  { id: "domain", label: "Domain", glyph: "⌾" },
  { id: "ip", label: "IP / Host", glyph: "⊹" },
  { id: "org", label: "Org", glyph: "▣" },
  { id: "social", label: "Social", glyph: "◈" },
  { id: "location", label: "Location", glyph: "⌖" },
  { id: "document", label: "Document", glyph: "▤" },
  { id: "note", label: "Note", glyph: "✎" },
]

export const GRAPH_STORAGE_KEY = "offsec_entity_graph_v1"

/** Suggested manual pivots per entity type (opens real OSINT resources; no auto-queries). */
export const PIVOTS: Partial<Record<EntityType, Array<{ label: string; url: (v: string) => string }>>> = {
  username: [
    { label: "Sherlock (cmd)", url: (v) => `https://github.com/sherlock-project/sherlock#usage` },
    { label: "WhatsMyName", url: (v) => `https://whatsmyname.app/` },
  ],
  email: [
    { label: "HIBP", url: (v) => `https://haveibeenpwned.com/account/${encodeURIComponent(v)}` },
    { label: "Google it", url: (v) => `https://www.google.com/search?q=${encodeURIComponent('"' + v + '"')}` },
  ],
  domain: [
    { label: "crt.sh", url: (v) => `https://crt.sh/?q=${encodeURIComponent(v)}` },
    { label: "DNSdumpster", url: () => `https://dnsdumpster.com/` },
    { label: "Shodan", url: (v) => `https://www.shodan.io/search?query=${encodeURIComponent(v)}` },
  ],
  ip: [
    { label: "Shodan", url: (v) => `https://www.shodan.io/host/${encodeURIComponent(v)}` },
    { label: "AbuseIPDB", url: (v) => `https://www.abuseipdb.com/check/${encodeURIComponent(v)}` },
  ],
  phone: [{ label: "Google it", url: (v) => `https://www.google.com/search?q=${encodeURIComponent('"' + v + '"')}` }],
  person: [{ label: "Google it", url: (v) => `https://www.google.com/search?q=${encodeURIComponent('"' + v + '"')}` }],
}
