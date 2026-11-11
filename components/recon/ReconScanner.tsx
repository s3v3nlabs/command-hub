"use client"

import { useState } from "react"
import { Shield, Database, Globe, Server, Lock } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

// Mock data types
type DnsRecord = {
  type: string
  name: string
  value: string
  ttl: number
}

type Subdomain = {
  name: string
  ip: string
  status: "active" | "inactive"
  lastSeen: string
}

type Certificate = {
  issuer: string
  validFrom: string
  validTo: string
  domains: string[]
}

type ScanResult = {
  domain: string
  timestamp: string
  dnsRecords: DnsRecord[]
  subdomains: Subdomain[]
  certificates: Certificate[]
  technologies: string[]
  ports: { port: number; service: string; state: string }[]
}

export function ReconScanner() {
  const [domain, setDomain] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [scanResults, setScanResults] = useState<ScanResult | null>(null)

  const runScan = () => {
    if (!domain) return

    setIsScanning(true)

    // Simulate API call with timeout
    setTimeout(() => {
      setScanResults(getMockResults(domain))
      setIsScanning(false)
    }, 2000)
  }

  return (
    <Card className="w-full shadow-md border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          Passive Reconnaissance Scanner
        </CardTitle>
        <CardDescription>Gather intelligence without direct target interaction</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex gap-2 mb-4">
          <div className="relative flex-grow">
            <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="example.com"
              className="pl-9"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runScan()}
            />
          </div>
          <Button onClick={runScan} disabled={!domain || isScanning} className="whitespace-nowrap">
            {isScanning ? "Scanning..." : "Run Passive Scan"}
          </Button>
        </div>

        {scanResults && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">
                Results for <span className="font-bold">{scanResults.domain}</span>
              </h3>
              <Badge variant="outline" className="text-xs">
                {scanResults.timestamp}
              </Badge>
            </div>

            <Tabs defaultValue="subdomains">
              <TabsList className="grid grid-cols-4 mb-2">
                <TabsTrigger value="subdomains">Subdomains</TabsTrigger>
                <TabsTrigger value="dns">DNS</TabsTrigger>
                <TabsTrigger value="certs">Certificates</TabsTrigger>
                <TabsTrigger value="tech">Technologies</TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[300px] rounded-md border p-4">
                <TabsContent value="subdomains" className="mt-0">
                  <div className="space-y-2">
                    {scanResults.subdomains.map((sub, i) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4 text-gray-500" />
                          <span className="font-mono text-sm">{sub.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{sub.ip}</span>
                          <Badge variant={sub.status === "active" ? "default" : "secondary"} className="text-xs">
                            {sub.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="dns" className="mt-0">
                  <Accordion type="single" collapsible className="w-full">
                    {scanResults.dnsRecords.map((record, i) => (
                      <AccordionItem key={i} value={`item-${i}`}>
                        <AccordionTrigger className="py-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">
                              {record.type}
                            </Badge>
                            <span className="text-sm">{record.name}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="bg-gray-50 p-2 rounded-md">
                            <div className="font-mono text-sm break-all">{record.value}</div>
                            <div className="text-xs text-gray-500 mt-1">TTL: {record.ttl}</div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </TabsContent>

                <TabsContent value="certs" className="mt-0">
                  <div className="space-y-4">
                    {scanResults.certificates.map((cert, i) => (
                      <div key={i} className="border rounded-md p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Lock className="h-4 w-4 text-green-500" />
                          <span className="font-medium text-sm">{cert.issuer}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                          <div>Valid From: {cert.validFrom}</div>
                          <div>Valid To: {cert.validTo}</div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {cert.domains.map((domain, j) => (
                            <Badge key={j} variant="outline" className="text-xs">
                              {domain}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="tech" className="mt-0">
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Technologies Detected</h4>
                    <div className="flex flex-wrap gap-1">
                      {scanResults.technologies.map((tech, i) => (
                        <Badge key={i} className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <h4 className="text-sm font-medium mb-2">Open Ports</h4>
                  <div className="space-y-2">
                    {scanResults.ports.map((port, i) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-gray-500" />
                          <span className="font-mono text-sm">{port.port}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{port.service}</span>
                          <Badge variant={port.state === "open" ? "default" : "secondary"} className="text-xs">
                            {port.state}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between text-xs text-gray-500 pt-2">
        <div>Data sources: DNSDumpster, crt.sh, ProjectDiscovery</div>
        <div>Passive scan only - no direct target interaction</div>
      </CardFooter>
    </Card>
  )
}

// Mock data generator
function getMockResults(domain: string): ScanResult {
  return {
    domain,
    timestamp: new Date().toLocaleString(),
    dnsRecords: [
      { type: "A", name: domain, value: "93.184.216.34", ttl: 3600 },
      { type: "MX", name: domain, value: "mail." + domain, ttl: 3600 },
      { type: "NS", name: domain, value: "ns1." + domain, ttl: 86400 },
      { type: "TXT", name: domain, value: "v=spf1 include:_spf.google.com ~all", ttl: 3600 },
      { type: "CNAME", name: "www." + domain, value: domain, ttl: 3600 },
    ],
    subdomains: [
      { name: "www." + domain, ip: "93.184.216.34", status: "active", lastSeen: "2023-05-01" },
      { name: "api." + domain, ip: "93.184.216.35", status: "active", lastSeen: "2023-05-01" },
      { name: "mail." + domain, ip: "93.184.216.36", status: "active", lastSeen: "2023-05-01" },
      { name: "dev." + domain, ip: "93.184.216.37", status: "inactive", lastSeen: "2023-04-15" },
      { name: "staging." + domain, ip: "93.184.216.38", status: "active", lastSeen: "2023-05-01" },
      { name: "blog." + domain, ip: "93.184.216.39", status: "active", lastSeen: "2023-05-01" },
      { name: "shop." + domain, ip: "93.184.216.40", status: "active", lastSeen: "2023-05-01" },
    ],
    certificates: [
      {
        issuer: "Let's Encrypt Authority X3",
        validFrom: "2023-01-01",
        validTo: "2023-12-31",
        domains: [domain, "www." + domain, "mail." + domain],
      },
      {
        issuer: "DigiCert SHA2 Secure Server CA",
        validFrom: "2022-06-01",
        validTo: "2023-06-01",
        domains: ["api." + domain, "dev." + domain],
      },
    ],
    technologies: [
      "Nginx 1.18",
      "PHP 7.4",
      "WordPress",
      "jQuery",
      "Google Analytics",
      "CloudFlare",
      "Bootstrap",
      "AWS",
    ],
    ports: [
      { port: 80, service: "HTTP", state: "open" },
      { port: 443, service: "HTTPS", state: "open" },
      { port: 22, service: "SSH", state: "filtered" },
      { port: 25, service: "SMTP", state: "closed" },
      { port: 3306, service: "MySQL", state: "filtered" },
    ],
  }
}
