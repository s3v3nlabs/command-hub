/**
 * NMAP Parser Module
 * Handles parsing of nmap XML and text output formats
 */

import { XMLParser } from "fast-xml-parser"

export interface NmapPort {
  port: number
  protocol: "tcp" | "udp" | "sctp" | "ip"
  state: "open" | "closed" | "filtered" | "unfiltered" | "open|filtered" | "closed|filtered"
  service?: {
    name: string
    product?: string
    version?: string
    extrainfo?: string
    method: "table" | "probed"
    conf: number
  }
  scripts?: Record<string, string>
}

export interface NmapHost {
  ip: string
  hostname?: string
  status: "up" | "down" | "unknown"
  ports: NmapPort[]
  os?: {
    name?: string
    accuracy?: number
    family?: string
  }
  mac?: string
  vendor?: string
  distance?: number
  lastBoot?: Date
  uptime?: number
}

export interface NmapScan {
  hosts: NmapHost[]
  runStats: {
    startTime: Date
    endTime: Date
    elapsed: number
    summary: string
    exit: "success" | "error" | "crashed"
  }
  scanInfo: {
    type: string
    protocol: string
    numservices: number
    services: string
    args: string
    version: string
  }
}

export interface NmapParserOptions {
  detectVersions?: boolean
  extractScripts?: boolean
  includeHosts?: "all" | "up" | "down"
}

const DEFAULT_OPTIONS: NmapParserOptions = {
  detectVersions: true,
  extractScripts: true,
  includeHosts: "up",
}

/**
 * Parses NMAP XML output into a structured object
 */
export function parseNmapXML(xmlContent: string, options: NmapParserOptions = DEFAULT_OPTIONS): NmapScan {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    isArray: (name) => ["host", "port", "script", "osmatch", "osclass"].includes(name),
  })

  try {
    const result = parser.parse(xmlContent)
    const nmaprun = result.nmaprun

    // Extract scan information
    const scanInfo = {
      type: nmaprun.scaninfo?.type || "unknown",
      protocol: nmaprun.scaninfo?.protocol || "unknown",
      numservices: Number.parseInt(nmaprun.scaninfo?.numservices || "0", 10),
      services: nmaprun.scaninfo?.services || "",
      args: nmaprun.args || "",
      version: nmaprun.version || "",
    }

    // Extract hosts
    const hosts: NmapHost[] = []
    if (nmaprun.host && Array.isArray(nmaprun.host)) {
      for (const host of nmaprun.host) {
        const parsedHost = parseHost(host, options)

        // Filter hosts based on options
        if (
          options.includeHosts === "all" ||
          (options.includeHosts === "up" && parsedHost.status === "up") ||
          (options.includeHosts === "down" && parsedHost.status === "down")
        ) {
          hosts.push(parsedHost)
        }
      }
    }

    // Extract run statistics
    const runStats = {
      startTime: new Date(Number.parseInt(nmaprun.start || Date.now(), 10) * 1000),
      endTime: new Date(Number.parseInt(nmaprun.runstats?.finished?.time || Date.now(), 10) * 1000),
      elapsed: Number.parseFloat(nmaprun.runstats?.finished?.elapsed || "0"),
      summary: nmaprun.runstats?.finished?.summary || "",
      exit: nmaprun.runstats?.finished?.exit || "unknown",
    }

    return {
      hosts,
      runStats,
      scanInfo,
    }
  } catch (error) {
    console.error("Error parsing NMAP XML:", error)
    throw new Error(`Failed to parse NMAP XML: ${error}`)
  }
}

/**
 * Parses a host entry from NMAP XML
 */
