import fs from "fs"
import path from "path"
import type { LabWorkspace } from "./types"
import { LabInputError, assertWorkspaceRelPath } from "./validate"

export function labWorkspace(): LabWorkspace {
  const override = process.env.ANDROID_LAB_WORKSPACE?.trim()
  const root =
    override && path.isAbsolute(override) && !override.includes("\0")
      ? path.resolve(override)
      : path.join(process.cwd(), "data", "offsec", "android-lab")
  const ws: LabWorkspace = {
    root,
    apks: path.join(root, "apks"),
    push: path.join(root, "push"),
    pull: path.join(root, "pull"),
    pcap: path.join(root, "pcap"),
  }
  for (const d of Object.values(ws)) {
    try {
      fs.mkdirSync(d, { recursive: true })
    } catch {
      /* ignore — status endpoint will surface a note */
    }
  }
  return ws
}

/**
 * Resolve a client-provided relative name to an absolute path under a workspace
 * subdir. Rejects anything that would escape the directory.
 */
export function resolveUnder(dir: string, rel: string): string {
  const safe = assertWorkspaceRelPath(rel)
  const abs = path.resolve(dir, safe)
  const base = path.resolve(dir) + path.sep
  if (abs !== path.resolve(dir) && !abs.startsWith(base)) {
    throw new LabInputError("path escapes lab workspace")
  }
  return abs
}

const SELECTED_FILE = () => path.join(labWorkspace().root, "selected.json")

export function getSelectedSerial(): string | null {
  try {
    const raw = JSON.parse(fs.readFileSync(SELECTED_FILE(), "utf8")) as { serial?: string }
    return typeof raw.serial === "string" && raw.serial ? raw.serial : null
  } catch {
    return null
  }
}

export function setSelectedSerial(serial: string | null): void {
  const file = SELECTED_FILE()
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify({ serial, updatedAt: new Date().toISOString() }, null, 2))
}
