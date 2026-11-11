import { type NextRequest, NextResponse } from "next/server"
import { adbTools } from "@/lib/graphene/adbTools"

export async function GET(request: NextRequest, { params: paramsPromise }: { params: Promise<{ deviceId: string }> }) {
  const params = await paramsPromise
  try {
    const system = await adbTools.getSystemInfo(params.deviceId)
    return NextResponse.json({ system })
  } catch (error) {
    console.error("Failed to get system info:", error)
    return NextResponse.json(
      { error: "Failed to get system info", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