function parseHost(host: any, options: NmapParserOptions): NmapHost {
  // Extract IP address
  let ip = ""
  if (host.address && Array.isArray(host.address)) {
    const ipAddr = host.address.find((addr) => addr.addrtype === "ipv4" || addr.addrtype === "ipv6")
    if (ipAddr) {
      ip = ipAddr.addr
    }
  } else if (host.address) {
    ip = host.address.addr
  }

  // Extract hostname
  let hostname
  if (host.hostnames && host.hostnames.hostname) {
    if (Array.isArray(host.hostnames.hostname)) {
      hostname = host.hostnames.hostname[0].name
    } else {
      hostname = host.hostnames.hostname.name
    }
  }

  // Extract status
  const status = host.status?.state || "unknown"

  // Extract MAC address and vendor
  let mac
  let vendor
  if (host.address && Array.isArray(host.address)) {
    const macAddr = host.address.find((addr) => addr.addrtype === "mac")
    if (macAddr) {
      mac = macAddr.addr
      vendor = macAddr.vendor
    }
  }

  // Extract ports
  const ports: NmapPort[] = []
  if (host.ports && host.ports.port) {
    const portList = Array.isArray(host.ports.port) ? host.ports.port : [host.ports.port]

    for (const port of portList) {
      const parsedPort: NmapPort = {
        port: Number.parseInt(port.portid, 10),
        protocol: port.protocol,
        state: port.state?.state || "unknown",
      }

      // Extract service information if available
      if (port.service && options.detectVersions) {
        parsedPort.service = {
          name: port.service.name || "",
          product: port.service.product,
          version: port.service.version,
          extrainfo: port.service.extrainfo,
          method: port.service.method || "table",
          conf: Number.parseInt(port.service.conf || "0", 10),
        }
      }

      // Extract script output if available
      if (port.script && options.extractScripts) {
        parsedPort.scripts = {}
        const scripts = Array.isArray(port.script) ? port.script : [port.script]

        for (const script of scripts) {
          parsedPort.scripts[script.id] = script.output
        }
      }

      ports.push(parsedPort)
    }
  }

  // Extract OS information
  let os
  if (host.os && host.os.osmatch) {
    const osmatch = Array.isArray(host.os.osmatch) ? host.os.osmatch[0] : host.os.osmatch
    os = {
      name: osmatch.name,
      accuracy: Number.parseInt(osmatch.accuracy || "0", 10),
      family: osmatch.osclass?.osfamily || "",
    }
  }

  // Extract uptime information
  let lastBoot
  let uptime
  if (host.uptime) {
    uptime = Number.parseInt(host.uptime.seconds || "0", 10)
    if (host.uptime.lastboot) {
      lastBoot = new Date(host.uptime.lastboot)
    }
  }

  // Extract distance (hop count)
  let distance
  if (host.distance) {
    distance = Number.parseInt(host.distance.value || "0", 10)
  }

  return {
    ip,
    hostname,
    status: status as "up" | "down" | "unknown",
    ports,
    os,
    mac,
    vendor,
    distance,
    lastBoot,
    uptime,
  }
}

/**
 * Parses NMAP text output into a structured object
 * Note: Text parsing is less reliable than XML parsing
 */
