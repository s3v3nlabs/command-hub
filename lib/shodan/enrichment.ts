interface EnrichmentResult {
  ip: string
  enrichment_timestamp: string
  geolocation: {
    country: string
    country_code: string
    city: string
    region: string
    latitude: number
    longitude: number
    timezone: string
    isp: string
    asn: string
    organization: string
  }
  threat_intelligence: {
    reputation_score: number
    threat_categories: string[]
    malware_families: string[]
    last_seen_malicious: string | null
    threat_feeds: string[]
    confidence_level: number
  }
  cve_data: Array<{
    id: string
    severity: string
    cvss_score: number
    description: string
    published_date: string
    references: string[]
  }>
  whois_data: {
    registrar: string
    creation_date: string
    expiration_date: string
    name_servers: string[]
    contacts: {
      registrant: string
      admin: string
      tech: string
    }
  }
  internetdb_data: {
    ports: number[]
    cpes: string[]
    vulns: string[]
    tags: string[]
    hostnames: string[]
  }
  dns_data: {
    a_records: string[]
    aaaa_records: string[]
    mx_records: string[]
    ns_records: string[]
    txt_records: string[]
    cname_records: string[]
  }
  ssl_data: {
    certificate_valid: boolean
    issuer: string
    subject: string
    valid_from: string
    valid_to: string
    fingerprint: string
    key_size: number
    signature_algorithm: string
  }
}

interface CacheStats {
  cve_cache_size: number
  threat_intel_cache_size: number
  geo_cache_size: number
  whois_cache_size: number
  dns_cache_size: number
  ssl_cache_size: number
  total_cache_size: number
  cache_hit_ratio: number
  oldest_entry: string
  newest_entry: string
}

class EnrichmentEngine {
  private cveCache = new Map<string, any>()
  private threatIntelCache = new Map<string, any>()
  private geoCache = new Map<string, any>()
  private whoisCache = new Map<string, any>()
  private dnsCache = new Map<string, any>()
  private sslCache = new Map<string, any>()
  private cacheExpiry = new Map<string, number>()

  private readonly CACHE_TTL = {
    cve: 24 * 60 * 60 * 1000, // 24 hours
    threat_intel: 6 * 60 * 60 * 1000, // 6 hours
    geo: 7 * 24 * 60 * 60 * 1000, // 7 days
    whois: 24 * 60 * 60 * 1000, // 24 hours
    dns: 60 * 60 * 1000, // 1 hour
    ssl: 24 * 60 * 60 * 1000, // 24 hours
  }

  private readonly RATE_LIMITS = {
    cve_api: 1000, // requests per hour
    threat_intel: 500,
    geo_api: 1000,
    whois_api: 100,
    dns_api: 1000,
    ssl_api: 500,
  }

  private requestCounts = new Map<string, { count: number; resetTime: number }>()

  async enrichIP(ip: string, shodanData?: any): Promise<EnrichmentResult> {
    const startTime = Date.now()

    try {
      // Validate IP address
      if (!this.isValidIP(ip)) {
        throw new Error(`Invalid IP address: ${ip}`)
      }

      // Parallel enrichment requests
      const [geolocation, threatIntel, cveData, whoisData, internetdbData, dnsData, sslData] = await Promise.allSettled(
        [
          this.getGeolocation(ip),
          this.getThreatIntelligence(ip),
          this.getCVEData(ip, shodanData),
          this.getWhoisData(ip),
          this.getInternetDBData(ip),
          this.getDNSData(ip),
          this.getSSLData(ip),
        ],
      )

      const result: EnrichmentResult = {
        ip,
        enrichment_timestamp: new Date().toISOString(),
        geolocation: this.extractResult(geolocation, this.getDefaultGeolocation()),
        threat_intelligence: this.extractResult(threatIntel, this.getDefaultThreatIntel()),
        cve_data: this.extractResult(cveData, []),
        whois_data: this.extractResult(whoisData, this.getDefaultWhois()),
        internetdb_data: this.extractResult(internetdbData, this.getDefaultInternetDB()),
        dns_data: this.extractResult(dnsData, this.getDefaultDNS()),
        ssl_data: this.extractResult(sslData, this.getDefaultSSL()),
      }

      console.log(`Enrichment completed for ${ip} in ${Date.now() - startTime}ms`)
      return result
    } catch (error) {
      console.error(`Enrichment failed for ${ip}:`, error)
      throw error
    }
  }

