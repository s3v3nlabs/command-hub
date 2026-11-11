/**
 * Honest local IDS signals for Command Hub fortress.
 * Never invent nation-state theater. Label live vs simulated.
 * HOLD_VYRNA_UNSYNC — no lattice-sync claims.
 */

import fs from "fs"
import path from "path"
import os from "os"

export type SignalKind = "live" | "simulated"

export interface IdsEvent {
  id: string
  ts: string
  severity: "info" | "low" | "medium" | "high" | "critical"
  source: string
  message: string
  kind: SignalKind
}

export interface IdsStatusPayload {
  ok: true
  generatedAt: string
  hold: "HOLD_VYRNA_UNSYNC"
  lattice_sync: false
  mode: "local-signals"
  uptimeSec: number
  process: {
    pid: number
    node: string
    platform: string
    hostname: string
    rssMb: number
  }
  envLocalPresent: boolean
  holdFlags: {
    HOLD_VYRNA_UNSYNC: true
    SECURE_MODE: boolean
    GOVERNOR_MODE: boolean
    REPLAY_APPROVED_ONLY: boolean
  }
  auth: {
    failedApiAuthCount: number
    note: string
  }
  modules: Array<{
    id: string
    label: string
    pathHint: string
    available: boolean
    kind: SignalKind
  }>
  lastScan: {
    at: string
    kind: SignalKind
    summary: string
  }
  events: IdsEvent[]
  legend: {
    live: string
    simulated: string
  }
}

/** In-memory failed API auth counter (process-local). */
let failedApiAuthCount = 0
const eventRing: IdsEvent[] = []
const MAX_EVENTS = 40

export function recordFailedApiAuth(reason = "unauthorized"): number {
  failedApiAuthCount += 1
  pushEvent({
    id: `auth-fail-${Date.now()}`,
    ts: new Date().toISOString(),
    severity: "medium",
    source: "api-auth",
    message: `Failed API auth (${reason}). Count=${failedApiAuthCount}`,
    kind: "live",
  })
  return failedApiAuthCount
}

export function getFailedApiAuthCount(): number {
  return failedApiAuthCount
}

function pushEvent(ev: IdsEvent) {
  eventRing.unshift(ev)
  if (eventRing.length > MAX_EVENTS) eventRing.length = MAX_EVENTS
}

function hasEnv(name: string): boolean {
  const v = process.env[name]
  return typeof v === "string" && v.trim().length > 0
}

function envLocalPresent(): boolean {
  try {
    const root = process.cwd()
    return fs.existsSync(path.join(root, ".env.local"))
  } catch {
    return false
  }
}

function moduleAvailable(rel: string): boolean {
  try {
    return fs.existsSync(path.join(process.cwd(), rel))
  } catch {
    return false
  }
}

export function buildIdsStatus(): IdsStatusPayload {
  const now = new Date().toISOString()
  const mem = process.memoryUsage()
  const rssMb = Math.round((mem.rss / (1024 * 1024)) * 10) / 10

  const modules = [
    {
      id: "heimdal-threat",
      label: "Heimdal threat detection",
      pathHint: "lib/heimdal/*threat*",
      available:
        moduleAvailable("lib/heimdal/advanced-threat-detection.ts") ||
        moduleAvailable("lib/heimdal/enhanced-threat-detection.ts"),
      kind: "live" as SignalKind,
    },
    {
      id: "security-cors",
      label: "Security CORS manager",
      pathHint: "lib/security/cors-manager.ts",
      available: moduleAvailable("lib/security/cors-manager.ts"),
      kind: "live" as SignalKind,
    },
    {
      id: "network-security-ui",
      label: "Network Security UI",
      pathHint: "app/network-security",
      available: moduleAvailable("app/network-security/page.tsx"),
      kind: "live" as SignalKind,
    },
    {
      id: "self-healing",
      label: "Self-Healing",
      pathHint: "app/self-healing + lib/SelfHealing*",
      available:
        moduleAvailable("app/self-healing/page.tsx") ||
        moduleAvailable("lib/SelfHealingAgentCore.ts"),
      kind: "live" as SignalKind,
    },
    {
      id: "threat-analysis-ui",
      label: "Threat Analysis UI",
      pathHint: "app/threat-analysis",
      available: moduleAvailable("app/threat-analysis/page.tsx"),
      kind: "live" as SignalKind,
    },
  ]

  const bootEvents: IdsEvent[] =
    eventRing.length > 0
      ? []
      : [
          {
            id: "boot-ids",
            ts: now,
            severity: "info",
            source: "ids-status",
            message: "IDS status endpoint online — reporting honest local signals only",
            kind: "live",
          },
          {
            id: "sim-baseline",
            ts: now,
            severity: "low",
            source: "ids-console",
            message: "Baseline console feed seeded (simulated) — no external IDS sensor attached",
            kind: "simulated",
          },
        ]

  const events = [...eventRing, ...bootEvents].slice(0, MAX_EVENTS)

  return {
    ok: true,
    generatedAt: now,
    hold: "HOLD_VYRNA_UNSYNC",
    lattice_sync: false,
    mode: "local-signals",
    uptimeSec: Math.floor(process.uptime()),
    process: {
      pid: process.pid,
      node: process.version,
      platform: `${os.platform()}/${os.arch()}`,
      hostname: os.hostname(),
      rssMb,
    },
    envLocalPresent: envLocalPresent(),
    holdFlags: {
      HOLD_VYRNA_UNSYNC: true,
      SECURE_MODE: process.env.SECURE_MODE === "true" || process.env.SECURE_MODE === "1",
      GOVERNOR_MODE: process.env.GOVERNOR_MODE === "true" || process.env.GOVERNOR_MODE === "1",
      REPLAY_APPROVED_ONLY:
        process.env.REPLAY_APPROVED_ONLY === "true" || process.env.REPLAY_APPROVED_ONLY === "1",
    },
    auth: {
      failedApiAuthCount,
      note: "Counter is process-local; increments only when callers invoke recordFailedApiAuth",
    },
    modules,
    lastScan: {
      at: now,
      kind: "live",
      summary: `Local signal sweep: env.local=${envLocalPresent()}, modules=${modules.filter((m) => m.available).length}/${modules.length}, failedAuth=${failedApiAuthCount}`,
    },
    events,
    legend: {
      live: "Derived from process/fs/env presence or real counters on this box",
      simulated: "UI/console seed only — not an external sensor or blocked-attacker claim",
    },
  }
}

