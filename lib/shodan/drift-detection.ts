interface DriftAnalysis {
  query: string
  timestamp: Date
  result_count: number
  unique_ips: number
  drift_score: number
  anomaly_indicators: string[]
  baseline_comparison: {
    expected_results: number
    actual_results: number
    deviation_percentage: number
  }
  geographic_distribution: Record<string, number>
  port_distribution: Record<number, number>
  service_distribution: Record<string, number>
  temporal_patterns: {
    hour_of_day: number
    day_of_week: number
    unusual_timing: boolean
  }
  honeypot_indicators: {
    suspicious_banners: string[]
    fake_services: string[]
    honeypot_probability: number
  }
}

interface DriftSummary {
  total_queries: number
  high_drift_queries: number
  avg_drift_score: number
  recent_anomalies: string[]
  trending_patterns: string[]
  honeypot_detections: number
}

class DriftDetector {
  private queryBaselines = new Map<string, any>()
  private driftHistory: DriftAnalysis[] = []
  private readonly MAX_HISTORY = 1000
  private readonly HIGH_DRIFT_THRESHOLD = 0.7
  private readonly HONEYPOT_THRESHOLD = 0.8

  // Known honeypot indicators
  private honeypotIndicators = {
    banners: [
      "Honeypot",
      "HoneyPot",
      "HONEYPOT",
      "Kippo",
      "Cowrie",
      "Dionaea",
      "Conpot",
      "Glastopf",
      "Wordpot",
      "Elastichoney",
      "T-Pot",
      "Modern Honey Network",
      "MHN",
      "Thinkst Canary",
      "OpenCanary",
    ],
    suspicious_services: [
      "fake-telnet",
      "fake-ssh",
      "fake-ftp",
      "fake-http",
      "honeypot-service",
      "decoy-service",
      "trap-service",
    ],
    suspicious_versions: ["Honeypot 1.0", "Fake Service v1.0", "Decoy Server", "Trap v2.0", "Canary Service"],
    suspicious_responses: [
      "Welcome to the honeypot",
      "This is a monitored system",
      "Unauthorized access detected",
      "Security research system",
      "Intrusion detection active",
    ],
  }

  analyzeResults(query: string, results: any[]): DriftAnalysis {
    const timestamp = new Date()
    const normalizedQuery = this.normalizeQuery(query)

    // Get or create baseline for this query pattern
    const baseline = this.getOrCreateBaseline(normalizedQuery, results)

    // Calculate drift metrics
    const driftScore = this.calculateDriftScore(baseline, results)
    const anomalyIndicators = this.detectAnomalies(baseline, results)
    const honeypotIndicators = this.detectHoneypots(results)

    // Analyze distributions
    const geoDistribution = this.analyzeGeographicDistribution(results)
    const portDistribution = this.analyzePortDistribution(results)
    const serviceDistribution = this.analyzeServiceDistribution(results)

    // Temporal analysis
    const temporalPatterns = this.analyzeTemporalPatterns(timestamp)

    const analysis: DriftAnalysis = {
      query: normalizedQuery,
      timestamp,
      result_count: results.length,
      unique_ips: new Set(results.map((r) => r.ip_str)).size,
      drift_score: driftScore,
      anomaly_indicators: anomalyIndicators,
      baseline_comparison: {
        expected_results: baseline.avg_result_count,
        actual_results: results.length,
        deviation_percentage: this.calculateDeviation(baseline.avg_result_count, results.length),
      },
      geographic_distribution: geoDistribution,
      port_distribution: portDistribution,
      service_distribution: serviceDistribution,
      temporal_patterns: temporalPatterns,
      honeypot_indicators: honeypotIndicators,
    }

    // Update baseline with new data
    this.updateBaseline(normalizedQuery, results)

    // Store analysis
    this.driftHistory.push(analysis)
    if (this.driftHistory.length > this.MAX_HISTORY) {
      this.driftHistory = this.driftHistory.slice(-this.MAX_HISTORY)
    }

    return analysis
  }

