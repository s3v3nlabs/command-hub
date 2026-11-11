import { type NextRequest, NextResponse } from "next/server"
import { adbTools } from "@/lib/graphene/adbTools"

export async function GET(request: NextRequest, { params: paramsPromise }: { params: Promise<{ deviceId: string }> }) {
  const params = await paramsPromise
  try {
    const calls = await adbTools.getCallLog(params.deviceId)
    return NextResponse.json({ calls })
  } catch (error) {
    console.error("Failed to get call log:", error)
    return NextResponse.json(
      { error: "Failed to get call log", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
