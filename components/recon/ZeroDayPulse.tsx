"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RefreshCw } from "lucide-react"

type ZeroDay = {
  id: string
  cveId: string
  affectedSoftware: string
  source: "NVD" | "ExploitDB" | "Twitter"
  dateDiscovered: string
  severity: "Critical" | "High" | "Medium" | "Low"
  description: string
}

const mockZeroDays: ZeroDay[] = [
  {
    id: "1",
    cveId: "CVE-2023-36884",
    affectedSoftware: "Microsoft Office",
    source: "NVD",
    dateDiscovered: "2023-07-11",
    severity: "Critical",
    description: "Microsoft Office and Windows HTML Remote Code Execution Vulnerability",
  },
  {
    id: "2",
    cveId: "CVE-2023-38831",
    affectedSoftware: "WinRAR",
    source: "ExploitDB",
    dateDiscovered: "2023-08-23",
    severity: "High",
    description: "Path Traversal vulnerability in WinRAR leading to code execution",
  },
  {
    id: "3",
    cveId: "CVE-2023-41064",
    affectedSoftware: "iOS/iPadOS",
    source: "Twitter",
    dateDiscovered: "2023-09-07",
    severity: "Critical",
    description: "Zero-click exploit chain via iMessage used for targeted spyware delivery",
  },
  {
    id: "4",
    cveId: "CVE-2023-42824",
    affectedSoftware: "Apache Struts",
    source: "NVD",
    dateDiscovered: "2023-10-15",
    severity: "High",
    description: "Remote code execution vulnerability in Apache Struts framework",
  },
  {
    id: "5",
    cveId: "CVE-2023-44487",
    affectedSoftware: "HTTP/2",
    source: "ExploitDB",
    dateDiscovered: "2023-10-10",
    severity: "Critical",
    description: "HTTP/2 Rapid Reset Attack affecting multiple web servers",
  },
]

export function ZeroDayPulse() {
  const [zeroDays, setZeroDays] = useState<ZeroDay[]>(mockZeroDays)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    // Simulate refresh delay
    setTimeout(() => {
      setIsRefreshing(false)
      // In a real implementation, this would fetch new data
    }, 1000)
  }

  const getSeverityColor = (severity: ZeroDay["severity"]) => {
    switch (severity) {
      case "Critical":
        return "bg-red-500 hover:bg-red-600"
      case "High":
        return "bg-orange-500 hover:bg-orange-600"
      case "Medium":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "Low":
        return "bg-blue-500 hover:bg-blue-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  const getSourceBadge = (source: ZeroDay["source"]) => {
    switch (source) {
      case "NVD":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">NVD</Badge>
      case "ExploitDB":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">ExploitDB</Badge>
      case "Twitter":
        return <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-200">Twitter</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">Recent Zero-Day Alerts</CardTitle>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-8 px-2">
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {zeroDays.map((zeroDay) => (
              <div key={zeroDay.id} className="p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium">{zeroDay.cveId}</div>
                  <Badge className={getSeverityColor(zeroDay.severity)}>{zeroDay.severity}</Badge>
                </div>
                <div className="text-sm text-gray-700 mb-1">
                  <span className="font-medium">Software:</span> {zeroDay.affectedSoftware}
                </div>
                <div className="text-sm text-gray-700 mb-2">{zeroDay.description}</div>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <div>Source: {getSourceBadge(zeroDay.source)}</div>
                  <div>Discovered: {zeroDay.dateDiscovered}</div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-0 text-xs text-gray-500">
        Data sources: National Vulnerability Database, ExploitDB, Twitter OSINT
      </CardFooter>
    </Card>
  )
}
