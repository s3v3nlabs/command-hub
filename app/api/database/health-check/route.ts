import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface TableInfo {
  name: string
  exists: boolean
  rowCount: number | null
  error?: string
}

interface DatabaseHealthCheck {
  connected: boolean
  tables: TableInfo[]
  totalTables: number
  healthyTables: number
  errors: string[]
}

const REQUIRED_TABLES = [
  "intelligence_modules",
  "system_logs",
  "signal_data",
  "messages",
  "consciousness_patterns",
  "field_coherence_log",
  "glyph_activations",
  "symbolic_memory",
  "fractal_memory_nodes",
  "consciousness_mesh_nodes",
  "consciousness_mesh_signals",
  "biometric_coherence_readings",
  "symbolic_memories",
]

async function checkTableExists(supabase: any, tableName: string): Promise<TableInfo> {
  try {
    // Use a simple select query to check if table exists
    const { data, error, count } = await supabase.from(tableName).select("*", { count: "exact", head: true }).limit(1)

    if (error) {
      // Check if it's a "relation does not exist" error (table doesn't exist)
      if (error.code === "42P01" || error.message.includes("does not exist")) {
        return {
          name: tableName,
          exists: false,
          rowCount: null,
        }
      }

      // Other errors
      return {
        name: tableName,
        exists: false,
        rowCount: null,
        error: error.message,
      }
    }

    return {
      name: tableName,
      exists: true,
      rowCount: count || 0,
    }
  } catch (error) {
    return {
      name: tableName,
      exists: false,
      rowCount: null,
      error: `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

export async function GET() {
  const errors: string[] = []

  // Check environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push("Missing Supabase environment variables")
    return NextResponse.json({
      connected: false,
      tables: [],
      totalTables: REQUIRED_TABLES.length,
      healthyTables: 0,
      errors,
    })
  }

  // Test basic connection
  let connected = false
  let supabase: any = null

  try {
    supabase = await createClient()

    // Test connection with a simple query that should always work
    const { error } = await supabase.rpc("version")

    connected = !error
    if (error) {
      errors.push(`Connection failed: ${error.message}`)
    }
  } catch (error) {
    // If RPC doesn't work, try a different approach
    try {
      supabase = await createClient()
      // Try to access any system table that should exist
      const { error: testError } = await supabase.from("pg_tables").select("tablename").limit(1)

      connected = !testError
      if (testError) {
        errors.push(`Connection test failed: ${testError.message}`)
      }
    } catch (fallbackError) {
      errors.push(`Connection test failed: ${fallbackError instanceof Error ? fallbackError.message : "Unknown error"}`)
    }
  }

  // Check all required tables
  const tableChecks: TableInfo[] = []

  if (connected && supabase) {
    for (const tableName of REQUIRED_TABLES) {
      const tableInfo = await checkTableExists(supabase, tableName)
      tableChecks.push(tableInfo)

      if (tableInfo.error) {
        errors.push(`${tableName}: ${tableInfo.error}`)
      }
    }
  } else {
    // If not connected, mark all tables as unknown
    REQUIRED_TABLES.forEach((tableName) => {
      tableChecks.push({
        name: tableName,
        exists: false,
        rowCount: null,
        error: "Cannot check - no database connection",
      })
    })
  }

  const healthyTables = tableChecks.filter((table) => table.exists && !table.error).length

  const healthCheck: DatabaseHealthCheck = {
    connected,
    tables: tableChecks,
    totalTables: REQUIRED_TABLES.length,
    healthyTables,
    errors,
  }

  return NextResponse.json(healthCheck)
}
