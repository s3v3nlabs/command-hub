/**
 * radare2 headless adapter (static only). Hard rules:
 *  - target opened read-only (no -w), never with -d (debugger) — nothing executes;
 *  - `-N` ignores rc files, `cfg.sandbox=true` disables `!` shell escapes, file
 *    writes and network in r2 itself;
 *  - subjects are validated by sanitizeSubject() before being placed in a command.
 */

import fs from "fs"
import path from "path"
import { run } from "./proc"
import type { StaticOp } from "./types"

export function r2Binary(): string | null {
  const explicit = process.env.RADARE2_BIN?.trim()
  if (explicit) return fs.existsSync(explicit) ? explicit : null
  for (const dir of (process.env.PATH || "").split(path.delimiter)) {
    for (const name of ["radare2", "r2"]) {
      const p = path.join(dir, name)
      try {
        fs.accessSync(p, fs.constants.X_OK)
        return p
      } catch {
        /* next */
      }
    }
  }
  return null
}

export async function r2Version(bin: string): Promise<string | undefined> {
  const r = await run(bin, ["-v"], { timeoutMs: 5000 })
  return r.stdout.split("\n")[0]?.trim() || undefined
}

const ANALYSIS = () => (/^a{2,4}$/.test(process.env.RE_R2_ANALYSIS || "") ? process.env.RE_R2_ANALYSIS! : "aa")

/** Build the r2 command string for an op. Subject must already be sanitized. */
export function r2Command(op: StaticOp, subject?: string): { cmd: string; json: boolean } {
  const a = ANALYSIS()
  switch (op) {
    case "overview":
      return { cmd: "ij", json: true }
    case "functions":
      return { cmd: `${a};aflj`, json: true }
    case "strings":
      return { cmd: "izj", json: true }
    case "symbols":
      return { cmd: "isj", json: true }
    case "imports":
      return { cmd: "iij", json: true }
    case "disasm":
      return { cmd: `${a};s ${subject};pdfj`, json: true }
    case "pseudocode":
      return { cmd: `${a};s ${subject};pdc`, json: false }
    case "xrefs":
      return { cmd: `${a};axtj @ ${subject}`, json: true }
  }
}

export const R2_LIMITATIONS: Partial<Record<StaticOp, string[]>> = {
  functions: ["Function boundaries come from radare2 auto-analysis (`aa`); stripped/obfuscated code may be mis-split."],
  pseudocode: [
    "radare2 `pdc` is a naive pseudo-C view, not a true decompiler. Use Ghidra (or REA with a Ghidra/IDA/Hopper provider) for real decompilation.",
  ],
  strings: ["`iz` lists strings in data sections only; runtime-built or encrypted strings will not appear."],
  xrefs: ["Cross-references reflect static analysis only; indirect/computed calls are often missing."],
}

export async function runR2(
  bin: string,
  file: string,
  op: StaticOp,
  subject?: string,
): Promise<{ ok: true; data: unknown; source: string } | { ok: false; error: string; source: string }> {
  const { cmd, json } = r2Command(op, subject)
  // cfg.sandbox confines r2 to its cwd, so run inside the target's own sandbox dir.
  const args = ["-2", "-q", "-N", "-e", "cfg.sandbox=true", "-e", "scr.color=0", "-e", "scr.interactive=false", "-c", cmd, path.basename(file)]
  const source = `radare2 ${args.slice(0, -1).map((x) => (/\s|;/.test(x) ? JSON.stringify(x) : x)).join(" ")} <target>`
  const r = await run(bin, args, { cwd: path.dirname(file) })
  if (r.code !== 0 && !r.stdout.trim()) {
    return { ok: false, error: `radare2 exited ${r.code}: ${r.stderr.trim().slice(0, 600) || "no output"}`, source }
  }
  if (!json) return { ok: true, data: r.stdout, source }
  const text = r.stdout.trim()
  if (!text) return { ok: true, data: [], source }
  try {
    return { ok: true, data: JSON.parse(text), source }
  } catch {
    return { ok: false, error: `radare2 returned non-JSON output: ${text.slice(0, 300)}`, source }
  }
}
