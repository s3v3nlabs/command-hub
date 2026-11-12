/**
 * Lab command executor — real child_process runs against the hub host / isolated lab.
 * Allowlisted verbs only; argv arrays only (never a shell). Targets must be local/lab
 * addresses. The scope ladder is the authorization gate; this module is the muscle.
 */

import { execFile } from "child_process"
import { promisify } from "util"
import os from "os"

const execFileAsync = promisify(execFile)

export interface LabExecResult {
  ok: boolean
  verb: string
  argv: string[]
  stdout: string
  stderr: string
  exitCode: number | null
  timedOut: boolean
  durationMs: number
  hostname: string
  error?: string
}

export interface LabVerb {
  id: string
  summary: string
  /** Build argv. Return { bin, args }. Throw on bad operator input. */
  build: (arg?: string) => { bin: string; args: string[] }
  timeoutMs?: number
  maxOut?: number
}

const MAX_OUT_DEFAULT = 32_000
const TIMEOUT_DEFAULT = 8_000

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return s.slice(0, max) + `\n…[truncated ${s.length - max} bytes]`
}

/** True only for the hub itself or RFC1918 / lab-local identifiers. */
export function isLabHost(host: string | undefined | null): boolean {
  if (!host) return false
  const h = host.trim().toLowerCase().replace(/\.+$/, "")
  if (!h) return false
  if (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "::1" ||
    h === "0.0.0.0" ||
    h === "lab.local" ||
    h === "hub" ||
    h === "self" ||
    h === os.hostname().toLowerCase()
  ) {
    return true
  }
  if (h.endsWith(".lab.local") || h.endsWith(".localhost")) return true
  // IPv4 RFC1918 + loopback + link-local
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])]
    if (a === 127) return true
    if (a === 10) return true
    if (a === 192 && b === 168) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 169 && b === 254) return true
    return false
  }
  return false
}

function assertSafeToken(s: string, what: string): string {
  const t = s.trim()
  if (!t) throw new Error(`${what} required`)
  if (t.length > 400) throw new Error(`${what} too long`)
  if (!/^[A-Za-z0-9_./:@%+=, -]+$/.test(t)) {
    throw new Error(`${what} contains disallowed characters`)
  }
  return t
}

