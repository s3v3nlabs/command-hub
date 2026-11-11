interface PortCluster {
  port: number
  count: number
  services: string[]
  countries: string[]
  organizations: string[]
  vulnerability_count: number
  risk_score: number
}

interface HeatmapData {
  type: "port-country" | "service-country" | "vuln-country" | "org-country"
  data: Array<{
    x: string
    y: string
    value: number
    label: string
  }>
  metadata: {
    max_value: number
    min_value: number
    total_entries: number
  }
}

interface NetworkNode {
  id: string
  type: "ip" | "country" | "organization" | "service" | "port"
  label: string
  size: number
  color: string
  metadata: Record<string, any>
}

interface NetworkEdge {
  source: string
  target: string
  weight: number
  type: string
  label?: string
}

interface NetworkTopology {
  nodes: NetworkNode[]
  edges: NetworkEdge[]
  clusters: Array<{
    id: string
    nodes: string[]
    type: string
    strength: number
  }>
}

interface GeoDistribution {
  country: string
  country_code: string
  count: number
  latitude: number
  longitude: number
  top_ports: number[]
  top_services: string[]
  vulnerability_density: number
  risk_level: "low" | "medium" | "high"
}

class VisualizationEngine {
  generatePortClusterData(shodanResults: any[]): PortCluster[] {
    const portMap = new Map<
      number,
      {
        count: number
        services: Set<string>
        countries: Set<string>
        organizations: Set<string>
        vulnerabilities: Set<string>
      }
    >()

    // Aggregate data by port
    for (const result of shodanResults) {
      const port = result.port
      if (!port) continue

      if (!portMap.has(port)) {
        portMap.set(port, {
          count: 0,
          services: new Set(),
          countries: new Set(),
          organizations: new Set(),
          vulnerabilities: new Set(),
        })
      }

      const portData = portMap.get(port)!
      portData.count++

      if (result.product) portData.services.add(result.product)
      if (result.country_name) portData.countries.add(result.country_name)
      if (result.org) portData.organizations.add(result.org)
      if (result.vulns) {
        for (const vuln of result.vulns) {
          portData.vulnerabilities.add(vuln)
        }
      }
    }

    // Convert to cluster format
    const clusters: PortCluster[] = []
    for (const [port, data] of portMap.entries()) {
      const riskScore = this.calculatePortRiskScore(port, data.vulnerabilities.size, data.services)

      clusters.push({
        port,
        count: data.count,
        services: Array.from(data.services).slice(0, 5), // Top 5 services
        countries: Array.from(data.countries).slice(0, 5), // Top 5 countries
        organizations: Array.from(data.organizations).slice(0, 5), // Top 5 orgs
        vulnerability_count: data.vulnerabilities.size,
        risk_score: riskScore,
      })
    }

    return clusters.sort((a, b) => b.count - a.count)
  }

  generateHeatmapData(shodanResults: any[], type: HeatmapData["type"]): HeatmapData {
    const dataMap = new Map<string, Map<string, number>>()
    let maxValue = 0
    let minValue = Number.POSITIVE_INFINITY

    for (const result of shodanResults) {
      let xValue: string
      let yValue: string

      switch (type) {
        case "port-country":
          xValue = result.port?.toString() || "Unknown"
          yValue = result.country_name || "Unknown"
          break
        case "service-country":
          xValue = result.product || "Unknown"
          yValue = result.country_name || "Unknown"
          break
        case "vuln-country":
          xValue = result.vulns?.[0] || "No Vulns"
          yValue = result.country_name || "Unknown"
          break
        case "org-country":
          xValue = result.org || "Unknown"
          yValue = result.country_name || "Unknown"
          break
        default:
          continue
      }

      if (!dataMap.has(xValue)) {
        dataMap.set(xValue, new Map())
      }

      const xMap = dataMap.get(xValue)!
      const currentValue = xMap.get(yValue) || 0
      const newValue = currentValue + 1

      xMap.set(yValue, newValue)
      maxValue = Math.max(maxValue, newValue)
      minValue = Math.min(minValue, newValue)
    }

    // Convert to heatmap format
    const data: HeatmapData["data"] = []
    for (const [x, yMap] of dataMap.entries()) {
      for (const [y, value] of yMap.entries()) {
        data.push({
          x,
          y,
          value,
          label: `${x} in ${y}: ${value}`,
        })
      }
    }

    return {
      type,
      data: data.sort((a, b) => b.value - a.value).slice(0, 100), // Top 100 entries
      metadata: {
        max_value: maxValue,
        min_value: minValue === Number.POSITIVE_INFINITY ? 0 : minValue,
        total_entries: data.length,
      },
    }
  }

