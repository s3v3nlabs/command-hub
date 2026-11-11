/**
 * Plugin SDK — drop-in module contract for third parties.
 *
 * DESIGN / SANDBOX HONESTY:
 * The hub does NOT execute third-party `entry` code inside core. A plugin is a
 * *manifest* that (a) registers navigation + a route that the plugin ships as a
 * normal Next.js route OR points at a hosted surface, and (b) declares the
 * capabilities it needs. The only runtime contract a plugin may use is the
 * hub's documented public HTTP API surface (see PLUGIN_API_SURFACE) with an
 * operator-issued token. This keeps the trust boundary real: core never runs
 * untrusted JS, and a plugin can never silently escalate.
 *
 * See docs/PLUGIN_SDK.md for a worked example.
 */

import { type ModuleManifest, type ModulePermission, isModuleManifest } from "./types"

export const PLUGIN_API_VERSION = "1.0.0" as const

/** A plugin manifest is a ModuleManifest plus optional SDK metadata. */
export interface PluginManifest extends ModuleManifest {
  /** SDK/contract version the plugin targets. */
  sdkVersion?: string
  /** Author / publisher identity (display only; trust comes from signature). */
  publisher?: string
  /** Homepage / source URL. */
  homepage?: string
  /** SPDX license id. */
  license?: string
  /** Minimum hub version required (semver string; informational). */
  minHubVersion?: string
}

/**
 * The documented, stable surface a plugin may call at runtime. These are the
 * ONLY hub capabilities exposed to plugins; anything else is out of contract.
 */
export const PLUGIN_API_SURFACE = {
  version: PLUGIN_API_VERSION,
  endpoints: [
    { method: "GET", path: "/api/modules", description: "List registered modules.", permission: "read" },
    { method: "POST", path: "/api/modules", description: "Register/validate a module manifest (dev-gated).", permission: "dev" },
    { method: "GET", path: "/api/offsec/scope", description: "List engagement scopes / audit (ladder-gated capabilities).", permission: "ops" },
    { method: "GET", path: "/api/audit/timeline", description: "Read the unified audit timeline (eyes-only sealed).", permission: "ops" },
  ],
  rules: [
    "Core never executes a plugin's `entry` code; plugins ship their own route or hosted surface.",
    "All runtime calls require an operator-issued HUB_API_TOKEN (Authorization: Bearer).",
    "Plugins declare permissions up front; the marketplace shows them before enable.",
    "Exploit/malware-flavored ids, names, or descriptions are rejected at validation.",
    "Plugins never claim lattice_sync (HOLD_VYRNA_UNSYNC enforced; lattice_sync:false).",
  ],
} as const

const ALLOWED_PERMISSIONS: ModulePermission[] = ["ui", "read", "dev", "messaging", "ai", "privacy", "ops"]

export interface PluginValidation {
  ok: boolean
  errors: string[]
  warnings: string[]
  manifest?: PluginManifest
}

/**
 * Validate a plugin manifest: base schema + SDK rules. Honest, no network.
 */
export function validatePluginManifest(value: unknown): PluginValidation {
  const errors: string[] = []
  const warnings: string[] = []

  if (!isModuleManifest(value)) {
    errors.push("Fails base ModuleManifest schema (id/name/version/description/permissions required; exploit-flavored ids rejected).")
    return { ok: false, errors, warnings }
  }
  const m = value as PluginManifest

  // permissions must be from the allowed set
  const badPerms = m.permissions.filter((p) => !ALLOWED_PERMISSIONS.includes(p))
  if (badPerms.length) errors.push(`Unknown permissions: ${badPerms.join(", ")}`)

  // semver-ish version
  if (!/^\d+\.\d+\.\d+/.test(m.version)) warnings.push("version should be semver (e.g. 1.0.0)")

  // route sanity: plugins must declare a route or an entry
  if (!m.route && !m.entry) errors.push("A plugin must declare a `route` (its own page) or an `entry`.")
  if (m.route && !m.route.startsWith("/")) errors.push("`route` must be an absolute path starting with '/'.")

  // lattice_sync must never be true
  if ((m as { lattice_sync?: unknown }).lattice_sync === true) errors.push("lattice_sync must be false (HOLD_VYRNA_UNSYNC).")

  // sdk version compat (informational)
  if (m.sdkVersion && m.sdkVersion.split(".")[0] !== PLUGIN_API_VERSION.split(".")[0]) {
    warnings.push(`sdkVersion ${m.sdkVersion} major differs from hub SDK ${PLUGIN_API_VERSION}.`)
  }

  const ok = errors.length === 0
  return { ok, errors, warnings, manifest: ok ? { ...m, lattice_sync: false } : undefined }
}
