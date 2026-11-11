import { type NextRequest, NextResponse } from "next/server"
import { adbTools } from "@/lib/graphene/adbTools"

export async function POST(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const { format = "png" } = await request.json()
    const screenshot = await adbTools.captureScreen(params.deviceId, format)
    return NextResponse.json({ screenshot })
  } catch (error) {
    console.error("Failed to capture screenshot:", error)
    return NextResponse.json(
      { error: "Failed to capture screenshot", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
