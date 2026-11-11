export interface HeimdallMockResponse {
  signal: "aligned" | "drift" | "anomaly" | "threat"
  drift: number
  prediction: string[]
  cve_linked: string[]
  commentary: string
  confidence: number
  threat_level: "low" | "medium" | "high" | "critical"
  attack_vectors: string[]
  recommended_actions: string[]
  signature_patterns: string[]
  time_to_threat: number
}

export async function analyzeHeimdal(input: string): Promise<HeimdallMockResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1200))

  // Parse input to determine response type
  const inputLower = input.toLowerCase()
  const hasPortScan = inputLower.includes("port") || inputLower.includes("scan")
  const hasVulnerability = inputLower.includes("cve") || inputLower.includes("vuln")
  const hasAnomaly = inputLower.includes("anomaly") || inputLower.includes("drift")

  // Generate realistic mock responses based on input
  if (hasAnomaly || Math.random() > 0.7) {
    return {
      signal: "anomaly",
      drift: 0.23 + Math.random() * 0.4,
      prediction: ["AnomalyDetection", "BaselineDeviation", "PotentialThreat"],
      cve_linked: ["CVE-2024-1189", "CVE-2023-4567"],
      commentary:
        "Significant drift detected. Pattern suggests coordinated reconnaissance activity. Recommend immediate baseline review.",
      confidence: 78 + Math.random() * 15,
      threat_level: "high",
      attack_vectors: ["Network Reconnaissance", "Service Enumeration", "Vulnerability Scanning"],
      recommended_actions: [
        "Activate enhanced monitoring protocols",
        "Review network access controls",
        "Update intrusion detection signatures",
      ],
      signature_patterns: ["port_sequence:22,80,443,8080", "timing_pattern:burst_scan", "geo_pattern:distributed"],
      time_to_threat: 12 + Math.random() * 24,
    }
  }

  if (hasPortScan) {
    return {
      signal: "aligned",
      drift: 0.07 + Math.random() * 0.1,
      prediction: ["PortScan", "LowNoiseRecon", "ServiceDiscovery"],
      cve_linked: ["CVE-2024-1189"],
      commentary:
        "Tactical alignment confirmed. Port scan pattern within standard drift tolerances. Likely automated reconnaissance.",
      confidence: 85 + Math.random() * 10,
      threat_level: "medium",
      attack_vectors: ["Port Scanning", "Service Fingerprinting"],
      recommended_actions: [
        "Monitor scan source for escalation",
        "Verify service configurations",
        "Update port scan detection rules",
      ],
      signature_patterns: ["port_sequence:21,22,23,25,53,80,110,443", "scan_type:tcp_syn"],
      time_to_threat: 48 + Math.random() * 72,
    }
  }

  if (hasVulnerability) {
    return {
      signal: "threat",
      drift: 0.45 + Math.random() * 0.3,
      prediction: ["ExploitAttempt", "VulnerabilityTargeting", "ActiveThreat"],
      cve_linked: ["CVE-2024-0001", "CVE-2023-9999", "CVE-2024-1337"],
      commentary:
        "Critical vulnerability exploitation detected. Multiple CVEs being actively targeted. Immediate response required.",
      confidence: 92 + Math.random() * 7,
      threat_level: "critical",
      attack_vectors: ["Remote Code Execution", "Privilege Escalation", "Data Exfiltration"],
      recommended_actions: [
        "Implement emergency response protocols",
        "Isolate affected systems immediately",
        "Apply security patches urgently",
        "Activate incident response team",
      ],
      signature_patterns: ["exploit_pattern:buffer_overflow", "payload_signature:shellcode_detected"],
      time_to_threat: 2 + Math.random() * 6,
    }
  }

  // Default aligned response
  return {
    signal: "aligned",
    drift: 0.03 + Math.random() * 0.05,
    prediction: ["NormalTraffic", "BaselineCompliant"],
    cve_linked: [],
    commentary:
      "System operating within normal parameters. No significant threats detected. Baseline alignment maintained.",
    confidence: 88 + Math.random() * 10,
    threat_level: "low",
    attack_vectors: [],
    recommended_actions: [
      "Continue standard monitoring",
      "Maintain current security posture",
      "Update threat intelligence feeds",
    ],
    signature_patterns: ["normal_traffic_pattern"],
    time_to_threat: 168 + Math.random() * 336, // 1-2 weeks
  }
}

export async function getHeimdallStatus(): Promise<{ status: string; latency: number; model_version: string }> {
  await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300))

  return {
    status: "operational",
    latency: 150 + Math.random() * 200,
    model_version: "v2.1.0-mock",
  }
}

export async function resetHeimdallContext(): Promise<{ success: boolean; message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  return {
    success: true,
    message: "Heimdall context reset successfully. All analysis baselines cleared.",
  }
}
