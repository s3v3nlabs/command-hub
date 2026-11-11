export interface DriftAnalysisResult {
  entropy_score: number
  baseline_deviation: number
  anomaly_type: "port_shift" | "ip_migration" | "service_variation" | "honeypot_detected"
  confidence: number
  threat_level: "low" | "medium" | "high" | "critical"
  recommendations: string[]
}

export interface BaselineMemory {
  ip_ranges: Record<string, number[]>
  port_usage: Record<number, number>
  service_banners: Record<string, string[]>
  regional_patterns: Record<string, any>
  last_updated: string
}

export class DriftAnalyzer {
  private baseline: BaselineMemory
  private entropy_threshold: number
  private time_window: number

  constructor(baseline?: BaselineMemory, entropy_threshold = 0.75, time_window = 24) {
    this.baseline = baseline || this.initializeBaseline()
    this.entropy_threshold = entropy_threshold
    this.time_window = time_window
  }

  private initializeBaseline(): BaselineMemory {
    return {
      ip_ranges: {},
      port_usage: {},
      service_banners: {},
      regional_patterns: {},
      last_updated: new Date().toISOString(),
    }
  }

  public analyzePortDrift(current_ports: number[], region: string): DriftAnalysisResult {
    const baseline_ports = this.baseline.port_usage
    const entropy = this.calculatePortEntropy(current_ports, baseline_ports)
    const deviation = this.calculateBaselineDeviation(current_ports, Object.keys(baseline_ports).map(Number))

    return {
      entropy_score: entropy,
      baseline_deviation: deviation,
      anomaly_type: "port_shift",
      confidence: entropy > this.entropy_threshold ? 0.9 : 0.6,
      threat_level: this.determineThreatLevel(entropy, deviation),
      recommendations: this.generateRecommendations("port_shift", entropy, deviation),
    }
  }

  public analyzeIPMigration(current_ips: string[], region: string): DriftAnalysisResult {
    const baseline_ips = this.baseline.ip_ranges[region] || []
    const entropy = this.calculateIPEntropy(current_ips, baseline_ips)
    const deviation = this.calculateIPDeviation(current_ips, baseline_ips)

    return {
      entropy_score: entropy,
      baseline_deviation: deviation,
      anomaly_type: "ip_migration",
      confidence: entropy > this.entropy_threshold ? 0.85 : 0.5,
      threat_level: this.determineThreatLevel(entropy, deviation),
      recommendations: this.generateRecommendations("ip_migration", entropy, deviation),
    }
  }

  public analyzeServiceVariation(current_banners: string[], service_type: string): DriftAnalysisResult {
    const baseline_banners = this.baseline.service_banners[service_type] || []
    const entropy = this.calculateServiceEntropy(current_banners, baseline_banners)
    const deviation = this.calculateServiceDeviation(current_banners, baseline_banners)

    return {
      entropy_score: entropy,
      baseline_deviation: deviation,
      anomaly_type: "service_variation",
      confidence: entropy > this.entropy_threshold ? 0.8 : 0.4,
      threat_level: this.determineThreatLevel(entropy, deviation),
      recommendations: this.generateRecommendations("service_variation", entropy, deviation),
    }
  }

  public detectHoneypot(behavioral_data: any): DriftAnalysisResult {
    const entropy = this.calculateBehavioralEntropy(behavioral_data)
    const deviation = this.calculateBehavioralDeviation(behavioral_data)

    return {
      entropy_score: entropy,
      baseline_deviation: deviation,
      anomaly_type: "honeypot_detected",
      confidence: entropy > 0.9 ? 0.95 : 0.3,
      threat_level: this.determineThreatLevel(entropy, deviation),
      recommendations: this.generateRecommendations("honeypot_detected", entropy, deviation),
    }
  }

  private calculatePortEntropy(current: number[], baseline: Record<number, number>): number {
    const total_baseline = Object.values(baseline).reduce((sum, count) => sum + count, 0)
    if (total_baseline === 0) return 0

    let entropy = 0
    for (const port of current) {
      const baseline_prob = (baseline[port] || 0) / total_baseline
      const current_prob = 1 / current.length
      if (baseline_prob > 0) {
        entropy += current_prob * Math.log2(current_prob / baseline_prob)
      }
    }

    return Math.abs(entropy) * 100
  }

