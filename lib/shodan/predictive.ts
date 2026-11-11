interface QuerySuggestion {
  filter: string
  description: string
  confidence: number
  category: string
  usage_count: number
}

interface QueryStats {
  total_queries: number
  successful_queries: number
  avg_results_per_query: number
  success_rate: number
  avg_response_time: number
  cache_hit_rate: number
  error_rate: number
  most_common_query: string
  top_queries: Array<{ query: string; count: number }>
  recent_queries: Array<{ query: string; timestamp: string; results: number }>
}

class PredictiveEngine {
  private queryHistory: Array<{
    query: string
    timestamp: number
    result_count: number
    success: boolean
    response_time: number
  }> = []

  private suggestionCache: Map<string, QuerySuggestion[]> = new Map()
  private cacheExpiry: Map<string, number> = new Map()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  // Common Shodan query patterns and templates
  private queryTemplates = [
    {
      pattern: "port:{port}",
      description: "Search for specific port",
      category: "network",
      examples: ["port:22", "port:80", "port:443"],
    },
    {
      pattern: "country:{country}",
      description: "Filter by country code",
      category: "geographic",
      examples: ["country:US", "country:CN", "country:RU"],
    },
    {
      pattern: 'org:"{organization}"',
      description: "Search by organization",
      category: "organization",
      examples: ['org:"Amazon"', 'org:"Google"', 'org:"Microsoft"'],
    },
    {
      pattern: "product:{product}",
      description: "Filter by product/service",
      category: "service",
      examples: ["product:apache", "product:nginx", "product:mysql"],
    },
    {
      pattern: "vuln:{cve}",
      description: "Search for specific vulnerability",
      category: "security",
      examples: ["vuln:CVE-2021-44228", "vuln:CVE-2022-22965"],
    },
    {
      pattern: "has_vuln:true",
      description: "Find hosts with known vulnerabilities",
      category: "security",
      examples: ["has_vuln:true"],
    },
    {
      pattern: "has_screenshot:true",
      description: "Find hosts with screenshots",
      category: "visual",
      examples: ["has_screenshot:true"],
    },
    {
      pattern: 'city:"{city}"',
      description: "Filter by city",
      category: "geographic",
      examples: ['city:"New York"', 'city:"London"', 'city:"Tokyo"'],
    },
    {
      pattern: "asn:{asn}",
      description: "Search by Autonomous System Number",
      category: "network",
      examples: ["asn:AS15169", "asn:AS8075"],
    },
    {
      pattern: "net:{network}",
      description: "Search within IP network range",
      category: "network",
      examples: ["net:192.168.1.0/24", "net:10.0.0.0/8"],
    },
  ]

  // High-value target patterns for advanced users
  private advancedPatterns = [
    {
      filter: "port:502 country:US",
      description: "Industrial control systems in US",
      category: "industrial",
      confidence: 0.9,
    },
    {
      filter: "port:3389 country:CN",
      description: "RDP services in China",
      category: "remote-access",
      confidence: 0.85,
    },
    {
      filter: "has_vuln:true port:22",
      description: "Vulnerable SSH services",
      category: "security",
      confidence: 0.95,
    },
    {
      filter: "product:apache has_vuln:true",
      description: "Vulnerable Apache servers",
      category: "security",
      confidence: 0.9,
    },
    {
      filter: "port:1433,3306,5432 country:US",
      description: "Database servers in US",
      category: "database",
      confidence: 0.8,
    },
    {
      filter: "has_screenshot:true port:80,8080",
      description: "Web interfaces with screenshots",
      category: "visual",
      confidence: 0.75,
    },
    {
      filter: "port:23 product:telnet",
      description: "Telnet services (legacy)",
      category: "legacy",
      confidence: 0.7,
    },
    {
      filter: "port:21 product:ftp",
      description: "FTP services",
      category: "file-transfer",
      confidence: 0.7,
    },
    {
      filter: "port:161 product:snmp",
      description: "SNMP services",
      category: "monitoring",
      confidence: 0.8,
    },
    {
      filter: "port:445 product:smb",
      description: "SMB file shares",
      category: "file-sharing",
      confidence: 0.85,
    },
  ]

  recordQuery(query: string, resultCount: number, responseTime = 0, success = true): void {
    this.queryHistory.push({
      query: query.toLowerCase().trim(),
      timestamp: Date.now(),
      result_count: resultCount,
      success,
      response_time: responseTime,
    })

    // Keep only last 1000 queries
    if (this.queryHistory.length > 1000) {
      this.queryHistory = this.queryHistory.slice(-1000)
    }

    // Clear suggestion cache for this query to force refresh
    this.suggestionCache.delete(query.toLowerCase())
  }

