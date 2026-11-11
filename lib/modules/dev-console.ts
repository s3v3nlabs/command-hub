/**
 * Dev-only Command Hub module console helpers.
 * NO arbitrary eval in parent window. Preview via sandboxed iframe srcdoc only.
 * Inspired by Operator console inspector (status / whisper / modules) — not exploit tooling.
 */

import type { ModuleManifest } from "./types"
import { isModuleManifest } from "./types"

export type DevConsoleCommand =
  | { cmd: "status" }
  | { cmd: "modules" }
  | { cmd: "whisper"; channel?: "team" | "whisper" | "system"; body: string }
  | { cmd: "help" }

export type DevConsoleResult = {
  ok: boolean
  cmd: string
  message: string
  data?: unknown
  lattice_sync: false
  hold: "HOLD_VYRNA_UNSYNC"
  devOnly: true
}

export function isDevConsoleEnabled(): boolean {
  if (typeof process !== "undefined" && process.env.S3V3N_DEV_CONSOLE === "1") return true
  if (typeof process !== "undefined" && process.env.NODE_ENV === "development") return true
  return false
}

/** Build a safe sandbox srcdoc for preview-only module JSON (no parent eval). */
export function buildSandboxSrcdoc(manifest: ModuleManifest): string {
  const safe = {
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    route: manifest.route ?? null,
    permissions: manifest.permissions,
    kind: manifest.kind ?? "route",
    lattice_sync: false,
    hold: "HOLD_VYRNA_UNSYNC",
    note: "DEV PREVIEW ONLY — sandboxed iframe; no parent eval; no remote code.",
  }
  const json = JSON.stringify(safe, null, 2)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Module Preview (DEV)</title>
<style>
  body{margin:0;background:#0a0a0a;color:#a3e635;font-family:ui-monospace,monospace;padding:16px;font-size:12px}
  h1{font-size:14px;letter-spacing:.08em;text-transform:uppercase;color:#e5e5e5}
  .badge{display:inline-block;border:1px solid #525252;padding:2px 8px;margin:4px 0 12px;color:#fbbf24}
  pre{white-space:pre-wrap;word-break:break-word;border:1px solid #262626;padding:12px;background:#111}
</style></head><body>
<h1>Module Bay · Sandbox Preview</h1>
<div class="badge">DEV ONLY · iframe sandbox · allow-scripts (no allow-same-origin)</div>
<pre>${json}</pre>
</body></html>`
}

export function parseManifestJson(raw: string): { ok: true; manifest: ModuleManifest } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(raw)
    if (!isModuleManifest(parsed)) return { ok: false, error: "JSON does not match ModuleManifest schema" }
    return { ok: true, manifest: parsed }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Invalid JSON" }
  }
}

export function helpText(): string {
  return [
    "CommandHubDev (DEV ONLY)",
    "  status   — registry / hive hold flags",
    "  modules  — list registered manifests",
    "  whisper <text> — post to Signalframe team bus (channel=team)",
    "  help     — this text",
    "Preview: paste module JSON → sandboxed iframe srcdoc (no parent eval).",
    "HOLD_VYRNA_UNSYNC · lattice_sync: false",
  ].join("\n")
}

declare global {
  interface Window {
    CommandHubDev?: {
      help: () => string
      status: () => Promise<DevConsoleResult>
      modules: () => Promise<DevConsoleResult>
      whisper: (body: string) => Promise<DevConsoleResult>
      loadModulePreview: (json: string) => { ok: boolean; srcdoc?: string; error?: string }
    }
  }
}

/** Client binder — call from Module Bay page only. */
export function bindCommandHubDev(): void {
  if (typeof window === "undefined") return
  window.CommandHubDev = {
    help: () => helpText(),
    status: async () => {
      const [mod, hive] = await Promise.all([
        fetch("/api/modules").then((r) => r.json()).catch(() => ({ ok: false })),
        fetch("/api/hive").then((r) => r.json()).catch(() => ({ ok: false })),
      ])
      return {
        ok: true,
        cmd: "status",
        message: "Module Bay + Hive status (no Vyrna sync)",
        data: {
          modules: mod,
          hive: { ok: hive?.ok, peers: hive?.peers, lastSync: hive?.lastSync, lattice_sync: false },
        },
        lattice_sync: false,
        hold: "HOLD_VYRNA_UNSYNC",
        devOnly: true,
      }
    },
    modules: async () => {
      const mod = await fetch("/api/modules").then((r) => r.json()).catch(() => ({ ok: false }))
      return {
        ok: Boolean(mod?.ok),
        cmd: "modules",
        message: `modules: ${mod?.count ?? 0}`,
        data: mod,
        lattice_sync: false,
        hold: "HOLD_VYRNA_UNSYNC",
        devOnly: true,
      }
    },
    whisper: async (body: string) => {
      const res = await fetch("/api/signalframe/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "whisper", body, from: "CommandHubDev" }),
      })
      const data = await res.json().catch(() => ({ ok: false }))
      return {
        ok: Boolean(data?.ok),
        cmd: "whisper",
        message: data?.ok ? "whisper posted (body not logged)" : data?.error || "whisper failed",
        data: { id: data?.id, channel: data?.channel },
        lattice_sync: false,
        hold: "HOLD_VYRNA_UNSYNC",
        devOnly: true,
      }
    },
    loadModulePreview: (json: string) => {
      const parsed = parseManifestJson(json)
      if (!parsed.ok) return { ok: false, error: parsed.error }
      return { ok: true, srcdoc: buildSandboxSrcdoc(parsed.manifest) }
    },
  }
}
