import { type NextRequest, NextResponse } from "next/server"
import { adbTools } from "@/lib/graphene/adbTools"

export async function GET(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const battery = await adbTools.getBatteryInfo(params.deviceId)
    return NextResponse.json({ battery })
  } catch (error) {
    console.error("Failed to get battery info:", error)
    return NextResponse.json(
      { error: "Failed to get battery info", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
