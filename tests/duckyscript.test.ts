import { describe, it, expect } from "vitest"
import { buildDucky, detectBadUsb } from "@/lib/offsec/duckyscript"

describe("duckyscript", () => {
  it("builds an awareness payload", () => {
    const s = buildDucky("awareness-notepad", { message: "hello", delay_ms: "500" })
    expect(s).toContain("STRING hello")
    expect(s).toContain("DELAY 500")
  })
  it("flags encoded powershell as high", () => {
    const r = detectBadUsb("DELAY 100\nSTRING powershell -enc AQAAAA==\nENTER")
    expect(r.findings.some((f) => f.rule === "encoded_powershell" && f.severity === "high")).toBe(true)
    expect(r.score).toBeGreaterThan(0)
  })
})
