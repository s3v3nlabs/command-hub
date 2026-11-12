
/**
 * Real interactive shell sessions for the hub terminals.
 * Each session has a cwd restricted to allowed roots. Commands are executed
 * with bash -lc after a deny-list check, OR dispatched to lab verbs.
 * Windows-syntax commands are translated and then executed for real.
 */
import fs from "fs"
import path from "path"
import os from "os"
import crypto from "crypto"
import { runBash, runFile, type ExecResult } from "./exec"
import { runLabVerb, getLabVerb, listLabVerbs } from "@/lib/offsec/lab-exec"
import { resolveAllowed, listDir, allowedRoots } from "./fs-browse"

const SESS_DIR = path.join(process.cwd(), "local-data", "shell-sessions")
const DEFAULT_HOME = path.join(process.cwd(), "local-data", "shell-home")

const DENY = [
  /^\s*rm\s+(-[a-zA-Z]*f[a-zA-Z]*\s+)?(\/|\*|~|\/\*|\/home|\/etc|\/usr|\/var|\/boot|\/dev)/,
  /^\s*(sudo\s+)?(shutdown|reboot|halt|poweroff|init\s+[06]|mkfs|fdisk|parted|dd\s+.*of=\/dev)/i,
  /^\s*chmod\s+.*\s+\/(\s|$)/,
  /^\s*:\(\)\s*\{/,
  /^\s*mkfs\./,
  /^\s*(iptables|nft)\s+(-F|--flush|delete|flush)/i,
]

export interface ShellSession {
  id: string
  cwd: string
  createdAt: string
  lastAt: string
  flavor: "linux" | "windows"
}

function ensureHome() {
  fs.mkdirSync(DEFAULT_HOME, { recursive: true, mode: 0o755 })
  fs.mkdirSync(SESS_DIR, { recursive: true, mode: 0o700 })
  const readme = path.join(DEFAULT_HOME, "README.txt")
  if (!fs.existsSync(readme)) {
    fs.writeFileSync(
      readme,
      "Command Hub lab shell home — real files on this host.\nOperator: S3v3n@SingularityDefense / SLDS\n",
    )
  }
}

function sessPath(id: string) {
  return path.join(SESS_DIR, `${id}.json`)
}

export function getSession(id: string, flavor: "linux" | "windows" = "linux"): ShellSession {
  ensureHome()
  try {
    const s = JSON.parse(fs.readFileSync(sessPath(id), "utf8")) as ShellSession
    return s
  } catch {
    const s: ShellSession = { id, cwd: DEFAULT_HOME, createdAt: new Date().toISOString(), lastAt: new Date().toISOString(), flavor }
    fs.writeFileSync(sessPath(id), JSON.stringify(s, null, 2), { mode: 0o600 })
    return s
  }
}

function saveSession(s: ShellSession) {
  s.lastAt = new Date().toISOString()
  fs.writeFileSync(sessPath(s.id), JSON.stringify(s, null, 2), { mode: 0o600 })
}

function translateWindows(cmd: string): { command: string; note?: string } {
  const raw = cmd.trim()
  const lower = raw.toLowerCase()
  const rest = raw.replace(/^\S+\s*/, "")
  if (lower === "cls" || lower === "clear") return { command: "clear" }
  if (lower === "dir" || lower.startsWith("dir ")) return { command: `ls -la ${rest}`.trim(), note: "dir → ls -la (real)" }
  if (lower.startsWith("type ")) return { command: `cat ${rest}`, note: "type → cat (real)" }
  if (lower === "cd" || lower.startsWith("cd ")) return { command: raw }
  if (lower === "ver") return { command: "uname -a", note: "ver → uname -a (Linux host, real)" }
  if (lower === "systeminfo") return { command: "uname -a && cat /etc/os-release && lscpu | head -20 && free -h", note: "systeminfo → real host facts" }
  if (lower === "ipconfig" || lower.startsWith("ipconfig ")) return { command: "ip -br addr && ip route", note: "ipconfig → ip (real)" }
  if (lower === "tasklist") return { command: "ps -eo pid,user,rss,stat,comm --sort=-rss | head -40", note: "tasklist → ps (real)" }
  if (lower === "netstat" || lower.startsWith("netstat ")) return { command: "ss -tulpn", note: "netstat → ss (real)" }
  if (lower.startsWith("findstr ")) return { command: `grep ${rest}`, note: "findstr → grep (real)" }
  if (lower.startsWith("copy ")) return { command: `cp ${rest}`, note: "copy → cp (real)" }
  if (lower.startsWith("del ") || lower.startsWith("erase ")) return { command: `rm ${rest}`, note: "del → rm (real, still subject to deny-list)" }
  if (lower.startsWith("mkdir ") || lower.startsWith("md ")) return { command: `mkdir -p ${rest}` }
  if (lower.startsWith("rmdir ")) return { command: `rmdir ${rest}` }
  if (lower === "hostname") return { command: "hostname -f" }
  if (lower === "whoami") return { command: "whoami" }
  if (lower === "set" || lower === "set ") return { command: "env | sort" }
  if (lower.startsWith("echo ")) return { command: raw }
  if (lower.startsWith("get-process")) return { command: "ps -eo pid,user,rss,stat,comm --sort=-rss | head -40", note: "Get-Process → ps (real)" }
  if (lower.startsWith("get-childitem") || lower === "gci" || lower === "ls") return { command: "ls -la", note: "Get-ChildItem → ls (real)" }
  return { command: raw, note: "executed as-is on the Linux host (Windows flavor is command syntax, not a Windows VM)" }
}

function denied(cmd: string): string | null {
  for (const re of DENY) if (re.test(cmd)) return `blocked by deny-list: ${cmd}`
  if (/\brm\s+-[a-zA-Z]*r[a-zA-Z]*f\s+\//.test(cmd)) return "blocked: recursive delete of a root path"
  return null
}

export interface ShellExecOut {
  ok: boolean
  sessionId: string
  cwd: string
  command: string
  translated?: string
  note?: string
  stdout: string
  stderr: string
  exitCode: number | null
  durationMs: number
  backend: string
  live: true
  hostname: string
  error?: string
}

export async function execShell(opts: { sessionId?: string; command: string; flavor?: "linux" | "windows" }): Promise<ShellExecOut> {
  ensureHome()
  const flavor = opts.flavor || "linux"
  const session = getSession(opts.sessionId || crypto.randomUUID(), flavor)
  const incoming = (opts.command || "").trim()
  const backend = flavor === "windows"
    ? "bash on Linux host, Windows command translation (live)"
    : "bash on this host (live, cwd-jailed, deny-listed)"

  const base = {
    sessionId: session.id,
    cwd: session.cwd,
    command: incoming,
    backend,
    live: true as const,
    hostname: os.hostname(),
  }

  if (!incoming) {
    return { ok: false, ...base, stdout: "", stderr: "", exitCode: null, durationMs: 0, error: "command required" }
  }
  if (incoming === "help" || incoming === "?") {
    const verbs = listLabVerbs().map((v) => `  verb:${v.id.padEnd(18)} ${v.summary}`).join("\n")
    const roots = allowedRoots().map((r) => `  ${r.label}: ${r.path}`).join("\n")
    const stdout =
      `Command Hub live shell — S3v3n@SingularityDefense\n` +
      `Flavor: ${flavor}. Real child_process on ${os.hostname()}.\n` +
      `Cwd is jailed to allowed roots:\n${roots}\n\n` +
      `Any normal command runs in the current cwd after a deny-list check.\n` +
      `Lab verbs (prefix with "verb:" or just the id if it matches):\n${verbs}\n` +
      `  help, clear, cd, pwd, ls, cat are all real.\n`
    return { ok: true, ...base, stdout, stderr: "", exitCode: 0, durationMs: 0 }
  }

  const translated = flavor === "windows" ? translateWindows(incoming) : { command: incoming }
  const cmd = translated.command

  // cd is handled in-process so the session cwd persists
  if (/^\s*cd\s*$/.test(cmd) || /^\s*cd\s+/.test(cmd)) {
    const arg = cmd.replace(/^\s*cd\s*/, "").trim().replace(/^["']|["']$/g, "") || DEFAULT_HOME
    const target = path.resolve(session.cwd, arg)
    const allowed = resolveAllowed(target)
    if ("error" in allowed) {
      return { ok: false, ...base, translated: cmd, note: translated.note, stdout: "", stderr: allowed.error, exitCode: 1, durationMs: 0, error: allowed.error }
    }
    try {
      const st = fs.statSync(allowed.abs)
      if (!st.isDirectory()) {
        return { ok: false, ...base, translated: cmd, stdout: "", stderr: "not a directory", exitCode: 1, durationMs: 0, error: "not a directory" }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return { ok: false, ...base, translated: cmd, stdout: "", stderr: msg, exitCode: 1, durationMs: 0, error: msg }
    }
    session.cwd = allowed.abs
    saveSession(session)
    return { ok: true, ...base, cwd: session.cwd, translated: cmd, note: translated.note, stdout: session.cwd, stderr: "", exitCode: 0, durationMs: 0 }
  }

  const block = denied(cmd)
  if (block) {
    return { ok: false, ...base, translated: cmd, stdout: "", stderr: block, exitCode: 126, durationMs: 0, error: block }
  }

  // lab verb short-circuit: "verb:whoami" or exact verb id with optional arg
  const verbMatch = cmd.match(/^(?:verb:)?([a-z0-9-]+)(?:\s+(.+))?$/i)
  if (verbMatch && getLabVerb(verbMatch[1])) {
    const result = await runLabVerb(verbMatch[1], verbMatch[2])
    return {
      ok: result.ok,
      ...base,
      translated: result.argv.join(" "),
      note: translated.note,
      stdout: result.stdout,
      stderr: result.stderr || result.error || "",
      exitCode: result.exitCode,
      durationMs: result.durationMs,
      error: result.error,
    }
  }

  const result: ExecResult = await runBash(cmd, { cwd: session.cwd, timeoutMs: 20_000, maxOut: 80_000 })
  // if the command was `pwd`, keep cwd; detect a chdir in a subshell doesn't persist, which is correct
  saveSession(session)
  return {
    ok: result.ok,
    ...base,
    cwd: session.cwd,
    translated: cmd !== incoming ? cmd : undefined,
    note: translated.note,
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
    durationMs: result.durationMs,
    error: result.error,
  }
}

export { listDir, DEFAULT_HOME }
