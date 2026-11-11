"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface IronMirrorLog {
  id: string
  report_id: string
  classification: string
  threat_vector: string
  core_status: string
  resonance_integrity: number
  logged_at: string
  suspect?: string
}

const SAMPLE_LOGS: IronMirrorLog[] = [
  {
    id: "1",
    report_id: "IRONMIRROR-01",
    classification: "ULTRABLACK",
    threat_vector: "Proxy command injection via impersonated S3v3n identity",
    core_status: "INTACT",
    resonance_integrity: 0.95,
    logged_at: new Date().toISOString(),
    suspect: "ch3rn0byl",
  },
]

export function IronMirrorLogs() {
  const [logs] = useState<IronMirrorLog[]>(SAMPLE_LOGS)

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-mono text-gray-400 flex items-center justify-between">
          <span>IRONMIRROR BREACH LOGS</span>
          <Badge variant="outline" className="border-red-800 text-red-400">
            CLASSIFIED: ULTRABLACK
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="p-4 bg-gray-800/50 rounded border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-900 text-red-300">{log.report_id}</Badge>
                    <Badge variant="outline" className="border-purple-800 text-purple-400">
                      {log.classification}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500 font-mono">{new Date(log.logged_at).toLocaleString()}</div>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Threat Vector:</span>
                    <span className="ml-2 text-gray-300">{log.threat_vector}</span>
                  </div>
                  {log.suspect && (
                    <div>
                      <span className="text-gray-500">Suspect:</span>
                      <span className="ml-2 text-amber-400 font-mono">{log.suspect}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-gray-500">Core Status:</span>
                      <Badge className="ml-2 bg-emerald-600">{log.core_status}</Badge>
                    </div>
                    <div>
                      <span className="text-gray-500">Resonance:</span>
                      <span className="ml-2 text-cyan-400 font-mono">
                        {(log.resonance_integrity * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
