interface CensysResponse {
  result: {
    ip: string
    location: {
      country: string
      country_code: string
      city: string
      province: string
    }
    autonomous_system: {
      asn: number
      name: string
      organization: string
    }
    services: Array<{
      port: number
      service_name: string
      transport_protocol: string
      certificate?: {
        parsed: {
          subject_dn: string
          issuer_dn: string
          validity: {
            start: string
            end: string
          }
        }
      }
    }>
    last_updated_at: string
  }
}

export interface CensysResult {
  source: "censys"
  reputation: number
  open_ports: number[]
  services: Array<{
    port: number
    service: string
    protocol: string
  }>
  certificates: number
  country?: string
  asn?: number
  organization?: string
  last_updated?: string
  confidence: number
}

export async function analyzeWithCensys(ip: string): Promise<CensysResult | null> {
  const apiId = process.env.CENSYS_API_ID
  const apiSecret = process.env.CENSYS_API_SECRET

    if (!apiId || !apiSecret) {
    return null
  }

  // Only works for IP addresses
  if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
    return null
  }

  try {
    const auth = Buffer.from(`${apiId}:${apiSecret}`).toString("base64")

    const response = await fetch(`https://search.censys.io/api/v2/hosts/${ip}`, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Censys API error: ${response.status}`)
    }

    const data: CensysResponse = await response.json()
    const result = data.result

    const openPorts = result.services.map((service) => service.port)
    const certificates = result.services.filter((service) => service.certificate).length

    // Calculate reputation based on service exposure
    let reputation = 70 // Neutral start
    if (openPorts.length > 10) reputation -= 20 // Many open ports = higher risk
    if (openPorts.includes(23) || openPorts.includes(21)) reputation -= 15 // Telnet/FTP
    if (certificates > 0) reputation += 10 // SSL certificates = better
    reputation = Math.max(0, Math.min(100, reputation))

    return {
      source: "censys",
      reputation,
      open_ports: openPorts,
      services: result.services.map((service) => ({
        port: service.port,
        service: service.service_name,
        protocol: service.transport_protocol,
      })),
      certificates,
      country: result.location.country,
      asn: result.autonomous_system.asn,
      organization: result.autonomous_system.organization,
      last_updated: result.last_updated_at,
      confidence: 0.85,
    }
  } catch (error) {
    console.error("Censys analysis failed:", error)
    return null
  }
}
