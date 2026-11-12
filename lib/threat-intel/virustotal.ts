interface VirusTotalResponse {
  data: {
    attributes: {
      last_analysis_stats: {
        malicious: number
        suspicious: number
        undetected: number
        harmless: number
      }
      reputation: number
      country: string
      as_owner: string
      asn: number
    }
  }
}

export interface VirusTotalResult {
  source: "virustotal"
  reputation: number
  malicious: number
  suspicious: number
  total_scans: number
  country?: string
  asn?: number
  as_owner?: string
  confidence: number
}

export async function analyzeWithVirusTotal(target: string): Promise<VirusTotalResult | null> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY

    if (!apiKey) {
    return null
  }

  try {
    const isIP = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(target)
    const endpoint = isIP ? "ip_addresses" : "domains"

    const response = await fetch(`https://www.virustotal.com/api/v3/${endpoint}/${target}`, {
      headers: {
        "x-apikey": apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(`VirusTotal API error: ${response.status}`)
    }

    const data: VirusTotalResponse = await response.json()
    const stats = data.data.attributes.last_analysis_stats
    const total = stats.malicious + stats.suspicious + stats.undetected + stats.harmless

    return {
      source: "virustotal",
      reputation: Math.max(0, 100 - (stats.malicious * 20 + stats.suspicious * 10)),
      malicious: stats.malicious,
      suspicious: stats.suspicious,
      total_scans: total,
      country: data.data.attributes.country,
      asn: data.data.attributes.asn,
      as_owner: data.data.attributes.as_owner,
      confidence: 0.9,
    }
  } catch (error) {
    console.error("VirusTotal analysis failed:", error)
    return null
  }
}