  generateNetworkTopology(shodanResults: any[]): NetworkTopology {
    const nodes = new Map<string, NetworkNode>()
    const edges: NetworkEdge[] = []
    const edgeWeights = new Map<string, number>()

    // Create nodes and track relationships
    for (const result of shodanResults) {
      const ip = result.ip_str
      const country = result.country_name || "Unknown"
      const org = result.org || "Unknown"
      const service = result.product || "Unknown"
      const port = result.port?.toString() || "Unknown"

      // Create IP node
      if (!nodes.has(ip)) {
        nodes.set(ip, {
          id: ip,
          type: "ip",
          label: ip,
          size: 1,
          color: this.getNodeColor("ip"),
          metadata: { vulnerabilities: result.vulns?.length || 0 },
        })
      }

      // Create country node
      const countryId = `country_${country}`
      if (!nodes.has(countryId)) {
        nodes.set(countryId, {
          id: countryId,
          type: "country",
          label: country,
          size: 1,
          color: this.getNodeColor("country"),
          metadata: { type: "geographic" },
        })
      }

      // Create organization node
      const orgId = `org_${org}`
      if (!nodes.has(orgId)) {
        nodes.set(orgId, {
          id: orgId,
          type: "organization",
          label: org,
          size: 1,
          color: this.getNodeColor("organization"),
          metadata: { type: "entity" },
        })
      }

      // Create service node
      const serviceId = `service_${service}`
      if (!nodes.has(serviceId)) {
        nodes.set(serviceId, {
          id: serviceId,
          type: "service",
          label: service,
          size: 1,
          color: this.getNodeColor("service"),
          metadata: { type: "software" },
        })
      }

      // Create port node
      const portId = `port_${port}`
      if (!nodes.has(portId)) {
        nodes.set(portId, {
          id: portId,
          type: "port",
          label: `Port ${port}`,
          size: 1,
          color: this.getNodeColor("port"),
          metadata: { port_number: Number.parseInt(port) || 0 },
        })
      }

      // Create edges and track weights
      const relationships = [
        [ip, countryId, "located_in"],
        [ip, orgId, "belongs_to"],
        [ip, serviceId, "runs"],
        [ip, portId, "listens_on"],
        [serviceId, portId, "uses"],
      ]

      for (const [source, target, type] of relationships) {
        const edgeKey = `${source}-${target}`
        const weight = edgeWeights.get(edgeKey) || 0
        edgeWeights.set(edgeKey, weight + 1)

        // Update edge if it exists, otherwise create new one
        const existingEdge = edges.find((e) => e.source === source && e.target === target)
        if (existingEdge) {
          existingEdge.weight = weight + 1
        } else {
          edges.push({
            source,
            target,
            weight: 1,
            type,
            label: type.replace(/_/g, " "),
          })
        }
      }

      // Update node sizes based on connections
      nodes.get(ip)!.size++
      nodes.get(countryId)!.size++
      nodes.get(orgId)!.size++
      nodes.get(serviceId)!.size++
      nodes.get(portId)!.size++
    }

    // Generate clusters
    const clusters = this.generateNetworkClusters(Array.from(nodes.values()), edges)

    return {
      nodes: Array.from(nodes.values()),
      edges: edges.sort((a, b) => b.weight - a.weight).slice(0, 200), // Top 200 edges
      clusters,
    }
  }

  generateGeoDistribution(shodanResults: any[]): GeoDistribution[] {
    const countryMap = new Map<
      string,
      {
        count: number
        ports: Map<number, number>
        services: Map<string, number>
        vulnerabilities: number
        coordinates: { lat: number; lon: number }
      }
    >()

    // Aggregate data by country
    for (const result of shodanResults) {
      const country = result.country_name || "Unknown"
      const countryCode = result.country_code || "XX"

      if (!countryMap.has(country)) {
        countryMap.set(country, {
          count: 0,
          ports: new Map(),
          services: new Map(),
          vulnerabilities: 0,
          coordinates: {
            lat: result.latitude || 0,
            lon: result.longitude || 0,
          },
        })
      }

      const countryData = countryMap.get(country)!
      countryData.count++

      if (result.port) {
        const portCount = countryData.ports.get(result.port) || 0
        countryData.ports.set(result.port, portCount + 1)
      }

      if (result.product) {
        const serviceCount = countryData.services.get(result.product) || 0
        countryData.services.set(result.product, serviceCount + 1)
      }

      if (result.vulns) {
        countryData.vulnerabilities += result.vulns.length
      }
    }

    // Convert to distribution format
    const distributions: GeoDistribution[] = []
    for (const [country, data] of countryMap.entries()) {
      const topPorts = Array.from(data.ports.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([port]) => port)

      const topServices = Array.from(data.services.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([service]) => service)

      const vulnerabilityDensity = data.count > 0 ? data.vulnerabilities / data.count : 0
      const riskLevel = this.calculateCountryRiskLevel(vulnerabilityDensity, topPorts, topServices)

      distributions.push({
        country,
        country_code: this.getCountryCode(country),
        count: data.count,
        latitude: data.coordinates.lat,
        longitude: data.coordinates.lon,
        top_ports: topPorts,
        top_services: topServices,
        vulnerability_density: vulnerabilityDensity,
        risk_level: riskLevel,
      })
    }

    return distributions.sort((a, b) => b.count - a.count)
  }

