/**
 * Black Aurora Labs — gated source bundle generator.
 * Builds a git bundle (preferred) or git-archive tarball of the local repo on demand.
 * Degrades honestly when git is unavailable.
 */

import { execFile } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"
import { randomBytes } from "crypto"

const execFileAsync = promisify(execFile)

const BUNDLE_DIR = path.join(process.cwd(), "local-data", "black-aurora", "bundles")

export type BundleFormat = "bundle" | "tar"

export type BundleResult =
  | {
      ok: true
      format: BundleFormat
      filePath: string
      filename: string
      bytes: number
      contentType: string
    }
  | { ok: false; error: string; detail?: string }

function ensureBundleDir(): void {
  fs.mkdirSync(BUNDLE_DIR, { recursive: true, mode: 0o700 })
}

async function runGit(args: string[], cwd: string): Promise<{ ok: true; stdout: string } | { ok: false; error: string }> {
  try {
    const { stdout } = await execFileAsync("git", args, {
      cwd,
      maxBuffer: 16 * 1024 * 1024,
      timeout: 120_000,
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    })
    return { ok: true, stdout: String(stdout || "") }
  } catch (e) {
    const err = e as { stderr?: string; message?: string }
    return { ok: false, error: String(err.stderr || err.message || e).slice(0, 500) }
  }
}

/**
 * Create a downloadable artifact of the current repo (main / HEAD).
 * Prefer `git bundle create` of HEAD; fall back to `git archive --format=tar.gz`.
 */
export async function createSourceBundle(format: BundleFormat = "bundle"): Promise<BundleResult> {
  ensureBundleDir()
  const root = process.cwd()
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
  const nonce = randomBytes(4).toString("hex")

  // Confirm we're in a git repo
  const check = await runGit(["rev-parse", "--is-inside-work-tree"], root)
  if (!check.ok) {
    return {
      ok: false,
      error: "git_unavailable",
      detail:
        "This hub host has no usable git work tree. Operator: run from a cloned command-hub checkout, or set BLACK_AURORA_MODE=github-private and hand out a private-repo invite.",
    }
  }

  if (format === "bundle") {
    const filename = `command-hub-${stamp}-${nonce}.bundle`
    const filePath = path.join(BUNDLE_DIR, filename)
    // Bundle HEAD (works even if branch name isn't main)
    const r = await runGit(["bundle", "create", filePath, "HEAD"], root)
    if (r.ok && fs.existsSync(filePath)) {
      const st = fs.statSync(filePath)
      return {
        ok: true,
        format: "bundle",
        filePath,
        filename,
        bytes: st.size,
        contentType: "application/octet-stream",
      }
    }
    // Fall through to tar
  }

  const filename = `command-hub-${stamp}-${nonce}.tar.gz`
  const filePath = path.join(BUNDLE_DIR, filename)
  const r = await runGit(["archive", "--format=tar.gz", "-o", filePath, "HEAD"], root)
  if (!r.ok || !fs.existsSync(filePath)) {
    return {
      ok: false,
      error: "bundle_failed",
      detail: r.ok === false ? r.error : "archive produced no file",
    }
  }
  const st = fs.statSync(filePath)
  return {
    ok: true,
    format: "tar",
    filePath,
    filename,
    bytes: st.size,
    contentType: "application/gzip",
  }
}

/** Best-effort cleanup of a temp bundle after streaming. */
export function cleanupBundle(filePath: string): void {
  try {
    if (filePath.startsWith(BUNDLE_DIR) && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch {
    /* ignore */
  }
}

export function __bundleDir(): string {
  return BUNDLE_DIR
}
