import { type NextRequest, NextResponse } from "next/server"
import { adbTools } from "@/lib/graphene/adbTools"

export async function POST(request: NextRequest, { params: paramsPromise }: { params: Promise<{ deviceId: string }> }) {
  const params = await paramsPromise
  try {
    const { command } = await request.json()

    if (!command) {
      return NextResponse.json({ error: "Command is required" }, { status: 400 })
    }

    const output = await adbTools.executeShellCommand(params.deviceId, command)
    return NextResponse.json({ output })
  } catch (error) {
    console.error("Failed to execute shell command:", error)
    return NextResponse.json(
      { error: "Failed to execute command", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
