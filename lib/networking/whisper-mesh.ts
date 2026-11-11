/**
 * WhisperMesh - Secure Command Hub to Command Hub Communication
 * Encrypted, decentralized networking for sovereign operations
 */

import { createHash, randomBytes, createCipher, createDecipher } from "crypto"
import { EventEmitter } from "events"

export interface WhisperNode {
  id: string
  publicKey: string
  address: string
  port: number
  lastSeen: number
  trustLevel: number
  capabilities: string[]
  location?: {
    lat: number
    lng: number
    city?: string
    country?: string
  }
}

export interface WhisperMessage {
  id: string
  from: string
  to: string | null // null for broadcast
  type: "data" | "command" | "sync" | "heartbeat" | "alert"
  payload: any
  timestamp: number
  signature: string
  encrypted: boolean
  priority: "low" | "normal" | "high" | "critical"
}

export interface NetworkTopology {
  nodes: Map<string, WhisperNode>
  connections: Map<string, string[]>
  routes: Map<string, string[]>
}

export class WhisperMesh extends EventEmitter {
  private nodeId: string
  private privateKey: string
  private publicKey: string
  private nodes: Map<string, WhisperNode> = new Map()
  private connections: Map<string, WebSocket> = new Map()
  private server: any = null
  private port: number
  private encryptionKey: string
  private isRunning = false

  constructor(port = 8080) {
    super()
    this.port = port
    this.nodeId = this.generateNodeId()
    this.generateKeyPair()
    this.encryptionKey = this.generateEncryptionKey()

    console.log(`⚬ WHISPERMESH NODE INITIALIZED: ${this.nodeId} ⚬`)
  }

  private generateNodeId(): string {
    const timestamp = Date.now().toString(36)
    const random = randomBytes(8).toString("hex")
    return `WHISPER-${timestamp}-${random}`.toUpperCase()
  }

  private generateKeyPair(): void {
    // In production, use proper asymmetric encryption
    this.privateKey = randomBytes(32).toString("hex")
    this.publicKey = createHash("sha256").update(this.privateKey).digest("hex")
  }

  private generateEncryptionKey(): string {
    return randomBytes(32).toString("hex")
  }

  async startNode(): Promise<void> {
    if (this.isRunning) return

    try {
      // Start WebSocket server
      const WebSocket = require("ws")
      this.server = new WebSocket.Server({ port: this.port })

      this.server.on("connection", (ws: any, req: any) => {
        this.handleNewConnection(ws, req)
      })

      this.server.on("error", (error: any) => {
        console.error("WhisperMesh server error:", error)
      })

      // Start discovery and maintenance
      this.startNodeDiscovery()
      this.startHeartbeat()
      this.startNetworkMaintenance()

      this.isRunning = true
      console.log(`⚬ WHISPERMESH SERVER STARTED ON PORT ${this.port} ⚬`)
    } catch (error) {
      console.error("Failed to start WhisperMesh node:", error)
      throw error
    }
  }

  private handleNewConnection(ws: any, req: any): void {
    const remoteAddress = req.socket.remoteAddress
    console.log(`⚬ NEW CONNECTION FROM: ${remoteAddress} ⚬`)

    ws.on("message", (data: Buffer) => {
      try {
        const message = this.decryptMessage(data.toString())
        this.handleMessage(message, ws)
      } catch (error) {
        console.error("Failed to process message:", error)
      }
    })

    ws.on("close", () => {
      console.log(`⚬ CONNECTION CLOSED: ${remoteAddress} ⚬`)
      this.handleConnectionClose(ws)
    })

    ws.on("error", (error: any) => {
      console.error("WebSocket error:", error)
    })

    // Send handshake
    this.sendHandshake(ws)
  }

  private sendHandshake(ws: any): void {
    const handshake = {
      type: "handshake",
      nodeId: this.nodeId,
      publicKey: this.publicKey,
      capabilities: [
        "liam-erd",
        "kepler-maps",
        "heimdal-ai",
        "signal-frame",
        "osint-analysis",
        "threat-detection",
        "pattern-recognition",
      ],
      timestamp: Date.now(),
    }

    const encrypted = this.encryptMessage(handshake)
    ws.send(encrypted)
  }

