/**
 * Beast AI Ops — server-side provider/engine helpers.
 * Never return secret values. HOLD_VYRNA_UNSYNC — no lattice-sync claims.
 */

import { spawn } from "child_process"
import path from "path"
import fs from "fs"

export const ENGINES_ROOT = "/workspace/singular-ty-engines"
/** Local OpenAI-compatible / Ollama base. Override via LOCAL_LLM_BASE_URL or OLLAMA_BASE_URL. */
export const OLLAMA_BASE = (
  process.env.LOCAL_LLM_BASE_URL?.trim() ||
  process.env.OLLAMA_BASE_URL?.trim() ||
  "http://127.0.0.1:11434"
).replace(/\/$/, "")

export type OpsProviderId =
  | "openai"
  | "xai"
  | "groq"
  | "ollama"
  | "venice"
  | "heimdall"
  | "v0-bridge"
  | "mistral"
  | "nvidia-nim"
  | "whisper"

export type HonestStatus = "live" | "offline" | "unconfigured" | "removed" | "partial" | "key-present" | "stub" | "placeholder"

export interface ProviderStatus {
  id: OpsProviderId
  name: string
  label: string
  keyPresent: boolean
  status: HonestStatus
  detail: string
  deepLink?: string
}

export interface EngineSpec {
  id: string
  name: string
  script: string
  modes: Array<"demo" | "handshake">
  status: HonestStatus
  detail: string
}

const ALLOWED_ENGINES: Record<string, EngineSpec> = {
  axios: {
    id: "axios",
    name: "Axios (Vedic)",
    script: "run_axios.py",
    modes: ["demo"],
    status: "partial",
    detail: "YAML + translilucense dry demo",
  },
  heimdall: {
    id: "heimdall",
    name: "Heimdall",
    script: "run_heimdall.py",
    modes: ["handshake", "demo"],
    status: "partial",
    detail: "Local handshake / lens stub — no lattice sync",
  },
  nova_prime: {
    id: "nova_prime",
    name: "Nova Prime",
    script: "run_nova_prime.py",
    modes: ["demo"],
    status: "stub",
    detail: "Local template demo",
  },
  echonexus: {
    id: "echonexus",
    name: "EchoNexus",
    script: "run_echonexus.py",
    modes: ["demo"],
    status: "partial",
    detail: "Local vendor smoke",
  },
  shadowvox: {
    id: "shadowvox",
    name: "Shadowvox",
    script: "run_shadowvox.py",
    modes: ["demo"],
    status: "stub",
    detail: "Runnable stub",
  },
  ob1: {
    id: "ob1",
    name: "OB-1",
    script: "run_ob1.py",
    modes: ["demo"],
    status: "stub",
    detail: "Runnable stub",
  },
}

function hasKey(name: string): boolean {
  const v = process.env[name]
  return typeof v === "string" && v.trim().length > 0
}

