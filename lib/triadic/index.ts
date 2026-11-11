/**
 * Triadic Local AI — status aggregator (ADD-ONLY).
 * Wires existing Ollama / DIMM / Ghostlight MCP / mesh probes.
 * HOLD_VYRNA_UNSYNC · lattice_sync: false · never log secrets or prompt bodies.
 */

import fs from "fs"
import { probeOllama, OLLAMA_BASE } from "@/lib/ai/ops-router"
import { getStatus as getDimmStatus, HOLD as DIMM_HOLD } from "@/lib/dimm-drive"
import { meshHubStatus, HOLD as MESH_HOLD } from "@/lib/mesh"

export const HOLD = "HOLD_VYRNA_UNSYNC" as const
export const GHOSTLIGHT_MCP = "http://127.0.0.1:8765/mcp"
export const OLLAMA_BIN = "/usr/local/bin/ollama"
export const TRIADIC_PACK =
  "/workspace/singular-ty-engines/local-ai-build/triadic_relearn_2026-09-23"

export type ProbeBadge = "LIVE" | "DOWN" | "STUB" | "NOT_CFG" | "READY"

async function probeGhostlight(timeoutMs = 2000): Promise<{
  badge: ProbeBadge
  online: boolean
  detail: string
  serverName?: string
  protocolVersion?: string
}> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(GHOSTLIGHT_MCP, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "triadic-hub", version: "0.1" },
        },
      }),
      signal: ctrl.signal,
    })
    clearTimeout(t)
    const text = await res.text()
    // SSE or JSON — look for serverInfo
    let serverName: string | undefined
    let protocolVersion: string | undefined
    const nameMatch = text.match(/"name"\s*:\s*"([^"]+)"/)
    const verMatch = text.match(/"protocolVersion"\s*:\s*"([^"]+)"/)
    if (nameMatch) serverName = nameMatch[1]
    if (verMatch) protocolVersion = verMatch[1]
    const ok =
      res.ok ||
      text.includes("serverInfo") ||
      text.includes("ghostlight") ||
      text.includes("protocolVersion")
    if (ok) {
      return {
        badge: "LIVE",
        online: true,
        detail: serverName
          ? `MCP initialize ok · ${serverName}`
          : `MCP initialize ok · HTTP ${res.status}`,
        serverName,
        protocolVersion,
      }
    }
    return {
      badge: "DOWN",
      online: false,
      detail: `MCP probe HTTP ${res.status}`,
    }
  } catch (e) {
    clearTimeout(t)
    return {
      badge: "DOWN",
      online: false,
      detail:
        e instanceof Error
          ? e.name === "AbortError"
            ? "timeout"
            : e.message.slice(0, 120)
          : "offline",
    }
  }
}

function ollamaBinaryPresent(): boolean {
  try {
    return fs.existsSync(OLLAMA_BIN)
  } catch {
    return false
  }
}

function packDigest(): {
  root: string
  files: string[]
  present: boolean
  excerpt: string[]
} {
  const files = [
    "QUICK_DIGEST.md",
    "ARCHITECTURE.md",
    "BUILD_PLAN.md",
    "COMPONENT_INVENTORY.md",
    "AXIOS_PULSE.txt",
    "SHA256SUMS.txt",
  ]
  const present = fs.existsSync(TRIADIC_PACK)
  const found = present
    ? files.filter((f) => fs.existsSync(`${TRIADIC_PACK}/${f}`))
    : []
  return {
    root: TRIADIC_PACK,
    files: found,
    present,
    excerpt: [
      "P16 brainstem (Ollama/vLLM) · RunPod muscle · MCP tool fabric · CommandHub orchestrates",
      "Sensitive vault / Σ0-VANTAS stays local — cloud minimum payloads only",
      "HOLD_VYRNA_UNSYNC · lattice_sync: false · Phase 4 dry-run until Operator spend approval",
    ],
  }
}

