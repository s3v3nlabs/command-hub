"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Search, AlertTriangle, Shield, Calendar } from "lucide-react"

type BreachData = {
  id: string
  service: string
  breachDate: string
  leakedData: string[]
  affectedAccounts: number
  verified: boolean
}

export function LeakMonitor() {
  const [query, setQuery] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [hasScanned, setHasScanned] = useState(false)
  const [breaches, setBreaches] = useState<BreachData[]>([])

  const mockBreaches: Record<string, BreachData[]> = {
    "example.com": [
      {
        id: "1",
        service: "ExampleCloud",
        breachDate: "2022-06-15",
        leakedData: ["Email addresses", "Passwords (hashed)", "Names"],
        affectedAccounts: 8500000,
        verified: true,
      },
      {
        id: "2",
        service: "ExampleShop",
        breachDate: "2021-11-03",
        leakedData: ["Email addresses", "Phone numbers", "Purchase history"],
        affectedAccounts: 3200000,
        verified: true,
      },
    ],
    "acme.org": [
      {
        id: "3",
        service: "AcmeForums",
        breachDate: "2023-02-28",
        leakedData: ["Email addresses", "Usernames", "IP addresses"],
        affectedAccounts: 1200000,
        verified: true,
      },
    ],
    "john.doe@gmail.com": [
      {
        id: "4",
        service: "SocialConnect",
        breachDate: "2020-08-12",
        leakedData: ["Email addresses", "Passwords (plaintext)", "Personal information"],
        affectedAccounts: 12500000,
        verified: true,
      },
      {
        id: "5",
        service: "GamePortal",
        breachDate: "2022-12-05",
        leakedData: ["Email addresses", "Usernames", "Gaming statistics"],
        affectedAccounts: 4800000,
        verified: false,
      },
      {
        id: "6",
        service: "FitnessTracker",
        breachDate: "2023-01-17",
        leakedData: ["Email addresses", "Health data", "Location history"],
        affectedAccounts: 2300000,
        verified: true,
      },
    ],
  }

  const handleScan = () => {
    if (!query.trim()) return

    setIsScanning(true)

    // Simulate API call delay
    setTimeout(() => {
      const foundBreaches = mockBreaches[query.toLowerCase()] || []
      setBreaches(foundBreaches)
      setHasScanned(true)
      setIsScanning(false)
    }, 1500)
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Data Breach Monitor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-4">
          <Input
            placeholder="Enter email address or domain"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleScan} disabled={isScanning || !query.trim()} className="whitespace-nowrap">
            {isScanning ? "Scanning..." : "Scan for Leaks"}
            <Search className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {hasScanned && (
          <div className="mt-4">
            {breaches.length > 0 ? (
              <>
                <div className="mb-3 flex items-center text-red-600">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  <span className="font-medium">
                    Found {breaches.length} breach{breaches.length !== 1 ? "es" : ""} for {query}
                  </span>
                </div>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    {breaches.map((breach) => (
                      <div key={breach.id} className="p-4 border border-red-100 rounded-lg bg-red-50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-lg">{breach.service}</div>
                          {breach.verified ? (
                            <Badge className="bg-red-500">Verified</Badge>
                          ) : (
                            <Badge variant="outline" className="text-orange-500 border-orange-500">
                              Unverified
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center text-sm text-gray-700 mb-2">
                          <Calendar className="mr-1 h-4 w-4 text-gray-500" />
                          Breach date: {breach.breachDate}
                        </div>

                        <div className="text-sm text-gray-700 mb-2">
                          <span className="font-medium">Affected accounts:</span>{" "}
                          {formatNumber(breach.affectedAccounts)}
                        </div>

                        <div className="text-sm text-gray-700">
                          <span className="font-medium">Compromised data:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {breach.leakedData.map((data, index) => (
                              <Badge key={index} variant="outline" className="bg-white">
                                {data}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Shield className="h-12 w-12 text-green-500 mb-2" />
                <h3 className="text-lg font-medium text-green-700">No breaches found</h3>
                <p className="text-sm text-gray-500 max-w-md mt-1">
                  Good news! We couldn't find any data breaches associated with {query}. Continue monitoring regularly
                  for best security practices.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0 text-xs text-gray-500">
        Data sources: HaveIBeenPwned, BreachDirectory, DeHashed
      </CardFooter>
    </Card>
  )
}
