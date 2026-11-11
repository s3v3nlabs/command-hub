/** Pure unified-search filter for the command palette (testable). */
export interface CommandItem {
  id: string
  label: string
  sublabel?: string
  route?: string
  group: string
  haystack: string
}

/** AND-match every whitespace term against each item's haystack. */
export function filterCommandItems<T extends { haystack: string }>(items: T[], query: string, limit = 40): T[] {
  const needle = (query || "").trim().toLowerCase()
  if (!needle) return items.slice(0, limit)
  const terms = needle.split(/\s+/)
  return items.filter((it) => terms.every((t) => it.haystack.includes(t))).slice(0, limit)
}