  private normalizeQuery(query: string): string {
    // Normalize query to identify similar patterns
    return query
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ")
      .replace(/country:[a-z]{2}/gi, "country:XX") // Normalize country codes
      .replace(/port:\d+/gi, "port:XXX") // Normalize port numbers
      .replace(/ip:\d+\.\d+\.\d+\.\d+/gi, "ip:XXX.XXX.XXX.XXX") // Normalize IPs
  }

  private getOrCreateBaseline(normalizedQuery: string, results: any[]): any {
    if (!this.queryBaselines.has(normalizedQuery)) {
      this.queryBaselines.set(normalizedQuery, {
        query: normalizedQuery,
        execution_count: 0,
        avg_result_count: 0,
        result_count_history: [],
        geographic_baseline: new Map<string, number>(),
        port_baseline: new Map<number, number>(),
        service_baseline: new Map<string, number>(),
        first_seen: Date.now(),
        last_updated: Date.now(),
      })
    }

    return this.queryBaselines.get(normalizedQuery)
  }

  private updateBaseline(normalizedQuery: string, results: any[]): void {
    const baseline = this.queryBaselines.get(normalizedQuery)
    if (!baseline) return

    baseline.execution_count++
    baseline.result_count_history.push(results.length)

    // Keep only last 50 executions for baseline calculation
    if (baseline.result_count_history.length > 50) {
      baseline.result_count_history = baseline.result_count_history.slice(-50)
    }

    // Update average result count
    baseline.avg_result_count =
      baseline.result_count_history.reduce((sum, count) => sum + count, 0) / baseline.result_count_history.length

    // Update geographic baseline
    const geoDistribution = this.analyzeGeographicDistribution(results)
    for (const [country, count] of Object.entries(geoDistribution)) {
      const currentCount = baseline.geographic_baseline.get(country) || 0
      baseline.geographic_baseline.set(country, (currentCount + count) / 2) // Moving average
    }

    // Update port baseline
    const portDistribution = this.analyzePortDistribution(results)
    for (const [port, count] of Object.entries(portDistribution)) {
      const portNum = Number.parseInt(port)
      const currentCount = baseline.port_baseline.get(portNum) || 0
      baseline.port_baseline.set(portNum, (currentCount + count) / 2) // Moving average
    }

    // Update service baseline
    const serviceDistribution = this.analyzeServiceDistribution(results)
    for (const [service, count] of Object.entries(serviceDistribution)) {
      const currentCount = baseline.service_baseline.get(service) || 0
      baseline.service_baseline.set(service, (currentCount + count) / 2) // Moving average
    }

    baseline.last_updated = Date.now()
  }

  private calculateDriftScore(baseline: any, results: any[]): number {
    let driftScore = 0
    let factors = 0

    // Result count drift
    if (baseline.avg_result_count > 0) {
      const countDrift = Math.abs(results.length - baseline.avg_result_count) / baseline.avg_result_count
      driftScore += Math.min(countDrift, 1.0)
      factors++
    }

    // Geographic distribution drift
    const geoDistribution = this.analyzeGeographicDistribution(results)
    const geoDrift = this.calculateDistributionDrift(baseline.geographic_baseline, geoDistribution)
    driftScore += geoDrift
    factors++

    // Port distribution drift
    const portDistribution = this.analyzePortDistribution(results)
    const portDrift = this.calculateDistributionDrift(baseline.port_baseline, portDistribution)
    driftScore += portDrift
    factors++

    // Service distribution drift
    const serviceDistribution = this.analyzeServiceDistribution(results)
    const serviceDrift = this.calculateDistributionDrift(baseline.service_baseline, serviceDistribution)
    driftScore += serviceDrift
    factors++

    return factors > 0 ? driftScore / factors : 0
  }

  private calculateDistributionDrift(baseline: Map<any, number>, current: Record<any, number>): number {
    if (baseline.size === 0) return 0

    let totalDrift = 0
    let comparisons = 0

    // Check drift for existing baseline items
    for (const [key, baselineValue] of baseline.entries()) {
      const currentValue = current[key] || 0
      if (baselineValue > 0) {
        const drift = Math.abs(currentValue - baselineValue) / baselineValue
        totalDrift += Math.min(drift, 1.0)
        comparisons++
      }
    }

    // Check for new items not in baseline
    for (const [key, currentValue] of Object.entries(current)) {
      if (!baseline.has(key) && currentValue > 0) {
        totalDrift += 0.5 // Moderate drift for new items
        comparisons++
      }
    }

    return comparisons > 0 ? totalDrift / comparisons : 0
  }

