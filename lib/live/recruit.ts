
/**
 * Live recruitment / people search: GitHub public user search (no canned
 * candidates). Optional extra: npm user registry. Honest empty results.
 */
import { liveFetch } from "./http"

export async function searchTalent(query: string) {
  const q = (query || "").trim()
  if (!q) return { ok: false as const, error: "query required" }
  const url = `https://api.github.com/search/users?q=${encodeURIComponent(q)}&per_page=15`
  const r = await liveFetch(url, { timeoutMs: 10_000, headers: { Accept: "application/vnd.github+json" } })
  if (!r.ok) {
    return { ok: false as const, error: r.error || `GitHub search HTTP ${r.status}`, backend: "GitHub /search/users (live)", live: true, url, people: [] }
  }
  const j = (r.json || {}) as { total_count?: number; items?: Array<Record<string, unknown>> }
  const items = Array.isArray(j.items) ? j.items : []
  const people = []
  for (const it of items.slice(0, 12)) {
    const login = String(it.login || "")
    const prof = await liveFetch(`https://api.github.com/users/${encodeURIComponent(login)}`, { timeoutMs: 8000, headers: { Accept: "application/vnd.github+json" } })
    const p = (prof.json && typeof prof.json === "object" ? (prof.json as Record<string, unknown>) : it)
    people.push({
      id: `gh:${p.id || login}`,
      name: String(p.name || p.login || login),
      username: login,
      url: String(p.html_url || it.html_url || `https://github.com/${login}`),
      location: p.location ? String(p.location) : "",
      bio: p.bio ? String(p.bio) : "",
      company: p.company ? String(p.company) : "",
      publicRepos: Number(p.public_repos || 0),
      followers: Number(p.followers || 0),
      blog: p.blog ? String(p.blog) : "",
      avatar: String(p.avatar_url || it.avatar_url || ""),
      source: "GitHub public API (live)",
    })
  }
  return {
    ok: true as const,
    backend: "GitHub public user search (live)",
    live: true,
    query: q,
    total: j.total_count || people.length,
    people,
    note: "Public GitHub profiles only. This is not a private recruiting database and does not invent candidates.",
  }
}
