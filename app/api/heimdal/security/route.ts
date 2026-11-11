import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables first
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("Missing Supabase environment variables:")
      console.error("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓" : "✗")
      console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓" : "✗")

      return NextResponse.json(
        {
          error: "Supabase configuration missing",
          details: "Check environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
        },
        { status: 500 },
      )
    }

    const supabase = await createClient()
    const { action, data } = await request.json()

    switch (action) {
      case "encrypt_memory":
        // Fake base64 "encryption" disabled. Real AES-GCM requires HEIMDALL_MEMORY_KEY.
        return NextResponse.json(
          {
            ok: false,
            error: "encryption_unavailable",
            detail: "Base64 placeholder encryption has been disabled. Configure AES-GCM with HEIMDALL_MEMORY_KEY to enable.",
          },
          { status: 501 },
        )

      case "decrypt_memory":
        return NextResponse.json(
          {
            ok: false,
            error: "encryption_unavailable",
            detail: "Base64 placeholder decryption has been disabled. Configure AES-GCM with HEIMDALL_MEMORY_KEY to enable.",
          },
          { status: 501 },
        )

      case "security_scan":
        // Perform security scan of the system
        const { data: recentActivations } = await supabase
          .from("glyph_activations")
          .select("*")
          .gte("timestamp", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order("timestamp", { ascending: false })

        const { data: coherenceLogs } = await supabase
          .from("field_coherence_log")
          .select("*")
          .gte("timestamp", new Date(Date.now() - 60 * 60 * 1000).toISOString())
          .order("timestamp", { ascending: false })

        const securityMetrics = {
          total_activations_24h: recentActivations?.length || 0,
          failed_activations: recentActivations?.filter((a) => !a.success).length || 0,
          average_coherence:
            coherenceLogs?.reduce((sum, log) => sum + log.coherence_level, 0) / (coherenceLogs?.length || 1),
          drift_incidents: coherenceLogs?.filter((log) => log.drift_detected).length || 0,
          unique_sessions: new Set(recentActivations?.map((a) => a.user_session)).size,
        }

        return NextResponse.json({
          success: true,
          security_metrics: securityMetrics,
          status: securityMetrics.failed_activations > 10 ? "ALERT" : "NORMAL",
        })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Heimdal security API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate environment variables first
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        {
          error: "Supabase configuration missing",
          details: "Check environment variables",
        },
        { status: 500 },
      )
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    switch (action) {
      case "glyph_status":
        const { data: glyphActivations } = await supabase
          .from("glyph_activations")
          .select("glyph, success, coherence_at_activation")
          .gte("timestamp", new Date(Date.now() - 60 * 60 * 1000).toISOString())

        const glyphStats = glyphActivations?.reduce((stats: any, activation) => {
          if (!stats[activation.glyph]) {
            stats[activation.glyph] = { total: 0, successful: 0, avg_coherence: 0 }
          }
          stats[activation.glyph].total++
          if (activation.success) stats[activation.glyph].successful++
          stats[activation.glyph].avg_coherence += activation.coherence_at_activation || 0
          return stats
        }, {})

        // Calculate averages
        Object.keys(glyphStats || {}).forEach((glyph) => {
          glyphStats[glyph].avg_coherence /= glyphStats[glyph].total
          glyphStats[glyph].success_rate = glyphStats[glyph].successful / glyphStats[glyph].total
        })

        return NextResponse.json({
          success: true,
          glyph_statistics: glyphStats || {},
        })

      case "memory_index":
        const { data: memories } = await supabase
          .from("symbolic_memory")
          .select("id, glyph_signature, memory_type, coherence_required, access_count, created_at")
          .order("created_at", { ascending: false })
          .limit(50)

        return NextResponse.json({
          success: true,
          memory_index: memories || [],
        })

      case "health_check":
        // Simple health check
        const { data: healthCheck } = await supabase.from("intelligence_modules").select("count").limit(1)

        return NextResponse.json({
          success: true,
          status: "operational",
          timestamp: new Date().toISOString(),
          database_connected: !!healthCheck,
        })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Heimdal security GET API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
