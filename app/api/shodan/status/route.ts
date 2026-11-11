import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.SHODAN_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Shodan API key not configured" }, { status: 500 })
    }

    const response = await fetch(`https://api.shodan.io/api-info?key=${apiKey}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Shodan API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Shodan API info error:", error)

    // Return mock data on error
    const mockData = {
      plan: "dev",
      scan_credits: 100,
      usage: {
        query_credits: 50,
        scan_credits: 10,
        monitored_ips: 0,
      },
      unlocked: true,
    }

    return NextResponse.json(mockData)
  }
}
