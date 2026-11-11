import { type NextRequest, NextResponse } from "next/server"
import { adbTools } from "@/lib/graphene/adbTools"
import { requireHubAuth } from "@/lib/security/api-auth"

export async function GET(request: NextRequest, { params: paramsPromise }: { params: Promise<{ deviceId: string }> }) {
  const params = await paramsPromise
  const denied = requireHubAuth(request, { surface: "adb:battery", requireInSecureMode: true })
  if (denied) return denied
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
