/**
 * Ghidra headless adapter (static only). Runs analyzeHeadless with the bundled
 * read-only export script scripts/ghidra/HubExportEvidence.java into a
 * throw-away project under local-data/re-workbench/ghidra-projects/, then
 * deletes the project. The target is imported for analysis, never executed.
 */

import fs from "fs"
import path from "path"
import os from "os"
import { randomUUID } from "crypto"
import { run } from "./proc"
import { rePaths } from "./paths"

export function ghidraHeadless(): string | null {
  const home = process.env.GHIDRA_INSTALL_DIR?.trim() || process.env.GHIDRA_HOME?.trim()
  const candidates = [
    home ? path.join(home, "support", "analyzeHeadless") : "",
    ...(process.env.PATH || "").split(path.delimiter).map((d) => path.join(d, "analyzeHeadless")),
  ].filter(Boolean)
  for (const p of candidates) {
    try {
      fs.accessSync(p, fs.constants.X_OK)
      return p
    } catch {
      /* next */
    }
  }
  return null
}

export function ghidraScriptDir(): string {
  return path.join(process.cwd(), "scripts", "ghidra")
}

export type GhidraMode = "summary" | "function"

export async function runGhidra(
  headless: string,
  file: string,
  mode: GhidraMode,
  subject?: string,
): Promise<{ ok: true; data: Record<string, unknown>; source: string } | { ok: false; error: string; source: string }> {
  const projRoot = rePaths.ghidraProjects()
  fs.mkdirSync(projRoot, { recursive: true, mode: 0o700 })
  const projName = `hub-${randomUUID().slice(0, 8)}`
  const out = path.join(os.tmpdir(), `hub-ghidra-${randomUUID()}.json`)
  const args = [
    projRoot,
    projName,
    "-import",
    file,
    "-scriptPath",
    ghidraScriptDir(),
    "-postScript",
    "HubExportEvidence.java",
    out,
    mode,
    ...(mode === "function" && subject ? [subject] : []),
    "-deleteProject",
  ]
  const source = `analyzeHeadless <proj> ${projName} -import <target> -postScript HubExportEvidence.java <out> ${mode}${subject ? " " + subject : ""} -deleteProject`
  const timeoutMs = Math.max(30_000, Number(process.env.RE_GHIDRA_TIMEOUT_MS || "") || 600_000)
  const r = await run(headless, args, { timeoutMs })
  try {
    if (!fs.existsSync(out)) {
      const tail = (r.stdout + "\n" + r.stderr).split("\n").filter((l) => /ERROR|Exception|error/i.test(l)).slice(-6).join("\n")
      return { ok: false, error: `Ghidra produced no evidence (exit ${r.code}). ${tail.slice(0, 800)}`, source }
    }
    const data = JSON.parse(fs.readFileSync(out, "utf8")) as Record<string, unknown>
    if (typeof data.error === "string") return { ok: false, error: data.error, source }
    return { ok: true, data, source }
  } catch (e) {
    return { ok: false, error: `Ghidra evidence unreadable: ${(e as Error).message}`, source }
  } finally {
    fs.rmSync(out, { force: true })
    fs.rmSync(path.join(projRoot, `${projName}.gpr`), { force: true })
    fs.rmSync(path.join(projRoot, `${projName}.rep`), { recursive: true, force: true })
  }
}