  getSuggestions(partialQuery: string): QuerySuggestion[] {
    const cacheKey = partialQuery.toLowerCase().trim()

    // Check cache first
    if (this.suggestionCache.has(cacheKey) && this.isCacheValid(cacheKey)) {
      return this.suggestionCache.get(cacheKey) || []
    }

    const suggestions: QuerySuggestion[] = []

    // Template-based suggestions
    for (const template of this.queryTemplates) {
      if (template.pattern.toLowerCase().includes(cacheKey) || cacheKey.includes(template.category)) {
        for (const example of template.examples) {
          suggestions.push({
            filter: example,
            description: template.description,
            confidence: 0.8,
            category: template.category,
            usage_count: this.getQueryUsageCount(example),
          })
        }
      }
    }

    // Advanced pattern suggestions
    for (const pattern of this.advancedPatterns) {
      if (
        pattern.filter.toLowerCase().includes(cacheKey) ||
        pattern.description.toLowerCase().includes(cacheKey) ||
        pattern.category.toLowerCase().includes(cacheKey)
      ) {
        suggestions.push({
          filter: pattern.filter,
          description: pattern.description,
          confidence: pattern.confidence,
          category: pattern.category,
          usage_count: this.getQueryUsageCount(pattern.filter),
        })
      }
    }

    // Historical query suggestions
    const historicalSuggestions = this.getHistoricalSuggestions(cacheKey)
    suggestions.push(...historicalSuggestions)

    // Smart completion suggestions
    const completionSuggestions = this.getCompletionSuggestions(cacheKey)
    suggestions.push(...completionSuggestions)

    // Sort by confidence and usage
    const sortedSuggestions = suggestions
      .sort((a, b) => {
        const scoreA = a.confidence * 0.7 + (a.usage_count / 100) * 0.3
        const scoreB = b.confidence * 0.7 + (b.usage_count / 100) * 0.3
        return scoreB - scoreA
      })
      .slice(0, 10) // Limit to top 10

    // Cache the results
    this.suggestionCache.set(cacheKey, sortedSuggestions)
    this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL)

