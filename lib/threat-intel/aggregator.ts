import { analyzeWithVirusTotal, type VirusTotalResult } from "./virustotal"
import { analyzeWithAbuseIPDB, type AbuseIPDBResult } from "./abuseipdb"
import { analyzeWithGreyNoise, type GreyNoiseResult } from "./greynoise"
import { analyzeWithOTX, type OTXResult } from "./otx"
import { analyzeWithCensys, type CensysResult } from "./censys"
import { analyzeWithThreatCrowd, type ThreatCrowdResult } from "./threatcrowd"

export type ThreatIntelResult =
  | VirusTotalResult
  | AbuseIPDBResult
  | GreyNoiseResult
  | OTXResult
  | CensysResult
  | ThreatCrowdResult

export interface AggregatedThreatIntel {
  target: string
  overall_reputation: number
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  confidence: number
  sources: ThreatIntelResult[]
  summary: {
    total_sources: number
    active_sources: number
    threat_indicators: string[]
    recommendations: string[]
  }
  geolocation?: {
    country: string
    country_code?: string
    asn?: number
    organization?: string
  }
  analysis_timestamp: string
}

export async function aggregateThreatIntelligence(target: string): Promise<AggregatedThreatIntel> {
  console.log(`Starting threat intelligence analysis for: ${target}`)

  // Run all analyses in parallel
  const analyses = await Promise.allSettled([
    analyzeWithVirusTotal(target),
    analyzeWithAbuseIPDB(target),
    analyzeWithGreyNoise(target),
    analyzeWithOTX(target),
    analyzeWithCensys(target),
    analyzeWithThreatCrowd(target),
  ])

  // Collect successful results
  const sources: ThreatIntelResult[] = []
  analyses.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value) {
      sources.push(result.value)
    } else if (result.status === "rejected") {
      console.error(`Analysis ${index} failed:`, result.reason)
    }
  })

  // Calculate overall reputation (weighted average)
  let totalReputation = 0
  let totalWeight = 0

  sources.forEach((source) => {
    const weight = source.confidence
    totalReputation += source.reputation * weight
    totalWeight += weight
  })

  const overallReputation = totalWeight > 0 ? Math.round(totalReputation / totalWeight) : 50

  // Determine risk level
  let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  if (overallReputation >= 80) riskLevel = "LOW"
  else if (overallReputation >= 60) riskLevel = "MEDIUM"
  else if (overallReputation >= 30) riskLevel = "HIGH"
  else riskLevel = "CRITICAL"

  // Calculate overall confidence
  const overallConfidence = totalWeight > 0 ? totalWeight / sources.length : 0

  // Extract threat indicators
  const threatIndicators: string[] = []
  sources.forEach((source) => {
    switch (source.source) {
      case "virustotal":
        if (source.malicious > 0) threatIndicators.push(`${source.malicious} malicious detections`)
        if (source.suspicious > 0) threatIndicators.push(`${source.suspicious} suspicious detections`)
        break
      case "abuseipdb":
        if (source.abuse_confidence > 25) threatIndicators.push(`${source.abuse_confidence}% abuse confidence`)
        if (source.total_reports > 0) threatIndicators.push(`${source.total_reports} abuse reports`)
        break
      case "greynoise":
        if (source.classification === "malicious") threatIndicators.push("Classified as malicious scanner")
        if (source.is_noise) threatIndicators.push("Internet background noise")
        break
      case "otx":
        if (source.pulse_count > 0) threatIndicators.push(`${source.pulse_count} threat pulses`)
        if (source.malware_count > 0) threatIndicators.push(`${source.malware_count} malware associations`)
        break
      case "censys":
        if (source.open_ports.length > 10) threatIndicators.push(`${source.open_ports.length} open ports`)
        break
      case "threatcrowd":
        if (source.votes < 0) threatIndicators.push(`${Math.abs(source.votes)} negative votes`)
        if (source.hashes > 0) threatIndicators.push(`${source.hashes} malware hashes`)
        break
    }
  })

  // Generate recommendations
  const recommendations: string[] = []
  if (riskLevel === "CRITICAL") {
    recommendations.push("IMMEDIATE ACTION: Block this target in firewall")
    recommendations.push("Investigate any recent connections to this target")
    recommendations.push("Scan systems that may have communicated with this target")
  } else if (riskLevel === "HIGH") {
    recommendations.push("Consider blocking or restricting access to this target")
    recommendations.push("Monitor traffic to/from this target closely")
    recommendations.push("Review logs for suspicious activity")
  } else if (riskLevel === "MEDIUM") {
    recommendations.push("Monitor this target for changes in reputation")
    recommendations.push("Apply additional security controls if accessing")
  } else {
    recommendations.push("Target appears safe based on current intelligence")
    recommendations.push("Continue normal monitoring procedures")
  }

  // Extract geolocation info
  let geolocation: AggregatedThreatIntel["geolocation"]
  const vtResult = sources.find((s) => s.source === "virustotal") as VirusTotalResult
  const abuseResult = sources.find((s) => s.source === "abuseipdb") as AbuseIPDBResult
  const censysResult = sources.find((s) => s.source === "censys") as CensysResult
  const otxResult = sources.find((s) => s.source === "otx") as OTXResult

  if (vtResult || abuseResult || censysResult || otxResult) {
    geolocation = {
      country:
        vtResult?.country || abuseResult?.country_code || censysResult?.country || otxResult?.country || "Unknown",
      country_code: abuseResult?.country_code,
      asn: vtResult?.asn || censysResult?.asn,
      organization: vtResult?.as_owner || censysResult?.organization,
    }
  }

  return {
    target,
    overall_reputation: overallReputation,
    risk_level: riskLevel,
    confidence: Math.round(overallConfidence * 100) / 100,
    sources,
    summary: {
      total_sources: 6, // Total possible sources
      active_sources: sources.length,
      threat_indicators: threatIndicators,
      recommendations,
    },
    geolocation,
    analysis_timestamp: new Date().toISOString(),
  }
}
