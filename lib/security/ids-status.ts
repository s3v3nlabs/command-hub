/**
 * Honest local IDS signals for Command Hub fortress.
 * Never invent nation-state theater. Only live signals from this host.
 * HOLD_VYRNA_UNSYNC — no lattice-sync claims.
 */

import fs from "fs"
import path from "path"
import os from "os"

export type SignalKind = "live" | "unavailable"

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
    unavailable: string
  }
}

/** File-backed IDS ring so detections survive across Next.js route module copies. */
const MAX_EVENTS = 40
const IDS_DIR = path.join(process.cwd(), "local-data", "heimdall-ids")
const EVENTS_FILE = path.join(IDS_DIR, "events.jsonl")
const AUTH_FILE = path.join(IDS_DIR, "failed-auth.count")

function ensureIdsDir() {
  try {
    fs.mkdirSync(IDS_DIR, { recursive: true, mode: 0o700 })
  } catch {
    /* ignore */
  }
}

function readAuthCount(): number {
  try {
    ensureIdsDir()
    if (!fs.existsSync(AUTH_FILE)) return 0
    return Math.max(0, parseInt(fs.readFileSync(AUTH_FILE, "utf8").trim(), 10) || 0)
  } catch {
    return 0
  }
}

function writeAuthCount(n: number) {
  try {
    ensureIdsDir()
    fs.writeFileSync(AUTH_FILE, String(n), { mode: 0o600 })
  } catch {
    /* ignore */
  }
}

function readEvents(): IdsEvent[] {
  try {
    ensureIdsDir()
    if (!fs.existsSync(EVENTS_FILE)) return []
    const lines = fs.readFileSync(EVENTS_FILE, "utf8").split("\n").filter(Boolean)
    const out: IdsEvent[] = []
    for (const line of lines.slice(-MAX_EVENTS)) {
      try {
        out.push(JSON.parse(line) as IdsEvent)
      } catch {
        /* skip */
      }
    }
    return out.reverse()
  } catch {
    return []
  }
}

export function recordFailedApiAuth(reason = "unauthorized"): number {
  const failedApiAuthCount = readAuthCount() + 1
  writeAuthCount(failedApiAuthCount)
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
  return readAuthCount()
}

function pushEvent(ev: IdsEvent) {
  try {
    ensureIdsDir()
    fs.appendFileSync(EVENTS_FILE, JSON.stringify(ev) + "\n", { mode: 0o600 })
  } catch {
    /* ignore */
  }
}

export type IdsSeverity = IdsEvent["severity"]

/** Record a live threat/detection event into the IDS ring (Heimdall request-guard + API auth). */
export function recordIdsThreat(input: {
  severity: IdsSeverity
  source: string
  message: string
  blocked?: boolean
  meta?: Record<string, unknown>
}): void {
  const blocked = Boolean(input.blocked)
  pushEvent({
    id: `threat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ts: new Date().toISOString(),
    severity: input.severity,
    source: input.source,
    message: blocked ? `[BLOCKED] ${input.message}` : input.message,
    kind: "live",
  })
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
    readEvents().length > 0
      ? []
      : [
          {
            id: "boot-ids",
            ts: now,
            severity: "info",
            source: "ids-status",
            message: "IDS status endpoint online — reporting honest local signals only",
            kind: "live",
          }
        ]

  const events = [...readEvents(), ...bootEvents].slice(0, MAX_EVENTS)

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
      failedApiAuthCount: readAuthCount(),
      note: "File-backed counter under local-data/heimdall-ids/; increments when callers invoke recordFailedApiAuth",
    },
    modules,
    lastScan: {
      at: now,
      kind: "live",
      summary: `Local signal sweep: env.local=${envLocalPresent()}, modules=${modules.filter((m) => m.available).length}/${modules.length}, failedAuth=${readAuthCount()}`,
    },
    events,
    legend: {
      live: "Derived from process/fs/env presence, osquery, nft/iptables, or real counters on this box",
      unavailable: "A probe ran on this host and the tool or file was not present",
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

/** Alias used by live threat feed. */
export const getIdsStatus = buildIdsStatus
