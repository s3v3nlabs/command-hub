/**
 * Module registry — built-in manifests + scan modules/<id>/module.json + public/modules.
 * Registration only; never relocates existing app routes.
 */

import fs from "fs"
import path from "path"
import type { ModuleManifest } from "./types"
import { isModuleManifest } from "./types"

const ROOT = process.cwd()
const DISK_SCAN_DIRS = [
  path.join(ROOT, "modules"),
  path.join(ROOT, "public", "modules"),
]
const REGISTERED_DIR = path.join(ROOT, "data", "modules-registry")
const REGISTERED_FILE = path.join(REGISTERED_DIR, "registered.json")

/** Seed manifests pointing at EXISTING routes (registration only). */
export const BUILTIN_MANIFESTS: ModuleManifest[] = [
  {
    id: "signalframe",
    name: "Signalframe",
    version: "1.0.0",
    description: "WhisperMesh multi-frame messaging workspace (existing route).",
    route: "/signalframe",
    nav: { label: "Signalframe", group: "comms", order: 10, badge: "beta" },
    permissions: ["ui", "messaging"],
    entry: null,
    enabled: true,
    kind: "route",
    source: "builtin",
    lattice_sync: false,
  },
  {
    id: "command-hub",
    name: "Command Hub",
    version: "1.0.0",
    description: "Fortress command surface and IDS status rail.",
    route: "/command-hub",
    nav: { label: "Command Hub", group: "core", order: 1 },
    permissions: ["ui", "ops"],
    entry: null,
    enabled: true,
    kind: "route",
    source: "builtin",
    lattice_sync: false,
  },
  {
    id: "privacy",
    name: "Privacy Fortress",
    version: "1.0.0",
    description: "Anti-telemetry, encrypt-at-rest, egress profiles.",
    route: "/privacy",
    nav: { label: "Privacy Fortress", group: "core", order: 5 },
    permissions: ["ui", "privacy"],
    entry: null,
    enabled: true,
    kind: "route",
    source: "builtin",
    lattice_sync: false,
  },
  {
    id: "test-harness",
    name: "Test Harness",
    version: "1.0.0",
    description: "Local integration / autonomy test harness.",
    route: "/test-harness",
    nav: { label: "Test Harness", group: "dev", order: 40 },
    permissions: ["ui", "dev"],
    entry: null,
    enabled: true,
    kind: "route",
    source: "builtin",
    lattice_sync: false,
  },
  {
    id: "ai-hub",
    name: "AI Ops Hub",
    version: "1.0.0",
    description: "Modular AI ops / multiplexer surface.",
    route: "/ai-hub",
    nav: { label: "AI Ops Hub", group: "ai", order: 20 },
    permissions: ["ui", "ai"],
    entry: null,
    enabled: true,
    kind: "route",
    source: "builtin",
    lattice_sync: false,
  },
  {
    id: "kepler",
    name: "Kepler",
    version: "1.0.0",
    description: "Kepler intelligence map bridge (existing route).",
    route: "/intelligence/kepler",
    nav: { label: "Kepler", group: "intel", order: 30 },
    permissions: ["ui", "read"],
    entry: null,
    enabled: true,
    kind: "route",
    source: "builtin",
    lattice_sync: false,
  },
  {
    id: "sigma-lane",
    name: "Sigma Lane",
    version: "0.1.0",
    description: "Frequency-lane state machine · symbolic > tokens · drift Δt=0. HOLD_VYRNA_UNSYNC.",
    route: "/dev-operator#sigma-lane",
    nav: { label: "Sigma Lane", group: "ops", order: 15, badge: "new" },
    permissions: ["ui", "ops", "dev"],
    entry: null,
    enabled: true,
    kind: "route",
    source: "builtin",
    lattice_sync: false,
  },
  {
    id: "train-lane",
    name: "Train Lane / Σ3D-SYMTRAIN",
    version: "0.1.0",
    description: "Teacher→Student bus · dry-run SYMTRAIN · Omniverse optional. Operator-owned quota mesh only; no burner accounts.",
    route: "/symtrain",
    nav: { label: "Train Lane", group: "ops", order: 16, badge: "new" },
    permissions: ["ui", "ops", "dev"],
    entry: null,
    enabled: true,
    kind: "route",
    source: "builtin",
    lattice_sync: false,
  },
]

