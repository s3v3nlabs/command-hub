interface ThreatCrowdResponse {
  response_code: string
  resolutions?: Array<{
    last_resolved: string
    domain: string
  }>
  hashes?: string[]
  references?: string[]
  scans?: string[]
  votes: number
  permalink: string
}

export interface ThreatCrowdResult {
  source: "threatcrowd"
  reputation: number
  votes: number
  resolutions: number
  hashes: number
  references: number
  scans: number
  permalink?: string
  confidence: number
}

export async function analyzeWithThreatCrowd(target: string): Promise<ThreatCrowdResult | null> {
  try {
    const isIP = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(target)
    const endpoint = isIP ? "ip" : "domain"

    const response = await fetch(`https://www.threatcrowd.org/searchApi/v2/${endpoint}/report/?${endpoint}=${target}`)

    if (!response.ok) {
      throw new Error(`ThreatCrowd API error: ${response.status}`)
    }

    const data: ThreatCrowdResponse = await response.json()

    if (data.response_code !== "1") {
      // No data found
      return {
        source: "threatcrowd",
        reputation: 70, // Neutral for unknown
        votes: 0,
        resolutions: 0,
        hashes: 0,
        references: 0,
        scans: 0,
        confidence: 0.5,
      }
    }

    const resolutions = data.resolutions?.length || 0
    const hashes = data.hashes?.length || 0
    const references = data.references?.length || 0
    const scans = data.scans?.length || 0
    const votes = data.votes || 0

    // Calculate reputation based on threat indicators
    let reputation = 70 // Start neutral
    if (votes < 0) reputation += votes * 10 // Negative votes = bad reputation
    if (hashes > 0) reputation -= hashes * 5 // Associated malware
    if (references > 5) reputation -= 10 // Many references might indicate threats
    reputation = Math.max(0, Math.min(100, reputation))

    return {
      source: "threatcrowd",
      reputation,
      votes,
      resolutions,
      hashes,
      references,
      scans,
      permalink: data.permalink,
      confidence: 0.7,
    }
  } catch (error) {
    console.error("ThreatCrowd analysis failed:", error)
    return null
  }
}