/** Account rails: key-presence booleans + connect URLs. Never returns secrets. */
export interface AccountRail {
  id: string
  name: string
  keyPresent: boolean
  status: "key-present" | "offline" | "connect-pending" | "partial" | "local"
  detail: string
  connectHref: string
  connectLabel: string
}

export function getAccountRails(): AccountRail[] {
  const openai = hasEnv("OPENAI_API_KEY")
  const xai = hasEnv("XAI_API_KEY")
  const supabase =
    hasEnv("NEXT_PUBLIC_SUPABASE_URL") || hasEnv("SUPABASE_URL") || hasEnv("SUPABASE_ANON_KEY")
  const v0 =
    process.env.V0_BRIDGE_ENABLED === "true" || process.env.V0_CONSCIOUSNESS_MODE === "true"

  return [
    {
      id: "openai",
      name: "OpenAI",
      keyPresent: openai,
      status: openai ? "key-present" : "offline",
      detail: openai ? "OPENAI_API_KEY present (value never returned)" : "No OPENAI_API_KEY",
      connectHref: "https://platform.openai.com/api-keys",
      connectLabel: "Connect",
    },
    {
      id: "xai",
      name: "xAI / Grok",
      keyPresent: xai,
      status: xai ? "key-present" : "offline",
      detail: xai ? "XAI_API_KEY present" : "No XAI_API_KEY",
      connectHref: "https://console.x.ai",
      connectLabel: "Connect",
    },
    {
      id: "venice",
      name: "Venice",
      keyPresent: false,
      status: "partial",
      detail: "No official API key — open console; Operator signs in later",
      connectHref: "https://venice.ai",
      connectLabel: "Connect",
    },
    {
      id: "v0",
      name: "v0",
      keyPresent: v0,
      status: v0 ? "partial" : "connect-pending",
      detail: v0 ? "Bridge flags set" : "Open v0.dev — Operator signs in via secure form later",
      connectHref: "https://v0.dev",
      connectLabel: "Connect",
    },
    {
      id: "ollama",
      name: "Ollama",
      keyPresent: false,
      status: "local",
      detail: "Local probe via /api/ai/ops/status — no cloud password",
      connectHref: "https://ollama.com",
      connectLabel: "Docs",
    },
    {
      id: "supabase",
      name: "Supabase",
      keyPresent: supabase,
      status: supabase ? "key-present" : "offline",
      detail: supabase ? "Supabase URL/anon present" : "No Supabase env",
      connectHref: "https://supabase.com/dashboard",
      connectLabel: "Connect",
    },
    {
      id: "onedrive",
      name: "OneDrive",
      keyPresent: false,
      status: "connect-pending",
      detail: "No password manager — Operator connects via MCP/secure form later",
      connectHref: "https://onedrive.live.com",
      connectLabel: "Connect",
    },
    {
      id: "github",
      name: "GitHub",
      keyPresent: hasEnv("GITHUB_TOKEN") || hasEnv("GH_TOKEN"),
      status:
        hasEnv("GITHUB_TOKEN") || hasEnv("GH_TOKEN") ? "key-present" : "connect-pending",
      detail: "Repo edits out of scope for this reclaim UI; Connect opens GitHub only",
      connectHref: "https://github.com/login",
      connectLabel: "Connect",
    },
    {
      id: "vercel",
      name: "Vercel",
      keyPresent: hasEnv("VERCEL_TOKEN") || hasEnv("VERCEL_OIDC_TOKEN"),
      status:
        hasEnv("VERCEL_TOKEN") || hasEnv("VERCEL_OIDC_TOKEN") ? "key-present" : "connect-pending",
      detail: "Connect opens Vercel dashboard — no tokens stored in repo",
      connectHref: "https://vercel.com/login",
      connectLabel: "Connect",
    },
  ]
}