    return sortedSuggestions
  }

  private getHistoricalSuggestions(partialQuery: string): QuerySuggestion[] {
    const suggestions: QuerySuggestion[] = []
    const queryFrequency = new Map<string, number>()

    // Count query frequency
    for (const entry of this.queryHistory) {
      if (entry.success && entry.query.includes(partialQuery)) {
        queryFrequency.set(entry.query, (queryFrequency.get(entry.query) || 0) + 1)
      }
    }

    // Convert to suggestions
    for (const [query, count] of queryFrequency.entries()) {
      if (count >= 2) {
        // Only suggest queries used multiple times
        suggestions.push({
          filter: query,
          description: `Previously used query (${count}x)`,
          confidence: Math.min(0.9, 0.5 + count * 0.1),
          category: "historical",
          usage_count: count,
        })
      }
    }

    return suggestions
  }

  private getCompletionSuggestions(partialQuery: string): QuerySuggestion[] {
    const suggestions: QuerySuggestion[] = []

    // Common port completions
    if (partialQuery.includes("port:") && !partialQuery.includes(" ")) {
      const commonPorts = [22, 23, 25, 53, 80, 110, 143, 443, 993, 995, 1433, 3306, 3389, 5432, 5900, 6379, 9200]
      for (const port of commonPorts) {
        if (port.toString().startsWith(partialQuery.split("port:")[1] || "")) {
          suggestions.push({
            filter: `port:${port}`,
            description: `Search for port ${port}`,
            confidence: 0.6,
            category: "completion",
            usage_count: this.getQueryUsageCount(`port:${port}`),
          })
        }
      }
    }

    // Country code completions
    if (partialQuery.includes("country:") && !partialQuery.includes(" ")) {
      const commonCountries = ["US", "CN", "RU", "DE", "GB", "FR", "JP", "KR", "IN", "BR"]
      const partial = partialQuery.split("country:")[1] || ""
      for (const country of commonCountries) {
        if (country.toLowerCase().startsWith(partial.toLowerCase())) {
          suggestions.push({
            filter: `country:${country}`,
            description: `Filter by ${country}`,
            confidence: 0.7,
            category: "completion",
            usage_count: this.getQueryUsageCount(`country:${country}`),
          })
        }
      }
    }

    // Product completions
    if (partialQuery.includes("product:") && !partialQuery.includes(" ")) {
      const commonProducts = ["apache", "nginx", "mysql", "postgresql", "redis", "mongodb", "elasticsearch", "ssh"]
      const partial = partialQuery.split("product:")[1] || ""
      for (const product of commonProducts) {
        if (product.startsWith(partial.toLowerCase())) {
          suggestions.push({
            filter: `product:${product}`,
            description: `Search for ${product} services`,
            confidence: 0.7,
            category: "completion",
            usage_count: this.getQueryUsageCount(`product:${product}`),
          })
        }
      }
    }

    return suggestions
  }

  private getQueryUsageCount(query: string): number {
    return this.queryHistory.filter((entry) => entry.query === query.toLowerCase()).length
  }

  private isCacheValid(cacheKey: string): boolean {
    const expiry = this.cacheExpiry.get(cacheKey)
    return expiry ? Date.now() < expiry : false
  }

  getQueryStats(): QueryStats {
    const totalQueries = this.queryHistory.length
    const successfulQueries = this.queryHistory.filter((q) => q.success).length
    const totalResults = this.queryHistory.reduce((sum, q) => sum + q.result_count, 0)
    const totalResponseTime = this.queryHistory.reduce((sum, q) => sum + q.response_time, 0)

    // Calculate query frequency
    const queryFrequency = new Map<string, number>()
    for (const entry of this.queryHistory) {
      queryFrequency.set(entry.query, (queryFrequency.get(entry.query) || 0) + 1)
    }

    // Get top queries
    const topQueries = Array.from(queryFrequency.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }))

    // Get recent queries
    const recentQueries = this.queryHistory
      .slice(-20)
      .reverse()
      .map((entry) => ({
        query: entry.query,
        timestamp: new Date(entry.timestamp).toISOString(),
        results: entry.result_count,
      }))

    return {
      total_queries: totalQueries,
      successful_queries: successfulQueries,
      avg_results_per_query: totalQueries > 0 ? totalResults / totalQueries : 0,
      success_rate: totalQueries > 0 ? successfulQueries / totalQueries : 0,
      avg_response_time: totalQueries > 0 ? totalResponseTime / totalQueries : 0,
      cache_hit_rate: this.calculateCacheHitRate(),
      error_rate: totalQueries > 0 ? (totalQueries - successfulQueries) / totalQueries : 0,
      most_common_query: topQueries.length > 0 ? topQueries[0].query : "",
      top_queries: topQueries,
      recent_queries: recentQueries,
    }
  }

  private calculateCacheHitRate(): number {
    // Simple cache hit rate calculation based on suggestion cache usage
    const totalCacheRequests = this.suggestionCache.size + this.cacheExpiry.size
    const validCacheEntries = Array.from(this.cacheExpiry.keys()).filter((key) => this.isCacheValid(key)).length

    return totalCacheRequests > 0 ? validCacheEntries / totalCacheRequests : 0
  }

  // Advanced query building helpers
  buildComplexQuery(filters: Record<string, string | string[]>): string {
    const parts: string[] = []

    for (const [key, value] of Object.entries(filters)) {
      if (Array.isArray(value)) {
        if (value.length > 1) {
          parts.push(`${key}:${value.join(",")}`)
        } else if (value.length === 1) {
          parts.push(`${key}:${value[0]}`)
        }
      } else if (value) {
        if (value.includes(" ")) {
          parts.push(`${key}:"${value}"`)
        } else {
          parts.push(`${key}:${value}`)
        }
      }
    }

    return parts.join(" ")
  }

  getQueryComplexity(query: string): "simple" | "moderate" | "complex" {
    const filterCount = (query.match(/\w+:/g) || []).length
    const hasLogicalOperators = /\s+(AND|OR|NOT)\s+/i.test(query)
    const hasNegation = query.includes("-")
    const hasWildcards = query.includes("*")

    if (filterCount <= 1 && !hasLogicalOperators && !hasNegation && !hasWildcards) {
      return "simple"
    } else if (filterCount <= 3 && (!hasLogicalOperators || !hasNegation)) {
      return "moderate"
    } else {
      return "complex"
    }
  }

  // Query optimization suggestions
  optimizeQuery(query: string): { optimized: string; suggestions: string[] } {
    const suggestions: string[] = []
    let optimized = query.trim()

    // Remove redundant spaces
    optimized = optimized.replace(/\s+/g, " ")

    // Suggest more specific filters
    if (!optimized.includes("country:") && !optimized.includes("city:")) {
      suggestions.push("Consider adding geographic filters (country: or city:) to narrow results")
    }

    if (!optimized.includes("port:") && !optimized.includes("product:")) {
      suggestions.push("Add port: or product: filters for more targeted results")
    }

    // Suggest vulnerability focus
    if (optimized.includes("apache") || optimized.includes("nginx") || optimized.includes("mysql")) {
      if (!optimized.includes("has_vuln:")) {
        suggestions.push("Add has_vuln:true to focus on vulnerable instances")
      }
    }

    // Suggest screenshot filter for web services
    if (optimized.includes("port:80") || optimized.includes("port:443") || optimized.includes("port:8080")) {
      if (!optimized.includes("has_screenshot:")) {
        suggestions.push("Add has_screenshot:true to see visual interfaces")
      }
    }

    return { optimized, suggestions }
  }

  clearCache(): void {
    this.suggestionCache.clear()
    this.cacheExpiry.clear()
  }

  exportQueryHistory(): string {
    return JSON.stringify(
      {
        exported_at: new Date().toISOString(),
        total_queries: this.queryHistory.length,
        queries: this.queryHistory,
        stats: this.getQueryStats(),
      },
      null,
      2,
    )
  }

  importQueryHistory(data: string): boolean {
    try {
      const parsed = JSON.parse(data)
      if (parsed.queries && Array.isArray(parsed.queries)) {
        this.queryHistory = parsed.queries
        return true
      }
      return false
    } catch (error) {
      console.error("Failed to import query history:", error)
      return false
    }
  }
}

export const predictiveEngine = new PredictiveEngine()
export type { QuerySuggestion, QueryStats }
