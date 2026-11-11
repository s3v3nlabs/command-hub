import { supabase } from "./client"
import type { Database, Tables } from "./client"

export type IntelligenceModule = Tables<"intelligence_modules">
export type SignalData = Tables<"signal_data">
export type Message = Tables<"messages">
export type SystemLog = Tables<"system_logs">

export class DatabaseService {
  static async getIntelligenceModules() {
    if (!supabase) {
      throw new Error("Supabase client not initialized")
    }

    const { data, error } = await supabase
      .from("intelligence_modules")
      .select("*")
      .order("priority", { ascending: false })

    if (error) throw error
    return data
  }

  static async createIntelligenceModule(module: Database["public"]["Tables"]["intelligence_modules"]["Insert"]) {
    if (!supabase) {
      throw new Error("Supabase client not initialized")
    }

    const { data, error } = await supabase.from("intelligence_modules").insert(module).select().single()

    if (error) throw error
    return data
  }

  static async updateIntelligenceModule(
    id: string,
    updates: Database["public"]["Tables"]["intelligence_modules"]["Update"],
  ) {
    if (!supabase) {
      throw new Error("Supabase client not initialized")
    }

    const { data, error } = await supabase.from("intelligence_modules").update(updates).eq("id", id).select().single()

    if (error) throw error
    return data
  }

  static async deleteIntelligenceModule(id: string) {
    if (!supabase) {
      throw new Error("Supabase client not initialized")
    }

    const { error } = await supabase.from("intelligence_modules").delete().eq("id", id)

    if (error) throw error
  }

  static async getSignalData(limit = 100) {
    if (!supabase) {
      throw new Error("Supabase client not initialized")
    }

    const { data, error } = await supabase
      .from("signal_data")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }

  static async createSignalData(signal: Database["public"]["Tables"]["signal_data"]["Insert"]) {
    if (!supabase) {
      throw new Error("Supabase client not initialized")
    }

    const { data, error } = await supabase.from("signal_data").insert(signal).select().single()

    if (error) throw error
    return data
  }

  static async getMessages(channel?: string, limit = 50) {
    if (!supabase) {
      throw new Error("Supabase client not initialized")
    }

    let query = supabase.from("messages").select("*").order("timestamp", { ascending: false }).limit(limit)

    if (channel) {
      query = query.eq("channel", channel)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  }

  static async createMessage(message: Database["public"]["Tables"]["messages"]["Insert"]) {
    if (!supabase) {
      throw new Error("Supabase client not initialized")
    }

    const { data, error } = await supabase.from("messages").insert(message).select().single()

    if (error) throw error
    return data
  }

  static async getSystemLogs(module?: string, level?: string, limit = 100) {
    if (!supabase) {
      throw new Error("Supabase client not initialized")
    }

    let query = supabase.from("system_logs").select("*").order("timestamp", { ascending: false }).limit(limit)

    if (module) {
      query = query.eq("module", module)
    }

    if (level) {
      query = query.eq("level", level)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  }

  static async createSystemLog(log: Database["public"]["Tables"]["system_logs"]["Insert"]) {
    if (!supabase) {
      throw new Error("Supabase client not initialized")
    }

    const { data, error } = await supabase.from("system_logs").insert(log).select().single()

    if (error) throw error
    return data
  }
}

export default DatabaseService
