/**
 * Real child_process runner used by every live backend.
 * argv arrays only (no untrusted shell string), output caps, timeouts.
 */
import { execFile } from "child_process"
import { promisify } from "util"
import os from "os"

const execFileAsync = promisify(execFile)

export interface ExecResult {
  ok: boolean
  argv: string[]
  stdout: string
  stderr: string
  exitCode: number | null
  timedOut: boolean
  durationMs: number
  hostname: string
  error?: string
}

export async function runFile(
  bin: string,
  args: string[] = [],
  opts: { timeoutMs?: number; maxOut?: number; cwd?: string; env?: NodeJS.ProcessEnv; shell?: false } = {},
): Promise<ExecResult> {
  const timeoutMs = opts.timeoutMs ?? 10_000
  const maxOut = opts.maxOut ?? 64_000
  const started = Date.now()
  const base = { argv: [bin, ...args], hostname: os.hostname() }
  try {
    const { stdout, stderr } = await execFileAsync(bin, args, {
      timeout: timeoutMs,
      maxBuffer: maxOut + 2048,
      cwd: opts.cwd,
      env: { ...process.env, PATH: process.env.PATH || "/usr/bin:/bin:/usr/sbin:/sbin", HOME: process.env.HOME || "", ...(opts.env || {}) } as NodeJS.ProcessEnv,
    })
    return {
      ok: true,
      ...base,
      stdout: trim(String(stdout || ""), maxOut),
      stderr: trim(String(stderr || ""), Math.min(8000, maxOut)),
      exitCode: 0,
      timedOut: false,
      durationMs: Date.now() - started,
    }
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string; code?: string | number; killed?: boolean; message?: string }
    const timedOut = err.code === "ETIMEDOUT" || !!err.killed
    const missing = err.code === "ENOENT"
    return {
      ok: false,
      ...base,
      stdout: trim(String(err.stdout || ""), maxOut),
      stderr: trim(String(err.stderr || err.message || ""), Math.min(8000, maxOut)),
      exitCode: typeof err.code === "number" ? err.code : timedOut ? null : 1,
      timedOut,
      durationMs: Date.now() - started,
      error: missing
        ? `${bin} is not installed on this host`
        : timedOut
          ? `${bin} timed out after ${timeoutMs}ms`
          : err.message,
    }
  }
}

/** bash -lc in a jail cwd. Still used only after a deny-list check. */
export async function runBash(
  command: string,
  opts: { timeoutMs?: number; maxOut?: number; cwd: string; env?: NodeJS.ProcessEnv } = { cwd: process.cwd() },
): Promise<ExecResult> {
  return runFile("bash", ["-lc", command], {
    timeoutMs: opts.timeoutMs ?? 15_000,
    maxOut: opts.maxOut,
    cwd: opts.cwd,
    env: opts.env,
  })
}

function trim(s: string, max: number): string {
  if (s.length <= max) return s
  return s.slice(0, max) + `\n…[truncated ${s.length - max} bytes]`
}
