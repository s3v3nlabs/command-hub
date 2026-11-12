/**
 * Heimdall analysis bridge — talks to a real Heimdall API when configured.
 * Never invents threat scores. If HEIMDALL_API_ENDPOINT + HEIMDALL_API_KEY
 * are missing, callers get an honest unconfigured error.
 */

export interface HeimdallPrediction {
  threat_probability: number
  attack_vector: string[]
  confidence_score: number
  time_to_threat: number
  recommended_actions: string[]
  signature_patterns: string[]
}

export interface HeimdallAnalysisRequest {
  drift_data: unknown
  historical_patterns: unknown[]
  current_threat_landscape: unknown
  target_profile: unknown
}

export class HeimdallUnconfiguredError extends Error {
  constructor(message = "Heimdall API is not configured (set HEIMDALL_API_ENDPOINT and HEIMDALL_API_KEY)") {
    super(message)
    this.name = "HeimdallUnconfiguredError"
  }
}

export class HeimdallBridge {
  private api_endpoint: string
  private api_key: string
  private model_version: string
  private analysis_cache: Map<string, HeimdallPrediction>

  constructor(api_endpoint?: string, api_key?: string) {
    this.api_endpoint = (api_endpoint || process.env.HEIMDALL_API_ENDPOINT || "").trim()
    this.api_key = (api_key || process.env.HEIMDALL_API_KEY || "").trim()
    this.model_version = "v2.1.0"
    this.analysis_cache = new Map()
  }

  public isConfigured(): boolean {
    return Boolean(this.api_endpoint && this.api_key)
  }

  public async predictThreatEvolution(request: HeimdallAnalysisRequest): Promise<HeimdallPrediction> {
    if (!this.isConfigured()) throw new HeimdallUnconfiguredError()
    const cache_key = this.generateCacheKey(request)
    const cached = this.analysis_cache.get(cache_key)
    if (cached) return cached
    const prediction = await this.callRealHeimdallAPI(request)
    this.analysis_cache.set(cache_key, prediction)
    return prediction
  }

  private async callRealHeimdallAPI(request: HeimdallAnalysisRequest): Promise<HeimdallPrediction> {
    const response = await fetch(this.api_endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.api_key}`,
        "X-Model-Version": this.model_version,
      },
      body: JSON.stringify({
        analysis_type: "threat_evolution",
        data: request,
        options: {
          include_predictions: true,
          include_recommendations: true,
          confidence_threshold: 0.7,
        },
      }),
    })
    if (!response.ok) {
      throw new Error(`Heimdall API error: ${response.status} ${response.statusText}`)
    }
    const result = (await response.json()) as { prediction?: HeimdallPrediction }
    if (!result?.prediction) throw new Error("Heimdall API returned no prediction")
    return result.prediction
  }

  public async getStatus(): Promise<{ status: string; configured: boolean; latency: number; model_version: string; error?: string }> {
    const started = Date.now()
    if (!this.isConfigured()) {
      return { status: "unconfigured", configured: false, latency: 0, model_version: this.model_version, error: "HEIMDALL_API_ENDPOINT / HEIMDALL_API_KEY not set" }
    }
    try {
      const response = await fetch(this.api_endpoint, {
        method: "GET",
        headers: { Authorization: `Bearer ${this.api_key}` },
      })
      return {
        status: response.ok ? "ok" : `http_${response.status}`,
        configured: true,
        latency: Date.now() - started,
        model_version: this.model_version,
        error: response.ok ? undefined : await response.text().then((s) => s.slice(0, 200)),
      }
    } catch (e) {
      return {
        status: "error",
        configured: true,
        latency: Date.now() - started,
        model_version: this.model_version,
        error: e instanceof Error ? e.message : String(e),
      }
    }
  }

  public reset(): void {
    this.analysis_cache.clear()
  }

  private generateCacheKey(request: HeimdallAnalysisRequest): string {
    return JSON.stringify(request)
  }
}

export const heimdallBridge = new HeimdallBridge()
