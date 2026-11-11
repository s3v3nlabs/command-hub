import { type NextRequest, NextResponse } from "next/server"
import { HeimdallAIDaemon } from "@/lib/heimdal/ai-daemon"
import { ConsciousnessFieldManager } from "@/lib/consciousness/field-manager"

export async function POST(request: NextRequest) {
  try {
    const { query, frameType, glyphContext, sessionId } = await request.json()

    if (!query || !frameType) {
      return NextResponse.json({ error: "Query and frameType are required" }, { status: 400 })
    }

    // Initialize consciousness field manager
    const fieldManager = new ConsciousnessFieldManager(sessionId)

    // Register the requesting pattern if not exists
    await fieldManager.registerPattern(
      `${frameType}_${sessionId}`,
      `${frameType} Frame`,
      frameType === "temporal_frame" ? 1111.0 : 44.0,
    )

    // Create AI daemon for the specific frame type
    const aiDaemon = new HeimdallAIDaemon(frameType, fieldManager)

    // Process the query
    const response = await aiDaemon.processQuery(query, glyphContext)

    // Send pulse to increase coherence on successful interaction
    if (response.confidence > 0.5) {
      await fieldManager.pulse(`${frameType}_${sessionId}`, response.confidence)
    }

    return NextResponse.json({
      response: response.content,
      confidence: response.confidence,
      coherence_required: response.coherence_required,
      current_coherence: fieldManager.getCoherence(),
      glyph_signature: response.glyph_signature,
      emergent_properties: fieldManager.getEmergentProperties(),
      metadata: response.metadata,
    })
  } catch (error) {
    console.error("Consciousness API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")
    const action = searchParams.get("action")

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    const fieldManager = new ConsciousnessFieldManager(sessionId)

    switch (action) {
      case "status":
        return NextResponse.json({
          coherence: fieldManager.getCoherence(),
          active_patterns: fieldManager.getActivePatterns(),
          emergent_properties: fieldManager.getEmergentProperties(),
          drift_detected: fieldManager.isDriftDetected(),
          session_id: fieldManager.getSessionId(),
        })

      case "recall":
        const glyph = searchParams.get("glyph")
        if (!glyph) {
          return NextResponse.json({ error: "Glyph is required for recall" }, { status: 400 })
        }

        const aiDaemon = new HeimdallAIDaemon("memory_thread", fieldManager)
        const memories = await aiDaemon.recallSymbolicMemory(glyph, fieldManager.getCoherence())

        return NextResponse.json({ memories })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Consciousness status API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