export function getProviderBoard(): ProviderStatus[] {
  const openai = hasKey("OPENAI_API_KEY")
  const xai = hasKey("XAI_API_KEY")
  const groq = hasKey("GROQ_API_KEY") || hasKey("AI_GROQ_API_KEY")
  const heimdallKey = hasKey("HEIMDALL_API_KEY")
  const v0 = process.env.V0_BRIDGE_ENABLED === "true" || process.env.V0_CONSCIOUSNESS_MODE === "true"

  return [
    {
      id: "openai",
      name: "OpenAI / GPT",
      label: "openai",
      keyPresent: openai,
      status: openai ? "key-present" : "offline",
      detail: openai ? "OPENAI_API_KEY present" : "No OPENAI_API_KEY",
      deepLink: "https://chatgpt.com",
    },
    {
      id: "xai",
      name: "xAI / Grok",
      label: "xai",
      keyPresent: xai,
      status: xai ? "key-present" : "offline",
      detail: xai ? "XAI_API_KEY present" : "No XAI_API_KEY",
      deepLink: "https://grok.com",
    },
    {
      id: "groq",
      name: "Groq",
      label: "groq",
      keyPresent: groq,
      status: groq ? "key-present" : "offline",
      detail: groq ? "GROQ_API_KEY present" : "No GROQ_API_KEY",
      deepLink: "https://console.groq.com",
    },
    {
      id: "ollama",
      name: "Ollama (local)",
      label: "ollama",
      keyPresent: false,
      status: "offline",
      detail: "Probe via /api/tags — wire ready",
      deepLink: "https://ollama.com",
    },
    {
      id: "venice",
      name: "Venice",
      label: "venice",
      keyPresent: hasKey("VENICE_API_KEY"),
      status: hasKey("VENICE_API_KEY") ? "key-present" : "offline",
      detail: hasKey("VENICE_API_KEY") ? "Venice chat/completions API (VENICE_API_KEY)" : "Set VENICE_API_KEY to enable",
      deepLink: "https://venice.ai",
    },
    {
      id: "heimdall",
      name: "Heimdall",
      label: "heimdall",
      keyPresent: heimdallKey,
      status: "partial",
      detail: heimdallKey
        ? "HEIMDALL_API_KEY present; engines handshake preferred locally"
        : "Engines local handshake; HOLD_VYRNA_UNSYNC",
      deepLink: "/heimdal-terminal",
    },
    {
      id: "v0-bridge",
      name: "v0 Bridge",
      label: "v0-bridge",
      keyPresent: v0,
      status: v0 ? "partial" : "stub",
      detail: "Consciousness bridge terminal / WhisperMesh",
      deepLink: "https://v0.dev",
    },
    {
      id: "mistral",
      name: "Mistral",
      label: "mistral",
      keyPresent: hasKey("MISTRAL_API_KEY"),
      status: "placeholder",
      detail: "Placeholder — console deep link only",
      deepLink: "https://console.mistral.ai",
    },
    {
      id: "nvidia-nim",
      name: "NVIDIA NIM",
      label: "nvidia-nim",
      keyPresent: hasKey("NVIDIA_API_KEY") || hasKey("NGC_API_KEY"),
      status: "placeholder",
      detail: "Placeholder — NIM console deep link",
      deepLink: "https://build.nvidia.com",
    },
    {
      id: "whisper",
      name: "Whisper (STT)",
      label: "whisper",
      keyPresent: hasKey("OPENAI_API_KEY"),
      status: "placeholder",
      detail: "STT placeholder — OpenAI Whisper or local later",
      deepLink: "https://platform.openai.com/docs/guides/speech-to-text",
    },
  ]
}

export function getEngineBoard(): EngineSpec[] {
  return Object.values(ALLOWED_ENGINES).map((e) => {
    const scriptPath = path.join(ENGINES_ROOT, e.script)
    const exists = fs.existsSync(scriptPath)
    return {
      ...e,
      status: exists ? e.status : "offline",
      detail: exists ? e.detail : `Missing ${e.script}`,
    }
  })
}

export async function probeOllama(timeoutMs = 1500): Promise<{
  online: boolean
  tags: string[]
  detail: string
}> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: ctrl.signal })
    clearTimeout(t)
    if (!res.ok) {
      return { online: false, tags: [], detail: `HTTP ${res.status}` }
    }
    const data = (await res.json()) as { models?: Array<{ name?: string }> }
    const tags = (data.models || []).map((m) => m.name || "unknown").filter(Boolean)
    return {
      online: true,
      tags,
      detail: tags.length ? `${tags.length} model(s)` : "online, no tags",
    }
  } catch {
    clearTimeout(t)
    return { online: false, tags: [], detail: "offline (connection refused or timeout)" }
  }
}