  private handleMessage(message: WhisperMessage, ws: any): void {
    switch (message.type) {
      case "data":
        this.handleDataMessage(message)
        break
      case "command":
        this.handleCommandMessage(message)
        break
      case "sync":
        this.handleSyncMessage(message)
        break
      case "heartbeat":
        this.handleHeartbeat(message)
        break
      case "alert":
        this.handleAlert(message)
        break
      default:
        console.warn("Unknown message type:", message.type)
    }

    // Emit event for application layer
    this.emit("message", message)
  }

  private handleDataMessage(message: WhisperMessage): void {
    // Handle data sharing between command hubs
    console.log(`⚬ DATA MESSAGE FROM ${message.from} ⚬`)

    // Process different data types
    if (message.payload.type === "liam-entity") {
      this.emit("liam-entity", message.payload.data)
    } else if (message.payload.type === "kepler-data") {
      this.emit("kepler-data", message.payload.data)
    } else if (message.payload.type === "osint-intel") {
      this.emit("osint-intel", message.payload.data)
    }
  }

  private handleCommandMessage(message: WhisperMessage): void {
    console.log(`⚬ COMMAND MESSAGE FROM ${message.from}: ${message.payload.command} ⚬`)

    // Execute remote commands securely
    this.emit("remote-command", {
      from: message.from,
      command: message.payload.command,
      args: message.payload.args,
    })
  }

  private handleSyncMessage(message: WhisperMessage): void {
    // Handle database synchronization
    console.log(`⚬ SYNC MESSAGE FROM ${message.from} ⚬`)
    this.emit("sync-request", message.payload)
  }

  private handleHeartbeat(message: WhisperMessage): void {
    // Update node status
    const node = this.nodes.get(message.from)
    if (node) {
      node.lastSeen = Date.now()
      this.nodes.set(message.from, node)
    }
  }

  private handleAlert(message: WhisperMessage): void {
    console.log(`⚠ ALERT FROM ${message.from}: ${message.payload.alert} ⚠`)

    // Handle security alerts, threat notifications, etc.
    this.emit("security-alert", {
      from: message.from,
      alert: message.payload.alert,
      severity: message.payload.severity,
      data: message.payload.data,
    })
  }

  async connectToNode(address: string, port: number): Promise<boolean> {
    try {
      const WebSocket = require("ws")
      const ws = new WebSocket(`ws://${address}:${port}`)

      return new Promise((resolve, reject) => {
        ws.on("open", () => {
          console.log(`⚬ CONNECTED TO NODE: ${address}:${port} ⚬`)
          this.connections.set(`${address}:${port}`, ws)

          ws.on("message", (data: Buffer) => {
            try {
              const message = this.decryptMessage(data.toString())
              this.handleMessage(message, ws)
            } catch (error) {
              console.error("Failed to process message:", error)
            }
          })

          resolve(true)
        })

        ws.on("error", (error: any) => {
          console.error(`Failed to connect to ${address}:${port}:`, error)
          reject(error)
        })

        ws.on("close", () => {
          console.log(`⚬ DISCONNECTED FROM NODE: ${address}:${port} ⚬`)
          this.connections.delete(`${address}:${port}`)
        })
      })
    } catch (error) {
      console.error("Connection failed:", error)
      return false
    }
  }

  async broadcastMessage(
    type: WhisperMessage["type"],
    payload: any,
    priority: WhisperMessage["priority"] = "normal",
  ): Promise<void> {
    const message: WhisperMessage = {
      id: randomBytes(16).toString("hex"),
      from: this.nodeId,
      to: null, // broadcast
      type,
      payload,
      timestamp: Date.now(),
      signature: this.signMessage(payload),
      encrypted: true,
      priority,
    }

    const encrypted = this.encryptMessage(message)

    // Send to all connected nodes
    for (const [nodeAddress, ws] of this.connections) {
      try {
        if (ws.readyState === 1) {
          // WebSocket.OPEN
          ws.send(encrypted)
        }
      } catch (error) {
        console.error(`Failed to send to ${nodeAddress}:`, error)
      }
    }

    console.log(`⚬ BROADCAST MESSAGE: ${type} | Priority: ${priority} ⚬`)
  }