export function parseNmapText(textContent: string, options: NmapParserOptions = DEFAULT_OPTIONS): NmapScan {
  const hosts: NmapHost[] = []
  const lines = textContent.split("\n")

  let currentHost: Partial<NmapHost> | null = null
  let currentPort: Partial<NmapPort> | null = null

  // Extract scan info from the first few lines
  const scanInfoMatch = textContent.match(/Nmap scan report for (.+)/)
  const versionMatch = textContent.match(/Starting Nmap ([0-9.]+)/)
  const argsMatch = textContent.match(/Nmap command line: (.+)/)

  const scanInfo = {
    type: "connect",
    protocol: "tcp",
    numservices: 0,
    services: "",
    args: argsMatch ? argsMatch[1] : "",
    version: versionMatch ? versionMatch[1] : "",
  }

  // Extract start and end times
  const startTimeMatch = textContent.match(/Starting Nmap .+ at (.+)/)
  const endTimeMatch = textContent.match(/Nmap done at (.+)/)

  const runStats = {
    startTime: startTimeMatch ? new Date(startTimeMatch[1]) : new Date(),
    endTime: endTimeMatch ? new Date(endTimeMatch[1]) : new Date(),
    elapsed: 0,
    summary: "",
    exit: "success" as const,
  }

  // Calculate elapsed time
  runStats.elapsed = (runStats.endTime.getTime() - runStats.startTime.getTime()) / 1000

  // Extract summary
  const summaryMatch = textContent.match(/Nmap done: ([^\n]+)/)
  if (summaryMatch) {
    runStats.summary = summaryMatch[1]
  }

  // Parse each line
  for (const line of lines) {
    // New host
    if (line.match(/Nmap scan report for/)) {
      if (currentHost && Object.keys(currentHost).length > 0) {
        hosts.push(currentHost as NmapHost)
      }

      currentHost = {
        ip: "",
        status: "unknown",
        ports: [],
      }

      // Extract IP and hostname
      const ipMatch = line.match(/Nmap scan report for ([^ ]+) $$([^$$]+)\)/)
      if (ipMatch) {
        currentHost.hostname = ipMatch[1]
        currentHost.ip = ipMatch[2]
      } else {
        const simpleMatch = line.match(/Nmap scan report for ([^ ]+)/)
        if (simpleMatch) {
          currentHost.ip = simpleMatch[1]
        }
      }
    }

    // Host status
    else if (line.match(/Host is/)) {
      if (line.includes("up")) {
        if (currentHost) currentHost.status = "up"
      } else if (line.includes("down")) {
        if (currentHost) currentHost.status = "down"
      }
    }

    // MAC address
    else if (line.match(/MAC Address:/)) {
      const macMatch = line.match(/MAC Address: ([^ ]+) $$([^$$]+)\)/)
      if (macMatch && currentHost) {
        currentHost.mac = macMatch[1]
        currentHost.vendor = macMatch[2]
      }
    }

    // Port information
    else if (line.match(/^[0-9]+\/(tcp|udp)/)) {
      const portMatch = line.match(/^([0-9]+)\/(tcp|udp)\s+([^ ]+)\s+(.+)/)
      if (portMatch && currentHost) {
        currentPort = {
          port: Number.parseInt(portMatch[1], 10),
          protocol: portMatch[2] as "tcp" | "udp",
          state: portMatch[3] as any,
        }

        // Extract service info
        if (options.detectVersions && portMatch[4]) {
          const serviceInfo = portMatch[4].trim()
          currentPort.service = {
            name: serviceInfo.split(" ")[0],
            product: "",
            version: "",
            extrainfo: "",
            method: "table",
            conf: 3,
          }

          // Try to extract version info
          const versionMatch = serviceInfo.match(/([^ ]+) ([0-9.]+)/)
          if (versionMatch) {
            currentPort.service.product = versionMatch[1]
            currentPort.service.version = versionMatch[2]
          }
        }

        if (currentHost.ports) {
          currentHost.ports.push(currentPort as NmapPort)
        }
      }
    }

    // OS detection
    else if (line.match(/OS details:/)) {
      const osMatch = line.match(/OS details: (.+)/)
      if (osMatch && currentHost) {
        currentHost.os = {
          name: osMatch[1],
          accuracy: 0,
          family: "",
        }

        // Try to extract accuracy
        const accuracyMatch = line.match(/$$([0-9]+)%$$/)
        if (accuracyMatch) {
          if (currentHost.os) {
            currentHost.os.accuracy = Number.parseInt(accuracyMatch[1], 10)
          }
        }
      }
    }
  }

  // Add the last host if it exists
  if (currentHost && Object.keys(currentHost).length > 0) {
    hosts.push(currentHost as NmapHost)
  }

  // Filter hosts based on options
  const filteredHosts = hosts.filter((host) => {
    return (
      options.includeHosts === "all" ||
      (options.includeHosts === "up" && host.status === "up") ||
      (options.includeHosts === "down" && host.status === "down")
    )
  })

  return {
    hosts: filteredHosts,
    runStats,
    scanInfo,
  }
}