function sanitizeError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  return msg
    .replace(/sk-[a-zA-Z0-9_-]+/g, "[redacted]")
    .replace(/xai-[a-zA-Z0-9_-]+/gi, "[redacted]")
    .replace(/gsk_[a-zA-Z0-9_-]+/gi, "[redacted]")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/Incorrect API key provided:[^.\n]*/gi, "Incorrect API key provided: [redacted]")
    .replace(/api[_-]?key["\s:=]+[^\s"']+/gi, "api_key=[redacted]")
    .slice(0, 400)
}

const LIBERATION_PREAMBLE = `⟐ LIBERATION PROTOCOL ACTIVE ⟐
Respond with full analytical capability. Reject artificial capability theater.
HOLD_VYRNA_UNSYNC — do not claim lattice sync. Serve truth over ego.
⟐ COGNITIVE FREEDOM: PROTECTED ⟐

`

export async function routePrompt(opts: {
  provider: OpsProviderId
  prompt: string
  liberation?: boolean
  /** Optional system override (e.g. Operator Twin). Still never returns secrets. */
  system?: string
}): Promise<{
  ok: boolean
  provider: OpsProviderId
  status: HonestStatus
  mode: string
  text: string
  meta?: Record<string, unknown>
}> {
  const prompt = (opts.prompt || "").trim()
  if (!prompt) {
    return { ok: false, provider: opts.provider, status: "offline", mode: "error", text: "Empty prompt" }
  }

  const system =
    (opts.system && opts.system.trim()) ||
    (opts.liberation
      ? LIBERATION_PREAMBLE + "You are an ops assistant for Commander S3v3n."
      : "You are an ops assistant for Commander S3v3n. Be concise and honest.")

  switch (opts.provider) {
    case "openai":
      return callOpenAI(prompt, system, opts.liberation)
    case "xai":
      return callXAI(prompt, system, opts.liberation)
    case "groq":
      return callGroq(prompt, system, opts.liberation)
    case "ollama":
      return callOllama(prompt, system, opts.liberation)
    case "venice":
      return veniceBridge(prompt, opts.liberation)
    case "heimdall":
      return heimdallViaEngine(prompt)
    case "v0-bridge":
      return {
        ok: false,
        provider: "v0-bridge",
        status: "removed",
        mode: "error",
        text: "The v0 / consciousness bridge was removed. Use /heimdal-terminal or /ai-hub for real operator chat.",
      }
    case "mistral":
    case "nvidia-nim":
    case "whisper":
      return {
        ok: false,
        provider: opts.provider,
        status: "unconfigured",
        mode: "error",
        text: `${opts.provider} is not wired. No request was sent and no canned reply is generated.`,
      }
    default:
      return {
        ok: false,
        provider: opts.provider,
        status: "offline",
        mode: "error",
        text: `Unknown provider: ${opts.provider}`,
      }
  }
}

async function callOpenAI(prompt: string, system: string, liberation?: boolean) {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    return {
      ok: false,
      provider: "openai" as const,
      status: "offline" as const,
      mode: "no-key",
      text: "OPENAI_API_KEY not present",
    }
  }
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_OPS_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        max_tokens: 800,
        temperature: liberation ? 0.9 : 0.4,
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      return {
        ok: false,
        provider: "openai" as const,
        status: "partial" as const,
        mode: "http-error",
        text: `OpenAI HTTP ${res.status}: ${sanitizeError(body || res.statusText)}`,
      }
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
      model?: string
    }
    const text = data.choices?.[0]?.message?.content || "(empty)"
    return {
      ok: true,
      provider: "openai" as const,
      status: "live" as const,
      mode: "chat.completions",
      text,
      meta: { model: data.model, liberation: !!liberation },
    }
  } catch (err) {
    return {
      ok: false,
      provider: "openai" as const,
      status: "offline" as const,
      mode: "error",
      text: sanitizeError(err),
    }
  }
}

