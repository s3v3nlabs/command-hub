import { type NextRequest, NextResponse } from "next/server"
import { aggregateThreatIntelligence } from "@/lib/threat-intel/aggregator"

export async function POST(request: NextRequest) {
  try {
    const { target } = await request.json()

    if (!target) {
      return NextResponse.json({ error: "Target parameter is required" }, { status: 400 })
    }

    // Validate target format (IP or domain)
    const isValidIP = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(target)
    const isValidDomain = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(target)

    if (!isValidIP && !isValidDomain) {
      return NextResponse.json({ error: "Target must be a valid IP address or domain name" }, { status: 400 })
    }

    console.log(`Analyzing target: ${target}`)
    const result = await aggregateThreatIntelligence(target)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Threat intelligence analysis error:", error)
    return NextResponse.json({ error: "Internal server error during analysis" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Threat Intelligence API",
    endpoints: {
      analyze: "POST /api/threat-intel/analyze",
      body: { target: "IP address or domain name" },
    },
    sources: ["VirusTotal", "AbuseIPDB", "GreyNoise", "AlienVault OTX", "Censys", "ThreatCrowd"],
  })
}
