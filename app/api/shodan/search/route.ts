import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { query, facets, page = 1 } = await request.json()

    const apiKey = process.env.SHODAN_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Shodan API key not configured" }, { status: 500 })
    }

    const searchParams = new URLSearchParams({
      key: apiKey,
      query: query || "",
      page: page.toString(),
    })

    if (facets && facets.length > 0) {
      searchParams.append("facets", facets.join(","))
    }

    const response = await fetch(`https://api.shodan.io/shodan/host/search?${searchParams}`, {
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
    console.error("Shodan search error:", error)

    // Return mock data on error
    const mockData = {
      matches: [
        {
          ip_str: "192.168.1.1",
          port: 80,
          transport: "tcp",
          product: "nginx",
          version: "1.18.0",
          org: "Mock Organization",
          location: {
            country_name: "United States",
            city: "San Francisco",
          },
          timestamp: new Date().toISOString(),
          data: "HTTP/1.1 200 OK\nServer: nginx/1.18.0\n",
        },
        {
          ip_str: "10.0.0.1",
          port: 22,
          transport: "tcp",
          product: "OpenSSH",
          version: "8.0",
          org: "Mock ISP",
          location: {
            country_name: "Canada",
            city: "Toronto",
          },
          timestamp: new Date().toISOString(),
          data: "SSH-2.0-OpenSSH_8.0\n",
        },
      ],
      total: 2,
      facets: {},
    }

    return NextResponse.json(mockData)
  }
}