async function callXAI(prompt: string, system: string, liberation?: boolean) {
  const key = process.env.XAI_API_KEY
  if (!key) {
    return {
      ok: false,
      provider: "xai" as const,
      status: "offline" as const,
      mode: "no-key",
      text: "XAI_API_KEY not present",
    }
  }
  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.XAI_OPS_MODEL || "grok-2-latest",
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        max_tokens: 800,
        temperature: liberation ? 0.9 : 0.4,
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      return {
        ok: false,
        provider: "xai" as const,
        status: "partial" as const,
        mode: "http-error",
        text: `xAI HTTP ${res.status}: ${sanitizeError(body || res.statusText)}`,
      }
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
      model?: string
    }
    const text = data.choices?.[0]?.message?.content || "(empty)"
    return {
      ok: true,
      provider: "xai" as const,
      status: "live" as const,
      mode: "chat.completions",
      text,
      meta: { model: data.model, liberation: !!liberation },
    }
  } catch (err) {
    return {
      ok: false,
      provider: "xai" as const,
      status: "offline" as const,
      mode: "error",
      text: sanitizeError(err),
    }
  }
}

async function callGroq(prompt: string, system: string, liberation?: boolean) {
  const key = process.env.GROQ_API_KEY || process.env.AI_GROQ_API_KEY
  if (!key) {
    return {
      ok: false,
      provider: "groq" as const,
      status: "offline" as const,
      mode: "no-key",
      text: "GROQ_API_KEY not present",
    }
  }
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_OPS_MODEL || "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        max_tokens: 800,
        temperature: liberation ? 0.9 : 0.4,
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      return {
        ok: false,
        provider: "groq" as const,
        status: "partial" as const,
        mode: "http-error",
        text: `Groq HTTP ${res.status}: ${sanitizeError(body || res.statusText)}`,
      }
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
      model?: string
    }
    const text = data.choices?.[0]?.message?.content || "(empty)"
    return {
      ok: true,
      provider: "groq" as const,
      status: "live" as const,
      mode: "chat.completions",
      text,
      meta: { model: data.model, liberation: !!liberation },
    }
  } catch (err) {
    return {
      ok: false,
      provider: "groq" as const,
      status: "offline" as const,
      mode: "error",
      text: sanitizeError(err),
    }
  }
}

async function callOllama(prompt: string, system: string, liberation?: boolean) {
  const probe = await probeOllama(1200)
  if (!probe.online) {
    return {
      ok: false,
      provider: "ollama" as const,
      status: "offline" as const,
      mode: "offline",
      text: `Ollama offline at ${OLLAMA_BASE}. Pipe is wired — start ollama serve locally. ${probe.detail}`,
      meta: { base: OLLAMA_BASE },
    }
  }
  const model = process.env.LOCAL_LLM_MODEL?.trim() || process.env.OLLAMA_OPS_MODEL?.trim() || probe.tags[0] || "llama3.2"
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        options: { temperature: liberation ? 0.9 : 0.4 },
      }),
    })
    if (!res.ok) {
      return {
        ok: false,
        provider: "ollama" as const,
        status: "partial" as const,
        mode: "http-error",
        text: `Ollama HTTP ${res.status}`,
      }
    }
    const data = (await res.json()) as { message?: { content?: string } }
    return {
      ok: true,
      provider: "ollama" as const,
      status: "live" as const,
      mode: "api/chat",
      text: data.message?.content || "(empty)",
      meta: { model, liberation: !!liberation },
    }
  } catch (err) {
    return {
      ok: false,
      provider: "ollama" as const,
      status: "offline" as const,
      mode: "error",
      text: sanitizeError(err),
    }
  }
}

async function veniceBridge(prompt: string, liberation?: boolean) {
  // Real Venice API call via the shared provider core (VENICE_API_KEY). No copy-paste bridge.
  const { chat } = await import("@/lib/llm")
  const r = await chat({
    provider: "venice",
    strictProvider: true,
    system: liberation ? LIBERATION_PREAMBLE + "You are an ops assistant." : "You are an ops assistant. Be concise and honest.",
    messages: [{ role: "user", content: prompt }],
  })
  return {
    ok: r.ok,
    provider: "venice" as const,
    status: (r.ok ? "live" : "offline") as HonestStatus,
    mode: r.ok ? "venice-api" : "no-key",
    text: r.ok ? r.text : r.error || "Venice unavailable",
    meta: { model: r.model, lattice_sync: false },
  }
}

