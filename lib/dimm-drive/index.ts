/**
 * DIMM Drive — status + quota helpers (ADD-ONLY).
 * Backed by engines script: singular-ty-engines/dimm-drive/scripts/dimmctl.sh
 * HOLD_VYRNA_UNSYNC · lattice_sync: false · never print secrets
 */

import { execFileSync } from "child_process"
import fs from "fs"
import path from "path"

export const HOLD = "HOLD_VYRNA_UNSYNC" as const
export const DIMMCTL =
  process.env.DIMMCTL ||
  "/workspace/singular-ty-engines/dimm-drive/scripts/dimmctl.sh"
export const CONFIG_PATH =
  process.env.DIMM_CONFIG || "/workspace/dimm-drive/config.json"
export const MNT = "/workspace/dimm-drive/mnt"
export const SHM = "/dev/shm/singular-dimm"
export const MESH_ENV_KEYS = ["RUNPOD_API_KEY", "MODAL_TOKEN_ID", "VAST_API_KEY", "KAGGLE_USERNAME"] as const

export type DimmTier = "local" | "external" | "runpod"

export interface MeshPeer {
  id: string
  provider: string
  role: "reason" | "vision" | "audio" | "train" | "render" | "sigil2vec" | string
  enabled: boolean
  endpointOrNotebook: string
  notes: string
}

export interface MeshStatus {
  peers: MeshPeer[]
  envKeysPresent: string[]
  hold: typeof HOLD
  lattice_sync: false
}

export interface DimmStatus {
  ok: boolean
  service: string
  hold: typeof HOLD
  lattice_sync: false
  host?: {
    memTotalGi: number
    memAvailableGi: number
    shmSizeGi: number
    boxHardCapGb: number
  }
  local?: {
    enabled: boolean
    backend?: string
    sizeGb: number
    path: string
    usedBytes?: number | null
    softLimitBytes?: number | null
    subdirs?: string[]
  }
  tiers?: Record<DimmTier, boolean>
  external?: Record<string, unknown>
  runpod?: Record<string, unknown>
  sigil2vec?: Record<string, unknown>
  runpodApiKeyPresent?: boolean
  sigilCacheCount?: number
  mounted?: boolean
  mesh?: MeshStatus
  error?: string
}

function runDimmctl(args: string[], timeoutMs = 15000): { ok: boolean; stdout: string; stderr: string; code: number } {
  try {
    const stdout = execFileSync(DIMMCTL, args, {
      encoding: "utf8",
      timeout: timeoutMs,
      env: { ...process.env },
      maxBuffer: 2 * 1024 * 1024,
    })
    return { ok: true, stdout: String(stdout), stderr: "", code: 0 }
  } catch (e: unknown) {
    const err = e as { status?: number; stdout?: string; stderr?: string; message?: string }
    return {
      ok: false,
      stdout: String(err.stdout || ""),
      stderr: String(err.stderr || err.message || ""),
      code: typeof err.status === "number" ? err.status : 1,
    }
  }
}

export function isMounted(): boolean {
  return (
    fs.existsSync(path.join(MNT, ".dimm-drive")) ||
    fs.existsSync(path.join(SHM, ".dimm-drive"))
  )
}

export function resolveMountPath(): string | null {
  if (fs.existsSync(path.join(MNT, ".dimm-drive"))) return MNT
  if (fs.existsSync(path.join(SHM, ".dimm-drive"))) return SHM
  try {
    const real = fs.realpathSync(MNT)
    if (fs.existsSync(path.join(real, ".dimm-drive"))) return real
  } catch {
    /* ignore */
  }
  return null
}

export function sigilCacheCount(): number {
  const base = resolveMountPath()
  const dir = base
    ? path.join(base, "sigil")
    : "/workspace/dimm-drive/sigil-soft"
  try {
    if (!fs.existsSync(dir)) return 0
    return fs.readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "sigil_index.json").length
  } catch {
    return 0
  }
}

export function loadConfig(): Record<string, unknown> {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"))
  } catch {
    return {}
  }
}

