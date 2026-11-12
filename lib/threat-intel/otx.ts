interface OTXResponse {
  pulse_info: {
    count: number
    pulses: Array<{
      name: string
      description: string
      created: string
      modified: string
      tags: string[]
      malware_families: string[]
      attack_ids: string[]
    }>
  }
  general: {
    country_code: string
    country_name: string
    city: string
    asn: string
    hostname: string
    reputation: number
  }
  malware: {
    count: number
    data: Array<{
      hash: string
      detections: Array<{
        detection: string
        date: string
      }>
    }>
  }
}

export interface OTXResult {
  source: "otx"
  reputation: number
  pulse_count: number
  malware_count: number
  country?: string
  asn?: string
  hostname?: string
  pulses: Array<{
    name: string
    description: string
    tags: string[]
    created: string
  }>
  confidence: number
}

export async function analyzeWithOTX(target: string): Promise<OTXResult | null> {
  const apiKey = process.env.OTX_API_KEY

    if (!apiKey) {
    return null
  }

  try {
    const isIP = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(target)
    const endpoint = isIP ? "IPv4" : "domain"

    const response = await fetch(`https://otx.alienvault.com/api/v1/indicators/${endpoint}/${target}/general`, {
      headers: {
        "X-OTX-API-KEY": apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(`OTX API error: ${response.status}`)
    }

    const data: Partial<OTXResponse> = await response.json()

    // Get pulse information
    const pulseResponse = await fetch(`https://otx.alienvault.com/api/v1/indicators/${endpoint}/${target}/malware`, {
      headers: {
        "X-OTX-API-KEY": apiKey,
      },
    })

    let pulseData: Partial<OTXResponse> = {}
    if (pulseResponse.ok) {
      pulseData = await pulseResponse.json()
    }

    const pulseCount = data.pulse_info?.count || 0
    const malwareCount = data.malware?.count || pulseData.malware?.count || 0

    // Calculate reputation based on threat indicators
    let reputation = 80 // Start with good reputation
    if (pulseCount > 0) reputation -= pulseCount * 15
    if (malwareCount > 0) reputation -= malwareCount * 20
    reputation = Math.max(0, Math.min(100, reputation))

    return {
      source: "otx",
      reputation,
      pulse_count: pulseCount,
      malware_count: malwareCount,
      country: data.general?.country_name,
      asn: data.general?.asn,
      hostname: data.general?.hostname,
      pulses:
        data.pulse_info?.pulses?.slice(0, 5).map((pulse) => ({
          name: pulse.name,
          description: pulse.description,
          tags: pulse.tags,
          created: pulse.created,
        })) || [],
      confidence: 0.85,
    }
  } catch (error) {
    console.error("OTX analysis failed:", error)
    return null
  }
}
