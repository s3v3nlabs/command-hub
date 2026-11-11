/**
 * Emulates multi-AI voting without using real API keys.
 * ADD-ONLY: tries live BuildShip panel (via /api/panel or server env) first;
 * falls back to the original mock path when live is unavailable.
 */

export type PanelSource = "mock" | "buildship-live" | "s3v3n-live"

export type PrivacyMode = "PRIVATE_LOCAL" | "PRIVATE_VENICE" | "MOCK_ZERO_EGRESS"

export type PanelResponse = {
  model: string
  response: string
  confidence: number
  timestamp?: string
  metadata?: Record<string, unknown>
}

/** UI helper: derive source badge from harness responses */
export function getPanelSource(responses: PanelResponse[] | null | undefined): PanelSource {
  const raw = responses?.[0]?.metadata?.source
  if (raw === "s3v3n-live") return "s3v3n-live"
  if (raw === "buildship-live") return "buildship-live"
  return "mock"
}

/** UI helper: privacy mode badge */
export function getPrivacyMode(
  responses: PanelResponse[] | null | undefined,
  fallback?: PrivacyMode,
): PrivacyMode {
  const raw = responses?.[0]?.metadata?.privacy
  if (raw === "PRIVATE_VENICE" || raw === "PRIVATE_LOCAL" || raw === "MOCK_ZERO_EGRESS") {
    return raw
  }
  const src = getPanelSource(responses)
  if (src === "mock") return "MOCK_ZERO_EGRESS"
  if (src === "s3v3n-live") return fallback || "PRIVATE_LOCAL"
  return fallback || "PRIVATE_LOCAL"
}

function normalizePanelRows(data: unknown): PanelResponse[] {
  const root = data as Record<string, unknown> | unknown[] | null
  const rows: unknown[] = Array.isArray(root)
    ? root
    : Array.isArray((root as any)?.responses)
      ? ((root as any).responses as unknown[])
      : Array.isArray((root as any)?.models)
        ? ((root as any).models as unknown[])
        : Array.isArray((root as any)?.results)
          ? ((root as any).results as unknown[])
          : Array.isArray((root as any)?.data)
            ? ((root as any).data as unknown[])
            : []

  return rows
    .map((r: any) => ({
      model: String(r?.model || r?.provider || r?.name || "unknown"),
      response: String(r?.response || r?.output || r?.text || r?.content || ""),
      confidence: Number(r?.confidence ?? r?.score ?? 0.5),
      timestamp: r?.timestamp || new Date().toISOString(),
      metadata: {
        ...(typeof r?.metadata === "object" && r.metadata ? r.metadata : {}),
        source: "buildship-live" as const,
      },
    }))
    .filter((r) => r.response.length > 0 || r.model !== "unknown")
}

/**
 * Try live BuildShip panel.
 * - Server (BUILDSHIP_PANEL_URL set): fetch shipped URL directly (optional bearer).
 * - Client / no env: POST /api/panel (server proxy; never exposes URL).
 * Returns null on 503 / missing config / empty / network error so mock can run.
 */
export async function tryLivePanel(
  prompt: string,
  sessionId?: string,
): Promise<PanelResponse[] | null> {
  try {
    const serverUrl = typeof process !== "undefined" ? process.env.BUILDSHIP_PANEL_URL : undefined

    if (serverUrl && typeof window === "undefined") {
      const headers: Record<string, string> = { "content-type": "application/json" }
      const secret = process.env.BUILDSHIP_PANEL_SECRET
      if (secret) headers.authorization = `Bearer ${secret}`

      const res = await fetch(serverUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ prompt, sessionId }),
      })
      if (!res.ok) return null
      const data = await res.json()
      const normalized = normalizePanelRows(data)
      return normalized.length > 0 ? normalized : null
    }

    // Browser (or server without env): use local proxy so URL stays server-side
    const res = await fetch("/api/panel", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt, sessionId }),
    })
    if (res.status === 503 || !res.ok) return null
    const payload = await res.json()
    const raw = payload?.data ?? payload
    const normalized = normalizePanelRows(raw)
    return normalized.length > 0 ? normalized : null
  } catch {
    return null
  }
}

/**
 * @param prompt The prompt to process
 * @param sessionId Optional BuildShip session id for live panel history
 * @returns Array of model responses with confidence scores (+ metadata.source)
 */