export function meshStatus(): MeshStatus {
  const cfg = loadConfig() as Record<string, any>
  const rawPeers = Array.isArray(cfg?.mesh?.peers) ? cfg.mesh.peers : []
  const peers = rawPeers
    .filter((peer: unknown): peer is Record<string, unknown> => Boolean(peer && typeof peer === "object"))
    .map((peer) => ({
      id: typeof peer.id === "string" ? peer.id : "",
      provider: typeof peer.provider === "string" ? peer.provider : "",
      role: typeof peer.role === "string" ? peer.role : "",
      enabled: peer.enabled === true,
      endpointOrNotebook: typeof peer.endpointOrNotebook === "string" ? peer.endpointOrNotebook : "",
      notes: typeof peer.notes === "string" ? peer.notes : "",
    }))
  return {
    peers,
    // Names only; never expose environment variable values.
    envKeysPresent: MESH_ENV_KEYS.filter((key) => Boolean(process.env[key])),
    hold: HOLD,
    lattice_sync: false,
  }
}


const SIGIL_ADAPTER =
  process.env.SIGIL2VEC_ADAPTER ||
  "/workspace/singular-ty-engines/dimm-drive/sigil2vec/adapter.py"
const SIGIL_PYTHON =
  process.env.SIGIL2VEC_PYTHON ||
  "/workspace/singular-ty-engines/.venv-echonexus/bin/python"

/** Probe the local descriptor adapter without promoting it to trained Sigil2vec. Never prints secrets. */
export function probeSigil2vec(): Record<string, unknown> {
  try {
    const stdout = execFileSync(SIGIL_PYTHON, [SIGIL_ADAPTER], {
      encoding: "utf8",
      timeout: 8000,
      env: { ...process.env },
      maxBuffer: 1024 * 1024,
    })
    const text = String(stdout).trim()
    const start = text.indexOf("{")
    const parsed = JSON.parse(start >= 0 ? text.slice(start) : text) as Record<string, unknown>
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    try {
      const cfg = loadConfig() as Record<string, any>
      const s = cfg?.sigil2vec || {}
      return {
        ok: false,
        badge: s.badge || "STUB_HASH",
        encoder: s.encoder || "STUB_HASH",
        mode: s.mode || "STUB_HASH",
        opencvAvailable: Boolean(s.opencvAvailable),
        dims: s.dims || 128,
      }
    } catch {
      return {
        ok: false,
        badge: "STUB_HASH",
        encoder: "STUB_HASH",
        mode: "STUB_HASH",
        opencvAvailable: false,
      }
    }
  }
}

export function getStatus(): DimmStatus {
  const r = runDimmctl(["status"])
  if (!r.ok && !r.stdout.trim()) {
    return {
      ok: false,
      service: "dimm-drive",
      hold: HOLD,
      lattice_sync: false,
      error: r.stderr.slice(0, 400) || "dimmctl failed",
      mounted: isMounted(),
      sigilCacheCount: sigilCacheCount(),
      mesh: meshStatus(),
    }
  }
  try {
    // status may print trailing lines; take last JSON object
    const text = r.stdout.trim()
    const start = text.indexOf("{")
    const parsed = JSON.parse(start >= 0 ? text.slice(start) : text) as DimmStatus
    const live = probeSigil2vec()
    const cfgSigil =
      typeof parsed.sigil2vec === "object" && parsed.sigil2vec ? (parsed.sigil2vec as Record<string, unknown>) : {}
    const opencv = live.opencvAvailable === true
    // OpenCV is only a local CNN-free descriptor. There is no trained/runnable
    // Sigil2vec pack on this host, so the public status must remain STUB_HASH.
    const badge = "STUB_HASH"
    const encoder = opencv ? "opencv-descriptor" : String(live.encoder || cfgSigil.encoder || "STUB_HASH")
    const mode = opencv ? "opencv-descriptor" : String(live.mode || "STUB_HASH")
    const sigil = {
      ...cfgSigil,
      ...live,
      badge,
      encoder,
      mode,
      opencvAvailable: opencv,
      dims: live.dims || 128,
      note: opencv
        ? "STUB_HASH — OpenCV descriptor probe is available (64x64 gray hist+Sobel+ORB → 128-D), but no trained Sigil2vec pack is present."
        : "STUB_HASH — vault designed-only; OpenCV absent in echonexus/venv, so hash-unit embed only.",
    }
    return {
      ...parsed,
      ok: true,
      hold: HOLD,
      lattice_sync: false,
      mounted: isMounted(),
      sigilCacheCount: sigilCacheCount(),
      runpodApiKeyPresent: Boolean(process.env.RUNPOD_API_KEY),
      sigil2vec: sigil,
      mesh: meshStatus(),
    }
  } catch {
    return {
      ok: false,
      service: "dimm-drive",
      hold: HOLD,
      lattice_sync: false,
      error: "failed to parse dimmctl status",
      mounted: isMounted(),
      sigilCacheCount: sigilCacheCount(),
      mesh: meshStatus(),
    }
  }
}

