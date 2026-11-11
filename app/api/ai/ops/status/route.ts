export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import {
  getProviderBoard,
  getEngineBoard,
  probeOllama,
  type ProviderStatus,
} from "@/lib/ai/ops-router"

/**
 * GET /api/ai/ops/status
 * Provider key-presence (booleans only), ollama tags, engines smoke summary.
 * Never returns secret values.
 */
export async function GET() {
  try {
    const ollama = await probeOllama(1500)
    const providers: ProviderStatus[] = getProviderBoard().map((p) => {
      if (p.id === "ollama") {
        return {
          ...p,
          status: ollama.online ? "live" : "offline",
          detail: ollama.detail,
        }
      }
      return p
    })

    const engines = getEngineBoard().map((e) => ({
      id: e.id,
      name: e.name,
      script: e.script,
      modes: e.modes,
      status: e.status,
      detail: e.detail,
    }))

    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      hold: "HOLD_VYRNA_UNSYNC",
      lattice_sync: false,
      providers,
      ollama: {
        online: ollama.online,
        base: "http://127.0.0.1:11434",
        tags: ollama.tags,
        detail: ollama.detail,
      },
      engines,
      deepLinks: [
        { id: "chatgpt", label: "ChatGPT", href: "https://chatgpt.com" },
        { id: "grok", label: "Grok", href: "https://grok.com" },
        { id: "x", label: "x.com / Grok", href: "https://x.com/i/grok" },
        { id: "venice", label: "Venice.ai", href: "https://venice.ai" },
        { id: "v0", label: "v0.dev", href: "https://v0.dev" },
        { id: "ollama-docs", label: "Ollama docs", href: "https://ollama.com" },
        { id: "ollama-local", label: "Ollama local", href: "http://127.0.0.1:11434" },
        { id: "nvidia-nim", label: "NVIDIA NIM", href: "https://build.nvidia.com" },
        { id: "mistral", label: "Mistral console", href: "https://console.mistral.ai" },
      ],
      localNav: [
        { id: "phone-suite", label: "Phone Suite", href: "/phone-suite" },
        { id: "kepler", label: "Kepler", href: "/intelligence/kepler" },
        { id: "v0-bridge", label: "v0 Bridge", href: "/v0-bridge-terminal" },
        { id: "heimdal", label: "Heimdal Terminal", href: "/heimdal-terminal" },
        { id: "reclaim", label: "Reclaim / Eye of Truth", href: "/reclaim" },
        { id: "operator-twin", label: "Operator Twin", href: "/operator-twin" },
      ],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "status failed"
    return NextResponse.json(
      { ok: false, error: message.replace(/sk-[a-zA-Z0-9_-]+/g, "[redacted]") },
      { status: 500 },
    )
  }
}