  async sendDirectMessage(targetNodeId: string, type: WhisperMessage["type"], payload: any): Promise<boolean> {
    const message: WhisperMessage = {
      id: randomBytes(16).toString("hex"),
      from: this.nodeId,
      to: targetNodeId,
      type,
      payload,
      timestamp: Date.now(),
      signature: this.signMessage(payload),
      encrypted: true,
      priority: "normal",
    }

    // Find route to target node
    const route = this.findRoute(targetNodeId)
    if (!route || route.length === 0) {
      console.error(`No route to node: ${targetNodeId}`)
      return false
    }

    const nextHop = route[0]
    const ws = this.connections.get(nextHop)

    if (!ws || ws.readyState !== 1) {
      console.error(`No connection to next hop: ${nextHop}`)
      return false
    }

    try {
      const encrypted = this.encryptMessage(message)
      ws.send(encrypted)
      console.log(`⚬ DIRECT MESSAGE SENT TO ${targetNodeId} VIA ${nextHop} ⚬`)
      return true
    } catch (error) {
      console.error("Failed to send direct message:", error)
      return false
    }
  }

  private findRoute(targetNodeId: string): string[] {
    // Implement routing algorithm (simplified)
    // In production, use proper routing protocols
    const routes = new Map<string, string[]>()

    // For now, return direct connection if available
    for (const [nodeAddress] of this.connections) {
      const node = Array.from(this.nodes.values()).find((n) => `${n.address}:${n.port}` === nodeAddress)
      if (node && node.id === targetNodeId) {
        return [nodeAddress]
      }
    }

    return []
  }

  private encryptMessage(message: any): string {
    const jsonStr = JSON.stringify(message)
    const cipher = createCipher("aes-256-gcm", this.encryptionKey)

    let encrypted = cipher.update(jsonStr, "utf8", "hex")
    encrypted += cipher.final("hex")

    return encrypted
  }

  private decryptMessage(encryptedData: string): WhisperMessage {
    const decipher = createDecipher("aes-256-gcm", this.encryptionKey)

    let decrypted = decipher.update(encryptedData, "hex", "utf8")
    decrypted += decipher.final("utf8")

    return JSON.parse(decrypted)
  }

  private signMessage(payload: any): string {
    const payloadStr = JSON.stringify(payload)
    return createHash("sha256")
      .update(payloadStr + this.privateKey)
      .digest("hex")
  }

  private startNodeDiscovery(): void {
    // Implement node discovery (mDNS, DHT, etc.)
    setInterval(() => {
      this.discoverNodes()
    }, 30000) // Every 30 seconds
  }

  private startHeartbeat(): void {
    setInterval(() => {
      this.broadcastMessage("heartbeat", {
        nodeId: this.nodeId,
        timestamp: Date.now(),
        status: "active",
      })
    }, 60000) // Every minute
  }

  private startNetworkMaintenance(): void {
    setInterval(() => {
      this.cleanupStaleNodes()
      this.optimizeRoutes()
    }, 300000) // Every 5 minutes
  }

  private discoverNodes(): void {
    // Implement node discovery logic
    console.log("⚬ DISCOVERING NODES ⚬")
  }

  private cleanupStaleNodes(): void {
    const now = Date.now()
    const staleThreshold = 300000 // 5 minutes

    for (const [nodeId, node] of this.nodes) {
      if (now - node.lastSeen > staleThreshold) {
        console.log(`⚬ REMOVING STALE NODE: ${nodeId} ⚬`)
        this.nodes.delete(nodeId)
      }
    }
  }

  private optimizeRoutes(): void {
    // Implement route optimization
    console.log("⚬ OPTIMIZING ROUTES ⚬")
  }

  private handleConnectionClose(ws: any): void {
    // Clean up connection
    for (const [nodeAddress, connection] of this.connections) {
      if (connection === ws) {
        this.connections.delete(nodeAddress)
        break
      }
    }
  }

  async stopNode(): Promise<void> {
    if (!this.isRunning) return

    // Close all connections
    for (const ws of this.connections.values()) {
      ws.close()
    }
    this.connections.clear()

    // Close server
    if (this.server) {
      this.server.close()
    }

    this.isRunning = false
    console.log("⚬ WHISPERMESH NODE STOPPED ⚬")
  }

  getNetworkTopology(): NetworkTopology {
    const connections = new Map<string, string[]>()
    const routes = new Map<string, string[]>()

    // Build topology map
    for (const [nodeId] of this.nodes) {
      connections.set(nodeId, [])
      routes.set(nodeId, [])
    }

    return {
      nodes: this.nodes,
      connections,
      routes,
    }
  }

  getNodeStats() {
    return {
      nodeId: this.nodeId,
      connectedNodes: this.connections.size,
      knownNodes: this.nodes.size,
      isRunning: this.isRunning,
      port: this.port,
      uptime: Date.now(), // Would track actual uptime
    }
  }
}

export default WhisperMesh