  private detectAnomalies(baseline: any, results: any[]): string[] {
    const anomalies: string[] = []

    // Unusual result count
    if (baseline.avg_result_count > 0) {
      const deviation = this.calculateDeviation(baseline.avg_result_count, results.length)
      if (deviation > 200) {
        anomalies.push(`Unusual result count: ${results.length} vs expected ${baseline.avg_result_count.toFixed(0)}`)
      }
    }

    // Geographic anomalies
    const geoDistribution = this.analyzeGeographicDistribution(results)
    const topCountries = Object.entries(geoDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)

    for (const [country, count] of topCountries) {
      const baselineCount = baseline.geographic_baseline.get(country) || 0
      if (baselineCount > 0 && count > baselineCount * 3) {
        anomalies.push(`Unusual spike in ${country}: ${count} vs baseline ${baselineCount.toFixed(0)}`)
      }
    }

    // Port anomalies
    const portDistribution = this.analyzePortDistribution(results)
    const topPorts = Object.entries(portDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)

    for (const [port, count] of topPorts) {
      const portNum = Number.parseInt(port)
      const baselineCount = baseline.port_baseline.get(portNum) || 0
      if (baselineCount > 0 && count > baselineCount * 3) {
        anomalies.push(`Unusual port activity on ${port}: ${count} vs baseline ${baselineCount.toFixed(0)}`)
      }
    }

    // Temporal anomalies
    const now = new Date()
    const hour = now.getHours()
    const dayOfWeek = now.getDay()

    // Unusual timing (very early morning or late night for most regions)
    if (hour >= 2 && hour <= 5) {
      anomalies.push("Query executed during unusual hours (2-5 AM)")
    }

    // Weekend activity might be unusual for some query types
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      anomalies.push("Weekend query execution detected")
    }

