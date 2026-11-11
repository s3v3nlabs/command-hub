"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Database, CheckCircle, XCircle, AlertCircle, RefreshCw, Activity } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface DatabaseStatus {
  connected: boolean
  tablesExist: boolean
  moduleCount: number
  logCount: number
  messageCount: number
  lastUpdate: string
  error?: string
}

export default function DatabaseVerification() {
  const [status, setStatus] = useState<DatabaseStatus>({
    connected: false,
    tablesExist: false,
    moduleCount: 0,
    logCount: 0,
    messageCount: 0,
    lastUpdate: "Never",
  })
  const [isChecking, setIsChecking] = useState(false)
  const [realTimeEvents, setRealTimeEvents] = useState<string[]>([])

  const verifyDatabase = async () => {
    setIsChecking(true)
    try {
      // Test basic connection
      const { data: connectionTest, error: connectionError } = await supabase
        .from("intelligence_modules")
        .select("count", { count: "exact", head: true })

      if (connectionError) {
        setStatus((prev) => ({
          ...prev,
          connected: false,
          error: connectionError.message,
          lastUpdate: new Date().toLocaleTimeString(),
        }))
        return
      }

      // Check if tables exist and get counts
      const [modulesResult, logsResult, messagesResult] = await Promise.all([
        supabase.from("intelligence_modules").select("*", { count: "exact" }),
        supabase.from("system_logs").select("*", { count: "exact", head: true }),
        supabase.from("messages").select("*", { count: "exact", head: true }),
      ])

      setStatus({
        connected: true,
        tablesExist: true,
        moduleCount: modulesResult.count || 0,
        logCount: logsResult.count || 0,
        messageCount: messagesResult.count || 0,
        lastUpdate: new Date().toLocaleTimeString(),
        error: undefined,
      })

      // Add verification event
      setRealTimeEvents((prev) => [`✅ Database verified at ${new Date().toLocaleTimeString()}`, ...prev.slice(0, 4)])
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        connected: false,
        error: error instanceof Error ? error.message : "Unknown error",
        lastUpdate: new Date().toLocaleTimeString(),
      }))
    } finally {
      setIsChecking(false)
    }
  }

  const testRealTimeConnection = () => {
    if (!supabase) return

    // Subscribe to intelligence modules changes
    const subscription = supabase
      .channel("verification_test")
      .on("postgres_changes", { event: "*", schema: "public", table: "intelligence_modules" }, (payload) => {
        setRealTimeEvents((prev) => [
          `🔄 Real-time event: ${payload.eventType} on intelligence_modules at ${new Date().toLocaleTimeString()}`,
          ...prev.slice(0, 4),
        ])
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "system_logs" }, (payload) => {
        setRealTimeEvents((prev) => [
          `📝 Real-time event: ${payload.eventType} on system_logs at ${new Date().toLocaleTimeString()}`,
          ...prev.slice(0, 4),
        ])
      })
      .subscribe()

    setRealTimeEvents((prev) => [
      `🎯 Real-time subscription started at ${new Date().toLocaleTimeString()}`,
      ...prev.slice(0, 4),
    ])

    // Cleanup subscription after 30 seconds
    setTimeout(() => {
      subscription.unsubscribe()
      setRealTimeEvents((prev) => [
        `⏹️ Real-time subscription ended at ${new Date().toLocaleTimeString()}`,
        ...prev.slice(0, 4),
      ])
    }, 30000)
  }

  const insertTestData = async () => {
    try {
      // Insert a test system log
      const { error } = await supabase.from("system_logs").insert({
        module_id: "verification-test",
        event_type: "VERIFICATION_TEST",
        message: `Database verification test at ${new Date().toISOString()}`,
        metadata: { test: true, timestamp: Date.now() },
      })

      if (error) {
        setRealTimeEvents((prev) => [`❌ Test insert failed: ${error.message}`, ...prev.slice(0, 4)])
      } else {
        setRealTimeEvents((prev) => [
          `✅ Test data inserted successfully at ${new Date().toLocaleTimeString()}`,
          ...prev.slice(0, 4),
        ])
        // Refresh status
        await verifyDatabase()
      }
    } catch (error) {
      setRealTimeEvents((prev) => [
        `❌ Test insert error: ${error instanceof Error ? error.message : "Unknown error"}`,
        ...prev.slice(0, 4),
      ])
    }
  }

  useEffect(() => {
    verifyDatabase()
  }, [])

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <Database className="w-5 h-5 mr-2" />
          Supabase Database Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Connection</span>
            <Badge className={`${status.connected ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
              {status.connected ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" /> CONNECTED
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 mr-1" /> DISCONNECTED
                </>
              )}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Tables</span>
            <Badge
              className={`${status.tablesExist ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}
            >
              {status.tablesExist ? "EXISTS" : "CHECKING"}
            </Badge>
          </div>
        </div>

        {/* Data Counts */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-800 rounded border border-gray-600">
            <div className="text-2xl font-bold text-white">{status.moduleCount}</div>
            <div className="text-xs text-gray-400">Intelligence Modules</div>
          </div>
          <div className="text-center p-3 bg-gray-800 rounded border border-gray-600">
            <div className="text-2xl font-bold text-white">{status.logCount}</div>
            <div className="text-xs text-gray-400">System Logs</div>
          </div>
          <div className="text-center p-3 bg-gray-800 rounded border border-gray-600">
            <div className="text-2xl font-bold text-white">{status.messageCount}</div>
            <div className="text-xs text-gray-400">Messages</div>
          </div>
        </div>

        {/* Error Display */}
        {status.error && (
          <div className="p-3 bg-red-900/20 border border-red-500/30 rounded">
            <div className="flex items-center text-red-400 mb-2">
              <AlertCircle className="w-4 h-4 mr-2" />
              Database Error
            </div>
            <div className="text-sm text-red-300 font-mono">{status.error}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button onClick={verifyDatabase} disabled={isChecking} className="bg-gray-700 hover:bg-gray-600 text-white">
            {isChecking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
          </Button>
          <Button onClick={testRealTimeConnection} className="bg-blue-700 hover:bg-blue-600 text-white">
            <Activity className="w-4 h-4" />
          </Button>
          <Button onClick={insertTestData} className="bg-green-700 hover:bg-green-600 text-white">
            Test Insert
          </Button>
        </div>

        {/* Real-time Events Log */}
        <div>
          <div className="text-sm text-gray-400 mb-2">Real-time Events:</div>
          <div className="bg-gray-800 border border-gray-600 rounded p-3 max-h-32 overflow-y-auto">
            {realTimeEvents.length > 0 ? (
              realTimeEvents.map((event, index) => (
                <div key={index} className="text-xs text-gray-300 font-mono mb-1">
                  {event}
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-500">No real-time events yet...</div>
            )}
          </div>
        </div>

        {/* Last Update */}
        <div className="text-xs text-gray-500 text-center">Last verified: {status.lastUpdate}</div>
      </CardContent>
    </Card>
  )
}
