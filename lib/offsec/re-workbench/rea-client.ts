/**
 * Minimal MCP client for REA (morluto/rea, MIT). REA's published transport is
 * stdio (`rea-agents mcp`), so the primary mode spawns REA_MCP_COMMAND without
 * a shell. REA_MCP_URL is an optional Streamable-HTTP endpoint for operators
 * who expose REA through an MCP HTTP bridge. When neither is configured we
 * report that honestly; nothing is ever synthesized.
 *
 * Verified against rea-agents 6.8.0 (protocol 2025-06-18, 229 tools).
 */

import { spawn, type ChildProcessWithoutNullStreams } from "child_process"

const PROTOCOL = "2025-06-18"
const CLIENT_INFO = { name: "singularity-command-hub-re-workbench", version: "1.0.0" }
const CALL_TIMEOUT_MS = () => Math.max(5_000, Number(process.env.RE_ENGINE_TIMEOUT_MS || "") || 180_000)
const IDLE_KILL_MS = 15 * 60_000

export interface McpTool {
  name: string
  description?: string
  inputSchema?: unknown
}

export interface ReaConfig {
  mode: "stdio" | "http" | "none"
  command?: string[]
  url?: string
}

export function reaConfig(): ReaConfig {
  const url = process.env.REA_MCP_URL?.trim()
  const cmd = process.env.REA_MCP_COMMAND?.trim()
  if (cmd) return { mode: "stdio", command: splitCommand(cmd) }
  if (url) return { mode: "http", url }
  return { mode: "none" }
}

/** Whitespace split with simple "double quote" support. Never passed to a shell. */
export function splitCommand(cmd: string): string[] {
  const out: string[] = []
  const re = /"([^"]*)"|(\S+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(cmd))) out.push(m[1] ?? m[2])
  return out
}

type Pending = { resolve: (v: unknown) => void; reject: (e: Error) => void; timer: NodeJS.Timeout }

class StdioMcp {
  private proc: ChildProcessWithoutNullStreams
  private buf = ""
  private nextId = 0
  private pending = new Map<number, Pending>()
  private stderrTail = ""
  ready: Promise<{ serverInfo?: { name?: string; version?: string } }>
  serverInfo?: { name?: string; version?: string }
  dead = false
  lastUsed = Date.now()

  constructor(argv: string[]) {
    this.proc = spawn(argv[0], argv.slice(1), {
      stdio: ["pipe", "pipe", "pipe"],
      shell: false,
      env: { ...process.env, REA_MCP_OUTPUT_SCHEMA_PROFILE: process.env.REA_MCP_OUTPUT_SCHEMA_PROFILE || "off" },
    })
    this.proc.stdout.setEncoding("utf8")
    this.proc.stdout.on("data", (d: string) => this.onData(d))
    this.proc.stderr.on("data", (d: Buffer) => {
      this.stderrTail = (this.stderrTail + d.toString()).slice(-2000)
    })
    const fail = (why: string) => {
      this.dead = true
      for (const p of this.pending.values()) {
        clearTimeout(p.timer)
        p.reject(new Error(`${why}${this.stderrTail ? ` — stderr: ${this.stderrTail.slice(-400)}` : ""}`))
      }
      this.pending.clear()
    }
    this.proc.on("error", (e) => fail(`REA process failed to start: ${e.message}`))
    this.proc.on("exit", (code) => fail(`REA process exited (code ${code})`))
    this.ready = this.request("initialize", {
      protocolVersion: PROTOCOL,
      capabilities: {},
      clientInfo: CLIENT_INFO,
    }).then((r) => {
      const res = r as { serverInfo?: { name?: string; version?: string } }
      this.serverInfo = res.serverInfo
      this.notify("notifications/initialized")
      return res
    })
  }

  private onData(d: string) {
    this.buf += d
    let i: number
    while ((i = this.buf.indexOf("\n")) >= 0) {
      const line = this.buf.slice(0, i).trim()
      this.buf = this.buf.slice(i + 1)
      if (!line) continue
      let msg: { id?: number; result?: unknown; error?: { message?: string } }
      try {
        msg = JSON.parse(line)
      } catch {
        continue
      }
      if (typeof msg.id !== "number") continue
      const p = this.pending.get(msg.id)
      if (!p) continue
      this.pending.delete(msg.id)
      clearTimeout(p.timer)
      if (msg.error) p.reject(new Error(msg.error.message || "MCP error"))
      else p.resolve(msg.result)
    }
  }

  notify(method: string, params?: unknown) {
    if (this.dead) return
    this.proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, ...(params ? { params } : {}) }) + "\n")
  }

  request(method: string, params?: unknown): Promise<unknown> {
    if (this.dead) return Promise.reject(new Error("REA process is not running"))
    this.lastUsed = Date.now()
    const id = ++this.nextId
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`REA ${method} timed out after ${CALL_TIMEOUT_MS()}ms`))
      }, CALL_TIMEOUT_MS())
      this.pending.set(id, { resolve, reject, timer })
      this.proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params: params ?? {} }) + "\n")
    })
  }

  kill() {
    this.dead = true
    try {
      this.proc.kill("SIGTERM")
    } catch {
      /* ignore */
    }
  }
}

