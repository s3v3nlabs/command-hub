import { describe, it, expect, vi, afterEach } from "vitest"
import { scrubVaultText, scrubHit } from "@/lib/vault/scrub"
import { VAULT_CONNECT_CONFIGS } from "@/lib/vault/connect-configs"
import { vaultSearch, vaultFetch, vaultBaseUrl } from "@/lib/vault/client"

describe("vault scrubber", () => {
  it("redacts secret-shaped strings", () => {
    const raw = "key sk-abcdeFGHIJKLmnopqrST and Bearer abc.def.ghi and password: hunter2"
    const out = scrubVaultText(raw)
    expect(out).not.toMatch(/sk-abcde/)
    expect(out).not.toMatch(/Bearer abc/)
    expect(out).toMatch(/\[redacted\]/)
    expect(out).toMatch(/password=\[redacted\]/)
  })

  it("scrubs snip and text on a hit", () => {
    const hit = scrubHit({
      conversation_id: "c1",
      snip: "token: supersecret",
      text: "BEGIN",
    })
    expect(String(hit.snip)).not.toMatch(/supersecret/)
  })
})

describe("connect configs", () => {
  it("covers the documented AI nodes and contains no live-looking secrets", () => {
    const ids = VAULT_CONNECT_CONFIGS.map((c) => c.id)
    for (const need of [
      "chatgpt-developer",
      "claude-desktop",
      "claude-code",
      "cursor",
      "grok",
      "ollama",
      "venice",
      "curl",
    ]) {
      expect(ids).toContain(need)
    }
    const blob = JSON.stringify(VAULT_CONNECT_CONFIGS)
    expect(blob).not.toMatch(/sk-[a-zA-Z0-9]{10,}/)
    expect(blob).not.toMatch(/Bearer [A-Za-z0-9_-]{24,}/)
    // Placeholders are fine; a long random token is not.
    expect(VAULT_CONNECT_CONFIGS.every((c) => c.snippet.length > 20 && c.verified.length > 20)).toBe(true)
  })
})

describe("vault client degradation", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("defaults to loopback", () => {
    expect(vaultBaseUrl()).toMatch(/127\.0\.0\.1:8765/)
  })

  it("returns an honest degraded payload when fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("connect ECONNREFUSED")
      }),
    )
    const result = await vaultFetch("/api/search?q=test")
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.degraded).toBe(true)
      expect(result.reason).toMatch(/unreachable/i)
    }
  })

  it("returns degraded on 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 }),
      ),
    )
    const result = await vaultSearch({ query: "11:30" })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.degraded).toBe(true)
      expect(result.reason).toMatch(/token/i)
    }
  })

  it("scrubs hits on a successful search", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            ok: true,
            query: "11:30",
            count: 1,
            backend: "fts",
            hits: [
              {
                conversation_id: "c",
                role: "user",
                snip: "meet at 11:30 password: hunter2",
                create_time: "2025-09-01T00:00:00+00:00",
                evidence: "DOCUMENTED",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    )
    const result = await vaultSearch({ query: "11:30" })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.hits[0].snip).toContain("11:30")
      expect(result.hits[0].snip).not.toContain("hunter2")
      expect(result.hits[0].evidence).toBe("DOCUMENTED")
    }
  })
})