function assertLocalUrl(raw: string): string {
  const t = assertSafeToken(raw, "url")
  let u: URL
  try {
    u = new URL(t)
  } catch {
    throw new Error("url must be a valid http(s) URL")
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("only http(s) allowed")
  if (!isLabHost(u.hostname)) throw new Error(`url host ${u.hostname} is not a lab/local address`)
  return u.toString()
}

function assertSafeSql(sql: string): string {
  const t = sql.trim()
  if (!t) throw new Error("sql required")
  if (t.length > 500) throw new Error("sql too long")
  if (/[;`]/.test(t)) throw new Error("sql must be a single statement")
  if (!/^\s*select\b/i.test(t)) throw new Error("only SELECT is allowed")
  if (/\b(insert|update|delete|drop|alter|attach|pragma|create|replace|vacuum)\b/i.test(t)) {
    throw new Error("mutating SQL is not allowed")
  }
  return t
}

export const LAB_VERBS: LabVerb[] = [
  { id: "whoami", summary: "hub process user (whoami)", build: () => ({ bin: "whoami", args: [] }) },
  { id: "id", summary: "uid/gid (id)", build: () => ({ bin: "id", args: [] }) },
  { id: "uname", summary: "kernel / arch (uname -a)", build: () => ({ bin: "uname", args: ["-a"] }) },
  { id: "hostname", summary: "hostname -f", build: () => ({ bin: "hostname", args: ["-f"] }) },
  { id: "uptime", summary: "uptime", build: () => ({ bin: "uptime", args: [] }) },
  { id: "date", summary: "UTC date", build: () => ({ bin: "date", args: ["-u", "+%Y-%m-%dT%H:%M:%SZ"] }) },
  { id: "pwd", summary: "hub cwd", build: () => ({ bin: "pwd", args: [] }) },
  { id: "ps", summary: "top processes by RSS", build: () => ({ bin: "ps", args: ["-eo", "pid,user,rss,stat,comm", "--sort=-rss"] }), maxOut: 16_000 },
  { id: "listen", summary: "listening TCP/UDP sockets (ss)", build: () => ({ bin: "ss", args: ["-lntup"] }) },
  { id: "df", summary: "disk free", build: () => ({ bin: "df", args: ["-h"] }) },
  { id: "free", summary: "memory", build: () => ({ bin: "free", args: ["-h"] }) },
  {
    id: "osquery-system",
    summary: "osquery system_info",
    build: () => ({ bin: "osqueryi", args: ["--json", "SELECT hostname, cpu_brand, physical_memory, hardware_vendor, hardware_model, uuid FROM system_info"] }),
  },
  {
    id: "osquery-processes",
    summary: "osquery top processes",
    build: () => ({
      bin: "osqueryi",
      args: ["--json", "SELECT pid, name, path, uid, resident_size FROM processes ORDER BY resident_size DESC LIMIT 25"],
    }),
  },
  {
    id: "osquery-listening",
    summary: "osquery listening_ports",
    build: () => ({
      bin: "osqueryi",
      args: ["--json", "SELECT pid, port, protocol, address, family FROM listening_ports WHERE port != 0 LIMIT 80"],
    }),
  },
  {
    id: "osquery-users",
    summary: "osquery users",
    build: () => ({ bin: "osqueryi", args: ["--json", "SELECT uid, gid, username, directory, shell FROM users WHERE uid >= 0 LIMIT 40"] }),
  },
  {
    id: "osquery",
    summary: "osqueryi --json <SELECT…>",
    build: (arg) => ({ bin: "osqueryi", args: ["--json", assertSafeSql(arg || "SELECT * FROM system_info")] }),
  },
  { id: "nft-list", summary: "nft -a list ruleset", build: () => ({ bin: "nft", args: ["-a", "list", "ruleset"] }), timeoutMs: 10_000 },
  { id: "iptables-list", summary: "iptables -L -n -v", build: () => ({ bin: "iptables", args: ["-L", "-n", "-v"] }) },
  {
    id: "tcpdump-snap",
    summary: "3s / 12-packet snap on any (tcpdump)",
    build: () => ({ bin: "timeout", args: ["3", "tcpdump", "-c", "12", "-nn", "-i", "any"] }),
    timeoutMs: 6_000,
  },
  {
    id: "curl-local",
    summary: "curl a lab/local URL (arg = URL)",
    build: (arg) => ({
      bin: "curl",
      args: ["-sv", "--max-time", "5", "--max-redirs", "2", "-o", "-", "-w", "\n\nHTTP_CODE=%{http_code} TIME=%{time_total}", assertLocalUrl(arg || "http://127.0.0.1:3000/")],
    }),
    timeoutMs: 8_000,
  },
  {
    id: "recon",
    summary: "composite local recon (uname + id + listen + uptime)",
    build: () => ({ bin: "uname", args: ["-a"] }), // composite handled in runLabVerb
  },
]

const VERB_MAP = new Map(LAB_VERBS.map((v) => [v.id, v]))

export function listLabVerbs(): { id: string; summary: string }[] {
  return LAB_VERBS.map((v) => ({ id: v.id, summary: v.summary }))
}

export function getLabVerb(id: string): LabVerb | undefined {
  return VERB_MAP.get(id.trim().toLowerCase())
}

async function runBin(
  bin: string,
  args: string[],
  opts: { timeoutMs?: number; maxOut?: number } = {},
): Promise<LabExecResult> {
  const timeoutMs = opts.timeoutMs ?? TIMEOUT_DEFAULT
  const maxOut = opts.maxOut ?? MAX_OUT_DEFAULT
  const started = Date.now()
  const base = {
    verb: bin,
    argv: [bin, ...args],
    hostname: os.hostname(),
  }
  try {
    const { stdout, stderr } = await execFileAsync(bin, args, {
      timeout: timeoutMs,
      maxBuffer: maxOut + 1024,
      env: { ...process.env, PATH: process.env.PATH || "/usr/bin:/bin:/usr/sbin:/sbin" },
    })
    return {
      ok: true,
      ...base,
      stdout: truncate(String(stdout || ""), maxOut),
      stderr: truncate(String(stderr || ""), Math.min(8000, maxOut)),
      exitCode: 0,
      timedOut: false,
      durationMs: Date.now() - started,
    }
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string; code?: string | number; killed?: boolean; message?: string }
    const timedOut = err.code === "ETIMEDOUT" || !!err.killed
    const exitCode = typeof err.code === "number" ? err.code : timedOut ? null : 1
    const missing = err.code === "ENOENT"
    return {
      ok: false,
      ...base,
      stdout: truncate(String(err.stdout || ""), maxOut),
      stderr: truncate(String(err.stderr || err.message || ""), Math.min(8000, maxOut)),
      exitCode,
      timedOut,
      durationMs: Date.now() - started,
      error: missing ? `${bin} is not installed on this host` : timedOut ? `${bin} timed out after ${timeoutMs}ms` : err.message,
    }
  }
}

/**
 * Run an allowlisted lab verb. `recon` fans out to several real commands and concatenates.
 */
export async function runLabVerb(verbId: string, arg?: string): Promise<LabExecResult> {
  const id = (verbId || "").trim().toLowerCase()
  // accept legacy verb aliases from the previous C2 UI
  const aliases: Record<string, string> = {
    "sim-recon": "recon",
    "sim-whoami": "whoami",
    whoami: "whoami",
  }
  const resolved = aliases[id] || id
  if (resolved === "recon") {
    const parts = await Promise.all(
      (["uname", "id", "hostname", "uptime", "listen"] as const).map((v) => runLabVerb(v)),
    )
    const stdout = parts
      .map((p) => `── ${p.argv.join(" ")}  (exit ${p.exitCode}, ${p.durationMs}ms) ──\n${p.stdout}${p.stderr ? "\n[stderr]\n" + p.stderr : ""}`)
      .join("\n\n")
    const ok = parts.every((p) => p.ok || p.stdout)
    return {
      ok,
      verb: "recon",
      argv: ["recon"],
      stdout,
      stderr: parts.filter((p) => !p.ok && p.error).map((p) => `${p.verb}: ${p.error}`).join("\n"),
      exitCode: ok ? 0 : 1,
      timedOut: parts.some((p) => p.timedOut),
      durationMs: parts.reduce((a, p) => a + p.durationMs, 0),
      hostname: os.hostname(),
    }
  }
  const verb = getLabVerb(resolved)
  if (!verb) {
    return {
      ok: false,
      verb: resolved,
      argv: [],
      stdout: "",
      stderr: "",
      exitCode: null,
      timedOut: false,
      durationMs: 0,
      hostname: os.hostname(),
      error: `unknown verb "${verbId}". Allowlisted: ${listLabVerbs().map((v) => v.id).join(", ")}`,
    }
  }
  try {
    const { bin, args } = verb.build(arg)
    const r = await runBin(bin, args, { timeoutMs: verb.timeoutMs, maxOut: verb.maxOut })
    r.verb = verb.id
    return r
  } catch (e) {
    return {
      ok: false,
      verb: verb.id,
      argv: [],
      stdout: "",
      stderr: "",
      exitCode: null,
      timedOut: false,
      durationMs: 0,
      hostname: os.hostname(),
      error: e instanceof Error ? e.message : String(e),
    }
  }
}
