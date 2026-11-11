import { describe, it, expect, beforeEach } from "vitest"
import {
  selectBackend,
  rankBackendsForSpeculative,
  __resetRouterStateForTests,
  __getStateForTests,
} from "@/lib/compute/router"
import type { ComputeBackend, BackendRuntimeState } from "@/lib/compute/types"

function backend(partial: Partial<ComputeBackend> & { id: string }): ComputeBackend {
  return {
    kind: "ollama",
    baseUrl: `http://127.0.0.1:${9000 + partial.id.length}`,
    label: partial.id,
    maxConcurrency: 2,
    costWeight: 1,
    enabled: true,
    ...partial,
  }
}

function runtimeMap(init: Record<string, Partial<BackendRuntimeState>>) {
  const map = new Map<string, BackendRuntimeState>()
  return (id: string): BackendRuntimeState => {
    if (!map.has(id)) {
      map.set(id, {
        id,
        health: "healthy",
        inFlight: 0,
        totalRequests: 0,
        totalErrors: 0,
        totalTimeouts: 0,
        consecutiveFailures: 0,
        lastLatencyMs: null,
        ewmaLatencyMs: null,
        lastCheckedAt: Date.now(),
        lastError: null,
        circuitOpenedAt: null,
        models: [],
        warmed: false,
        ...(init[id] || {}),
      })
    }
    return map.get(id)!
  }
}

describe("compute router — selectBackend", () => {
  beforeEach(() => {
    __resetRouterStateForTests()
  })

  it("picks least-loaded backend", () => {
    const a = backend({ id: "a", maxConcurrency: 4 })
    const b = backend({ id: "b", maxConcurrency: 4 })
    const get = runtimeMap({ a: { inFlight: 3 }, b: { inFlight: 0 } })
    const pick = selectBackend([a, b], get, "least-loaded")
    expect(pick?.id).toBe("b")
  })

  it("skips circuit-open and down backends (failover)", () => {
    const a = backend({ id: "a" })
    const b = backend({ id: "b" })
    const get = runtimeMap({
      a: { health: "circuit-open", circuitOpenedAt: Date.now() },
      b: { health: "healthy" },
    })
    const pick = selectBackend([a, b], get, "least-loaded")
    expect(pick?.id).toBe("b")
  })

  it("returns null when all backends are at concurrency cap", () => {
    const a = backend({ id: "a", maxConcurrency: 1 })
    const get = runtimeMap({ a: { inFlight: 1 } })
    expect(selectBackend([a], get, "least-loaded")).toBeNull()
  })

  it("cost-aware prefers lower costWeight", () => {
    const local = backend({ id: "local", costWeight: 1 })
    const runpod = backend({ id: "runpod", kind: "runpod", costWeight: 5 })
    const get = runtimeMap({})
    const pick = selectBackend([runpod, local], get, "cost-aware")
    expect(pick?.id).toBe("local")
  })

  it("latency-aware prefers lower ewma", () => {
    const slow = backend({ id: "slow" })
    const fast = backend({ id: "fast" })
    const get = runtimeMap({
      slow: { ewmaLatencyMs: 2000 },
      fast: { ewmaLatencyMs: 120 },
    })
    const pick = selectBackend([slow, fast], get, "latency-aware")
    expect(pick?.id).toBe("fast")
  })

  it("honors preferBackendId when eligible", () => {
    const a = backend({ id: "a" })
    const b = backend({ id: "b" })
    const get = runtimeMap({})
    const pick = selectBackend([a, b], get, "least-loaded", "b")
    expect(pick?.id).toBe("b")
  })

  it("round-robin cycles across eligible backends", () => {
    const a = backend({ id: "a" })
    const b = backend({ id: "b" })
    const get = runtimeMap({})
    const first = selectBackend([a, b], get, "round-robin")
    const second = selectBackend([a, b], get, "round-robin")
    expect(first?.id).toBeTruthy()
    expect(second?.id).toBeTruthy()
    expect(first!.id).not.toBe(second!.id)
  })
})

describe("compute router — speculative ranking", () => {
  beforeEach(() => {
    __resetRouterStateForTests()
  })

  it("ranks up to N least-loaded healthy backends", () => {
    const a = backend({ id: "a", maxConcurrency: 4 })
    const b = backend({ id: "b", maxConcurrency: 4 })
    const c = backend({ id: "c", maxConcurrency: 4 })
    const get = runtimeMap({
      a: { inFlight: 2 },
      b: { inFlight: 0 },
      c: { health: "down" },
    })
    const ranked = rankBackendsForSpeculative([a, b, c], get, 2)
    expect(ranked.map((x) => x.id)).toEqual(["b", "a"])
  })
})

describe("compute router — state helper", () => {
  beforeEach(() => {
    __resetRouterStateForTests()
  })

  it("creates empty runtime state on first access", () => {
    const s = __getStateForTests("x")
    expect(s.health).toBe("unknown")
    expect(s.inFlight).toBe(0)
  })
})
