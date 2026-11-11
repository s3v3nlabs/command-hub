/**
 * Sigil2vec — real text/symbol embedding index.
 * Embeds with OpenAI or Ollama when available, otherwise a deterministic offline hashed
 * n-gram encoder (lib/llm/core.mjs → localEmbed). Index lives in local-data/ (gitignored).
 * Vectors from different providers are never mixed: the index records its provider/model.
 */
import fs from "fs"
import path from "path"
import { cosine, embed } from "@/lib/llm"

const DIR = path.join(process.cwd(), "local-data", "sigil2vec")
const FILE = path.join(DIR, "index.json")

export type SigilEntry = { id: string; text: string; tags: string[]; vector: number[]; createdAt: string }
type Index = { provider: string; model: string; entries: SigilEntry[] }

function load(): Index | null {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"))
  } catch {
    return null
  }
}
function save(ix: Index) {
  fs.mkdirSync(DIR, { recursive: true })
  fs.writeFileSync(FILE, JSON.stringify(ix))
}

export function sigilStatus() {
  const ix = load()
  return { count: ix?.entries.length || 0, provider: ix?.provider || null, model: ix?.model || null, path: "local-data/sigil2vec/index.json" }
}

export async function addSigils(items: Array<{ text: string; tags?: string[] }>) {
  const ix = load()
  const res = await embed(items.map((i) => i.text), { provider: (ix?.provider as any) || "auto" })
  const index: Index = ix && ix.provider === res.provider ? ix : { provider: res.provider, model: res.model, entries: [] }
  const now = new Date().toISOString()
  items.forEach((it, i) =>
    index.entries.push({
      id: `sg_${Date.now().toString(36)}_${i}`,
      text: it.text.slice(0, 4000),
      tags: (it.tags || []).slice(0, 12),
      vector: res.vectors[i],
      createdAt: now,
    }),
  )
  save(index)
  return { added: items.length, provider: index.provider, model: index.model, total: index.entries.length, reset: Boolean(ix && ix.provider !== res.provider) }
}

export async function searchSigils(query: string, k = 5) {
  const ix = load()
  if (!ix || ix.entries.length === 0) return { provider: null, results: [] as any[] }
  const res = await embed([query], { provider: ix.provider as any })
  const q = res.vectors[0]
  const results = ix.entries
    .map((e) => ({ id: e.id, text: e.text, tags: e.tags, score: Number(cosine(q, e.vector).toFixed(4)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
  return { provider: ix.provider, model: ix.model, results }
}

export function clearSigils() {
  try {
    fs.unlinkSync(FILE)
  } catch {
    /* none */
  }
}
