import { describe, it, expect } from "vitest"
import { filterCommandItems } from "@/lib/command/search"

const items = [
  { id: "a", haystack: "module marketplace install modules /marketplace" },
  { id: "b", haystack: "audit timeline who did what /audit" },
  { id: "c", haystack: "attack navigator heatmap mitre /offsec/attack-navigator" },
  { id: "d", haystack: "workspace red team offense" },
]

describe("command palette search", () => {
  it("returns all (capped) for empty query", () => {
    expect(filterCommandItems(items, "")).toHaveLength(4)
    expect(filterCommandItems(items, "   ")).toHaveLength(4)
  })
  it("AND-matches multiple terms", () => {
    expect(filterCommandItems(items, "attack mitre").map((i) => i.id)).toEqual(["c"])
    expect(filterCommandItems(items, "red offense").map((i) => i.id)).toEqual(["d"])
  })
  it("is case-insensitive and matches routes", () => {
    expect(filterCommandItems(items, "MARKETPLACE").map((i) => i.id)).toEqual(["a"])
    expect(filterCommandItems(items, "/audit").map((i) => i.id)).toEqual(["b"])
  })
  it("respects the limit", () => {
    expect(filterCommandItems(items, "", 2)).toHaveLength(2)
  })
})
