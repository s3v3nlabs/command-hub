export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Unified live-backend API. /api/live/<module>
 * GET reads; POST mutates (shell, messages, notes, sql, report generation).
 * Auth follows the hub pattern: requireHubAuth when a token is configured
 * or SECURE_MODE is on.
 */

import { type NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { getSystemSnapshot } from "@/lib/live/sys"
import { getNetworkSnapshot, getFirewallLogs } from "@/lib/live/net"
import { listDir, readFilePreview } from "@/lib/live/fs-browse"
import { execShell, getSession } from "@/lib/live/shell"
import { liveOsint, asLegacyProfile } from "@/lib/live/osint"
import { getThreats } from "@/lib/live/threats"
import { lookupLeaks } from "@/lib/live/leaks"
import { listMessages, sendMessage } from "@/lib/live/messages"
import { sqliteQuery, postgresQuery, vaultStreamsOverview, sqliteInsertEvent } from "@/lib/live/db"
import { listVault, readNote, writeNote, vaultRoot } from "@/lib/live/obsidian"
import { getSigint } from "@/lib/live/sigint"
import { getEdrSnapshot, resetIntegrityBaseline } from "@/lib/live/edr"
import { listReports, generateReport, readReport } from "@/lib/live/reports"
import { liveRecon } from "@/lib/live/recon"
import { getBeastWagon } from "@/lib/live/beastwagon"
import { searchTalent } from "@/lib/live/recruit"

function deny(req: NextRequest, surface: string, mutating = false) {
  return requireHubAuth(req, { surface, requireInSecureMode: mutating })
}

async function handleGET(module: string, req: NextRequest) {
  const url = req.nextUrl
  const q = (k: string) => url.searchParams.get(k) || undefined
  switch (module) {
    case "sys":
    case "system":
      return getSystemSnapshot()
    case "net":
    case "network":
      return getNetworkSnapshot()
    case "firewall-logs":
      return getFirewallLogs(Number(q("limit") || 80))
    case "fs":
    case "files": {
      const preview = q("preview")
      if (preview) return readFilePreview(preview)
      return listDir(q("path"))
    }
    case "shell": {
      const id = q("session")
      if (!id) return { ok: true, backend: "live shell", note: "POST {command, sessionId, flavor} to execute" }
      return { ok: true, session: getSession(id, (q("flavor") as "linux" | "windows") || "linux") }
    }
    case "osint": {
      const target = q("q") || q("target")
      if (!target) return { ok: false, error: "q= target required" }
      const raw = await liveOsint(target)
      return { ...raw, profile: raw && (raw as { ok?: boolean }).ok !== false ? asLegacyProfile(raw as Record<string, unknown>) : null }
    }
    case "threats":
    case "threat":
      return getThreats(Number(q("limit") || 25))
    case "leaks": {
      const target = q("q") || q("target")
      if (!target) return { ok: false, error: "q= email or domain required" }
      return lookupLeaks(target)
    }
    case "messages":
      return listMessages(q("channel"), Number(q("limit") || 200))
    case "db":
    case "vault-streams": {
      const sql = q("sql")
      if (sql) {
        const engine = q("engine") || "sqlite"
        return engine === "postgres" ? postgresQuery(sql) : sqliteQuery(sql)
      }
      return vaultStreamsOverview()
    }
    case "obsidian":
    case "vault": {
      const rel = q("path") || q("rel") || ""
      if (q("read") === "1" || q("read") === "true") return readNote(rel)
      return listVault(rel)
    }
    case "sigint":
    case "signal":
      return getSigint()
    case "edr":
      return getEdrSnapshot()
    case "reports": {
      const name = q("name")
      if (name) return readReport(name)
      return listReports()
    }
    case "recon": {
      const target = q("q") || q("target")
      if (!target) return { ok: false, error: "q= target required" }
      return liveRecon(target, { active: q("active") === "1" })
    }
    case "beastwagon":
      return getBeastWagon()
    case "recruit": {
      const target = q("q") || q("target")
      if (!target) return { ok: false, error: "q= required" }
      return searchTalent(target)
    }
    case "health":
      return {
        ok: true,
        live: true,
        modules: [
          "sys", "net", "firewall-logs", "fs", "shell", "osint", "threats", "leaks",
          "messages", "db", "obsidian", "sigint", "edr", "reports", "recon", "beastwagon", "recruit",
        ],
        vaultRoot: vaultRoot(),
      }
    default:
      return { ok: false, error: `unknown live module "${module}"` }
  }
}

async function handlePOST(module: string, req: NextRequest, body: Record<string, unknown>) {
  switch (module) {
    case "shell":
      return execShell({
        sessionId: body.sessionId ? String(body.sessionId) : undefined,
        command: String(body.command || body.cmd || ""),
        flavor: body.flavor === "windows" ? "windows" : "linux",
      })
    case "messages":
      return sendMessage({
        from: body.from ? String(body.from) : undefined,
        to: body.to ? String(body.to) : undefined,
        body: String(body.body || body.text || ""),
        channel: body.channel ? String(body.channel) : undefined,
      })
    case "db":
    case "vault-streams": {
      const sql = String(body.sql || body.query || "")
      const engine = String(body.engine || "sqlite")
      if (body.op === "event") return sqliteInsertEvent(String(body.source || "hub"), String(body.kind || "note"), body.payload)
      return engine === "postgres" ? postgresQuery(sql) : sqliteQuery(sql)
    }
    case "obsidian":
    case "vault": {
      const rel = String(body.path || body.rel || "")
      const content = String(body.content ?? body.body ?? "")
      return writeNote(rel, content)
    }
    case "edr":
      if (body.op === "reset-baseline") return resetIntegrityBaseline()
      return getEdrSnapshot()
    case "reports":
      if (body.op === "generate" || body.generate) return generateReport()
      return listReports()
    case "osint": {
      const raw = await liveOsint(String(body.q || body.target || ""))
      return { ...raw, profile: raw && (raw as { ok?: boolean }).ok !== false ? asLegacyProfile(raw as Record<string, unknown>) : null }
    }
    case "recon":
      return liveRecon(String(body.q || body.target || body.domain || ""), { active: Boolean(body.active) })
    case "leaks":
      return lookupLeaks(String(body.q || body.target || body.query || ""))
    case "recruit":
      return searchTalent(String(body.q || body.target || body.query || ""))
    default:
      return { ok: false, error: `POST not supported for "${module}"` }
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ module: string }> }) {
  const { module } = await ctx.params
  // Read-only live facts are unauthenticated (same pattern as /api/offsec/tools).
  // Mutating POSTs still go through requireHubAuth.
  void req
  try {
    const data = await handleGET(module, req)
    const status = (data as { ok?: boolean }).ok === false ? 400 : 200
    return NextResponse.json(data, { status })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ module: string }> }) {
  const { module } = await ctx.params
  const mutating = ["shell", "messages", "db", "vault-streams", "obsidian", "vault", "edr", "reports"].includes(module)
  const denied = deny(req, `live:${module}`, mutating)
  if (denied) return denied
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  try {
    const data = await handlePOST(module, req, body)
    const status = (data as { ok?: boolean }).ok === false ? 400 : 200
    return NextResponse.json(data, { status })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

