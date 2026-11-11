"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

interface ThreatResult {
  source: string
  status: "clean" | "suspicious" | "malicious" | "unknown"
  score?: number
  details?: string
}

export function ThreatIntelPanel() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ThreatResult[]>([])

  const runScan = async () => {
    if (!query) return
    setLoading(true)

    // Simulate threat intel lookup
    await new Promise((r) => setTimeout(r, 1500))

    setResults([
      { source: "VirusTotal", status: "clean", score: 0, details: "0/94 detections" },
      { source: "AbuseIPDB", status: "clean", score: 0, details: "Confidence: 0%" },
      { source: "GreyNoise", status: "unknown", details: "Not observed" },
      { source: "OTX", status: "clean", details: "No pulses found" },
      { source: "Censys", status: "clean", details: "Standard services" },
    ])

    setLoading(false)
  }

  const getStatusIcon = (status: ThreatResult["status"]) => {
    switch (status) {
      case "clean":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />
      case "suspicious":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />
      case "malicious":
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Shield className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: ThreatResult["status"]) => {
    switch (status) {
      case "clean":
        return <Badge className="bg-emerald-600">CLEAN</Badge>
      case "suspicious":
        return <Badge className="bg-amber-600">SUSPICIOUS</Badge>
      case "malicious":
        return <Badge className="bg-red-600">MALICIOUS</Badge>
      default:
        return <Badge variant="outline">UNKNOWN</Badge>
    }
  }

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-mono text-gray-400">THREAT INTELLIGENCE LOOKUP</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter IP, domain, or hash..."
            className="bg-gray-800 border-gray-700 text-gray-200 font-mono"
            onKeyDown={(e) => e.key === "Enter" && runScan()}
          />
          <Button onClick={runScan} disabled={loading || !query} className="bg-cyan-600 hover:bg-cyan-700">
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((result, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded border border-gray-700"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <div className="text-sm font-mono text-gray-200">{result.source}</div>
                    <div className="text-xs text-gray-500">{result.details}</div>
                  </div>
                </div>
                {getStatusBadge(result.status)}
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-gray-600 font-mono">
          Sources: VirusTotal • AbuseIPDB • GreyNoise • OTX • Censys
        </div>
      </CardContent>
    </Card>
  )
}
