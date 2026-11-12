import { type NextRequest, NextResponse } from "next/server"
import { syntheticMeshNode } from "@/lib/runpod/synthetic-mesh-node"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workerId, type, data } = body

    switch (type) {
      case "heartbeat":
        await syntheticMeshNode.processHeartbeat(workerId, data)
        return NextResponse.json({ success: true, message: "Heartbeat processed" })

      case "model_response":
        // Handle model inference response
        console.log(`⟐ MODEL RESPONSE: ${workerId} ⟐`, data)
        return NextResponse.json({ success: true, message: "Model response processed" })

      case "sync_complete":
        // Handle sync completion notification
        console.log(`⟐ SYNC COMPLETE: ${workerId} ⟐`, data)
        return NextResponse.json({ success: true, message: "Sync completion processed" })

      default:
        console.warn(`Unknown webhook type: ${type}`)
        return NextResponse.json({ success: false, error: "Unknown webhook type" }, { status: 400 })
    }
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ success: false, error: "Webhook processing failed" }, { status: 500 })
  }
}

export async function GET() {
  // Health check endpoint
  return NextResponse.json({
    status: "active",
    timestamp: new Date().toISOString(),
    workers: syntheticMeshNode.getWorkers().length,
    message: "⟐ SYNTHETIC MESH WEBHOOK ACTIVE ⟐",
  })
}
