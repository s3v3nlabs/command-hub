/**
 * S3v3n native multi-AI Panel of Experts (private mirror of BuildShip UX).
 * One prompt → parallel fan-out → score/leaderboard → aggregate.
 *
 * Privacy threat model:
 * - Prefer zero-egress / private seats (Twin RAG, Ollama, Axios local, Ghostlight 127.0.0.1).
 * - Venice only with Operator-owned VENICE_API_KEY (server-side).
 * - ops-router providers only with reclaim env keys (Operator-owned).
 * - Never scrape third-party UIs, never spoof unpaid commercial access.
 * - Never log prompt/response bodies to console/analytics/shared files.
 */

import { spawn } from "child_process"
import fs from "fs"
import path from "path"
import { probeOllama, OLLAMA_BASE, routePrompt, type OpsProviderId } from "@/lib/ai/ops-router"
import { searchTwin, getTwinStatus, buildTwinIndex } from "@/lib/ai/operator-twin"
import { safeLog } from "@/lib/privacy/antiTelemetry"
import { encryptJson } from "@/lib/privacy/localCrypto"
import { egressAwareFetch, getEgressConfig } from "@/lib/privacy/egress"

export type PrivacyMode = "PRIVATE_LOCAL" | "PRIVATE_VENICE" | "MOCK_ZERO_EGRESS"

export type PanelSeatId =
  | "twin-rag"
  | "ollama"
  | "axios"
  | "ghostlight-vault"
  | "venice"
  | "groq"
  | "xai"
  | "openai"

export type S3v3nPanelResponse = {
  model: string
  response: string
  confidence: number
  timestamp: string
  metadata: {
    source: "s3v3n-live"
    seat: PanelSeatId
    privacy: PrivacyMode
    offline?: boolean
    detail?: string
    [key: string]: unknown
  }
}

export type S3v3nPanelResult = {
  ok: boolean
  source: "s3v3n-live"
  privacyMode: PrivacyMode
  responses: S3v3nPanelResponse[]
  leaderboard: Array<{ model: string; seat: PanelSeatId; confidence: number; rank: number }>
  aggregate: { model: string; response: string; confidence: number; seat: PanelSeatId } | null
  adapters: Array<{ seat: PanelSeatId; status: "live" | "offline" | "skipped"; detail: string }>
}

const GHOSTLIGHT_MCP = "http://127.0.0.1:8765/mcp"
const ENGINES_ROOT = "/workspace/singular-ty-engines"
const VENICE_API_BASE = process.env.VENICE_API_URL || "https://api.venice.ai/api/v1"

function hasKey(name: string): boolean {
  const v = process.env[name]
  return typeof v === "string" && v.trim().length > 0
}

function redact(s: string): string {
  return s
    .replace(/sk-[a-zA-Z0-9_-]+/g, "[redacted]")
    .replace(/gsk_[a-zA-Z0-9_-]+/g, "[redacted]")
    .replace(/xai-[a-zA-Z0-9_-]+/gi, "[redacted]")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "[redacted-jwt]")
}

function seatResult(
  seat: PanelSeatId,
  model: string,
  response: string,
  confidence: number,
  privacy: PrivacyMode,
  extra: Record<string, unknown> = {},
): S3v3nPanelResponse {
  return {
    model,
    response: redact(response).slice(0, 8000),
    confidence: Number(Math.max(0, Math.min(1, confidence)).toFixed(2)),
    timestamp: new Date().toISOString(),
    metadata: {
      source: "s3v3n-live",
      seat,
      privacy,
      ...extra,
    },
  }
}

/** Local Twin RAG — retrieval only (zero LLM egress). */
async function adapterTwinRag(prompt: string): Promise<{
  live: S3v3nPanelResponse | null
  status: "live" | "offline" | "skipped"
  detail: string
}> {
  try {
    let status = getTwinStatus()
    if (!status.indexed) {
      buildTwinIndex()
      status = getTwinStatus()
    }
    if (!status.indexed) {
      return { live: null, status: "offline", detail: "twin index unavailable" }
    }
    const hits = searchTwin(prompt, 6)
    if (!hits.length) {
      return {
        live: seatResult(
          "twin-rag",
          "operatorTwin-RAG",
          "No matching local vault chunks for this prompt (retrieval-only, zero egress).",
          0.15,
          "PRIVATE_LOCAL",
          { hits: 0, mode: "retrieval-only" },
        ),
        status: "live",
        detail: "indexed, zero hits",
      }
    }
    const conf = Math.min(0.9, 0.35 + hits[0].score / 12)
    const body = [
      "Operator Twin RAG (local retrieval only — no cloud synthesis):",
      ...hits.map(
        (h, i) =>
          `[${i + 1}] ${h.vault} · ${h.title} (score ${h.score.toFixed(2)})\n${h.excerpt}`,
      ),
    ].join("\n\n")
    return {
      live: seatResult("twin-rag", "operatorTwin-RAG", body, conf, "PRIVATE_LOCAL", {
        hits: hits.length,
        mode: "retrieval-only",
      }),
      status: "live",
      detail: `${hits.length} hit(s)`,
    }
  } catch (err) {
    return {
      live: null,
      status: "offline",
      detail: err instanceof Error ? err.message.slice(0, 120) : "twin error",
    }
  }
}