  // Helper methods
  private calculatePortRiskScore(port: number, vulnCount: number, services: Set<string>): number {
    let riskScore = 0

    // Base risk by port number
    const highRiskPorts = [21, 23, 135, 139, 445, 1433, 3306, 5432]
    const mediumRiskPorts = [22, 25, 53, 110, 143, 993, 995]

    if (highRiskPorts.includes(port)) {
      riskScore += 0.4
    } else if (mediumRiskPorts.includes(port)) {
      riskScore += 0.2
    } else if (port < 1024) {
      riskScore += 0.1 // Well-known ports have some inherent risk
    }

    // Risk from vulnerabilities
    riskScore += Math.min(vulnCount * 0.1, 0.4)

    // Risk from service types
    const riskyServices = ["ftp", "telnet", "mysql", "postgresql", "mssql", "mongodb", "redis"]
    for (const service of services) {
      if (riskyServices.some((risky) => service.toLowerCase().includes(risky))) {
        riskScore += 0.1
      }
    }

    return Math.min(riskScore, 1.0)
  }

  private calculateCountryRiskLevel(
    vulnDensity: number,
    topPorts: number[],
    topServices: string[],
  ): "low" | "medium" | "high" {
    let riskScore = 0

    // Risk from vulnerability density
    if (vulnDensity > 2) riskScore += 0.4
    else if (vulnDensity > 1) riskScore += 0.2
    else if (vulnDensity > 0.5) riskScore += 0.1

    // Risk from exposed ports
    const highRiskPorts = [21, 23, 135, 139, 445, 1433, 3306, 5432]
    const riskyPortCount = topPorts.filter((port) => highRiskPorts.includes(port)).length
    riskScore += riskyPortCount * 0.1

    // Risk from services
    const riskyServices = ["ftp", "telnet", "mysql", "postgresql", "mssql"]
    const riskyServiceCount = topServices.filter((service) =>
      riskyServices.some((risky) => service.toLowerCase().includes(risky)),
    ).length
    riskScore += riskyServiceCount * 0.1

    if (riskScore >= 0.6) return "high"
    if (riskScore >= 0.3) return "medium"
    return "low"
  }

  private getNodeColor(type: string): string {
    const colors = {
      ip: "#3b82f6", // Blue
      country: "#10b981", // Green
      organization: "#f59e0b", // Amber
      service: "#8b5cf6", // Purple
      port: "#ef4444", // Red
    }
    return colors[type as keyof typeof colors] || "#6b7280"
  }

  private getCountryCode(countryName: string): string {
    const countryCodes: Record<string, string> = {
      "United States": "US",
      China: "CN",
      Russia: "RU",
      Germany: "DE",
      "United Kingdom": "GB",
      France: "FR",
      Japan: "JP",
      "South Korea": "KR",
      India: "IN",
      Brazil: "BR",
      Canada: "CA",
      Australia: "AU",
      Netherlands: "NL",
      Italy: "IT",
      Spain: "ES",
      Poland: "PL",
      Ukraine: "UA",
      Turkey: "TR",
      Iran: "IR",
      Unknown: "XX",
    }
    return countryCodes[countryName] || "XX"
  }

  private generateNetworkClusters(
    nodes: NetworkNode[],
    edges: NetworkEdge[],
  ): Array<{
    id: string
    nodes: string[]
    type: string
    strength: number
  }> {
    const clusters: Array<{
      id: string
      nodes: string[]
      type: string
      strength: number
    }> = []

    // Group nodes by type
    const nodesByType = new Map<string, NetworkNode[]>()
    for (const node of nodes) {
      if (!nodesByType.has(node.type)) {
        nodesByType.set(node.type, [])
      }
      nodesByType.get(node.type)!.push(node)
    }

    // Create clusters for each type
    for (const [type, typeNodes] of nodesByType.entries()) {
      if (typeNodes.length >= 3) {
        // Only create clusters with 3+ nodes
        // Calculate cluster strength based on internal connections
        const nodeIds = new Set(typeNodes.map((n) => n.id))
        const internalEdges = edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
        const strength = internalEdges.reduce((sum, e) => sum + e.weight, 0) / typeNodes.length

        clusters.push({
          id: `cluster_${type}`,
          nodes: typeNodes.map((n) => n.id),
          type,
          strength,
        })
      }
    }

    // Create geographic clusters
    const countryNodes = nodes.filter((n) => n.type === "country")
    if (countryNodes.length >= 2) {
      clusters.push({
        id: "cluster_geographic",
        nodes: countryNodes.map((n) => n.id),
        type: "geographic",
        strength: 0.8,
      })
    }

    // Create service clusters
    const serviceNodes = nodes.filter((n) => n.type === "service")
    if (serviceNodes.length >= 2) {
      clusters.push({
        id: "cluster_services",
        nodes: serviceNodes.map((n) => n.id),
        type: "services",
        strength: 0.7,
      })
    }

    return clusters.sort((a, b) => b.strength - a.strength)
  }

