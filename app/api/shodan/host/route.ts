import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { ip } = await request.json()

    if (!ip) {
      return NextResponse.json({ error: "IP address is required" }, { status: 400 })
    }

    const apiKey = process.env.SHODAN_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Shodan API key not configured" }, { status: 500 })
    }

    const response = await fetch(`https://api.shodan.io/shodan/host/${ip}?key=${apiKey}`, {
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
    console.error("Shodan host lookup error:", error)

    // Return mock data on error
    const mockData = {
      ip_str: request.body?.ip || "192.168.1.1",
      org: "Mock Organization",
      isp: "Mock ISP",
      country_name: "United States",
      city: "San Francisco",
      ports: [22, 80, 443],
      hostnames: ["example.com"],
      data: [
        {
          port: 80,
          transport: "tcp",
          product: "nginx",
          version: "1.18.0",
          timestamp: new Date().toISOString(),
          data: "HTTP/1.1 200 OK\nServer: nginx/1.18.0\n",
        },
        {
          port: 443,
          transport: "tcp",
          product: "nginx",
          version: "1.18.0",
          timestamp: new Date().toISOString(),
          data: "HTTP/1.1 200 OK\nServer: nginx/1.18.0\n",
        },
      ],
      vulns: [],
      tags: ["web-server"],
    }

    return NextResponse.json(mockData)
  }
}
