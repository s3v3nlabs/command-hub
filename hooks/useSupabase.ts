"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/client"
import {
  getIntelligenceModules,
  getSystemLogs,
  getSignalData,
  getMessages,
  updateModulePriority,
  updateModuleStatus,
  addSystemLog,
  addMessage,
  subscribeToIntelligenceModules,
  subscribeToSystemLogs,
  subscribeToMessages,
  type IntelligenceModule,
  type SystemLog,
  type SignalData,
  type Message,
} from "@/lib/supabase/database"

export const useIntelligenceModules = () => {
  const [modules, setModules] = useState<IntelligenceModule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchModules = async () => {
    try {
      setLoading(true)
      const data = await getIntelligenceModules()
      setModules(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch modules")
    } finally {
      setLoading(false)
    }
  }

  const updatePriority = async (id: string, priority: number) => {
    const success = await updateModulePriority(id, priority)
    if (success) {
      await fetchModules() // Refresh data
      await addSystemLog(id, "PRIORITY_CHANGE", `Priority updated to ${priority}`, { new_priority: priority })
    }
    return success
  }

  const updateStatus = async (id: string, status: string) => {
    const success = await updateModuleStatus(id, status)
    if (success) {
      await fetchModules() // Refresh data
      await addSystemLog(id, "STATUS_CHANGE", `Status changed to ${status}`, { new_status: status })
    }
    return success
  }

  useEffect(() => {
    fetchModules()

    // Subscribe to real-time changes
    const subscription = subscribeToIntelligenceModules((payload) => {
      console.log("Intelligence module changed:", payload)
      fetchModules() // Refresh on changes
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  return {
    modules,
    loading,
    error,
    refetch: fetchModules,
    updatePriority,
    updateStatus,
  }
}

export const useSystemLogs = (limit = 50) => {
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const data = await getSystemLogs(limit)
      setLogs(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch logs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()

    // Subscribe to real-time changes
    const subscription = subscribeToSystemLogs((payload) => {
      console.log("New system log:", payload)
      fetchLogs() // Refresh on new logs
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [limit])

  return {
    logs,
    loading,
    error,
    refetch: fetchLogs,
  }
}

export const useSignalData = (moduleId?: string) => {
  const [signals, setSignals] = useState<SignalData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSignals = async () => {
    try {
      setLoading(true)
      const data = await getSignalData(moduleId)
      setSignals(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch signal data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSignals()
  }, [moduleId])

  return {
    signals,
    loading,
    error,
    refetch: fetchSignals,
  }
}

export const useMessages = (limit = 20) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const data = await getMessages(limit)
      setMessages(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch messages")
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (
    sender: string,
    content: string,
    encrypted = false,
    metadata: Record<string, any> = {},
  ) => {
    const success = await addMessage(sender, content, encrypted, metadata)
    if (success) {
      await fetchMessages() // Refresh messages
    }
    return success
  }

  useEffect(() => {
    fetchMessages()

    // Subscribe to real-time changes
    const subscription = subscribeToMessages((payload) => {
      console.log("New message:", payload)
      fetchMessages() // Refresh on new messages
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [limit])

  return {
    messages,
    loading,
    error,
    refetch: fetchMessages,
    sendMessage,
  }
}

export function useSupabase() {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (!supabase) {
          setError("Supabase client not initialized")
          setIsConnected(false)
          setIsLoading(false)
          return
        }

        const { data, error } = await supabase.from("intelligence_modules").select("count").limit(1)

        if (error) {
          setError(error.message)
          setIsConnected(false)
        } else {
          setError(null)
          setIsConnected(true)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        setIsConnected(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkConnection()
  }, [])

  return {
    supabase,
    isConnected,
    isLoading,
    error,
  }
}

export type { Database }
