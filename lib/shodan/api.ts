export interface ShodanSearchResult {
  ip_str: string
  port: number
  transport: string
  product?: string
  version?: string
  org?: string
  location?: {
    country_name?: string
    city?: string
  }
  timestamp: string
  data: string
}

export interface ShodanSearchResponse {
  matches: ShodanSearchResult[]
  total: number
  facets: Record<string, any>
}

export interface ShodanHostInfo {
  ip_str: string
  org?: string
  isp?: string
  country_name?: string
  city?: string
  ports: number[]
  hostnames: string[]
  data: Array<{
    port: number
    transport: string
    product?: string
    version?: string
    timestamp: string
    data: string
  }>
  vulns: string[]
  tags: string[]
}

export interface InternetDBResult {
  ip: string
  ports: number[]
  cpes: string[]
  hostnames: string[]
  tags: string[]
  vulns: string[]
}

export class ShodanAPIClient {
  private baseURL = "/api/shodan"

  async search(query: string, facets?: string[], page = 1): Promise<ShodanSearchResponse> {
    const response = await fetch(`${this.baseURL}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, facets, page }),
    })

    if (!response.ok) {
      throw new Error(`Search request failed: ${response.statusText}`)
    }

    return response.json()
  }

  async getHostInfo(ip: string): Promise<ShodanHostInfo> {
    const response = await fetch(`${this.baseURL}/host`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ip }),
    })

    if (!response.ok) {
      throw new Error(`Host lookup failed: ${response.statusText}`)
    }

    return response.json()
  }

  async getInternetDBInfo(ip: string): Promise<InternetDBResult> {
    const response = await fetch(`${this.baseURL}/internetdb`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ip }),
    })

    if (!response.ok) {
      throw new Error(`InternetDB lookup failed: ${response.statusText}`)
    }

    return response.json()
  }

  async getAPIInfo(): Promise<any> {
    const response = await fetch(`${this.baseURL}/status`, {
      method: "GET",
    })

    if (!response.ok) {
      throw new Error(`API info request failed: ${response.statusText}`)
    }

    return response.json()
  }
}

export const shodanClient = new ShodanAPIClient()