export async function getMultiModelResponses(prompt: string, sessionId?: string) {
  // ADD-ONLY order: S3v3n private panel → optional BuildShip URL → mock (zero egress)

  // 1) S3v3n native (server: direct; client: /api/s3v3n-panel)
  try {
    if (typeof window === "undefined") {
      const { runS3v3nPanel } = await import("@/lib/selfHealing/S3v3nPanel")
      const panel = await runS3v3nPanel(prompt)
      if (panel.ok && panel.responses.length > 0) {
        return panel.responses as PanelResponse[]
      }
    } else {
      const res = await fetch("/api/s3v3n-panel", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt, sessionId }),
      })
      if (res.ok) {
        const payload = await res.json()
        if (payload?.ok && Array.isArray(payload.responses) && payload.responses.length > 0) {
          return payload.responses as PanelResponse[]
        }
      }
    }
  } catch {
    // fall through — never log prompt bodies
  }

  // 2) Optional BuildShip only if BUILDSHIP_PANEL_URL set / proxy reachable
  const live = await tryLivePanel(prompt, sessionId)
  if (live && live.length > 0) return live

  // 3) --- existing mock path (unchanged behavior, MOCK_ZERO_EGRESS) ---
  // Define mock models with response patterns and confidence ranges
  const mockModels = [
    {
      name: "mockGPT",
      responseStyle: "detailed and cautious",
      confidenceRange: [0.75, 0.92],
      biasTowards: ["Fix A", "Analyze further"],
    },
    {
      name: "echoAI",
      responseStyle: "concise and decisive",
      confidenceRange: [0.82, 0.97],
      biasTowards: ["Fix B", "Immediate action"],
    },
    {
      name: "ghostLM",
      responseStyle: "balanced and methodical",
      confidenceRange: [0.78, 0.94],
      biasTowards: ["Fix A", "Systematic approach"],
    },
  ]

  // Generate deterministic but variable responses based on the prompt
  const promptHash = hashString(prompt)

  // Determine which fix type will be the "consensus" based on the prompt
  const consensusFix = promptHash % 2 === 0 ? "Fix A" : "Fix B"

  // Generate responses from each model
  const responses = mockModels.map((model) => {
    // Determine if this model will agree with consensus (70% chance)
    const agreesWithConsensus = Math.random() < 0.7

    // Select response based on model bias and consensus
    let response
    if (agreesWithConsensus) {
      response = consensusFix
    } else {
      // Pick from model's biases, excluding the consensus if possible
      const nonConsensusBiases = model.biasTowards.filter((bias) => bias !== consensusFix)
      response =
        nonConsensusBiases.length > 0
          ? nonConsensusBiases[Math.floor(Math.random() * nonConsensusBiases.length)]
          : model.biasTowards[Math.floor(Math.random() * model.biasTowards.length)]
    }

    // Generate confidence score within model's range
    const [min, max] = model.confidenceRange
    const confidence = min + Math.random() * (max - min)

    // Add response details based on model style
    let detailedResponse
    if (model.responseStyle.includes("detailed")) {
      detailedResponse = `${response}: I recommend this approach because ${generateReason(response, prompt)}. The analysis indicates ${generateAnalysis(response)}.`
    } else if (model.responseStyle.includes("concise")) {
      detailedResponse = `${response}: ${generateReason(response, prompt)}.`
    } else {
      detailedResponse = `${response}: Based on ${generateAnalysis(response)}, I recommend ${generateReason(response, prompt)}.`
    }

    return {
      model: model.name,
      response: detailedResponse,
      confidence: Number.parseFloat(confidence.toFixed(2)),
      timestamp: new Date().toISOString(),
      metadata: {
        responseTime: 100 + Math.floor(Math.random() * 900), // 100-1000ms
        promptTokens: prompt.length / 4,
        completionTokens: detailedResponse.length / 4,
        source: "mock" as const,
        privacy: "MOCK_ZERO_EGRESS" as const,
      },
    }
  })

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 700))

  return responses
}

/**
 * Generate a reason for a given fix
 */
function generateReason(fix: string, prompt: string) {
  const reasons = {
    "Fix A": [
      "the pattern indicates a configuration issue",
      "this addresses the root cause without side effects",
      "historical data shows this approach has higher success rate",
      "it maintains system stability while resolving the issue",
    ],
    "Fix B": [
      "this provides immediate resolution with minimal downtime",
      "the error signature matches known patterns best resolved this way",
      "it prevents cascading failures in dependent systems",
      "this approach has the lowest risk profile for the current state",
    ],
    "Analyze further": [
      "more data is needed before taking action",
      "the pattern is inconclusive and requires deeper investigation",
      "there are multiple potential causes that need to be isolated",
      "the risk of incorrect action outweighs the benefit of immediate response",
    ],
    "Immediate action": [
      "the system is in a critical state requiring intervention",
      "delay would result in data loss or service disruption",
      "the signature matches a known critical issue",
      "automated recovery is the safest approach",
    ],
    "Systematic approach": [
      "a methodical resolution ensures complete recovery",
      "this addresses both symptoms and underlying causes",
      "this balances immediate needs with long-term stability",
      "the pattern suggests a systemic issue requiring comprehensive treatment",
    ],
  }

  // Select a reason based on the fix type and prompt
  const availableReasons = reasons[fix as keyof typeof reasons] || reasons["Analyze further"]
  const reasonIndex = Math.abs(hashString(prompt + fix)) % availableReasons.length

  return availableReasons[reasonIndex]
}

/**
 * Generate analysis details
 */
function generateAnalysis(fix: string) {
  const analyses = {
    "Fix A": [
      "configuration parameters are outside expected ranges",
      "log patterns show timing inconsistencies",
      "resource allocation is suboptimal",
      "dependency chain has weak links",
    ],
    "Fix B": [
      "critical path execution is blocked",
      "resource contention is causing deadlocks",
      "buffer overflow conditions exist",
      "race condition in parallel processes",
    ],
    default: [
      "multiple factors contributing to system instability",
      "intermittent failures suggest timing-related issues",
      "resource utilization patterns indicate potential bottlenecks",
      "error propagation suggests cascading failure modes",
    ],
  }

  // Select analysis based on fix type
  const availableAnalyses = analyses[fix as keyof typeof analyses] || analyses["default"]
  const analysisIndex = Math.floor(Math.random() * availableAnalyses.length)

  return availableAnalyses[analysisIndex]
}

/**
 * Simple string hashing function for deterministic but variable results
 * @param str String to hash
 * @returns Numeric hash value
 */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}
