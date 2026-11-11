"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RefreshCw } from "lucide-react"

type KevItem = {
  cveId: string
  vendor: string
  product: string
  name: string
  dateAdded: string
  dueDate: string
  ransomware: boolean
  description: string
}

type KevResponse = { items: KevItem[]; total: number; catalogVersion: string; fetchedAt: string; error?: string }

export function ZeroDayPulse() {
  const [data, setData] = useState<KevResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const load = useCallback(async () => {
    setIsRefreshing(true)
    setError(null)
    try {
      const res = await fetch("/api/recon/kev?limit=30")
      const body = (await res.json()) as KevResponse
      if (!res.ok || body.error) throw new Error(body.error || `HTTP ${res.status}`)
      setData(body)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">Known Exploited Vulnerabilities (latest)</CardTitle>
          <Button variant="outline" size="sm" onClick={load} disabled={isRefreshing} className="h-8 px-2">
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && <div className="mb-3 rounded border border-red-500/40 p-3 text-sm text-red-400">{error}</div>}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {!data && !error && <div className="text-sm text-muted-foreground">Loading the CISA KEV feed…</div>}
            {data?.items.map((v) => (
              <div key={v.cveId} className="p-4 border rounded-lg hover:bg-muted/40 transition-colors">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <a
                    className="font-medium underline-offset-2 hover:underline"
                    href={`https://nvd.nist.gov/vuln/detail/${v.cveId}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {v.cveId}
                  </a>
                  {v.ransomware && <Badge className="bg-red-600 hover:bg-red-700">Ransomware use</Badge>}
                </div>
                <div className="text-sm mb-1">
                  <span className="font-medium">Affected:</span> {v.vendor} {v.product}
                </div>
                <div className="text-sm text-muted-foreground mb-2">{v.description}</div>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <div>Added to KEV: {v.dateAdded}</div>
                  <div>CISA due date: {v.dueDate}</div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-0 text-xs text-muted-foreground">
        Source: CISA Known Exploited Vulnerabilities catalog{data ? ` v${data.catalogVersion} (${data.total} entries)` : ""}. Live feed, no key needed.
      </CardFooter>
    </Card>
  )
}
