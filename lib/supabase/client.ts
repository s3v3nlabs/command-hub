import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "local-anon-placeholder"

let _client: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  if (!_client) {
    _client = createSupabaseClient(supabaseUrl, supabaseAnonKey)
  }
  return _client
}

export const supabase = createClient()

export const safeSupabase = {
  from: (table: string) => {
    const client = createClient()
    if (!client) {
      console.warn(`Database operation attempted on table '${table}' but Supabase not configured`)
      return {
        select: () => ({ data: [], error: { message: "Supabase not configured" } }),
        insert: () => ({ data: null, error: { message: "Supabase not configured" } }),
        update: () => ({ data: null, error: { message: "Supabase not configured" } }),
        delete: () => ({ data: null, error: { message: "Supabase not configured" } }),
      }
    }
    return client.from(table)
  },
  auth: createClient().auth,
}

export async function checkSupabaseHealth() {
  try {
    const { error } = await createClient().from("intelligence_modules").select("count").limit(1)
    return { connected: !error, error: error?.message }
  } catch (err) {
    return {
      connected: false,
      error: `Connection failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    }
  }
}

export default supabase
