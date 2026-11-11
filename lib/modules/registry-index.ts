/**
 * Marketplace registry INDEX loader.
 *
 * The module INDEX is a signed JSON manifest. By default it is bundled in the
 * repo at public/registry/modules.json with a detached ed25519 signature at
 * public/registry/modules.json.sig. Operators may point the hub at a hosted
 * index (GitHub Pages / Vercel / raw.githubusercontent) with REGISTRY_INDEX_URL;
 * the matching signature is fetched from "<url>.sig".
 *
 * Signature is verified honestly (lib/modules/signature.ts). If no verification
 * key is configured, or the signature is missing/invalid, the marketplace shows
 * the real state — it NEVER silently trusts an unverified index.
 *
 * Install / enable / disable is LOCAL operator state persisted under
 * data/marketplace/state.json (gitignored). Installing does not execute code.
 */

import fs from "fs"
import path from "path"
import { verifyDetached, type VerifyResult } from "./signature"
import { validatePluginManifest, type PluginManifest } from "./plugin-sdk"
import { assertSafeOutboundUrl } from "@/lib/security/request-guard"

export interface MarketplaceEntry extends PluginManifest {
  category?: string
  /** marketplace-only: validation verdict computed at load time */
  valid?: boolean
  validationErrors?: string[]
}

export interface RegistryIndex {
  version: string
  generatedAt: string
  modules: MarketplaceEntry[]
}

export interface LoadedIndex {
  ok: boolean
  source: "bundled" | "remote"
  url?: string
  index: RegistryIndex | null
  signature: VerifyResult
  error?: string
}

export type InstallState = Record<string, { installed: boolean; enabled: boolean; installedAt?: string }>

const BUNDLED_JSON = path.join(process.cwd(), "public", "registry", "modules.json")
const BUNDLED_SIG = path.join(process.cwd(), "public", "registry", "modules.json.sig")
const STATE_DIR = path.join(process.cwd(), "data", "marketplace")
const STATE_FILE = path.join(STATE_DIR, "state.json")

function parseIndex(raw: string): RegistryIndex | null {
  try {
    const obj = JSON.parse(raw)
    if (!obj || typeof obj !== "object" || !Array.isArray(obj.modules)) return null
    return obj as RegistryIndex
  } catch {
    return null
  }
}

function annotate(index: RegistryIndex): RegistryIndex {
  return {
    ...index,
    modules: index.modules.map((m) => {
      const v = validatePluginManifest(m)
      return { ...m, valid: v.ok, validationErrors: v.errors }
    }),
  }
}

/** Load the index (bundled or remote) + verify its detached signature. */
export async function loadRegistryIndex(): Promise<LoadedIndex> {
  const url = process.env.REGISTRY_INDEX_URL?.trim()
  if (url) {
    try {
      assertSafeOutboundUrl(url)
      const sigUrl = url.endsWith(".sig") ? url : `${url}.sig`
      const [docRes, sigRes] = await Promise.all([
        fetch(url, { cache: "no-store" }),
        fetch(sigUrl, { cache: "no-store" }).catch(() => null),
      ])
      if (!docRes.ok) throw new Error(`index fetch ${docRes.status}`)
      const raw = await docRes.text()
      const sig = sigRes && sigRes.ok ? (await sigRes.text()).trim() : ""
      const index = parseIndex(raw)
      const signature = verifyDetached(raw, sig)
      return { ok: !!index, source: "remote", url, index: index ? annotate(index) : null, signature }
    } catch (e) {
      return {
        ok: false,
        source: "remote",
        url,
        index: null,
        signature: { status: "error", verified: false, keySource: "none", detail: "remote load failed" },
        error: (e as Error).message,
      }
    }
  }
  // bundled
  try {
    if (!fs.existsSync(BUNDLED_JSON)) {
      return {
        ok: false,
        source: "bundled",
        index: null,
        signature: { status: "error", verified: false, keySource: "none", detail: "no bundled index" },
        error: "bundled index missing",
      }
    }
    const raw = fs.readFileSync(BUNDLED_JSON, "utf8")
    const sig = fs.existsSync(BUNDLED_SIG) ? fs.readFileSync(BUNDLED_SIG, "utf8").trim() : ""
    const index = parseIndex(raw)
    const signature = verifyDetached(raw, sig)
    return { ok: !!index, source: "bundled", index: index ? annotate(index) : null, signature }
  } catch (e) {
    return {
      ok: false,
      source: "bundled",
      index: null,
      signature: { status: "error", verified: false, keySource: "none", detail: "bundled load failed" },
      error: (e as Error).message,
    }
  }
}

// ── local install/enable state ──────────────────────────────────────────────
export function readInstallState(): InstallState {
  try {
    if (!fs.existsSync(STATE_FILE)) return {}
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) as InstallState
  } catch {
    return {}
  }
}

function writeInstallState(state: InstallState) {
  fs.mkdirSync(STATE_DIR, { recursive: true, mode: 0o700 })
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + "\n", { mode: 0o600 })
}

export function setInstallState(
  id: string,
  action: "install" | "uninstall" | "enable" | "disable",
): { ok: boolean; state: InstallState; error?: string } {
  if (!id) return { ok: false, state: readInstallState(), error: "id required" }
  const state = readInstallState()
  const cur = state[id] || { installed: false, enabled: false }
  switch (action) {
    case "install":
      state[id] = { installed: true, enabled: true, installedAt: new Date().toISOString() }
      break
    case "uninstall":
      delete state[id]
      break
    case "enable":
      if (!cur.installed) return { ok: false, state, error: "not_installed" }
      state[id] = { ...cur, enabled: true }
      break
    case "disable":
      if (!cur.installed) return { ok: false, state, error: "not_installed" }
      state[id] = { ...cur, enabled: false }
      break
    default:
      return { ok: false, state, error: "unknown_action" }
  }
  writeInstallState(state)
  return { ok: true, state }
}
