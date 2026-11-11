/**
 * Module Manifest schema for Command Hub Module Bay.
 * ADD-ONLY registry — points at existing routes; does not move pages.
 * HOLD_VYRNA_UNSYNC — lattice_sync never claimed by modules.
 */

export type ModulePermission =
  | "ui"
  | "read"
  | "dev"
  | "messaging"
  | "ai"
  | "privacy"
  | "ops"

export type ModuleNav = {
  label: string
  group?: string
  order?: number
  badge?: string
}

export type ModuleManifest = {
  id: string
  name: string
  version: string
  description: string
  route?: string
  nav?: ModuleNav
  permissions: ModulePermission[]
  entry?: string | null
  enabled?: boolean
  devOnly?: boolean
  kind?: "route" | "component" | "overlay" | "builtin"
  source?: "builtin" | "disk" | "registered"
  lattice_sync?: false
}

export type ModuleRegisterRequest = {
  manifest: ModuleManifest
}

export const MODULE_MANIFEST_REQUIRED = [
  "id",
  "name",
  "version",
  "description",
  "permissions",
] as const

export function isModuleManifest(value: unknown): value is ModuleManifest {
  if (!value || typeof value !== "object") return false
  const m = value as Record<string, unknown>
  if (typeof m.id !== "string" || !m.id.trim()) return false
  if (typeof m.name !== "string" || !m.name.trim()) return false
  if (typeof m.version !== "string" || !m.version.trim()) return false
  if (typeof m.description !== "string") return false
  if (!Array.isArray(m.permissions)) return false
  if (m.route !== undefined && typeof m.route !== "string") return false
  if (m.entry !== undefined && m.entry !== null && typeof m.entry !== "string") return false
  if (m.enabled !== undefined && typeof m.enabled !== "boolean") return false
  if (m.devOnly !== undefined && typeof m.devOnly !== "boolean") return false
  if (m.nav !== undefined) {
    if (!m.nav || typeof m.nav !== "object") return false
    const nav = m.nav as Record<string, unknown>
    if (typeof nav.label !== "string") return false
  }
  // Forbid exploit-flavored ids / permissions by convention
  const id = m.id.toLowerCase()
  if (/(exploit|malware|pwn|ransomware|keylog)/.test(id)) return false
  return true
}
