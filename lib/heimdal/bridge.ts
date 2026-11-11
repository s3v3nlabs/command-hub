import { analyzeHeimdal, getHeimdallStatus, resetHeimdallContext, type HeimdallMockResponse } from "./mock"

export interface HeimdallPrediction {
  threat_probability: number
  attack_vector: string[]
  confidence_score: number
  time_to_threat: number // hours
  recommended_actions: string[]
  signature_patterns: string[]
}

export interface HeimdallAnalysisRequest {
  drift_data: any
  historical_patterns: any[]
  current_threat_landscape: any
  target_profile: any
}

export class HeimdallBridge {
  private api_endpoint: string
  private api_key: string
  private model_version: string
  private analysis_cache: Map<string, HeimdallPrediction>
  private use_mock: boolean

  constructor(api_endpoint?: string, api_key?: string) {
    this.api_endpoint = api_endpoint || process.env.HEIMDALL_API_ENDPOINT || "https://heimdall.internal/api/v1"
    this.api_key = api_key || process.env.HEIMDALL_API_KEY || ""
    this.model_version = "v2.1.0"
    this.analysis_cache = new Map()
    this.use_mock = process.env.NODE_ENV === "development" || !this.api_key.startsWith("sk-")
  }

  public async predictThreatEvolution(request: HeimdallAnalysisRequest): Promise<HeimdallPrediction> {
    const cache_key = this.generateCacheKey(request)

    // Check cache first
    if (this.analysis_cache.has(cache_key)) {
      return this.analysis_cache.get(cache_key)!
    }

    try {
      let prediction: HeimdallPrediction

      if (this.use_mock) {
        // Use mock implementation
        const mockResponse = await analyzeHeimdal(JSON.stringify(request))
        prediction = this.convertMockToPrediction(mockResponse)
      } else {
        // Use real API implementation
        prediction = await this.callRealHeimdallAPI(request)
      }

      // Cache the result
      this.analysis_cache.set(cache_key, prediction)

      return prediction
    } catch (error) {
      console.error("Heimdall Bridge Error:", error)
      return this.getFallbackPrediction(request)
    }
  }

  private convertMockToPrediction(mockResponse: HeimdallMockResponse): HeimdallPrediction {
    return {
      threat_probability: this.getThreatProbability(mockResponse.threat_level),
      attack_vector: mockResponse.attack_vectors,
      confidence_score: mockResponse.confidence,
      time_to_threat: mockResponse.time_to_threat,
      recommended_actions: mockResponse.recommended_actions,
      signature_patterns: mockResponse.signature_patterns,
    }
  }

  private getThreatProbability(level: string): number {
    switch (level) {
      case "critical":
        return 85 + Math.random() * 10
      case "high":
        return 65 + Math.random() * 15
      case "medium":
        return 35 + Math.random() * 20
      case "low":
        return 10 + Math.random() * 15
      default:
        return 25
    }
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

    const result = await response.json()
    return result.prediction
  }

  public async getStatus(): Promise<{ status: string; latency: number; model_version: string }> {
    if (this.use_mock) {
      return await getHeimdallStatus()
    }

    try {
      const start = Date.now()
      const response = await fetch(`${this.api_endpoint}/status`, {
        headers: { Authorization: `Bearer ${this.api_key}` },
      })
      const latency = Date.now() - start

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`)
      }

      const status = await response.json()
      return {
        status: status.status || "unknown",
        latency,
        model_version: status.model_version || this.model_version,
      }
    } catch (error) {
      return {
        status: "error",
        latency: -1,
        model_version: this.model_version,
      }
    }
  }

  public async resetContext(): Promise<{ success: boolean; message: string }> {
    if (this.use_mock) {
      return await resetHeimdallContext()
    }

    try {
      const response = await fetch(`${this.api_endpoint}/reset`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.api_key}` },
      })

      if (!response.ok) {
        throw new Error(`Context reset failed: ${response.status}`)
      }

      const result = await response.json()
      this.clearCache() // Clear local cache too

      return {
        success: true,
        message: result.message || "Context reset successfully",
      }
    } catch (error) {
      return {
        success: false,
        message: `Reset failed: ${error}`,
      }
    }
  }

  private generateCacheKey(request: HeimdallAnalysisRequest): string {
    const key_data = {
      drift_hash: JSON.stringify(request.drift_data).slice(0, 50),
      patterns_count: request.historical_patterns.length,
      timestamp: Math.floor(Date.now() / (1000 * 60 * 15)), // 15-minute cache buckets
    }

    return Buffer.from(JSON.stringify(key_data)).toString("base64").slice(0, 32)
  }

  private getFallbackPrediction(request: HeimdallAnalysisRequest): HeimdallPrediction {
    return {
      threat_probability: 45,
      attack_vector: ["Reconnaissance", "Passive Intelligence Gathering"],
      confidence_score: 60,
      time_to_threat: 48,
      recommended_actions: [
        "Continue monitoring drift patterns",
        "Update baseline configurations",
        "Review threat intelligence feeds",
      ],
      signature_patterns: ["fallback_pattern", "generic_drift_signature"],
    }
  }

  public clearCache(): void {
    this.analysis_cache.clear()
  }

  public getCacheSize(): number {
    return this.analysis_cache.size
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const status = await this.getStatus()
      return status.status === "operational" || status.status === "ok"
    } catch {
      return false
    }
  }

  public isMockMode(): boolean {
    return this.use_mock
  }
}

export default HeimdallBridge