  // Export functionality
  exportVisualizationData(shodanResults: any[]): string {
    const data = {
      exported_at: new Date().toISOString(),
      total_results: shodanResults.length,
      port_clusters: this.generatePortClusterData(shodanResults),
      heatmap_port_country: this.generateHeatmapData(shodanResults, "port-country"),
      heatmap_service_country: this.generateHeatmapData(shodanResults, "service-country"),
      network_topology: this.generateNetworkTopology(shodanResults),
      geo_distribution: this.generateGeoDistribution(shodanResults),
    }

    return JSON.stringify(data, null, 2)
  }

  // Advanced analysis methods
  generateThreatLandscape(shodanResults: any[]): {
    threat_score: number
    risk_factors: string[]
    recommendations: string[]
    critical_findings: Array<{
      type: string
      description: string
      severity: "low" | "medium" | "high" | "critical"
      affected_hosts: number
    }>
  } {
    let threatScore = 0
    const riskFactors: string[] = []
    const recommendations: string[] = []
    const criticalFindings: Array<{
      type: string
      description: string
      severity: "low" | "medium" | "high" | "critical"
      affected_hosts: number
    }> = []

    // Analyze vulnerabilities
    const vulnHosts = shodanResults.filter((r) => r.vulns && r.vulns.length > 0)
    if (vulnHosts.length > 0) {
      const vulnPercentage = (vulnHosts.length / shodanResults.length) * 100
      threatScore += vulnPercentage * 0.01
      riskFactors.push(`${vulnPercentage.toFixed(1)}% of hosts have known vulnerabilities`)

      if (vulnPercentage > 50) {
        criticalFindings.push({
          type: "High Vulnerability Rate",
          description: `${vulnPercentage.toFixed(1)}% of discovered hosts have known vulnerabilities`,
          severity: "critical",
          affected_hosts: vulnHosts.length,
        })
        recommendations.push("Implement immediate vulnerability patching program")
      }
    }

    // Analyze exposed services
    const riskyServices = ["ftp", "telnet", "mysql", "postgresql", "mongodb", "redis"]
    const exposedRiskyServices = shodanResults.filter(
      (r) => r.product && riskyServices.some((risky) => r.product.toLowerCase().includes(risky)),
    )

    if (exposedRiskyServices.length > 0) {
      threatScore += (exposedRiskyServices.length / shodanResults.length) * 0.3
      riskFactors.push(`${exposedRiskyServices.length} hosts running high-risk services`)

      if (exposedRiskyServices.length > shodanResults.length * 0.1) {
        criticalFindings.push({
          type: "Exposed High-Risk Services",
          description: `${exposedRiskyServices.length} hosts running potentially dangerous services`,
          severity: "high",
          affected_hosts: exposedRiskyServices.length,
        })
        recommendations.push("Review and secure exposed database and legacy services")
      }
    }

    // Analyze geographic distribution
    const countries = new Set(shodanResults.map((r) => r.country_name).filter(Boolean))
    const highRiskCountries = ["CN", "RU", "KP", "IR"]
    const hostsInHighRiskCountries = shodanResults.filter((r) => highRiskCountries.includes(r.country_code))

    if (hostsInHighRiskCountries.length > 0) {
      threatScore += (hostsInHighRiskCountries.length / shodanResults.length) * 0.2
      riskFactors.push(`${hostsInHighRiskCountries.length} hosts in high-risk geographic regions`)
    }

    // Normalize threat score
    threatScore = Math.min(threatScore, 1.0) * 100

    return {
      threat_score: Math.round(threatScore),
      risk_factors: riskFactors,
      recommendations: recommendations,
      critical_findings: criticalFindings,
    }
  }
}

export const visualization = new VisualizationEngine()
export type { PortCluster, HeatmapData, NetworkTopology, GeoDistribution, NetworkNode, NetworkEdge }