  async bulkEnrich(ips: string[], shodanData?: any[]): Promise<EnrichmentResult[]> {
    const batchSize = 5
    const results: EnrichmentResult[] = []

    for (let i = 0; i < ips.length; i += batchSize) {
      const batch = ips.slice(i, i + batchSize)
      const batchPromises = batch.map((ip, index) => {
        const relatedShodanData = shodanData?.[i + index]
        return this.enrichIP(ip, relatedShodanData).catch((error) => {
          console.error(`Failed to enrich ${ip}:`, error)
          return null
        })
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults.filter((result): result is EnrichmentResult => result !== null))

      // Rate limiting between batches
      if (i + batchSize < ips.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    return results
  }

  private async getGeolocation(ip: string): Promise<any> {
    const cacheKey = `geo_${ip}`
    const cached = this.getCachedData(cacheKey, this.geoCache, this.CACHE_TTL.geo)
    if (cached) return cached

    if (!this.checkRateLimit("geo_api")) {
      throw new Error("Geolocation API rate limit exceeded")
    }

    try {
      // Using ip-api.com (free tier: 1000 requests/hour)
      const response = await fetch(
        `http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,city,lat,lon,timezone,isp,as,org`,
      )

      if (!response.ok) {
        throw new Error(`Geolocation API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.status === "fail") {
        throw new Error(`Geolocation failed: ${data.message}`)
      }

      const result = {
        country: data.country || "Unknown",
        country_code: data.countryCode || "XX",
        city: data.city || "Unknown",
        region: data.region || "Unknown",
        latitude: data.lat || 0,
        longitude: data.lon || 0,
        timezone: data.timezone || "Unknown",
        isp: data.isp || "Unknown",
        asn: data.as || "Unknown",
        organization: data.org || "Unknown",
      }

      this.setCachedData(cacheKey, result, this.geoCache, this.CACHE_TTL.geo)
      return result
    } catch (error) {
      console.error(`Geolocation lookup failed for ${ip}:`, error)
      return this.getDefaultGeolocation()
    }
  }

  private async getThreatIntelligence(ip: string): Promise<any> {
    const cacheKey = `threat_${ip}`
    const cached = this.getCachedData(cacheKey, this.threatIntelCache, this.CACHE_TTL.threat_intel)
    if (cached) return cached

    if (!this.checkRateLimit("threat_intel")) {
      throw new Error("Threat intelligence API rate limit exceeded")
    }

    try {
      // Simulate threat intelligence lookup
      // In production, this would integrate with services like:
      // - VirusTotal API
      // - AbuseIPDB
      // - Shodan InternetDB
      // - OTX AlienVault
      // - IBM X-Force

      const mockThreatData = {
        reputation_score: Math.floor(Math.random() * 100),
        threat_categories: this.generateThreatCategories(),
        malware_families: this.generateMalwareFamilies(),
        last_seen_malicious:
          Math.random() > 0.7 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : null,
        threat_feeds: ["shodan", "virustotal", "abuseipdb"],
        confidence_level: Math.random() * 0.5 + 0.5, // 0.5 to 1.0
      }

      this.setCachedData(cacheKey, mockThreatData, this.threatIntelCache, this.CACHE_TTL.threat_intel)
      return mockThreatData
    } catch (error) {
      console.error(`Threat intelligence lookup failed for ${ip}:`, error)
      return this.getDefaultThreatIntel()
    }
  }

  private async getCVEData(ip: string, shodanData?: any): Promise<any[]> {
    const cacheKey = `cve_${ip}`
    const cached = this.getCachedData(cacheKey, this.cveCache, this.CACHE_TTL.cve)
    if (cached) return cached

    if (!this.checkRateLimit("cve_api")) {
      throw new Error("CVE API rate limit exceeded")
    }

    try {
      const cveData: any[] = []

      // Extract CVEs from Shodan data if available
      if (shodanData?.vulns) {
        for (const cve of shodanData.vulns) {
          const cveInfo = await this.getCVEDetails(cve)
          if (cveInfo) {
            cveData.push(cveInfo)
          }
        }
      }

      // Add some mock CVE data for demonstration
      if (Math.random() > 0.6) {
        cveData.push({
          id: "CVE-2021-44228",
          severity: "Critical",
          cvss_score: 9.8,
          description: "Apache Log4j2 Remote Code Execution Vulnerability",
          published_date: "2021-12-10",
          references: [
            "https://nvd.nist.gov/vuln/detail/CVE-2021-44228",
            "https://logging.apache.org/log4j/2.x/security.html",
          ],
        })
      }

      if (Math.random() > 0.8) {
        cveData.push({
          id: "CVE-2022-22965",
          severity: "High",
          cvss_score: 8.1,
          description: "Spring Framework Remote Code Execution via Data Binding",
          published_date: "2022-03-31",
          references: [
            "https://nvd.nist.gov/vuln/detail/CVE-2022-22965",
            "https://spring.io/blog/2022/03/31/spring-framework-rce-early-announcement",
          ],
        })
      }

      this.setCachedData(cacheKey, cveData, this.cveCache, this.CACHE_TTL.cve)
      return cveData
    } catch (error) {
      console.error(`CVE lookup failed for ${ip}:`, error)
      return []
    }
  }

  private async getCVEDetails(cveId: string): Promise<any | null> {
    try {
      // In production, this would query the NVD API or similar
      // For now, return mock data based on common CVEs
      const mockCVEs: Record<string, any> = {
        "CVE-2021-44228": {
          id: "CVE-2021-44228",
          severity: "Critical",
          cvss_score: 9.8,
          description: "Apache Log4j2 Remote Code Execution Vulnerability",
          published_date: "2021-12-10",
          references: ["https://nvd.nist.gov/vuln/detail/CVE-2021-44228"],
        },
        "CVE-2022-22965": {
          id: "CVE-2022-22965",
          severity: "High",
          cvss_score: 8.1,
          description: "Spring Framework Remote Code Execution via Data Binding",
          published_date: "2022-03-31",
          references: ["https://nvd.nist.gov/vuln/detail/CVE-2022-22965"],
        },
        "CVE-2021-34527": {
          id: "CVE-2021-34527",
          severity: "Critical",
          cvss_score: 9.0,
          description: "Windows Print Spooler Remote Code Execution Vulnerability",
          published_date: "2021-07-01",
          references: ["https://nvd.nist.gov/vuln/detail/CVE-2021-34527"],
        },
      }

      return mockCVEs[cveId] || null
    } catch (error) {
      console.error(`Failed to get CVE details for ${cveId}:`, error)
      return null
    }
  }

  private async getWhoisData(ip: string): Promise<any> {
    const cacheKey = `whois_${ip}`
    const cached = this.getCachedData(cacheKey, this.whoisCache, this.CACHE_TTL.whois)
    if (cached) return cached

    if (!this.checkRateLimit("whois_api")) {
      throw new Error("WHOIS API rate limit exceeded")
    }

    try {
      // Mock WHOIS data - in production, integrate with WHOIS API service
      const mockWhoisData = {
        registrar: "Example Registrar Inc.",
        creation_date: "2010-01-01",
        expiration_date: "2025-01-01",
        name_servers: ["ns1.example.com", "ns2.example.com"],
        contacts: {
          registrant: "Example Organization",
          admin: "admin@example.com",
          tech: "tech@example.com",
        },
      }

      this.setCachedData(cacheKey, mockWhoisData, this.whoisCache, this.CACHE_TTL.whois)
      return mockWhoisData
    } catch (error) {
      console.error(`WHOIS lookup failed for ${ip}:`, error)
      return this.getDefaultWhois()
    }
  }

  private async getInternetDBData(ip: string): Promise<any> {
    try {
      // Use Shodan's free InternetDB service
      const response = await fetch(`https://internetdb.shodan.io/${ip}`)

      if (!response.ok) {
        if (response.status === 404) {
          // IP not found in InternetDB
          return this.getDefaultInternetDB()
        }
        throw new Error(`InternetDB API error: ${response.status}`)
      }

      const data = await response.json()
      return {
        ports: data.ports || [],
        cpes: data.cpes || [],
        vulns: data.vulns || [],
        tags: data.tags || [],
        hostnames: data.hostnames || [],
      }
    } catch (error) {
      console.error(`InternetDB lookup failed for ${ip}:`, error)
      return this.getDefaultInternetDB()
    }
  }

  private async getDNSData(ip: string): Promise<any> {
    const cacheKey = `dns_${ip}`
    const cached = this.getCachedData(cacheKey, this.dnsCache, this.CACHE_TTL.dns)
    if (cached) return cached

    if (!this.checkRateLimit("dns_api")) {
      throw new Error("DNS API rate limit exceeded")
    }

    try {
      // Mock DNS data - in production, use DNS lookup services
      const mockDNSData = {
        a_records: [ip],
        aaaa_records: [],
        mx_records: ["mail.example.com"],
        ns_records: ["ns1.example.com", "ns2.example.com"],
        txt_records: ["v=spf1 include:_spf.example.com ~all"],
        cname_records: [],
      }

      this.setCachedData(cacheKey, mockDNSData, this.dnsCache, this.CACHE_TTL.dns)
      return mockDNSData
    } catch (error) {
      console.error(`DNS lookup failed for ${ip}:`, error)
      return this.getDefaultDNS()
    }
  }

  private async getSSLData(ip: string): Promise<any> {
    const cacheKey = `ssl_${ip}`
    const cached = this.getCachedData(cacheKey, this.sslCache, this.CACHE_TTL.ssl)
    if (cached) return cached

    if (!this.checkRateLimit("ssl_api")) {
      throw new Error("SSL API rate limit exceeded")
    }

    try {
      // Mock SSL data - in production, use SSL certificate analysis
      const mockSSLData = {
        certificate_valid: Math.random() > 0.3,
        issuer: "Let's Encrypt Authority X3",
        subject: "CN=example.com",
        valid_from: "2023-01-01T00:00:00Z",
        valid_to: "2024-01-01T00:00:00Z",
        fingerprint: "SHA256:1234567890abcdef1234567890abcdef12345678",
        key_size: 2048,
        signature_algorithm: "sha256WithRSAEncryption",
      }

      this.setCachedData(cacheKey, mockSSLData, this.sslCache, this.CACHE_TTL.ssl)
      return mockSSLData
    } catch (error) {
      console.error(`SSL lookup failed for ${ip}:`, error)
      return this.getDefaultSSL()
    }
  }

  // Helper methods
  private isValidIP(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    return ipv4Regex.test(ip) || ipv6Regex.test(ip)
  }

  private extractResult(settledResult: PromiseSettledResult<any>, defaultValue: any): any {
    return settledResult.status === "fulfilled" ? settledResult.value : defaultValue
  }

  private getCachedData(key: string, cache: Map<string, any>, ttl: number): any | null {
    const expiry = this.cacheExpiry.get(key)
    if (expiry && Date.now() < expiry && cache.has(key)) {
      return cache.get(key)
    }
    return null
  }

  private setCachedData(key: string, data: any, cache: Map<string, any>, ttl: number): void {
    cache.set(key, data)
    this.cacheExpiry.set(key, Date.now() + ttl)
  }

  private checkRateLimit(apiType: string): boolean {
    const now = Date.now()
    const hourStart = Math.floor(now / (60 * 60 * 1000)) * (60 * 60 * 1000)

    const current = this.requestCounts.get(apiType)
    if (!current || current.resetTime !== hourStart) {
      this.requestCounts.set(apiType, { count: 1, resetTime: hourStart })
      return true
    }

    const limit = this.RATE_LIMITS[apiType as keyof typeof this.RATE_LIMITS] || 100
    if (current.count >= limit) {
      return false
    }

    current.count++
    return true
  }

  private generateThreatCategories(): string[] {
    const categories = ["malware", "botnet", "phishing", "spam", "scanning", "brute-force", "ddos", "tor-exit"]
    const count = Math.floor(Math.random() * 3)
    const selected: string[] = []

    for (let i = 0; i < count; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)]
      if (!selected.includes(category)) {
        selected.push(category)
      }
    }

    return selected
  }

  private generateMalwareFamilies(): string[] {
    const families = ["mirai", "conficker", "zeus", "emotet", "trickbot", "ryuk", "lockbit", "conti"]
    const count = Math.floor(Math.random() * 2)
    const selected: string[] = []

    for (let i = 0; i < count; i++) {
      const family = families[Math.floor(Math.random() * families.length)]
      if (!selected.includes(family)) {
        selected.push(family)
      }
    }

    return selected
  }

  // Default data generators
  private getDefaultGeolocation(): any {
    return {
      country: "Unknown",
      country_code: "XX",
      city: "Unknown",
      region: "Unknown",
      latitude: 0,
      longitude: 0,
      timezone: "Unknown",
      isp: "Unknown",
      asn: "Unknown",
      organization: "Unknown",
    }
  }

  private getDefaultThreatIntel(): any {
    return {
      reputation_score: 50,
      threat_categories: [],
      malware_families: [],
      last_seen_malicious: null,
      threat_feeds: [],
      confidence_level: 0.5,
    }
  }

  private getDefaultWhois(): any {
    return {
      registrar: "Unknown",
      creation_date: "Unknown",
      expiration_date: "Unknown",
      name_servers: [],
      contacts: {
        registrant: "Unknown",
        admin: "Unknown",
        tech: "Unknown",
      },
    }
  }

  private getDefaultInternetDB(): any {
    return {
      ports: [],
      cpes: [],
      vulns: [],
      tags: [],
      hostnames: [],
    }
  }

  private getDefaultDNS(): any {
    return {
      a_records: [],
      aaaa_records: [],
      mx_records: [],
      ns_records: [],
      txt_records: [],
      cname_records: [],
    }
  }

  private getDefaultSSL(): any {
    return {
      certificate_valid: false,
      issuer: "Unknown",
      subject: "Unknown",
      valid_from: "Unknown",
      valid_to: "Unknown",
      fingerprint: "Unknown",
      key_size: 0,
      signature_algorithm: "Unknown",
    }
  }

  // Cache management
  getCacheStats(): CacheStats {
    const totalSize =
      this.cveCache.size +
      this.threatIntelCache.size +
      this.geoCache.size +
      this.whoisCache.size +
      this.dnsCache.size +
      this.sslCache.size

    const validEntries = Array.from(this.cacheExpiry.entries()).filter(([, expiry]) => Date.now() < expiry)
    const hitRatio = this.cacheExpiry.size > 0 ? validEntries.length / this.cacheExpiry.size : 0

    const timestamps = Array.from(this.cacheExpiry.values())
    const oldestEntry = timestamps.length > 0 ? new Date(Math.min(...timestamps)).toISOString() : "N/A"
    const newestEntry = timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : "N/A"

    return {
      cve_cache_size: this.cveCache.size,
      threat_intel_cache_size: this.threatIntelCache.size,
      geo_cache_size: this.geoCache.size,
      whois_cache_size: this.whoisCache.size,
      dns_cache_size: this.dnsCache.size,
      ssl_cache_size: this.sslCache.size,
      total_cache_size: totalSize,
      cache_hit_ratio: hitRatio,
      oldest_entry: oldestEntry,
      newest_entry: newestEntry,
    }
  }

  clearCache(): void {
    this.cveCache.clear()
    this.threatIntelCache.clear()
    this.geoCache.clear()
    this.whoisCache.clear()
    this.dnsCache.clear()
    this.sslCache.clear()
  }

  clearExpiredCache(): number {
    const now = Date.now()
    let clearedCount = 0

    for (const [key, expiry] of this.cacheExpiry.entries()) {
      if (now >= expiry) {
        this.cacheExpiry.delete(key)
        this.cveCache.delete(key)
        this.threatIntelCache.delete(key)
        this.geoCache.delete(key)
        this.whoisCache.delete(key)
        this.dnsCache.delete(key)
        this.sslCache.delete(key)
        clearedCount++
      }
    }

    return clearedCount
  }
}

export const enrichmentEngine = new EnrichmentEngine()
export type { EnrichmentResult, CacheStats }