class HttpMcp {
  private sessionId: string | null = null
  private nextId = 0
  ready: Promise<{ serverInfo?: { name?: string; version?: string } }>
  serverInfo?: { name?: string; version?: string }
  dead = false
  lastUsed = Date.now()

  constructor(private url: string) {
    this.ready = this.request("initialize", {
      protocolVersion: PROTOCOL,
      capabilities: {},
      clientInfo: CLIENT_INFO,
    }).then(async (r) => {
      const res = r as { serverInfo?: { name?: string; version?: string } }
      this.serverInfo = res.serverInfo
      await this.post({ jsonrpc: "2.0", method: "notifications/initialized" }).catch(() => null)
      return res
    })
  }

  private async post(body: unknown): Promise<Response> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "MCP-Protocol-Version": PROTOCOL,
    }
    if (this.sessionId) headers["Mcp-Session-Id"] = this.sessionId
    const res = await fetch(this.url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(CALL_TIMEOUT_MS()),
    })
    const sid = res.headers.get("mcp-session-id")
    if (sid) this.sessionId = sid
    return res
  }

  async request(method: string, params?: unknown): Promise<unknown> {
    this.lastUsed = Date.now()
    const id = ++this.nextId
    const res = await this.post({ jsonrpc: "2.0", id, method, params: params ?? {} })
    if (!res.ok) throw new Error(`REA HTTP ${res.status} at ${this.url}`)
    const ct = res.headers.get("content-type") || ""
    const text = await res.text()
    const msgs: Array<{ id?: number; result?: unknown; error?: { message?: string } }> = []
    if (ct.includes("text/event-stream")) {
      for (const line of text.split("\n")) {
        if (!line.startsWith("data:")) continue
        try {
          msgs.push(JSON.parse(line.slice(5).trim()))
        } catch {
          /* skip */
        }
      }
    } else {
      const j = JSON.parse(text)
      msgs.push(...(Array.isArray(j) ? j : [j]))
    }
    const hit = msgs.find((m) => m.id === id)
    if (!hit) throw new Error("REA HTTP response did not contain a matching JSON-RPC id")
    if (hit.error) throw new Error(hit.error.message || "MCP error")
    return hit.result
  }

  kill() {
    this.dead = true
  }
}

type Client = StdioMcp | HttpMcp
const g = globalThis as unknown as { __reaClient?: Client; __reaIdle?: NodeJS.Timeout; __reaOpened?: string | null }

/** Which workbench session currently has its binary open in the live REA process. */
export function reaOpenedSession(): string | null {
  return g.__reaClient && !g.__reaClient.dead ? g.__reaOpened ?? null : null
}
export function markReaOpened(sessionId: string | null) {
  g.__reaOpened = sessionId
}

function getClient(): Client | null {
  const cfg = reaConfig()
  if (cfg.mode === "none") return null
  if (g.__reaClient && !g.__reaClient.dead) return g.__reaClient
  g.__reaClient = cfg.mode === "stdio" ? new StdioMcp(cfg.command!) : new HttpMcp(cfg.url!)
  g.__reaOpened = null // a fresh REA process has nothing open
  if (!g.__reaIdle) {
    g.__reaIdle = setInterval(() => {
      const c = g.__reaClient
      if (c && Date.now() - c.lastUsed > IDLE_KILL_MS) {
        c.kill()
        g.__reaClient = undefined
      }
    }, 60_000)
    g.__reaIdle.unref?.()
  }
  return g.__reaClient
}

export function resetReaClient() {
  g.__reaClient?.kill()
  g.__reaClient = undefined
  g.__reaOpened = null
}

export class ReaNotConfiguredError extends Error {
  constructor() {
    super("REA MCP server not configured: set REA_MCP_COMMAND (stdio, e.g. `rea mcp`) or REA_MCP_URL (HTTP bridge).")
  }
}

export async function reaHandshake(): Promise<{ name?: string; version?: string }> {
  const c = getClient()
  if (!c) throw new ReaNotConfiguredError()
  const r = await c.ready
  return r.serverInfo || {}
}

export async function reaListTools(): Promise<McpTool[]> {
  const c = getClient()
  if (!c) throw new ReaNotConfiguredError()
  await c.ready
  const r = (await c.request("tools/list", {})) as { tools?: McpTool[] }
  return r.tools || []
}

export interface ReaCallResult {
  isError: boolean
  /** Parsed structured result (structuredContent or JSON text), else raw text. */
  payload: unknown
}

export async function reaCallTool(name: string, args: Record<string, unknown>): Promise<ReaCallResult> {
  const c = getClient()
  if (!c) throw new ReaNotConfiguredError()
  await c.ready
  const r = (await c.request("tools/call", { name, arguments: args })) as {
    isError?: boolean
    structuredContent?: unknown
    content?: Array<{ type: string; text?: string }>
  }
  return { isError: !!r.isError, payload: parseToolPayload(r) }
}

/** REA returns {result:…} or {error:…} either as structuredContent or JSON text. */
export function parseToolPayload(r: {
  structuredContent?: unknown
  content?: Array<{ type: string; text?: string }>
}): unknown {
  if (r.structuredContent !== undefined) return r.structuredContent
  const text = (r.content || [])
    .filter((c) => c.type === "text")
    .map((c) => c.text || "")
    .join("\n")
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}
