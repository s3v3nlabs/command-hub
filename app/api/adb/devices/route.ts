import { NextResponse } from "next/server"
import { adbTools } from "@/lib/graphene/adbTools"

export const dynamic = "force-dynamic"

/**
 * Lists ADB devices. When the `adb` binary isn't installed or no phone is attached we
 * return 200 with an empty list + `adbAvailable:false` so the UI can show a setup hint
 * instead of crashing with "Failed to get devices".
 */
export async function GET() {
  try {
    const devices = await adbTools.getDevices()
    return NextResponse.json({ devices, adbAvailable: true })
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error)
    return NextResponse.json({
      devices: [],
      adbAvailable: false,
      hint: "adb not found or not running. Install Android platform-tools (`adb`), enable USB debugging, then reconnect.",
      details: details.slice(0, 300),
    })
  }
}