    return anomalies
  }

  private detectHoneypots(results: any[]): any {
    const suspiciousBanners: string[] = []
    const fakeServices: string[] = []
    let honeypotScore = 0

    for (const result of results) {
      // Check banners for honeypot indicators
      const banner = result.banner || result.data || ""
      for (const indicator of this.honeypotIndicators.banners) {
        if (banner.toLowerCase().includes(indicator.toLowerCase())) {
          suspiciousBanners.push(`${result.ip_str}: ${indicator}`)
          honeypotScore += 0.3
        }
      }

      // Check for suspicious service names
      const product = result.product || ""
      for (const service of this.honeypotIndicators.suspicious_services) {
        if (product.toLowerCase().includes(service.toLowerCase())) {
          fakeServices.push(`${result.ip_str}: ${service}`)
          honeypotScore += 0.4
        }
      }

      // Check for suspicious versions
      const version = result.version || ""
      for (const suspiciousVersion of this.honeypotIndicators.suspicious_versions) {
        if (version.toLowerCase().includes(suspiciousVersion.toLowerCase())) {
          fakeServices.push(`${result.ip_str}: ${suspiciousVersion}`)
          honeypotScore += 0.3
        }
      }

      // Check for suspicious response patterns
      for (const response of this.honeypotIndicators.suspicious_responses) {
        if (banner.toLowerCase().includes(response.toLowerCase())) {
          suspiciousBanners.push(`${result.ip_str}: ${response}`)
          honeypotScore += 0.5
        }
      }

      // Additional heuristics
      // Multiple services on unusual ports
      if (result.port && [2222, 2223, 2224, 8022, 8023, 8080, 8081, 8888].includes(result.port)) {
        honeypotScore += 0.1
      }

      // Suspicious hostnames
      const hostname = result.hostnames?.[0] || ""
      if (hostname.includes("honeypot") || hostname.includes("canary") || hostname.includes("trap")) {
        suspiciousBanners.push(`${result.ip_str}: Suspicious hostname ${hostname}`)
        honeypotScore += 0.4
      }
    }

    // Normalize score based on result count
    const normalizedScore = results.length > 0 ? Math.min(honeypotScore / results.length, 1.0) : 0

    return {
      suspicious_banners: suspiciousBanners.slice(0, 10), // Limit to top 10
      fake_services: fakeServices.slice(0, 10),
      honeypot_probability: normalizedScore,
    }
  }

  private analyzeGeographicDistribution(results: any[]): Record<string, number> {
    const distribution: Record<string, number> = {}

    for (const result of results) {
      const country = result.country_name || result.location?.country || "Unknown"
      distribution[country] = (distribution[country] || 0) + 1
    }

    return distribution
  }

  private analyzePortDistribution(results: any[]): Record<number, number> {
    const distribution: Record<number, number> = {}

    for (const result of results) {
      const port = result.port
      if (port) {
        distribution[port] = (distribution[port] || 0) + 1
      }
    }

    return distribution
  }

  private analyzeServiceDistribution(results: any[]): Record<string, number> {
    const distribution: Record<string, number> = {}

    for (const result of results) {
      const service = result.product || result._shodan?.module || "Unknown"
      distribution[service] = (distribution[service] || 0) + 1
    }

    return distribution
  }

  private analyzeTemporalPatterns(timestamp: Date): any {
    const hour = timestamp.getHours()
    const dayOfWeek = timestamp.getDay()

    // Determine if timing is unusual
    const unusualTiming = (hour >= 2 && hour <= 5) || dayOfWeek === 0 || dayOfWeek === 6

    return {
      hour_of_day: hour,
      day_of_week: dayOfWeek,
      unusual_timing: unusualTiming,
    }
  }

  private calculateDeviation(expected: number, actual: number): number {
    if (expected === 0) return actual > 0 ? 100 : 0
    return Math.abs((actual - expected) / expected) * 100
  }

  getDriftSummary(): DriftSummary {
    const totalQueries = this.driftHistory.length
    const highDriftQueries = this.driftHistory.filter(
      (analysis) => analysis.drift_score > this.HIGH_DRIFT_THRESHOLD,
    ).length
    const avgDriftScore =
      totalQueries > 0 ? this.driftHistory.reduce((sum, analysis) => sum + analysis.drift_score, 0) / totalQueries : 0

    // Collect recent anomalies
    const recentAnomalies: string[] = []
    const recentAnalyses = this.driftHistory.slice(-20) // Last 20 analyses
    for (const analysis of recentAnalyses) {
      recentAnomalies.push(...analysis.anomaly_indicators)
    }

    // Identify trending patterns
    const trendingPatterns = this.identifyTrendingPatterns()

    // Count honeypot detections
    const honeypotDetections = this.driftHistory.filter(
      (analysis) => analysis.honeypot_indicators.honeypot_probability > this.HONEYPOT_THRESHOLD,
    ).length

    return {
      total_queries: totalQueries,
      high_drift_queries: highDriftQueries,
      avg_drift_score: avgDriftScore,
      recent_anomalies: recentAnomalies.slice(0, 10), // Limit to 10 most recent
      trending_patterns: trendingPatterns,
      honeypot_detections: honeypotDetections,
    }
  }

  private identifyTrendingPatterns(): string[] {
    const patterns: string[] = []

    if (this.driftHistory.length < 10) return patterns

    const recent = this.driftHistory.slice(-10)
    const older = this.driftHistory.slice(-20, -10)

    // Check for increasing drift scores
    const recentAvgDrift = recent.reduce((sum, a) => sum + a.drift_score, 0) / recent.length
    const olderAvgDrift = older.length > 0 ? older.reduce((sum, a) => sum + a.drift_score, 0) / older.length : 0

    if (recentAvgDrift > olderAvgDrift * 1.5) {
      patterns.push("Increasing drift scores detected")
    }

    // Check for geographic concentration
    const recentCountries = new Map<string, number>()
    for (const analysis of recent) {
      for (const [country, count] of Object.entries(analysis.geographic_distribution)) {
        recentCountries.set(country, (recentCountries.get(country) || 0) + count)
      }
    }

    const topCountry = Array.from(recentCountries.entries()).sort(([, a], [, b]) => b - a)[0]
    if (topCountry && topCountry[1] > recent.length * 0.7) {
      patterns.push(`Geographic concentration in ${topCountry[0]}`)
    }

    // Check for port concentration
    const recentPorts = new Map<number, number>()
    for (const analysis of recent) {
      for (const [port, count] of Object.entries(analysis.port_distribution)) {
        const portNum = Number.parseInt(port)
        recentPorts.set(portNum, (recentPorts.get(portNum) || 0) + count)
      }
    }

    const topPort = Array.from(recentPorts.entries()).sort(([, a], [, b]) => b - a)[0]
    if (topPort && topPort[1] > recent.length * 0.6) {
      patterns.push(`Port concentration on ${topPort[0]}`)
    }

    // Check for honeypot trend
    const recentHoneypots = recent.filter((a) => a.honeypot_indicators.honeypot_probability > 0.5).length
    if (recentHoneypots > recent.length * 0.3) {
      patterns.push("Increased honeypot detection rate")
    }

    return patterns
  }

  // Export and import functionality
  exportDriftData(): string {
    return JSON.stringify(
      {
        exported_at: new Date().toISOString(),
        baselines: Array.from(this.queryBaselines.entries()),
        drift_history: this.driftHistory,
        summary: this.getDriftSummary(),
      },
      null,
      2,
    )
  }

  importDriftData(data: string): boolean {
    try {
      const parsed = JSON.parse(data)
      if (parsed.baselines && parsed.drift_history) {
        this.queryBaselines = new Map(parsed.baselines)
        this.driftHistory = parsed.drift_history
        return true
      }
      return false
    } catch (error) {
      console.error("Failed to import drift data:", error)
      return false
    }
  }

  clearDriftHistory(): void {
    this.driftHistory = []
    this.queryBaselines.clear()
  }

  // Advanced analysis methods
  getAnomalyTimeline(): Array<{ timestamp: string; anomalies: string[]; drift_score: number }> {
    return this.driftHistory
      .filter((analysis) => analysis.anomaly_indicators.length > 0)
      .map((analysis) => ({
        timestamp: analysis.timestamp.toISOString(),
        anomalies: analysis.anomaly_indicators,
        drift_score: analysis.drift_score,
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  getHoneypotReport(): Array<{ ip: string; indicators: string[]; probability: number; timestamp: string }> {
    const honeypots: Array<{ ip: string; indicators: string[]; probability: number; timestamp: string }> = []

    for (const analysis of this.driftHistory) {
      if (analysis.honeypot_indicators.honeypot_probability > 0.3) {
        const indicators = [
          ...analysis.honeypot_indicators.suspicious_banners,
          ...analysis.honeypot_indicators.fake_services,
        ]

        // Extract IPs from indicators
        const ipRegex = /(\d+\.\d+\.\d+\.\d+)/g
        const matches = indicators.join(" ").match(ipRegex) || []

        for (const ip of new Set(matches)) {
          honeypots.push({
            ip,
            indicators: indicators.filter((ind) => ind.includes(ip)),
            probability: analysis.honeypot_indicators.honeypot_probability,
            timestamp: analysis.timestamp.toISOString(),
          })
        }
      }
    }

    return honeypots.sort((a, b) => b.probability - a.probability)
  }

  getQueryPatternAnalysis(): Record<string, any> {
    const patterns = new Map<string, { count: number; avg_drift: number; anomalies: number }>()

    for (const analysis of this.driftHistory) {
      const pattern = analysis.query
      const existing = patterns.get(pattern) || { count: 0, avg_drift: 0, anomalies: 0 }

      existing.count++
      existing.avg_drift = (existing.avg_drift * (existing.count - 1) + analysis.drift_score) / existing.count
      existing.anomalies += analysis.anomaly_indicators.length

      patterns.set(pattern, existing)
    }

    return Object.fromEntries(
      Array.from(patterns.entries())
        .sort(([, a], [, b]) => b.avg_drift - a.avg_drift)
        .slice(0, 20), // Top 20 patterns
    )
  }
}

export const driftDetector = new DriftDetector()
export type { DriftAnalysis, DriftSummary }
