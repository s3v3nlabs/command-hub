import { execFile } from "child_process"

export const ENGINE_TIMEOUT_MS = () => Math.max(5_000, Number(process.env.RE_ENGINE_TIMEOUT_MS || "") || 180_000)

/** execFile wrapper — argv only, never a shell. */
export function run(
  bin: string,
  args: string[],
  opts: { timeoutMs?: number; env?: NodeJS.ProcessEnv; cwd?: string } = {},
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    execFile(
      bin,
      args,
      { timeout: opts.timeoutMs ?? ENGINE_TIMEOUT_MS(), maxBuffer: 64 * 1024 * 1024, env: opts.env ?? process.env, cwd: opts.cwd, shell: false },
      (err, stdout, stderr) => {
        const e = err as (NodeJS.ErrnoException & { code?: number | string; killed?: boolean }) | null
        resolve({
          code: e ? (typeof e.code === "number" ? e.code : e.killed ? 124 : 1) : 0,
          stdout: String(stdout || ""),
          stderr: String(stderr || "") + (e && typeof e.code === "string" ? `\n${e.code}: ${e.message}` : ""),
        })
      },
    )
  })
}