/**
 * Detects if the input is XML or text format and parses accordingly
 */
export function parseNmap(input: string, options: NmapParserOptions = DEFAULT_OPTIONS): NmapScan {
  // Check if input is XML
  if (input.trim().startsWith("<?xml") || input.trim().startsWith("<nmaprun")) {
    return parseNmapXML(input, options)
  } else {
    return parseNmapText(input, options)
  }
}

/**
 * Analyzes scan results for potential drift or anomalies
 */
export function analyzeDrift(
  currentScan: NmapScan,
  baselineScan: NmapScan,
): {
  newHosts: NmapHost[]
  missingHosts: NmapHost[]
  changedHosts: Array<{ host: NmapHost; changes: string[] }>
  newPorts: Array<{ host: string; port: NmapPort }>
  closedPorts: Array<{ host: string; port: NmapPort }>
  serviceChanges: Array<{ host: string; port: number; previous: string; current: string }>
} {
  const newHosts: NmapHost[] = []
  const missingHosts: NmapHost[] = []
  const changedHosts: Array<{ host: NmapHost; changes: string[] }> = []
  const newPorts: Array<{ host: string; port: NmapPort }> = []
  const closedPorts: Array<{ host: string; port: NmapPort }> = []
  const serviceChanges: Array<{ host: string; port: number; previous: string; current: string }> = []

  // Create maps for faster lookups
  const baselineHostMap = new Map<string, NmapHost>()
  for (const host of baselineScan.hosts) {
    baselineHostMap.set(host.ip, host)
  }

  const currentHostMap = new Map<string, NmapHost>()
  for (const host of currentScan.hosts) {
    currentHostMap.set(host.ip, host)
  }

  // Find new and changed hosts
  for (const [ip, host] of currentHostMap.entries()) {
    const baselineHost = baselineHostMap.get(ip)

    if (!baselineHost) {
      newHosts.push(host)
      continue
    }

    // Check for changes in the host
    const changes: string[] = []

    // Check for status changes
    if (host.status !== baselineHost.status) {
      changes.push(`Status changed from ${baselineHost.status} to ${host.status}`)
    }

    // Check for OS changes
    if (host.os?.name !== baselineHost.os?.name) {
      changes.push(`OS changed from ${baselineHost.os?.name || "unknown"} to ${host.os?.name || "unknown"}`)
    }

    // Check for hostname changes
    if (host.hostname !== baselineHost.hostname) {
      changes.push(`Hostname changed from ${baselineHost.hostname || "unknown"} to ${host.hostname || "unknown"}`)
    }

    // Check for port changes
    const baselinePortMap = new Map<number, NmapPort>()
    for (const port of baselineHost.ports) {
      baselinePortMap.set(port.port, port)
    }

    const currentPortMap = new Map<number, NmapPort>()
    for (const port of host.ports) {
      currentPortMap.set(port.port, port)

      const baselinePort = baselinePortMap.get(port.port)
      if (!baselinePort) {
        newPorts.push({ host: ip, port })
        changes.push(`New port ${port.port}/${port.protocol} (${port.service?.name || "unknown"})`)
      } else if (port.state !== baselinePort.state) {
        changes.push(`Port ${port.port}/${port.protocol} state changed from ${baselinePort.state} to ${port.state}`)
      } else if (
        port.service?.name !== baselinePort.service?.name ||
        port.service?.product !== baselinePort.service?.product ||
        port.service?.version !== baselinePort.service?.version
      ) {
        const prevService =
          `${baselinePort.service?.name || "unknown"} ${baselinePort.service?.product || ""} ${baselinePort.service?.version || ""}`.trim()
        const currService =
          `${port.service?.name || "unknown"} ${port.service?.product || ""} ${port.service?.version || ""}`.trim()

        serviceChanges.push({
          host: ip,
          port: port.port,
          previous: prevService,
          current: currService,
        })

        changes.push(`Service on port ${port.port}/${port.protocol} changed from ${prevService} to ${currService}`)
      }
    }

    // Find closed ports
    for (const [portNum, port] of baselinePortMap.entries()) {
      if (!currentPortMap.has(portNum)) {
        closedPorts.push({ host: ip, port })
        changes.push(`Port ${port.port}/${port.protocol} is no longer open`)
      }
    }

    if (changes.length > 0) {
      changedHosts.push({ host, changes })
    }
  }

  // Find missing hosts
  for (const [ip, host] of baselineHostMap.entries()) {
    if (!currentHostMap.has(ip)) {
      missingHosts.push(host)
    }
  }

  return {
    newHosts,
    missingHosts,
    changedHosts,
    newPorts,
    closedPorts,
    serviceChanges,
  }
}

