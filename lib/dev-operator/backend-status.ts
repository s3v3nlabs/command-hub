/**
 * Honest Dev Operator backend status.
 * Reports which inference path is live so the UI can show thin vs full answers.
 * Never returns secret values.
 */

import { OLLAMA_BASE } from "@/lib/ai/ops-router"

export type BackendKind = "sigma-lane" | "panel-twin" | "model-connected" | "fallback-thin"

export interface DevOperatorBackendStatus {
  kind: BackendKind
  label: string
  detail: string
  ollamaBase: string
  localModel: string | null
  ollamaReachable: boolean | null
  veniceKeyPresent: boolean
  twinIndexLikely: boolean
  answersWillBe: "full" | "partial" | "thin"
}

async function probeOllamaQuick(base: string): Promise<boolean> {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 1200)
    const r = await fetch(`${base}/api/tags`, { signal: ctrl.signal, cache: "no-store" })
    clearTimeout(t)
    return r.ok
  } catch {
    return false
  }
}

export async function getDevOperatorBackendStatus(): Promise<DevOperatorBackendStatus> {
  const ollamaBase = OLLAMA_BASE
  const localModel =
    process.env.LOCAL_LLM_MODEL?.trim() ||
    process.env.OLLAMA_OPS_MODEL?.trim() ||
    null
  const veniceKeyPresent = !!(process.env.VENICE_API_KEY && process.env.VENICE_API_KEY.trim())
  const ollamaReachable = await probeOllamaQuick(ollamaBase)

  let twinIndexLikely = false
  try {
    const fs = await import("fs")
    const path = await import("path")
    const dir = path.join(process.cwd(), "local-data", "twin-index")
    twinIndexLikely = fs.existsSync(dir)
  } catch {
    twinIndexLikely = false
  }

  if (ollamaReachable || veniceKeyPresent) {
    return {
      kind: "model-connected",
      label: "model-connected",
      detail: ollamaReachable
        ? `Local LLM reachable at ${ollamaBase}${localModel ? ` · model ${localModel}` : ""} · route via /compute pool`
        : "Venice key present (server-side) — cloud seat available if egress allowed",
      ollamaBase,
      localModel,
      ollamaReachable,
      veniceKeyPresent,
      twinIndexLikely,
      answersWillBe: "full",
    }
  }

  if (twinIndexLikely) {
    return {
      kind: "panel-twin",
      label: "panel / twin-rag",
      detail: "No live local/cloud model; S3v3nPanel twin-rag / retrieved lessons available — answers may be partial.",
      ollamaBase,
      localModel,
      ollamaReachable,
      veniceKeyPresent,
      twinIndexLikely,
      answersWillBe: "partial",
    }
  }

  return {
    kind: "sigma-lane",
    label: "sigma-lane only",
    detail: "No local model and no twin index detected. Sigma-lane + action stubs still work; chat answers will be thin. Wire LOCAL_LLM_BASE_URL + LOCAL_LLM_MODEL (or start Ollama).",
    ollamaBase,
    localModel,
    ollamaReachable,
    veniceKeyPresent,
    twinIndexLikely,
    answersWillBe: "thin",
  }
}
