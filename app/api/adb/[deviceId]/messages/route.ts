import { type NextRequest, NextResponse } from "next/server"
import { adbTools } from "@/lib/graphene/adbTools"

export async function GET(request: NextRequest, { params: paramsPromise }: { params: Promise<{ deviceId: string }> }) {
  const params = await paramsPromise
  try {
    const messages = await adbTools.getSMSMessages(params.deviceId)
    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Failed to get SMS messages:", error)
    return NextResponse.json(
      { error: "Failed to get SMS messages", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
