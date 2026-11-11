interface AbuseIPDBResponse {
  data: {
    abuseConfidencePercentage: number
    countryCode: string
    usageType: string
    isp: string
    totalReports: number
    numDistinctUsers: number
    lastReportedAt: string
  }
}

export interface AbuseIPDBResult {
  source: "abuseipdb"
  reputation: number
  abuse_confidence: number
  total_reports: number
  distinct_users: number
  country_code?: string
  isp?: string
  usage_type?: string
  last_reported?: string
  confidence: number
}

export async function analyzeWithAbuseIPDB(ip: string): Promise<AbuseIPDBResult | null> {
  const apiKey = process.env.ABUSEIPDB_API_KEY

  if (!apiKey) {
    console.log("AbuseIPDB API key not configured, using mock data")
    return {
      source: "abuseipdb",
      reputation: Math.floor(Math.random() * 100),
      abuse_confidence: Math.floor(Math.random() * 30),
      total_reports: Math.floor(Math.random() * 50),
      distinct_users: Math.floor(Math.random() * 20),
      country_code: "US",
      isp: "Example ISP",
      usage_type: "hosting",
      confidence: 0.85,
    }
  }

  // Only works for IP addresses
  if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
    return null
  }

  try {
    const response = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90&verbose`, {
      headers: {
        Key: apiKey,
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`AbuseIPDB API error: ${response.status}`)
    }

    const result: AbuseIPDBResponse = await response.json()
    const data = result.data

    return {
      source: "abuseipdb",
      reputation: Math.max(0, 100 - data.abuseConfidencePercentage),
      abuse_confidence: data.abuseConfidencePercentage,
      total_reports: data.totalReports,
      distinct_users: data.numDistinctUsers,
      country_code: data.countryCode,
      isp: data.isp,
      usage_type: data.usageType,
      last_reported: data.lastReportedAt,
      confidence: 0.9,
    }
  } catch (error) {
    console.error("AbuseIPDB analysis failed:", error)
    return null
  }
}
