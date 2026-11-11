/**
 * Child-process helpers. Always execFile/spawn with an argument array —
 * never a shell string, never interpolation of user input into a command line.
 */

import { execFile, spawn, type ChildProcess } from "child_process"
import { promisify } from "util"

const execFileAsync = promisify(execFile)

export interface RunResult {
  stdout: string
  stderr: string
  code: number
}

export async function runFile(
  bin: string,
  args: readonly string[],
  opts: { timeoutMs?: number; cwd?: string; input?: string; maxBuffer?: number; env?: NodeJS.ProcessEnv } = {},
): Promise<RunResult> {
  const env = opts.env || process.env
  // stdin support: execFile can't easily write stdin, use spawn when input is set.
  if (opts.input != null) {
    return runWithStdin(bin, args, opts.input, opts)
  }
  try {
    const { stdout, stderr } = await execFileAsync(bin, [...args], {
      timeout: opts.timeoutMs ?? 20_000,
      cwd: opts.cwd,
      maxBuffer: opts.maxBuffer ?? 8 * 1024 * 1024,
      env,
    })
    return { stdout: String(stdout), stderr: String(stderr), code: 0 }
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; code?: number | string; killed?: boolean; message?: string }
    if (e.killed) {
      throw new Error(`command timed out: ${bin}`)
    }
    // execFile throws on non-zero. Surface stdout/stderr rather than losing output.
    return {
      stdout: String(e.stdout || ""),
      stderr: String(e.stderr || e.message || ""),
      code: typeof e.code === "number" ? e.code : 1,
    }
  }
}

function runWithStdin(
  bin: string,
  args: readonly string[],
  input: string,
  opts: { timeoutMs?: number; cwd?: string; env?: NodeJS.ProcessEnv; maxBuffer?: number },
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, [...args], {
      cwd: opts.cwd,
      env: opts.env || process.env,
      stdio: ["pipe", "pipe", "pipe"],
    })
    let stdout = ""
    let stderr = ""
    const cap = opts.maxBuffer ?? 8 * 1024 * 1024
    const timer = setTimeout(() => {
      child.kill("SIGKILL")
      reject(new Error(`command timed out: ${bin}`))
    }, opts.timeoutMs ?? 20_000)
    child.stdout.on("data", (d: Buffer) => {
      if (stdout.length < cap) stdout += d.toString()
    })
    child.stderr.on("data", (d: Buffer) => {
      if (stderr.length < cap) stderr += d.toString()
    })
    child.on("error", (err) => {
      clearTimeout(timer)
      reject(err)
    })
    child.on("close", (code) => {
      clearTimeout(timer)
      resolve({ stdout, stderr, code: code ?? 1 })
    })
    child.stdin.write(input)
    child.stdin.end()
  })
}

/**
 * Detach a long-running process (emulator, scrcpy). The parent does not wait.
 */
export function spawnDetached(bin: string, args: readonly string[], env?: NodeJS.ProcessEnv): ChildProcess {
  const child = spawn(bin, [...args], {
    detached: true,
    stdio: "ignore",
    env: env || process.env,
  })
  child.unref()
  return child
}
