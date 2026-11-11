/**
 * Safe Dev Operator actions — stubs / proposals only. No silent core overwrites.
 */

import fs from "fs"
import path from "path"
import { isModuleManifest, type ModuleManifest } from "@/lib/modules/types"
import { registerModule } from "@/lib/modules/registry"

const MODULES_ROOT = path.join(process.cwd(), "modules")
const PROPOSALS = path.join(process.cwd(), "modules", "proposals")
const DOC_PROPOSALS = path.join(process.cwd(), "docs", "proposals")

export function createModuleStub(manifest: ModuleManifest): { ok: true; path: string } | { ok: false; error: string } {
  if (!isModuleManifest(manifest)) return { ok: false, error: "invalid manifest" }
  if (/(exploit|malware|pwn|ransomware|keylog)/i.test(manifest.id + manifest.name)) {
    return { ok: false, error: "rejected exploit-flavored id" }
  }
  const dir = path.join(MODULES_ROOT, manifest.id)
  fs.mkdirSync(dir, { recursive: true, mode: 0o755 })
  const dest = path.join(dir, "module.json")
  const body = { ...manifest, lattice_sync: false, enabled: manifest.enabled !== false }
  fs.writeFileSync(dest, JSON.stringify(body, null, 2) + "\n", { mode: 0o644 })
  // also register in bay
  registerModule(body)
  return { ok: true, path: dest }
}

export function writePatchProposal(title: string, markdown: string): { ok: true; path: string } | { ok: false; error: string } {
  const t = (title || "proposal").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48) || "proposal"
  fs.mkdirSync(PROPOSALS, { recursive: true })
  fs.mkdirSync(DOC_PROPOSALS, { recursive: true })
  const fname = `proposal-${new Date().toISOString().slice(0, 10)}-${t}.md`
  const dest = path.join(PROPOSALS, fname)
  const header = `---\nlattice_sync: false\nhold: HOLD_VYRNA_UNSYNC\nsource: dev-operator\n---\n\n# ${title}\n\n> Proposal only — do not silently overwrite Ghostlight/Signalframe core.\n\n`
  fs.writeFileSync(dest, header + (markdown || "").slice(0, 100000), { mode: 0o644 })
  // mirror short pointer in docs/proposals
  fs.writeFileSync(path.join(DOC_PROPOSALS, fname), `See \`${dest}\`.\n\n${(markdown || "").slice(0, 2000)}\n`, { mode: 0o644 })
  return { ok: true, path: dest }
}