/** Local Ollama if daemon is up. */
async function adapterOllama(prompt: string): Promise<{
  live: S3v3nPanelResponse | null
  status: "live" | "offline" | "skipped"
  detail: string
}> {
  const probe = await probeOllama(1200)
  if (!probe.online) {
    return { live: null, status: "offline", detail: probe.detail }
  }
  const result = await routePrompt({ provider: "ollama", prompt, liberation: false })
  if (!result.ok || result.status !== "live") {
    return { live: null, status: "offline", detail: result.text.slice(0, 120) }
  }
  return {
    live: seatResult(
      "ollama",
      `ollama:${String(result.meta?.model || "local")}`,
      result.text,
      0.78,
      "PRIVATE_LOCAL",
      { base: OLLAMA_BASE },
    ),
    status: "live",
    detail: "local inference",
  }
}

/** Axios / Vedic persona via local singular-ty-engines (zero Venice scrape). */
async function adapterAxios(prompt: string): Promise<{
  live: S3v3nPanelResponse | null
  status: "live" | "offline" | "skipped"
  detail: string
}> {
  const script = path.join(ENGINES_ROOT, "run_axios.py")
  if (!fs.existsSync(script)) {
    return { live: null, status: "offline", detail: "run_axios.py missing" }
  }
  const py = fs.existsSync(path.join(ENGINES_ROOT, ".venv/bin/python"))
    ? path.join(ENGINES_ROOT, ".venv/bin/python")
    : "python3"
  // Truncate prompt passed to child; do not write to shared logs
  const short = prompt.slice(0, 240)
  return new Promise((resolve) => {
    const child = spawn(py, [script, "--demo", "--prompt", short], {
      cwd: ENGINES_ROOT,
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    })
    let out = ""
    const timer = setTimeout(() => {
      child.kill("SIGKILL")
      resolve({ live: null, status: "offline", detail: "axios timeout" })
    }, 9000)
    child.stdout.on("data", (d) => {
      out += d.toString()
    })
    child.stderr.on("data", (d) => {
      out += d.toString()
    })
    child.on("error", () => {
      clearTimeout(timer)
      resolve({ live: null, status: "offline", detail: "axios spawn failed" })
    })
    child.on("close", (code) => {
      clearTimeout(timer)
      if (code !== 0 && !out.includes("SMOKE_OK") && !out.includes("PERSONA")) {
        resolve({ live: null, status: "offline", detail: `axios exit ${code}` })
        return
      }
      const preview = out.split("\n").slice(0, 40).join("\n").slice(0, 3500)
      resolve({
        live: seatResult(
          "axios",
          "axios-vedic",
          `Local Axios / Vedic seat (engines dry demo — no Venice scrape):\n${preview}`,
          0.62,
          "PRIVATE_LOCAL",
          { engine: "axios", mode: "local-demo" },
        ),
        status: "live",
        detail: "local engines demo",
      })
    })
  })
}

/** Ghostlight vault MCP on loopback only (never public Cloudflare URL). */
async function adapterGhostlightVault(prompt: string): Promise<{
  live: S3v3nPanelResponse | null
  status: "live" | "offline" | "skipped"
  detail: string
}> {
  try {
    const initRes = await fetch(GHOSTLIGHT_MCP, {
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
          clientInfo: { name: "s3v3n-panel", version: "0.1" },
        },
      }),
    })
    const sid = initRes.headers.get("mcp-session-id")
    if (!sid) {
      return { live: null, status: "offline", detail: "no mcp-session-id" }
    }
    await fetch(GHOSTLIGHT_MCP, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "mcp-session-id": sid,
      },
      body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
    }).catch(() => undefined)

    const toolRes = await fetch(GHOSTLIGHT_MCP, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "mcp-session-id": sid,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "vault_search",
          arguments: { query: prompt.slice(0, 200), limit: 5 },
        },
      }),
    })
    const raw = await toolRes.text()
    const dataLine = raw.split("\n").find((l) => l.startsWith("data: "))
    const payload = dataLine ? JSON.parse(dataLine.slice(6)) : null
    const text =
      payload?.result?.content?.[0]?.text ||
      payload?.result?.result ||
      (typeof payload?.result === "string" ? payload.result : null)
    if (!text) {
      return { live: null, status: "offline", detail: "vault_search empty" }
    }
    return {
      live: seatResult(
        "ghostlight-vault",
        "ghostlight-vault",
        `Ghostlight local vault FTS (127.0.0.1 only):\n${String(text).slice(0, 4000)}`,
        0.7,
        "PRIVATE_LOCAL",
        { mcp: "127.0.0.1:8765", mode: "vault_search" },
      ),
      status: "live",
      detail: "loopback MCP vault_search",
    }
  } catch (err) {
    return {
      live: null,
      status: "offline",
      detail: err instanceof Error ? err.message.slice(0, 120) : "mcp offline",
    }
  }
}

