import { NextResponse } from "next/server"
import { adbTools } from "@/lib/graphene/adbTools"

export async function GET() {
  try {
    const devices = await adbTools.getDevices()
    return NextResponse.json({ devices })
  } catch (error) {
    console.error("Failed to get devices:", error)
    return NextResponse.json(
      { error: "Failed to get devices", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