function ensureRegisteredDir(): void {
  try {
    fs.mkdirSync(REGISTERED_DIR, { recursive: true, mode: 0o700 })
  } catch {
    /* ignore */
  }
}

function readRegistered(): ModuleManifest[] {
  try {
    if (!fs.existsSync(REGISTERED_FILE)) return []
    const raw = JSON.parse(fs.readFileSync(REGISTERED_FILE, "utf8"))
    const list = Array.isArray(raw) ? raw : Array.isArray(raw?.modules) ? raw.modules : []
    return list.filter(isModuleManifest).map((m) => ({ ...m, source: "registered" as const, lattice_sync: false as const }))
  } catch {
    return []
  }
}

function writeRegistered(list: ModuleManifest[]): void {
  ensureRegisteredDir()
  fs.writeFileSync(REGISTERED_FILE, JSON.stringify(list, null, 2) + "\n", { mode: 0o600 })
}

function scanDiskManifests(): ModuleManifest[] {
  const found: ModuleManifest[] = []
  for (const dir of DISK_SCAN_DIRS) {
    if (!fs.existsSync(dir)) continue
    let entries: string[] = []
    try {
      entries = fs.readdirSync(dir)
    } catch {
      continue
    }
    for (const name of entries) {
      const candidate = path.join(dir, name, "module.json")
      const flat = path.join(dir, name)
      let file: string | null = null
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        file = candidate
      } else if (name === "module.json" || name.endsWith(".module.json")) {
        if (fs.existsSync(flat) && fs.statSync(flat).isFile()) file = flat
      }
      if (!file) continue
      try {
        const parsed = JSON.parse(fs.readFileSync(file, "utf8"))
        if (isModuleManifest(parsed)) {
          found.push({ ...parsed, source: "disk", lattice_sync: false, enabled: parsed.enabled !== false })
        }
      } catch {
        /* skip invalid */
      }
    }
  }
  return found
}

function mergeById(lists: ModuleManifest[][]): ModuleManifest[] {
  const map = new Map<string, ModuleManifest>()
  for (const list of lists) {
    for (const m of list) {
      map.set(m.id, { ...m, lattice_sync: false })
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    const ao = a.nav?.order ?? 100
    const bo = b.nav?.order ?? 100
    if (ao !== bo) return ao - bo
    return a.id.localeCompare(b.id)
  })
}

export function listModules(opts?: { includeDevOnly?: boolean; enabledOnly?: boolean }): ModuleManifest[] {
  const includeDev = opts?.includeDevOnly ?? process.env.NODE_ENV !== "production"
  const enabledOnly = opts?.enabledOnly ?? false
  let all = mergeById([BUILTIN_MANIFESTS, scanDiskManifests(), readRegistered()])
  if (!includeDev) all = all.filter((m) => !m.devOnly)
  if (enabledOnly) all = all.filter((m) => m.enabled !== false)
  return all
}

export function getModule(id: string): ModuleManifest | undefined {
  return listModules({ includeDevOnly: true }).find((m) => m.id === id)
}

/**
 * Dev-only registration of a validated manifest (persisted under data/modules-registry).
 * Does not execute entry code — registration metadata only.
 */
export function registerModule(manifest: ModuleManifest): { ok: true; manifest: ModuleManifest } | { ok: false; error: string } {
  if (!isModuleManifest(manifest)) {
    return { ok: false, error: "Invalid module manifest schema" }
  }
  if (/(exploit|malware|pwn|ransomware|keylog)/i.test(manifest.id + manifest.name + (manifest.description || ""))) {
    return { ok: false, error: "Rejected: exploit / malware oriented modules are not allowed" }
  }
  const existing = readRegistered().filter((m) => m.id !== manifest.id)
  const next: ModuleManifest = {
    ...manifest,
    source: "registered",
    lattice_sync: false,
    enabled: manifest.enabled !== false,
  }
  existing.push(next)
  writeRegistered(existing)
  return { ok: true, manifest: next }
}

export function registryStatus() {
  const modules = listModules({ includeDevOnly: true })
  return {
    ok: true,
    count: modules.length,
    builtin: BUILTIN_MANIFESTS.length,
    disk: scanDiskManifests().length,
    registered: readRegistered().length,
    hold: "HOLD_VYRNA_UNSYNC" as const,
    lattice_sync: false as const,
  }
}
