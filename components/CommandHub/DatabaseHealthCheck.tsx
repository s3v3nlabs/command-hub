"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Database, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react"
import { checkSupabaseHealth, type TableInfo } from "@/lib/supabase/health-check"

interface DatabaseHealthCheck {
  connected: boolean
  tables: TableInfo[]
  totalTables: number
  healthyTables: number
  errors: string[]
}

export function DatabaseHealthCheck() {
  const [healthCheck, setHealthCheck] = useState<DatabaseHealthCheck | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const runHealthCheck = async () => {
    setLoading(true)
    try {
      const result = await checkSupabaseHealth()
      setHealthCheck(result)
      setLastChecked(new Date())
    } catch (error) {
      console.error("Health check failed:", error)
      setHealthCheck({
        connected: false,
        tables: [],
        totalTables: 0,
        healthyTables: 0,
        errors: [`Health check failed: ${error instanceof Error ? error.message : "Unknown error"}`],
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runHealthCheck()
  }, [])

  const getStatusIcon = (table: TableInfo) => {
    if (table.error) return <XCircle className="h-4 w-4 text-red-500" />
    if (table.exists) return <CheckCircle className="h-4 w-4 text-green-500" />
    return <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusBadge = (table: TableInfo) => {
    if (table.error) return <Badge variant="destructive">Error</Badge>
    if (table.exists) return <Badge variant="default">Exists</Badge>
    return <Badge variant="destructive">Missing</Badge>
  }

  const getOverallStatus = () => {
    if (!healthCheck) return { color: "text-gray-500", text: "Unknown" }
    if (!healthCheck.connected) return { color: "text-red-500", text: "Disconnected" }
    if (healthCheck.healthyTables === healthCheck.totalTables) return { color: "text-green-500", text: "Healthy" }
    if (healthCheck.healthyTables > 0) return { color: "text-yellow-500", text: "Partial" }
    return { color: "text-red-500", text: "Critical" }
  }

  const overallStatus = getOverallStatus()

  return (
    <Card className="w-full bg-dark-50 border-dark-300">
      <CardHeader className="border-b border-dark-300">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-dark-700">
            <Database className="h-5 w-5" />
            Database Health Check
          </CardTitle>
          <Button
            onClick={runHealthCheck}
            disabled={loading}
            variant="outline"
            size="sm"
            className="border-dark-400 bg-transparent"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {loading ? "Checking..." : "Refresh"}
          </Button>
        </div>
        {lastChecked && <p className="text-sm text-dark-500">Last checked: {lastChecked.toLocaleString()}</p>}
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {/* Overall Status */}
        <div className="flex items-center justify-between p-4 border border-dark-300 rounded-lg bg-dark-100/50">
          <div className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${
                overallStatus.color.includes("green")
                  ? "bg-green-500"
                  : overallStatus.color.includes("yellow")
                    ? "bg-yellow-500"
                    : overallStatus.color.includes("red")
                      ? "bg-red-500"
                      : "bg-gray-500"
              }`}
            />
            <span className="font-medium text-dark-700">Overall Status</span>
          </div>
          <span className={`font-semibold ${overallStatus.color}`}>{overallStatus.text}</span>
        </div>

        {/* Connection Status */}
        {healthCheck && (
          <div className="flex items-center justify-between p-3 border border-dark-300 rounded-lg bg-dark-100/30">
            <span className="font-medium text-dark-700">Supabase Connection</span>
            <div className="flex items-center gap-2">
              {healthCheck.connected ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className={healthCheck.connected ? "text-green-600" : "text-red-600"}>
                {healthCheck.connected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
        )}

        {/* Tables Summary */}
        {healthCheck && (
          <div className="flex items-center justify-between p-3 border border-dark-300 rounded-lg bg-dark-100/30">
            <span className="font-medium text-dark-700">Tables Status</span>
            <span className="text-sm text-dark-600">
              {healthCheck.healthyTables} / {healthCheck.totalTables} healthy
            </span>
          </div>
        )}

        {/* Individual Tables */}
        {healthCheck && healthCheck.tables.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-dark-700">Table Details</h4>
            <div className="grid gap-2 max-h-64 overflow-y-auto">
              {healthCheck.tables.map((table) => (
                <div
                  key={table.name}
                  className="flex items-center justify-between p-2 border border-dark-300 rounded text-sm bg-dark-100/20"
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(table)}
                    <span className="font-mono text-dark-700">{table.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {table.rowCount !== null && <span className="text-xs text-dark-500">{table.rowCount} rows</span>}
                    {getStatusBadge(table)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Errors */}
        {healthCheck && healthCheck.errors.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2 text-dark-700">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Issues Found
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {healthCheck.errors.map((error, index) => (
                <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Setup Instructions */}
        {healthCheck && !healthCheck.connected && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <h4 className="font-medium text-blue-900 mb-2">Setup Required</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>1. Check your environment variables:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>
                  <code>NEXT_PUBLIC_SUPABASE_URL</code>
                </li>
                <li>
                  <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
                </li>
              </ul>
              <p>2. Run the SQL scripts in your Supabase SQL editor:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>
                  <code>scripts/create-tables-fixed-v2.sql</code>
                </li>
                <li>
                  <code>scripts/create-consciousness-tables-v2.sql</code>
                </li>
                <li>
                  <code>scripts/create-fractal-consciousness-tables.sql</code>
                </li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