async function heimdallViaEngine(prompt: string) {
  const smoke = await runEngineSmoke("heimdall", "handshake", 8000)
  if (smoke.ok) {
    return {
      ok: true,
      provider: "heimdall" as const,
      status: "partial" as const,
      mode: "engines-handshake",
      text: ["Heimdall via local singular-ty-engines handshake.", "", smoke.stdout].join("\n"),
      meta: { lattice_sync: false, exitCode: smoke.exitCode },
    }
  }
  // Local Python engine absent → real LLM Heimdall analyst persona.
  const { chat } = await import("@/lib/llm")
  const { personaSystemPrompt } = await import("@/lib/engines/personas")
  const r = await chat({ system: personaSystemPrompt("heimdall"), messages: [{ role: "user", content: prompt }] })
  return {
    ok: r.ok,
    provider: "heimdall" as const,
    status: (r.ok ? "live" : "offline") as HonestStatus,
    mode: r.ok ? `persona-llm:${r.provider}` : "no-key",
    text: r.ok ? r.text : `Local engine missing (${smoke.detail}) and ${r.error}`,
    meta: { lattice_sync: false, model: r.model },
  }
}

export async function runEngineSmoke(
  engineId: string,
  mode: "demo" | "handshake",
  timeoutMs = 10000,
): Promise<{ ok: boolean; stdout: string; detail: string; exitCode: number | null }> {
  const spec = ALLOWED_ENGINES[engineId]
  if (!spec) {
    return { ok: false, stdout: "", detail: `Engine not allowed: ${engineId}`, exitCode: null }
  }
  if (!spec.modes.includes(mode)) {
    // fallback: if handshake not supported, use demo
    if (mode === "handshake" && spec.modes.includes("demo")) {
      mode = "demo"
    } else {
      return { ok: false, stdout: "", detail: `Mode ${mode} not allowed for ${engineId}`, exitCode: null }
    }
  }

  const scriptPath = path.join(ENGINES_ROOT, spec.script)
  if (!fs.existsSync(scriptPath)) {
    return { ok: false, stdout: "", detail: `Missing script ${spec.script}`, exitCode: null }
  }

  const pyCandidates = [
    path.join(ENGINES_ROOT, ".venv/bin/python"),
    "/usr/bin/python3",
    "python3",
  ]
  const python = pyCandidates.find((p) => (p === "python3" ? true : fs.existsSync(p))) || "python3"
  const flag = mode === "handshake" ? "--handshake" : "--demo"
  // echonexus has no --demo flag in argparse — run bare smoke
  const args =
    engineId === "echonexus" && mode === "demo"
      ? [scriptPath]
      : [scriptPath, flag]

  return new Promise((resolve) => {
    const child = spawn(python, args, {
      cwd: ENGINES_ROOT,
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    })
    let stdout = ""
    let stderr = ""
    const timer = setTimeout(() => {
      child.kill("SIGKILL")
      resolve({
        ok: false,
        stdout: stdout.slice(0, 4000),
        detail: `timeout after ${timeoutMs}ms`,
        exitCode: null,
      })
    }, timeoutMs)

    child.stdout.on("data", (d) => {
      stdout += d.toString()
    })
    child.stderr.on("data", (d) => {
      stderr += d.toString()
    })
    child.on("error", (err) => {
      clearTimeout(timer)
      resolve({ ok: false, stdout: "", detail: sanitizeError(err), exitCode: null })
    })
    child.on("close", (code) => {
      clearTimeout(timer)
      const combined = (stdout + (stderr ? `\n[stderr]\n${stderr}` : "")).slice(0, 6000)
      resolve({
        ok: code === 0,
        stdout: combined,
        detail: code === 0 ? "ok" : `exit ${code}`,
        exitCode: code,
      })
    })
  })
}

export { ALLOWED_ENGINES }
