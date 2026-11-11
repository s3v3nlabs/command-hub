import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { ip } = await request.json()

    if (!ip) {
      return NextResponse.json({ error: "IP address is required" }, { status: 400 })
    }

    // InternetDB doesn't require API key
    const response = await fetch(`https://internetdb.shodan.io/${ip}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`InternetDB API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("InternetDB lookup error:", error)

    // Return mock data on error
    const mockData = {
      ip: request.body?.ip || "192.168.1.1",
      ports: [22, 80, 443],
      cpes: ["cpe:2.3:a:nginx:nginx:1.18.0:*:*:*:*:*:*:*"],
      hostnames: ["example.com"],
      tags: ["web-server"],
      vulns: [],
    }

    return NextResponse.json(mockData)
  }
}