  private calculateIPEntropy(current: string[], baseline: number[]): number {
    // Simplified IP entropy calculation
    const unique_current = new Set(current).size
    const unique_baseline = baseline.length

    if (unique_baseline === 0) return 0

    const ratio = unique_current / unique_baseline
    return Math.min(Math.abs(ratio - 1) * 100, 100)
  }

  private calculateServiceEntropy(current: string[], baseline: string[]): number {
    const current_set = new Set(current)
    const baseline_set = new Set(baseline)

    const intersection = new Set([...current_set].filter((x) => baseline_set.has(x)))
    const union = new Set([...current_set, ...baseline_set])

    if (union.size === 0) return 0

    const jaccard = intersection.size / union.size
    return (1 - jaccard) * 100
  }

  private calculateBehavioralEntropy(data: any): number {
    // Simplified behavioral entropy for honeypot detection
    const suspicious_indicators = [
      data.response_time_variance > 0.5,
      data.service_banner_inconsistency > 0.3,
      data.port_response_pattern_anomaly > 0.7,
      data.geolocation_mismatch > 0.4,
    ]

    const suspicious_count = suspicious_indicators.filter(Boolean).length
    return (suspicious_count / suspicious_indicators.length) * 100
  }

  private calculateBaselineDeviation(current: any[], baseline: any[]): number {
    if (baseline.length === 0) return 0

    const current_set = new Set(current)
    const baseline_set = new Set(baseline)

    const only_in_current = [...current_set].filter((x) => !baseline_set.has(x))
    const deviation_ratio = only_in_current.length / Math.max(baseline.length, 1)

    return Math.min(deviation_ratio * 100, 100)
  }

  private calculateIPDeviation(current: string[], baseline: number[]): number {
    return this.calculateBaselineDeviation(current, baseline.map(String))
  }

  private calculateServiceDeviation(current: string[], baseline: string[]): number {
    return this.calculateBaselineDeviation(current, baseline)
  }

  private calculateBehavioralDeviation(data: any): number {
    // Behavioral deviation calculation for honeypot detection
    const deviation_factors = [
      Math.abs(data.expected_response_time - data.actual_response_time) / data.expected_response_time,
      data.banner_similarity_score < 0.8 ? 1 : 0,
      data.port_behavior_consistency < 0.6 ? 1 : 0,
    ]

    return (deviation_factors.reduce((sum, factor) => sum + factor, 0) / deviation_factors.length) * 100
  }

  private determineThreatLevel(entropy: number, deviation: number): "low" | "medium" | "high" | "critical" {
    const combined_score = (entropy + deviation) / 2

    if (combined_score > 80) return "critical"
    if (combined_score > 60) return "high"
    if (combined_score > 40) return "medium"
    return "low"
  }

  private generateRecommendations(anomaly_type: string, entropy: number, deviation: number): string[] {
    const recommendations: string[] = []

    switch (anomaly_type) {
      case "port_shift":
        recommendations.push("Monitor port usage patterns for infrastructure changes")
        if (entropy > 70) recommendations.push("Investigate sudden port migration patterns")
        if (deviation > 50) recommendations.push("Update baseline port usage profiles")
        break

      case "ip_migration":
        recommendations.push("Analyze IP geolocation changes for potential threats")
        if (entropy > 60) recommendations.push("Verify IP ownership and registration changes")
        if (deviation > 40) recommendations.push("Cross-reference with threat intelligence feeds")
        break

      case "service_variation":
        recommendations.push("Examine service banner changes for version updates")
        if (entropy > 50) recommendations.push("Check for potential service impersonation")
        if (deviation > 30) recommendations.push("Validate service authenticity")
        break

      case "honeypot_detected":
        recommendations.push("Avoid interaction with suspected honeypot systems")
        if (entropy > 80) recommendations.push("Mark IP ranges as high-risk honeypot clusters")
        if (deviation > 70) recommendations.push("Update honeypot detection signatures")
        break
    }

    return recommendations
  }

  public updateBaseline(new_data: Partial<BaselineMemory>): void {
    this.baseline = {
      ...this.baseline,
      ...new_data,
      last_updated: new Date().toISOString(),
    }
  }

  public getBaseline(): BaselineMemory {
    return { ...this.baseline }
  }

  public setEntropyThreshold(threshold: number): void {
    this.entropy_threshold = Math.max(0, Math.min(1, threshold))
  }

  public setTimeWindow(hours: number): void {
    this.time_window = Math.max(1, hours)
  }
}

export default DriftAnalyzer
