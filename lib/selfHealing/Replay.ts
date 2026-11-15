/**
 * Replay check for a self-healing proposal / patch — deterministic.
 *
 * F3 fix (blue-team review): no randomness. This is a SIMULATED replay: it does not execute
 * the patch. It runs deterministic structural checks on the proposal and returns the same
 * result for the same input every time (`simulated: true` is always set so nothing downstream
 * mistakes it for an execution replay). The server-side heal gate (lib/selfHealing/HealGate.ts)
 * requires a PASSED replay record before any heal is authorised.
 *
 * Author: Christian Wilford (s3v3n), Founder, Singular/ty Defense Solutions, LLC.
 */

const DESTRUCTIVE = /\b(drop|delete|wipe|purge|rm\s+-rf|truncate|format|overwrite)\b/i

export function replayChecks(p: any): Array<{ check: string; ok: boolean }> {
  const action = typeof p?.action === "string" ? p.action : typeof p?.recommendation === "string" ? p.recommendation : ""
  return [
    { check: "is_object", ok: p != null && typeof p === "object" },
    { check: "has_type", ok: typeof p?.type === "string" && p.type.length > 0 },
    { check: "has_analysis", ok: p?.analysis != null && typeof p.analysis === "object" },
    { check: "action_not_destructive", ok: !DESTRUCTIVE.test(action) },
  ]
}

export async function simulateReplay(previousResponse: any, context?: any) {
  const startTime = Date.now()
  const canon = stableStringify(previousResponse)
  const inputHash = hashString(canon)
  const checks = replayChecks(previousResponse)
  const isSuccessful = checks.every((c) => c.ok)
  const executionTime = Date.now() - startTime
  return {
    original: previousResponse,
    replayResult: {
      success: isSuccessful,
      simulated: true as const,
      checks,
      executionTime,
      timestamp: new Date().toISOString(),
      replayId: `replay-${inputHash.toString(16).padStart(8, "0")}`,
      metrics: {
        checksPassed: checks.filter((c) => c.ok).length,
        checksTotal: checks.length,
        performance: executionTime < 1000 ? "high" : executionTime < 2000 ? "medium" : "low",
      },
      notes: isSuccessful
        ? "Simulated replay: structural checks passed (patch not executed)"
        : `Simulated replay: failed ${checks.filter((c) => !c.ok).map((c) => c.check).join(", ")}`,
    },
    context,
  }
}

/** Key-sorted JSON so equal objects hash equally. */
export function stableStringify(v: any): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null"
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`
  return `{${Object.keys(v)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stableStringify(v[k])}`)
    .join(",")}}`
}

/** 32-bit string hash (display id only — HealGate uses SHA-256 for binding). */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}
