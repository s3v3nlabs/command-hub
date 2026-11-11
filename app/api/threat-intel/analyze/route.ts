import { type NextRequest, NextResponse } from "next/server"
import { aggregateThreatIntelligence } from "@/lib/threat-intel/aggregator"
import { recordIdsThreat } from "@/lib/security/ids-status"

const HOSTNAME = /^[a-zA-Z0-9.-]+$/

function isBlockedTarget(t: string): boolean {
  const host = t.trim().toLowerCase().replace(/^\[|\]$/g, "")
  if (host === "localhost" || host === "metadata.google.internal" || host.endsWith(".internal") || host === "0.0.0.0" || host === "::1") return true
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (m) {
    const a = Number(m[1]), b = Number(m[2])
    if (a === 127 || a === 10 || a === 0 || (a === 169 && b === 254) || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31)) return true
    if (a > 255 || b > 255 || Number(m[3]) > 255 || Number(m[4]) > 255) return true
  }
  if (host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80")) return true
  return false
}

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

    if (!HOSTNAME.test(String(target)) || isBlockedTarget(String(target))) {
      recordIdsThreat({
        severity: "high",
        source: "threat-intel-analyze",
        message: `Blocked analysis of internal/invalid target`,
        blocked: true,
      })
      return NextResponse.json(
        { error: "target_blocked", detail: "Loopback, RFC1918, link-local and cloud-metadata targets are not permitted." },
        { status: 400 },
      )
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
