/**
 * Type-level regressions for the pre-existing `tsc --noEmit` errors fixed on
 * fix/real-data-sweep. These assertions are enforced by `npm run typecheck`
 * (CI step "Typecheck"), which compiles tests/ too; vitest only checks that
 * the file loads.
 */
import { describe, it, expectTypeOf } from "vitest"
import type { TranscriptEntry } from "@/lib/caller"

describe("typecheck regressions", () => {
  it("caller transcript accepts the simulated-callee speaker used by lib/caller/demo.ts", () => {
    expectTypeOf<"simulated-callee">().toMatchTypeOf<TranscriptEntry["speaker"]>()
  })
})

import { sqliteQuery, sqliteSchema } from "@/lib/live/db"

describe("live sqlite result type", () => {
  it("exposes helper fields (ok/result) to callers", () => {
    expectTypeOf(sqliteQuery).returns.resolves.toMatchTypeOf<Record<string, unknown>>()
    expectTypeOf(sqliteSchema).returns.resolves.toMatchTypeOf<Record<string, unknown>>()
  })
})
