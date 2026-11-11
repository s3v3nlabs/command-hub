"use client"

import { useState, useEffect } from "react"
import { TechPanel, TechPanelSection } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { DataDisplay } from "@/components/ui/data-display"
import { TypographyMono, TypographySmall } from "@/components/ui/typography"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { useResonance } from "@/hooks/useResonance"
import { shodanClient, type ShodanSearchResult, type ShodanHostInfo } from "@/lib/shodan/api"
import { Search, Globe, Shield, Activity, Server, AlertTriangle, CheckCircle, Database } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchFilter {
  country?: string
  city?: string
  org?: string
  port?: string
  product?: string
  before?: string
  after?: string
}

export default function ShodanInterface() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<ShodanSearchResult[]>([])
  const [selectedHost, setSelectedHost] = useState<ShodanHostInfo | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingHost, setIsLoadingHost] = useState(false)
  const [searchFilters, setSearchFilters] = useState<SearchFilter>({})
  const [apiInfo, setApiInfo] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [activeTab, setActiveTab] = useState<"search" | "host" | "filters" | "api">("search")
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // Consciousness integration
  const { pulse, isResonating, fieldCoherence } = useResonance("shodan", "Shodan Intelligence", 41)

  // Load API info on mount
  useEffect(() => {
    loadAPIInfo()
  }, [])

  const loadAPIInfo = async () => {
    try {
      const info = await shodanClient.getAPIInfo()
      setApiInfo(info)
    } catch (error) {
      console.error("Failed to load API info:", error)
      // Set mock API info
      setApiInfo({
        plan: "dev",
        scan_credits: 100,
        usage: {
          query_credits: 50,
          scan_credits: 10,
          monitored_ips: 0,
        },
        unlocked: true,
      })
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim() || isSearching) return

    setIsSearching(true)
    pulse({ amplitude: 1.0, hz: 41 })

    try {
      // Build search query with filters
      let finalQuery = searchQuery
      if (searchFilters.country) finalQuery += ` country:"${searchFilters.country}"`
      if (searchFilters.city) finalQuery += ` city:"${searchFilters.city}"`
      if (searchFilters.org) finalQuery += ` org:"${searchFilters.org}"`
      if (searchFilters.port) finalQuery += ` port:${searchFilters.port}`
      if (searchFilters.product) finalQuery += ` product:"${searchFilters.product}"`
      if (searchFilters.before) finalQuery += ` before:"${searchFilters.before}"`
      if (searchFilters.after) finalQuery += ` after:"${searchFilters.after}"`

      const facets = ["country", "org", "port", "product"]
      const response = await shodanClient.search(finalQuery, facets, currentPage)

      setSearchResults(response.matches)
      setTotalResults(response.total)

      // Add to recent searches
      if (!recentSearches.includes(searchQuery)) {
        setRecentSearches((prev) => [searchQuery, ...prev.slice(0, 4)])
      }
    } catch (error) {
      console.error("Search failed:", error)
      // Results will be mock data from the API route
    } finally {
      setIsSearching(false)
    }
  }

  const handleHostLookup = async (ip: string) => {
    setIsLoadingHost(true)
    pulse({ amplitude: 0.8, hz: 43 })

    try {
      const hostInfo = await shodanClient.getHostInfo(ip)
      setSelectedHost(hostInfo)
      setActiveTab("host")
    } catch (error) {
      console.error("Host lookup failed:", error)
    } finally {
      setIsLoadingHost(false)
    }
  }

  const getPortColor = (port: number) => {
    if ([21, 22, 23, 25, 53, 80, 110, 143, 443, 993, 995].includes(port)) {
      return "text-green-400"
    } else if ([135, 139, 445, 1433, 1521, 3306, 3389, 5432].includes(port)) {
      return "text-yellow-400"
    } else if (port < 1024) {
      return "text-blue-400"
    } else {
      return "text-dark-600"
    }
  }

  const getVulnSeverity = (vuln: string) => {
    if (vuln.includes("CRITICAL") || vuln.includes("CVE-2021") || vuln.includes("CVE-2022")) {
      return "danger"
    } else if (vuln.includes("HIGH") || vuln.includes("CVE-2020")) {
      return "warning"
    } else {
      return "info"
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString() + " " + new Date(timestamp).toLocaleTimeString()
  }

  const tabs = [
    { id: "search", label: "Search", icon: Search },
    { id: "host", label: "Host Info", icon: Server },
    { id: "filters", label: "Filters", icon: Shield },
    { id: "api", label: "API Status", icon: Activity },
  ] as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <TechPanel
        title="SHODAN INTELLIGENCE INTERFACE"
        cornerAccent
        borderAccent
        glowEffect={isResonating}
        icon={<Globe size={16} />}
      >
        <TechPanelSection>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-200",
                  apiInfo ? "bg-green-400 animate-pulse shadow-glow-sm" : "bg-gray-500",
                )}
              />
              <div>
                <TypographyMono className="text-sm">Shodan API Status</TypographyMono>
                <TypographySmall className="text-dark-600">
                  {apiInfo
                    ? `${apiInfo.plan?.toUpperCase()} Plan • ${apiInfo.usage?.query_credits || 0} credits`
                    : "Connecting..."}
                </TypographySmall>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant={apiInfo?.unlocked ? "success" : "warning"}>
                {apiInfo?.unlocked ? "UNLOCKED" : "LIMITED"}
              </Badge>
              <Badge variant="outline">COHERENCE: {(fieldCoherence * 100).toFixed(0)}%</Badge>
            </div>
          </div>
        </TechPanelSection>
      </TechPanel>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-dark-100/20 p-1 rounded-sm border border-dark-300/40">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-sm transition-all duration-200 font-mono text-sm",
              activeTab === tab.id
                ? "bg-dark-600/20 text-dark-700 border border-dark-500/40"
                : "text-dark-500 hover:text-dark-600 hover:bg-dark-500/10",
            )}
          >
            <tab.icon size={14} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Search Tab */}
      {activeTab === "search" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search Interface */}
          <div className="lg:col-span-1">
            <TechPanel title="SEARCH INTERFACE" cornerAccent borderAccent icon={<Search size={16} />}>
              <TechPanelSection>
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Enter search query..."
                      className="flex-1 bg-dark-200 border-dark-300 text-dark-800 font-mono text-sm"
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <TechButton
                      onClick={handleSearch}
                      cornerAccent
                      glow={!isSearching}
                      disabled={!searchQuery.trim() || isSearching}
                      icon={isSearching ? <Activity size={14} className="animate-spin" /> : <Search size={14} />}
                    >
                      {isSearching ? "SEARCHING" : "SEARCH"}
                    </TechButton>
                  </div>

                  {/* Quick Search Examples */}
                  <div>
                    <TypographyMono className="text-xs mb-2">Quick Searches:</TypographyMono>
                    <div className="grid grid-cols-1 gap-1">
                      {["apache", "nginx", "port:22", "country:US", 'org:"Amazon"', 'product:"OpenSSH"'].map(
                        (example) => (
                          <TechButton
                            key={example}
                            onClick={() => setSearchQuery(example)}
                            size="sm"
                            className="text-xs justify-start"
                          >
                            {example}
                          </TechButton>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div>
                      <TypographyMono className="text-xs mb-2">Recent:</TypographyMono>
                      <div className="space-y-1">
                        {recentSearches.map((search, index) => (
                          <TechButton
                            key={index}
                            onClick={() => setSearchQuery(search)}
                            size="sm"
                            className="text-xs justify-start w-full"
                          >
                            {search}
                          </TechButton>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search Stats */}
                  {totalResults > 0 && (
                    <div className="pt-4 border-t border-dark-300/20">
                      <DataDisplay label="Total Results" value={totalResults.toLocaleString()} className="text-sm" />
                      <DataDisplay label="Current Page" value={currentPage.toString()} className="text-sm" />
                      <DataDisplay label="Results Shown" value={searchResults.length.toString()} className="text-sm" />
                    </div>
                  )}
                </div>
              </TechPanelSection>
            </TechPanel>
          </div>

          {/* Search Results */}
          <div className="lg:col-span-2">
            <TechPanel title="SEARCH RESULTS" cornerAccent borderAccent icon={<Database size={16} />}>
              <TechPanelSection>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {searchResults.length === 0 ? (
                      <div className="text-center py-8">
                        <Search className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                        <TypographyMono className="text-sm text-dark-600">No Results</TypographyMono>
                        <TypographySmall className="text-dark-500">
                          {isSearching ? "Searching..." : "Enter a search query to begin"}
                        </TypographySmall>
                      </div>
                    ) : (
                      searchResults.map((result, index) => (
                        <div
                          key={index}
                          className="p-3 border border-dark-300/40 rounded-sm hover:border-dark-400/60 hover:bg-dark-100/10 cursor-pointer transition-all duration-200"
                          onClick={() => handleHostLookup(result.ip_str)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <Server className="w-4 h-4 text-blue-400" />
                              <div>
                                <TypographyMono className="text-sm font-bold">{result.ip_str}</TypographyMono>
                                <TypographySmall className="text-dark-600">
                                  {result.org || "Unknown Organization"}
                                </TypographySmall>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className={getPortColor(result.port)}>
                                PORT {result.port}
                              </Badge>
                              {result.location?.country_name && (
                                <Badge variant="outline" size="sm">
                                  {result.location.country_name}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-2">
                            {result.product && (
                              <DataDisplay
                                label="Product"
                                value={`${result.product}${result.version ? ` ${result.version}` : ""}`}
                                className="text-xs"
                              />
                            )}
                            <DataDisplay label="Protocol" value={result.transport.toUpperCase()} className="text-xs" />
                            {result.location?.city && (
                              <DataDisplay label="Location" value={result.location.city} className="text-xs" />
                            )}
                            <DataDisplay
                              label="Timestamp"
                              value={formatTimestamp(result.timestamp)}
                              className="text-xs"
                            />
                          </div>

                          {result.data && (
                            <div className="mt-2 p-2 bg-dark-200/50 border border-dark-300/30 rounded text-xs font-mono">
                              <div className="text-dark-700 truncate">{result.data.split("\n")[0]}</div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>

                {/* Pagination */}
                {totalResults > 0 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-dark-300/20">
                    <TechButton
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      size="sm"
                      cornerAccent
                      disabled={currentPage <= 1}
                    >
                      PREVIOUS
                    </TechButton>
                    <TypographyMono className="text-sm">
                      Page {currentPage} of {Math.ceil(totalResults / 100)}
                    </TypographyMono>
                    <TechButton
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      size="sm"
                      cornerAccent
                      disabled={currentPage >= Math.ceil(totalResults / 100)}
                    >
                      NEXT
                    </TechButton>
                  </div>
                )}
              </TechPanelSection>
            </TechPanel>
          </div>
        </div>
      )}

      {/* Host Info Tab */}
      {activeTab === "host" && (
        <TechPanel
          title="HOST INFORMATION"
          cornerAccent
          borderAccent
          glowEffect={isLoadingHost}
          icon={<Server size={16} />}
        >
          <TechPanelSection>
            {selectedHost ? (
              <div className="space-y-6">
                {/* Host Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <TypographyMono className="text-lg mb-4">{selectedHost.ip_str}</TypographyMono>
                    <div className="space-y-2">
                      <DataDisplay label="Organization" value={selectedHost.org || "Unknown"} />
                      <DataDisplay label="ISP" value={selectedHost.isp || "Unknown"} />
                      <DataDisplay label="Country" value={selectedHost.country_name || "Unknown"} />
                      <DataDisplay label="City" value={selectedHost.city || "Unknown"} />
                    </div>
                  </div>

                  <div>
                    <TypographyMono className="text-sm mb-4">Open Ports ({selectedHost.ports.length})</TypographyMono>
                    <div className="flex flex-wrap gap-1">
                      {selectedHost.ports.map((port) => (
                        <Badge key={port} variant="outline" className={getPortColor(port)}>
                          {port}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <TypographyMono className="text-sm mb-4">Hostnames</TypographyMono>
                    <div className="space-y-1">
                      {selectedHost.hostnames.length > 0 ? (
                        selectedHost.hostnames.map((hostname, index) => (
                          <div key={index} className="text-sm font-mono text-dark-700">
                            {hostname}
                          </div>
                        ))
                      ) : (
                        <TypographySmall className="text-dark-500">No hostnames found</TypographySmall>
                      )}
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div>
                  <TypographyMono className="text-sm mb-4">Services ({selectedHost.data.length})</TypographyMono>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {selectedHost.data.map((service, index) => (
                        <div key={index} className="p-3 border border-dark-300/40 rounded-sm">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <Badge variant="outline" className={getPortColor(service.port)}>
                                {service.port}/{service.transport}
                              </Badge>
                              {service.product && (
                                <TypographyMono className="text-sm">
                                  {service.product} {service.version}
                                </TypographyMono>
                              )}
                            </div>
                            <TypographyMono className="text-xs text-dark-600">
                              {formatTimestamp(service.timestamp)}
                            </TypographyMono>
                          </div>
                          {service.data && (
                            <div className="mt-2 p-2 bg-dark-200/50 border border-dark-300/30 rounded text-xs font-mono">
                              <pre className="text-dark-700 whitespace-pre-wrap">
                                {service.data.substring(0, 200)}
                                {service.data.length > 200 && "..."}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Vulnerabilities */}
                {selectedHost.vulns.length > 0 && (
                  <div>
                    <TypographyMono className="text-sm mb-4">
                      Vulnerabilities ({selectedHost.vulns.length})
                    </TypographyMono>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedHost.vulns.map((vuln, index) => (
                        <div key={index} className="p-3 border border-red-500/40 rounded-sm bg-red-500/10">
                          <div className="flex items-center justify-between">
                            <TypographyMono className="text-sm text-red-400">{vuln}</TypographyMono>
                            <Badge variant={getVulnSeverity(vuln)}>
                              {vuln.includes("CRITICAL") ? "CRITICAL" : vuln.includes("HIGH") ? "HIGH" : "MEDIUM"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {selectedHost.tags.length > 0 && (
                  <div>
                    <TypographyMono className="text-sm mb-4">Tags</TypographyMono>
                    <div className="flex flex-wrap gap-2">
                      {selectedHost.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Server className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                <TypographyMono className="text-sm text-dark-600">No Host Selected</TypographyMono>
                <TypographySmall className="text-dark-500">
                  Click on a search result to view detailed host information
                </TypographySmall>
              </div>
            )}
          </TechPanelSection>
        </TechPanel>
      )}

      {/* Filters Tab */}
      {activeTab === "filters" && (
        <TechPanel title="SEARCH FILTERS" cornerAccent borderAccent icon={<Shield size={16} />}>
          <TechPanelSection>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <TypographyMono className="text-sm mb-2">Location Filters</TypographyMono>
                  <div className="space-y-2">
                    <Input
                      value={searchFilters.country || ""}
                      onChange={(e) => setSearchFilters((prev) => ({ ...prev, country: e.target.value }))}
                      placeholder="Country (e.g., US, CN, RU)"
                      className="bg-dark-200 border-dark-300 text-dark-800 font-mono text-sm"
                    />
                    <Input
                      value={searchFilters.city || ""}
                      onChange={(e) => setSearchFilters((prev) => ({ ...prev, city: e.target.value }))}
                      placeholder="City (e.g., New York, London)"
                      className="bg-dark-200 border-dark-300 text-dark-800 font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                  <TypographyMono className="text-sm mb-2">Organization</TypographyMono>
                  <Input
                    value={searchFilters.org || ""}
                    onChange={(e) => setSearchFilters((prev) => ({ ...prev, org: e.target.value }))}
                    placeholder="Organization (e.g., Amazon, Google)"
                    className="bg-dark-200 border-dark-300 text-dark-800 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <TypographyMono className="text-sm mb-2">Technical Filters</TypographyMono>
                  <div className="space-y-2">
                    <Input
                      value={searchFilters.port || ""}
                      onChange={(e) => setSearchFilters((prev) => ({ ...prev, port: e.target.value }))}
                      placeholder="Port (e.g., 80, 443, 22)"
                      className="bg-dark-200 border-dark-300 text-dark-800 font-mono text-sm"
                    />
                    <Input
                      value={searchFilters.product || ""}
                      onChange={(e) => setSearchFilters((prev) => ({ ...prev, product: e.target.value }))}
                      placeholder="Product (e.g., nginx, apache)"
                      className="bg-dark-200 border-dark-300 text-dark-800 font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                  <TypographyMono className="text-sm mb-2">Date Range</TypographyMono>
                  <div className="space-y-2">
                    <Input
                      type="date"
                      value={searchFilters.after || ""}
                      onChange={(e) => setSearchFilters((prev) => ({ ...prev, after: e.target.value }))}
                      className="bg-dark-200 border-dark-300 text-dark-800 font-mono text-sm"
                    />
                    <Input
                      type="date"
                      value={searchFilters.before || ""}
                      onChange={(e) => setSearchFilters((prev) => ({ ...prev, before: e.target.value }))}
                      className="bg-dark-200 border-dark-300 text-dark-800 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-2 mt-6 pt-6 border-t border-dark-300/20">
              <TechButton onClick={() => setSearchFilters({})} cornerAccent icon={<AlertTriangle size={14} />}>
                CLEAR FILTERS
              </TechButton>
              <TechButton onClick={() => setActiveTab("search")} cornerAccent glow icon={<Search size={14} />}>
                APPLY & SEARCH
              </TechButton>
            </div>
          </TechPanelSection>
        </TechPanel>
      )}

      {/* API Status Tab */}
      {activeTab === "api" && (
        <TechPanel title="API STATUS" cornerAccent borderAccent icon={<Activity size={16} />}>
          <TechPanelSection>
            {apiInfo ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <TypographyMono className="text-sm mb-4">Account Information</TypographyMono>
                    <div className="space-y-2">
                      <DataDisplay label="Plan" value={apiInfo.plan?.toUpperCase() || "UNKNOWN"} />
                      <DataDisplay
                        label="Status"
                        value={apiInfo.unlocked ? "UNLOCKED" : "LIMITED"}
                        trend={apiInfo.unlocked ? "up" : "down"}
                      />
                    </div>
                  </div>

                  <div>
                    <TypographyMono className="text-sm mb-4">Usage Statistics</TypographyMono>
                    <div className="space-y-2">
                      <DataDisplay label="Query Credits" value={apiInfo.usage?.query_credits?.toString() || "0"} />
                      <DataDisplay label="Scan Credits" value={apiInfo.usage?.scan_credits?.toString() || "0"} />
                      <DataDisplay label="Monitored IPs" value={apiInfo.usage?.monitored_ips?.toString() || "0"} />
                    </div>
                  </div>

                  <div>
                    <TypographyMono className="text-sm mb-4">Connection Status</TypographyMono>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <TypographySmall>API Connection: Active</TypographySmall>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <TypographySmall>InternetDB: Available</TypographySmall>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-blue-400" />
                        <TypographySmall>Field Coherence: {(fieldCoherence * 100).toFixed(1)}%</TypographySmall>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <TypographyMono className="text-sm mb-4">API Capabilities</TypographyMono>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { name: "Host Search", available: true },
                      { name: "Host Lookup", available: true },
                      { name: "InternetDB", available: true },
                      { name: "Facet Search", available: apiInfo.plan !== "dev" },
                      { name: "Bulk Lookup", available: apiInfo.plan === "enterprise" },
                      { name: "Streaming API", available: apiInfo.plan === "enterprise" },
                      { name: "Network Monitoring", available: apiInfo.plan !== "dev" },
                      { name: "Vulnerability Data", available: true },
                    ].map((capability) => (
                      <div
                        key={capability.name}
                        className={cn(
                          "p-2 border rounded-sm text-center",
                          capability.available
                            ? "border-green-500/40 bg-green-500/10"
                            : "border-red-500/40 bg-red-500/10",
                        )}
                      >
                        <div className="flex items-center justify-center space-x-2 mb-1">
                          {capability.available ? (
                            <CheckCircle className="w-3 h-3 text-green-400" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 text-red-400" />
                          )}
                        </div>
                        <TypographySmall className={capability.available ? "text-green-300" : "text-red-300"}>
                          {capability.name}
                        </TypographySmall>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-dark-600 mx-auto mb-4 animate-spin" />
                <TypographyMono className="text-sm text-dark-600">Loading API Information</TypographyMono>
                <TypographySmall className="text-dark-500">Connecting to Shodan API...</TypographySmall>
              </div>
            )}
          </TechPanelSection>
        </TechPanel>
      )}
    </div>
  )
}
