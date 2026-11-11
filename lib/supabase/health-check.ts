import { supabase } from "./client"

export interface TableInfo {
  name: string
  exists: boolean
  rowCount: number | null
  error?: string
}

export interface DatabaseHealthCheck {
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

export async function checkTableExists(tableName: string): Promise<TableInfo> {
  try {
    // First check if table exists by querying information_schema
    const { data: tableExists, error: schemaError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", tableName)
      .single()

    if (schemaError && schemaError.code !== "PGRST116") {
      // PGRST116 is "not found" which is expected if table doesn't exist
      return {
        name: tableName,
        exists: false,
        rowCount: null,
        error: `Schema check failed: ${schemaError.message}`,
      }
    }

    if (!tableExists) {
      return {
        name: tableName,
        exists: false,
        rowCount: null,
      }
    }

    // If table exists, get row count
    const { count, error: countError } = await supabase.from(tableName).select("*", { count: "exact", head: true })

    if (countError) {
      return {
        name: tableName,
        exists: true,
        rowCount: null,
        error: `Count failed: ${countError.message}`,
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

export async function checkSupabaseHealth(): Promise<DatabaseHealthCheck> {
  const errors: string[] = []

  // Test basic connection
  let connected = false
  try {
    const { data, error } = await supabase.from("information_schema.tables").select("table_name").limit(1)
    connected = !error
    if (error) {
      errors.push(`Connection failed: ${error.message}`)
    }
  } catch (error) {
    errors.push(`Connection test failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }

  // Check all required tables
  const tableChecks = await Promise.all(REQUIRED_TABLES.map((tableName) => checkTableExists(tableName)))

  const healthyTables = tableChecks.filter((table) => table.exists && !table.error).length

  // Collect table-specific errors
  tableChecks.forEach((table) => {
    if (table.error) {
      errors.push(`${table.name}: ${table.error}`)
    }
  })

  return {
    connected,
    tables: tableChecks,
    totalTables: REQUIRED_TABLES.length,
    healthyTables,
    errors,
  }
}

export async function createMissingTables(): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = []

  try {
    // This would run the SQL scripts to create missing tables
    // For now, we'll just return instructions
    errors.push("Please run the SQL scripts in the /scripts folder in your Supabase SQL editor")
    errors.push(
      "Required scripts: create-tables-fixed-v2.sql, create-consciousness-tables-v2.sql, create-fractal-consciousness-tables.sql",
    )

    return {
      success: false,
      errors,
    }
  } catch (error) {
    errors.push(`Failed to create tables: ${error instanceof Error ? error.message : "Unknown error"}`)
    return {
      success: false,
      errors,
    }
  }
}