export async function getTriadicStatus() {
  const [ollamaProbe, ghostlight] = await Promise.all([
    probeOllama(1500),
    probeGhostlight(2000),
  ])

  const binary = ollamaBinaryPresent()
  const ollamaBadge: ProbeBadge = ollamaProbe.online
    ? "LIVE"
    : binary
      ? "DOWN"
      : "NOT_CFG"

  let dimm: ReturnType<typeof getDimmStatus> | { ok: false; error: string }
  try {
    dimm = getDimmStatus()
  } catch (e) {
    dimm = {
      ok: false,
      error: e instanceof Error ? e.message.slice(0, 160) : "dimm status failed",
    }
  }

  let mesh: ReturnType<typeof meshHubStatus> | { ok: false; error: string }
  try {
    mesh = meshHubStatus()
  } catch (e) {
    mesh = {
      ok: false,
      error: e instanceof Error ? e.message.slice(0, 160) : "mesh status failed",
    }
  }

  const meshProviders =
    mesh && "providers" in mesh && Array.isArray(mesh.providers)
      ? mesh.providers.map((p: { id?: string; status?: string; name?: string; tier?: string }) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          tier: p.tier,
        }))
      : []
  const anyReady = meshProviders.some(
    (p) => p.status === "ready" || p.status === "READY" || p.status === "live",
  )
  const meshBadge: ProbeBadge =
    mesh && "ok" in mesh && mesh.ok === false
      ? "DOWN"
      : anyReady
        ? "READY"
        : "STUB"

  const dimmLocal =
    dimm && "local" in dimm
      ? {
          mounted: !!(dimm as { mounted?: boolean }).mounted,
          sizeGb: (dimm as { local?: { sizeGb?: number } }).local?.sizeGb,
          path: (dimm as { local?: { path?: string } }).local?.path,
          backend: (dimm as { local?: { backend?: string } }).local?.backend,
          usedBytes: (dimm as { local?: { usedBytes?: number } }).local?.usedBytes,
        }
      : null
  const dimmHost =
    dimm && "host" in dimm
      ? (dimm as {
          host?: {
            memTotalGi?: number
            memAvailableGi?: number
            boxHardCapGb?: number
          }
        }).host
      : null

  return {
    ok: true,
    service: "triadic",
    hold: HOLD,
    lattice_sync: false as const,
    holds: {
      HOLD_VYRNA_UNSYNC: true,
      lattice_sync: false as const,
      note: "Never claim Vyrna sync or Venice lattice. Local probes only.",
    },
    seats: {
      commandHub: {
        badge: "LIVE" as ProbeBadge,
        detail: "Command Hub seat · /triadic panel",
        links: ["/command-hub", "/operator-twin", "/ai-hub"],
      },
      ollama: {
        badge: ollamaBadge,
        online: ollamaProbe.online,
        binaryPresent: binary,
        binaryPath: OLLAMA_BIN,
        base: OLLAMA_BASE,
        models: ollamaProbe.tags,
        detail: ollamaProbe.online
          ? ollamaProbe.detail
          : binary
            ? `binary present · server DOWN — run: ollama serve (${ollamaProbe.detail})`
            : "ollama binary not found",
      },
      ghostlight: {
        badge: ghostlight.badge,
        online: ghostlight.online,
        endpoint: GHOSTLIGHT_MCP,
        serverName: ghostlight.serverName,
        protocolVersion: ghostlight.protocolVersion,
        detail: ghostlight.detail,
      },
      dimmDrive: {
        badge: dimmLocal?.path ? ("LIVE" as ProbeBadge) : ("STUB" as ProbeBadge),
        local: dimmLocal,
        host: dimmHost,
        hold: DIMM_HOLD,
        lattice_sync: false as const,
        href: "/dimm-drive",
      },
      mesh: {
        badge: meshBadge,
        providers: meshProviders,
        auth: mesh && "auth" in mesh ? mesh.auth : "operator-owned",
        forbidsBurnerAccounts: true as const,
        hold: MESH_HOLD,
        lattice_sync: false as const,
        note: "DRY-RUN/STUB — no paid GPU spin from this panel",
        href: "/mesh",
      },
      runpod: {
        badge: "STUB" as ProbeBadge,
        detail: "Use /mesh dry-run schedule · never auto-start paid pods overnight",
        href: "/mesh",
      },
    },
    links: {
      dimmDrive: "/dimm-drive",
      mesh: "/mesh",
      symtrain: "/symtrain",
      reclaim: "/reclaim",
      venice: "/venice",
      commandHub: "/command-hub",
      modules: "/modules",
      s3v3nPanel: "/api/s3v3n-panel",
    },
    docs: packDigest(),
    ramGuard: {
      leaveOsGi: 2,
      boxHintGi: 15,
      note: "Do not pull giant models overnight without ≥2Gi free for OS (DIMM rules)",
    },
  }
}

/** Proxy chat to localhost Ollama only. Never logs prompt bodies. */
export async function ollamaChatSmoke(opts: {
  prompt?: string
  model?: string
}): Promise<{
  ok: boolean
  offline?: boolean
  status: ProbeBadge | "OFFLINE"
  text: string
  model?: string
  hold: typeof HOLD
  lattice_sync: false
}> {
  const probe = await probeOllama(1500)
  if (!probe.online) {
    return {
      ok: false,
      offline: true,
      status: "OFFLINE",
      text: `Ollama OFFLINE at ${OLLAMA_BASE}. Start with: ollama serve. No fake tokens.`,
      hold: HOLD,
      lattice_sync: false,
    }
  }
  const model =
    (typeof opts.model === "string" && opts.model.trim()) ||
    probe.tags[0] ||
    process.env.OLLAMA_OPS_MODEL ||
    "llama3.2"
  const prompt =
    typeof opts.prompt === "string" && opts.prompt.trim()
      ? opts.prompt.trim().slice(0, 2000)
      : "Reply with exactly: TRIADIC_SMOKE_OK"

  try {
    const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          {
            role: "system",
            content:
              "You are a local Triadic smoke check. HOLD_VYRNA_UNSYNC. Be brief.",
          },
          { role: "user", content: prompt },
        ],
        options: { temperature: 0.2 },
      }),
    })
    if (!res.ok) {
      return {
        ok: false,
        status: "DOWN",
        text: `Ollama HTTP ${res.status}`,
        model,
        hold: HOLD,
        lattice_sync: false,
      }
    }
    const data = (await res.json()) as { message?: { content?: string } }
    return {
      ok: true,
      status: "LIVE",
      text: (data.message?.content || "(empty)").slice(0, 4000),
      model,
      hold: HOLD,
      lattice_sync: false,
    }
  } catch (e) {
    return {
      ok: false,
      offline: true,
      status: "OFFLINE",
      text:
        e instanceof Error
          ? `Ollama error: ${e.message.slice(0, 200)}`
          : "Ollama error",
      model,
      hold: HOLD,
      lattice_sync: false,
    }
  }
}
