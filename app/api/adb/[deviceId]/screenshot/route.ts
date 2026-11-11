import { type NextRequest, NextResponse } from "next/server"
import { adbTools } from "@/lib/graphene/adbTools"
import { requireHubAuth } from "@/lib/security/api-auth"

export async function POST(request: NextRequest, { params: paramsPromise }: { params: Promise<{ deviceId: string }> }) {
  const params = await paramsPromise
  const denied = requireHubAuth(request, { surface: "adb:screenshot", requireInSecureMode: true })
  if (denied) return denied
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
