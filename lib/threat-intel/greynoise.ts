interface GreyNoiseResponse {
  ip: string
  noise: boolean
  riot: boolean
  classification: string
  name: string
  link: string
  last_seen: string
  message?: string
}

export interface GreyNoiseResult {
  source: "greynoise"
  reputation: number
  is_noise: boolean
  is_riot: boolean
  classification: string
  scanner_name?: string
  last_seen?: string
  confidence: number
}

export async function analyzeWithGreyNoise(ip: string): Promise<GreyNoiseResult | null> {
  const apiKey = process.env.GREYNOISE_API_KEY

    if (!apiKey) {
    return null
  }

  // Only works for IP addresses
  if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
    return null
  }

  try {
    const response = await fetch(`https://api.greynoise.io/v3/community/${ip}`, {
      headers: {
        key: apiKey,
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        // IP not found in GreyNoise database
        return {
          source: "greynoise",
          reputation: 70, // Neutral reputation for unknown IPs
          is_noise: false,
          is_riot: false,
          classification: "unknown",
          confidence: 0.6,
        }
      }
      throw new Error(`GreyNoise API error: ${response.status}`)
    }

    const data: GreyNoiseResponse = await response.json()

    let reputation = 50 // Default neutral
    if (data.classification === "malicious") reputation = 10
    else if (data.classification === "benign") reputation = 90
    else if (data.riot) reputation = 85 // RIOT IPs are generally trusted

    return {
      source: "greynoise",
      reputation,
      is_noise: data.noise,
      is_riot: data.riot,
      classification: data.classification,
      scanner_name: data.name,
      last_seen: data.last_seen,
      confidence: 0.85,
    }
  } catch (error) {
    console.error("GreyNoise analysis failed:", error)
    return null
  }
}