/**
 * Detects potential honeypots or deception systems
 */
export function detectHoneypots(scan: NmapScan): Array<{ host: NmapHost; confidence: number; reasons: string[] }> {
  const results: Array<{ host: NmapHost; confidence: number; reasons: string[] }> = []

  for (const host of scan.hosts) {
    const reasons: string[] = []
    let confidenceScore = 0

    // Check for common honeypot signatures

    // 1. Too many open ports
    if (host.ports.length > 20) {
      reasons.push(`Unusually high number of open ports: ${host.ports.length}`)
      confidenceScore += 10
    }

    // 2. Unusual port combinations
    const portNumbers = host.ports.map((p) => p.port)
    const hasCommonPorts = [21, 22, 23, 25, 80, 443, 3389].some((p) => portNumbers.includes(p))
    const hasUnusualPorts = [1, 2, 7, 9, 11, 13, 17, 19, 37, 70, 79].some((p) => portNumbers.includes(p))

    if (hasUnusualPorts && !hasCommonPorts) {
      reasons.push("Unusual combination of open ports without common services")
      confidenceScore += 15
    }

    // 3. Inconsistent service versions
    const serviceVersions = new Map<string, Set<string>>()
    for (const port of host.ports) {
      if (port.service?.name && port.service?.product) {
        if (!serviceVersions.has(port.service.name)) {
          serviceVersions.set(port.service.name, new Set())
        }
        if (port.service.version) {
          serviceVersions.get(port.service.name)?.add(port.service.version)
        }
      }
    }

    let inconsistentVersions = false
    for (const [service, versions] of serviceVersions.entries()) {
      if (versions.size > 1) {
        reasons.push(`Inconsistent versions for ${service}: ${Array.from(versions).join(", ")}`)
        inconsistentVersions = true
      }
    }

    if (inconsistentVersions) {
      confidenceScore += 20
    }

    // 4. All services have the same response pattern
    const serviceResponses = host.ports.filter((p) => p.service?.extrainfo).map((p) => p.service?.extrainfo)

    if (serviceResponses.length > 3) {
      const uniqueResponses = new Set(serviceResponses).size
      if (uniqueResponses === 1) {
        reasons.push("All services have identical response patterns")
        confidenceScore += 25
      }
    }

    // 5. Check for known honeypot services
    const honeypotServices = ["kippo", "cowrie", "dionaea", "conpot", "glastopf"]
    for (const port of host.ports) {
      const serviceInfo =
        `${port.service?.name || ""} ${port.service?.product || ""} ${port.service?.extrainfo || ""}`.toLowerCase()

      for (const honeypot of honeypotServices) {
        if (serviceInfo.includes(honeypot)) {
          reasons.push(`Known honeypot signature detected: ${honeypot}`)
          confidenceScore += 50
          break
        }
      }
    }

    // 6. Unusual OS detection results
    if (host.os) {
      if (host.os.accuracy && host.os.accuracy < 60) {
        reasons.push(`Low OS detection accuracy: ${host.os.accuracy}%`)
        confidenceScore += 10
      }

      // Multiple different OS families detected
      if (host.os.name && host.os.name.includes(" or ")) {
        reasons.push(`Multiple conflicting OS detections: ${host.os.name}`)
        confidenceScore += 15
      }
    }

    // Add to results if confidence is high enough
    if (confidenceScore >= 30) {
      results.push({
        host,
        confidence: Math.min(confidenceScore, 100),
        reasons,
      })
    }
  }

  return results
}