/** Soft quota set in config only (does not mount). */
export function setQuotaGb(sizeGb: number): { ok: boolean; sizeGb?: number; error?: string } {
  if (!Number.isFinite(sizeGb) || sizeGb <= 0 || sizeGb > 64) {
    return { ok: false, error: "sizeGb must be in (0, 64]" }
  }
  const cfg = loadConfig() as Record<string, any>
  cfg.local = cfg.local || {}
  cfg.local.quotaGbRequested = sizeGb
  cfg.updatedAt = new Date().toISOString()
  cfg.hold = HOLD
  cfg.lattice_sync = false
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true })
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2) + "\n")
  return { ok: true, sizeGb }
}

export function ensureMounted(sizeGb?: number): DimmStatus & { created?: boolean; detail?: string } {
  if (isMounted() && (sizeGb == null || sizeGb <= 0)) {
    return { ...getStatus(), created: false }
  }
  const cfg = loadConfig() as Record<string, any>
  const gb =
    sizeGb && sizeGb > 0
      ? sizeGb
      : Number(cfg?.local?.quotaGbRequested || cfg?.local?.sizeGb || 0.5)
  const r = runDimmctl(["create", "--size-gb", String(gb)], 30000)
  const status = getStatus()
  if (!r.ok && !isMounted()) {
    return {
      ...status,
      ok: false,
      created: false,
      error: (r.stderr || r.stdout).slice(0, 500) || "create failed",
      detail: r.stdout.slice(0, 300),
    }
  }
  return { ...status, created: true, detail: r.stdout.split("\n")[0]?.slice(0, 200) }
}

export function destroyDimm(): DimmStatus {
  runDimmctl(["destroy"], 20000)
  return getStatus()
}

export function listTiers(): {
  tiers: Array<{ id: DimmTier; enabled: boolean; note: string }>
  hold: typeof HOLD
  lattice_sync: false
} {
  const cfg = loadConfig() as Record<string, any>
  return {
    tiers: [
      {
        id: "local",
        enabled: Boolean(cfg?.local?.enabled) || isMounted(),
        note: "Host tmpfs or /dev/shm/singular-dimm quota",
      },
      {
        id: "external",
        enabled: Boolean(cfg?.external?.enabled),
        note: "SSH/RunPod pod tmpfs mirror (config.external)",
      },
      {
        id: "runpod",
        enabled: Boolean(cfg?.runpod?.enabled),
        note: "GPU infer via RUNPOD_API_KEY (never printed)",
      },
    ],
    hold: HOLD,
    lattice_sync: false,
  }
}

/** Prefer DIMM path for sigma-lane / MultiDimPool when mounted. */
export function preferDimmSubdir(subdir: "models" | "kv" | "symbols" | "ollama" | "sigil"): string | null {
  const base = resolveMountPath()
  if (!base) return null
  const p = path.join(base, subdir)
  try {
    fs.mkdirSync(p, { recursive: true })
  } catch {
    /* ignore */
  }
  return p
}