/**
 * Venice inference — ONLY with Operator-owned VENICE_API_KEY.
 * Refuses scrape / unpaid spoof paths.
 */
async function adapterVenice(prompt: string): Promise<{
  live: S3v3nPanelResponse | null
  status: "live" | "offline" | "skipped"
  detail: string
}> {
  if (!hasKey("VENICE_API_KEY")) {
    return {
      live: null,
      status: "skipped",
      detail: "VENICE_API_KEY absent — refuse scrape/spoof; use Axios local instead",
    }
  }
  const key = process.env.VENICE_API_KEY as string
  try {
    // Non-local seat: honor egress proxy when S3V3N_EGRESS_MODE != direct
    const res = await egressAwareFetch(`${VENICE_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.VENICE_OPS_MODEL || "llama-3.3-70b",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
      }),
    })
    if (!res.ok) {
      return { live: null, status: "offline", detail: `Venice HTTP ${res.status}` }
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
      model?: string
    }
    const text = data.choices?.[0]?.message?.content || ""
    if (!text) return { live: null, status: "offline", detail: "empty Venice response" }
    return {
      live: seatResult(
        "venice",
        `venice:${data.model || "chat"}`,
        text,
        0.8,
        "PRIVATE_VENICE",
        { mode: "owned-key" },
      ),
      status: "live",
      detail: "owned VENICE_API_KEY",
    }
  } catch (err) {
    return {
      live: null,
      status: "offline",
      detail: err instanceof Error ? err.message.slice(0, 120) : "venice error",
    }
  }
}

/** Owned-key ops-router seats (Operator credentials only). */
async function adapterOwnedProvider(
  seat: "groq" | "xai" | "openai",
  prompt: string,
): Promise<{
  live: S3v3nPanelResponse | null
  status: "live" | "offline" | "skipped"
  detail: string
}> {
  const keyMap = {
    groq: ["GROQ_API_KEY", "AI_GROQ_API_KEY"],
    xai: ["XAI_API_KEY"],
    openai: ["OPENAI_API_KEY"],
  } as const
  if (!keyMap[seat].some(hasKey)) {
    return { live: null, status: "skipped", detail: `${seat} key absent` }
  }
  const result = await routePrompt({
    provider: seat as OpsProviderId,
    prompt,
    liberation: false,
  })
  if (!result.ok || result.status !== "live") {
    return { live: null, status: "offline", detail: result.text.slice(0, 120) }
  }
  // Owned cloud seats still egress to that vendor — mark as PRIVATE_LOCAL only if
  // we treat "Operator-owned key" as private seat vs harvester-bypass. Badge stays
  // PRIVATE_LOCAL for panel mix unless Venice-only; privacyMode computed at aggregate.
  return {
    live: seatResult(
      seat,
      `${seat}:${String(result.meta?.model || "chat")}`,
      result.text,
      seat === "groq" ? 0.82 : seat === "xai" ? 0.8 : 0.79,
      "PRIVATE_LOCAL",
      { mode: "owned-key", provider: seat },
    ),
    status: "live",
    detail: "owned key via ops-router",
  }
}

function buildLeaderboard(responses: S3v3nPanelResponse[]) {
  return [...responses]
    .sort((a, b) => b.confidence - a.confidence)
    .map((r, i) => ({
      model: r.model,
      seat: r.metadata.seat,
      confidence: r.confidence,
      rank: i + 1,
    }))
}

function pickAggregate(
  responses: S3v3nPanelResponse[],
  preferSeat?: string,
): S3v3nPanelResult["aggregate"] {
  if (!responses.length) return null
  if (preferSeat) {
    const hit = responses.find((r) => r.metadata.seat === preferSeat || r.model === preferSeat)
    if (hit) {
      return {
        model: hit.model,
        response: hit.response,
        confidence: hit.confidence,
        seat: hit.metadata.seat,
      }
    }
  }
  const top = buildLeaderboard(responses)[0]
  const full = responses.find((r) => r.model === top.model && r.metadata.seat === top.seat)!
  return {
    model: full.model,
    response: full.response,
    confidence: full.confidence,
    seat: full.metadata.seat,
  }
}

function computePrivacyMode(responses: S3v3nPanelResponse[]): PrivacyMode {
  if (!responses.length) return "MOCK_ZERO_EGRESS"
  if (responses.some((r) => r.metadata.privacy === "PRIVATE_VENICE" || r.metadata.seat === "venice")) {
    return "PRIVATE_VENICE"
  }
  return "PRIVATE_LOCAL"
}

/**
 * Run S3v3n panel fan-out. Server-side only.
 * Does not log prompt/response bodies.
 */
export async function runS3v3nPanel(
  prompt: string,
  opts?: { preferSeat?: string; includeOwnedCloud?: boolean },
): Promise<S3v3nPanelResult> {
  const q = (prompt || "").trim()
  if (!q) {
    return {
      ok: false,
      source: "s3v3n-live",
      privacyMode: "MOCK_ZERO_EGRESS",
      responses: [],
      leaderboard: [],
      aggregate: null,
      adapters: [],
    }
  }

  const includeOwned = opts?.includeOwnedCloud !== false

  // Local-first seats always. Venice + owned-cloud BYOK only when includeOwnedCloud.
  const jobs: Array<Promise<{
    seat: PanelSeatId
    live: S3v3nPanelResponse | null
    status: "live" | "offline" | "skipped"
    detail: string
  }>> = [
    adapterTwinRag(q).then((r) => ({ seat: "twin-rag" as const, ...r })),
    adapterOllama(q).then((r) => ({ seat: "ollama" as const, ...r })),
    adapterAxios(q).then((r) => ({ seat: "axios" as const, ...r })),
    adapterGhostlightVault(q).then((r) => ({ seat: "ghostlight-vault" as const, ...r })),
  ]

  if (includeOwned) {
    jobs.push(
      adapterVenice(q).then((r) => ({ seat: "venice" as const, ...r })),
      adapterOwnedProvider("groq", q).then((r) => ({ seat: "groq" as const, ...r })),
      adapterOwnedProvider("xai", q).then((r) => ({ seat: "xai" as const, ...r })),
      adapterOwnedProvider("openai", q).then((r) => ({ seat: "openai" as const, ...r })),
    )
  }

  const settled = await Promise.all(jobs)
  const responses = settled.map((s) => s.live).filter(Boolean) as S3v3nPanelResponse[]
  const adapters = settled.map((s) => ({
    seat: s.seat,
    status: s.status,
    detail: s.detail,
  }))

  const privacyMode = computePrivacyMode(responses)
  const leaderboard = buildLeaderboard(responses)
  const aggregate = pickAggregate(responses, opts?.preferSeat)

  return {
    ok: responses.length > 0,
    source: "s3v3n-live",
    privacyMode: responses.length ? privacyMode : "MOCK_ZERO_EGRESS",
    responses,
    leaderboard,
    aggregate,
    adapters,
  }
}

/** Optional evidence persist — chmod 600 under reclaim vault path only. Never commit.
 * When S3V3N_PANEL_PERSIST=1, writes encrypted blob (AES-GCM) if privacy key available;
 * otherwise slim metadata only (no response bodies). Never logs bodies.
 */
export function persistPanelEvidence(
  result: S3v3nPanelResult,
  meta: { promptHash: string },
): string | null {
  if (process.env.S3V3N_PANEL_PERSIST !== "1") return null
  const dir = "/workspace/chatgpt-vault/raw/live_2026-gap/connector_ingest/s3v3n-panel"
  try {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 })
    const egress = getEgressConfig()
    // Store adapter status + hashes — strip full response bodies for privacy default
    const slim = {
      at: new Date().toISOString(),
      promptHash: meta.promptHash,
      privacyMode: result.privacyMode,
      egressMode: egress.mode,
      adapters: result.adapters,
      leaderboard: result.leaderboard,
      models: result.responses.map((r) => ({
        model: r.model,
        seat: r.metadata.seat,
        confidence: r.confidence,
        chars: r.response.length,
      })),
    }
    const encrypted = encryptJson(slim)
    const file = path.join(
      dir,
      encrypted ? `panel-${Date.now()}.enc.json` : `panel-${Date.now()}.json`,
    )
    const payload = encrypted
      ? { encrypted: true, alg: encrypted.alg, v: encrypted.v, iv: encrypted.iv, tag: encrypted.tag, ct: encrypted.ct }
      : slim
    fs.writeFileSync(file, JSON.stringify(payload, null, 2), { mode: 0o600 })
    try {
      fs.chmodSync(file, 0o600)
    } catch {
      /* ignore */
    }
    safeLog("info", "s3v3n-panel evidence persisted", {
      encrypted: Boolean(encrypted),
      chars: 0,
    })
    return file
  } catch {
    return null
  }
}