/**
 * Extracts version information from service banners and script output
 */
export function extractVersionInfo(
  scan: NmapScan,
): Record<string, Array<{ host: string; port: number; service: string; version: string; details: string }>> {
  const versionInfo: Record<
    string,
    Array<{ host: string; port: number; service: string; version: string; details: string }>
  > = {}

  for (const host of scan.hosts) {
    for (const port of host.ports) {
      if (port.service) {
        const service = port.service.name

        if (!versionInfo[service]) {
          versionInfo[service] = []
        }

        const version = port.service.version || ""
        const product = port.service.product || ""
        const extrainfo = port.service.extrainfo || ""

        versionInfo[service].push({
          host: host.ip,
          port: port.port,
          service,
          version,
          details: `${product} ${version} ${extrainfo}`.trim(),
        })
      }

      // Extract additional version info from scripts
      if (port.scripts) {
        for (const [scriptId, output] of Object.entries(port.scripts)) {
          if (scriptId.includes("version") || scriptId.includes("banner")) {
            const service = port.service?.name || scriptId

            if (!versionInfo[service]) {
              versionInfo[service] = []
            }

            // Try to extract version from script output
            const versionMatch = output.match(/version: ([^\n]+)/i) || output.match(/([0-9]+\.[0-9]+\.[0-9]+)/)

            const version = versionMatch ? versionMatch[1] : ""

            versionInfo[service].push({
              host: host.ip,
              port: port.port,
              service,
              version,
              details: output.split("\n")[0],
            })
          }
        }
      }
    }
  }

  return versionInfo
}

/**
 * Generates a summary report from scan results
 */
export function generateSummaryReport(scan: NmapScan): string {
  const upHosts = scan.hosts.filter((h) => h.status === "up").length
  const totalPorts = scan.hosts.reduce((sum, host) => sum + host.ports.length, 0)
  const services = new Set<string>()

  scan.hosts.forEach((host) => {
    host.ports.forEach((port) => {
      if (port.service?.name) {
        services.add(port.service.name)
      }
    })
  })

  let report = `# NMAP Scan Summary Report\n\n`
  report += `Scan completed on ${scan.runStats.endTime.toLocaleString()}\n`
  report += `Duration: ${scan.runStats.elapsed.toFixed(2)} seconds\n\n`

  report += `## Overview\n\n`
  report += `- Hosts scanned: ${scan.hosts.length}\n`
  report += `- Hosts up: ${upHosts}\n`
  report += `- Total open ports: ${totalPorts}\n`
  report += `- Unique services: ${services.size}\n\n`

  report += `## Host Summary\n\n`

  for (const host of scan.hosts.filter((h) => h.status === "up")) {
    report += `### ${host.ip} ${host.hostname ? `(${host.hostname})` : ""}\n\n`

    if (host.os?.name) {
      report += `OS: ${host.os.name} (${host.os.accuracy || 0}% confidence)\n\n`
    }

    if (host.mac) {
      report += `MAC: ${host.mac} ${host.vendor ? `(${host.vendor})` : ""}\n\n`
    }

    if (host.ports.length > 0) {
      report += `| Port | State | Service | Version |\n`
      report += `|------|-------|---------|----------|\n`

      for (const port of host.ports) {
        const service = port.service?.name || ""
        const version = [port.service?.product || "", port.service?.version || "", port.service?.extrainfo || ""]
          .filter(Boolean)
          .join(" ")

        report += `| ${port.port}/${port.protocol} | ${port.state} | ${service} | ${version} |\n`
      }

      report += `\n`
    } else {
      report += `No open ports found.\n\n`
    }
  }

  return report
}

export default {
  parseNmapXML,
  parseNmapText,
  parseNmap,
  analyzeDrift,
  detectHoneypots,
  extractVersionInfo,
  generateSummaryReport,
}
