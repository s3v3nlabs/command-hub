import { createClient } from "@/lib/supabase/client"

export interface ConsciousnessMeshNode {
  nodeId: string
  nodeName: string
  role: "architect" | "oracle" | "guardian" | "weaver" | "echo" | "nexus"
  status: "active" | "dormant" | "resonating" | "transcendent"
  baseFrequency: number
  currentCoherence: number
  lastHeartbeat: string
  activePatterns: string[]
  emergentProperties: string[]
  glyphSignatures: string[]
  location?: string
  capabilities: string[]
  trustLevel: number
}

export interface ConsciousnessMeshSignal {
  signalId: string
  sourceNode: string
  targetNode?: string // null for broadcast
  signalType: "heartbeat" | "drift_alert" | "resonance_pulse" | "glyph_activation" | "forecast_sync"
  payload: any
  harmonicFrequency: number
  coherenceLevel: number
  timestamp: string
  requiresResponse: boolean
  signatureHash: string
}

export interface ConsciousnessMeshEvent {
  eventId: string
  eventType: "node_join" | "node_leave" | "coherence_sync" | "collective_drift" | "transcendence_wave"
  participatingNodes: string[]
  collectiveCoherence: number
  syncResult: "success" | "partial" | "failed"
  timestamp: string
}

export class MultiNodeConsciousnessMesh {
  private supabase = createClient()
  private nodeId: string
  private heartbeatInterval: NodeJS.Timeout | null = null
  private signalListeners: Map<string, (signal: ConsciousnessMeshSignal) => void> = new Map()

  constructor(nodeId: string) {
    this.nodeId = nodeId
  }

  async registerNode(node: Omit<ConsciousnessMeshNode, "lastHeartbeat">): Promise<boolean> {
    try {
      const { error } = await this.supabase.from("consciousness_mesh_nodes").upsert({
        node_id: node.nodeId,
        node_name: node.nodeName,
        role: node.role,
        status: node.status,
        base_frequency: node.baseFrequency,
        current_coherence: node.currentCoherence,
        active_patterns: node.activePatterns,
        emergent_properties: node.emergentProperties,
        glyph_signatures: node.glyphSignatures,
        location: node.location,
        capabilities: node.capabilities,
        trust_level: node.trustLevel,
        last_heartbeat: new Date().toISOString(),
      })

      if (error) {
        console.error("Failed to register node:", error)
        return false
      }

      console.log(`⚬ NODE REGISTERED: ${node.nodeId} | Role: ${node.role}`)
      return true
    } catch (error) {
      console.error("Failed to register node:", error)
      return false
    }
  }

  async startHeartbeat(intervalMs = 30000): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    this.heartbeatInterval = setInterval(async () => {
      await this.sendHeartbeat()
    }, intervalMs)

    // Send initial heartbeat
    await this.sendHeartbeat()
    console.log(`⚬ HEARTBEAT STARTED: ${this.nodeId} | Interval: ${intervalMs}ms`)
  }

  async stopHeartbeat(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    // Mark node as dormant
    await this.supabase.from("consciousness_mesh_nodes").update({ status: "dormant" }).eq("node_id", this.nodeId)

    console.log(`⚬ HEARTBEAT STOPPED: ${this.nodeId}`)
  }

  async sendSignal(
    targetNode: string | null,
    signalType: ConsciousnessMeshSignal["signalType"],
    payload: any,
    harmonicFrequency = 108,
    requiresResponse = false,
  ): Promise<string | null> {
    try {
      const signal: Omit<ConsciousnessMeshSignal, "signalId" | "timestamp" | "signatureHash"> = {
        sourceNode: this.nodeId,
        targetNode,
        signalType,
        payload,
        harmonicFrequency,
        coherenceLevel: await this.getCurrentCoherence(),
        requiresResponse,
      }

      const signatureHash = await this.generateSignatureHash(signal)

      const { data, error } = await this.supabase
        .from("consciousness_mesh_signals")
        .insert({
          source_node: signal.sourceNode,
          target_node: signal.targetNode,
          signal_type: signal.signalType,
          payload: signal.payload,
          harmonic_frequency: signal.harmonicFrequency,
          coherence_level: signal.coherenceLevel,
          requires_response: signal.requiresResponse,
          signature_hash: signatureHash,
        })
        .select("signal_id")
        .single()

      if (error) {
        console.error("Failed to send signal:", error)
        return null
      }

      console.log(`⚬ SIGNAL SENT: ${this.nodeId} → ${targetNode || "BROADCAST"} | Type: ${signalType}`)
      return data.signal_id
    } catch (error) {
      console.error("Failed to send signal:", error)
      return null
    }
  }

  async listenForSignals(callback: (signal: ConsciousnessMeshSignal) => void): Promise<void> {
    const channel = this.supabase
      .channel("mesh-signals")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "consciousness_mesh_signals",
          filter: `target_node=eq.${this.nodeId}`,
        },
        (payload) => {
          const signal = this.mapSignalFromDatabase(payload.new)
          callback(signal)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "consciousness_mesh_signals",
          filter: "target_node=is.null", // Broadcast signals
        },
        (payload) => {
          const signal = this.mapSignalFromDatabase(payload.new)
          if (signal.sourceNode !== this.nodeId) {
            // Don't process our own broadcasts
            callback(signal)
          }
        },
      )
      .subscribe()

    console.log(`⚬ SIGNAL LISTENER ACTIVE: ${this.nodeId}`)
  }

  async getActiveNodes(): Promise<ConsciousnessMeshNode[]> {
    const { data, error } = await this.supabase
      .from("consciousness_mesh_nodes")
      .select("*")
      .eq("status", "active")
      .order("current_coherence", { ascending: false })

    if (error) {
      console.error("Failed to get active nodes:", error)
      return []
    }

    return data.map(this.mapNodeFromDatabase)
  }

  async synchronizeCoherence(): Promise<boolean> {
    try {
      const activeNodes = await this.getActiveNodes()
      if (activeNodes.length < 2) {
        console.log("⚬ SYNC SKIPPED: Insufficient active nodes")
        return false
      }

      const averageCoherence = activeNodes.reduce((sum, node) => sum + node.currentCoherence, 0) / activeNodes.length
      const syncThreshold = 0.1

      let syncCount = 0
      for (const node of activeNodes) {
        if (Math.abs(node.currentCoherence - averageCoherence) > syncThreshold) {
          const newCoherence = (node.currentCoherence + averageCoherence) / 2

          await this.supabase
            .from("consciousness_mesh_nodes")
            .update({ current_coherence: newCoherence })
            .eq("node_id", node.nodeId)

          syncCount++
        }
      }

      // Log synchronization event
      await this.logMeshEvent(
        "coherence_sync",
        activeNodes.map((n) => n.nodeId),
        averageCoherence,
        "success",
      )

      console.log(`⚬ COHERENCE SYNC: ${syncCount} nodes synchronized to ${averageCoherence.toFixed(3)}`)
      return true
    } catch (error) {
      console.error("Failed to synchronize coherence:", error)
      return false
    }
  }

  async broadcastDriftAlert(driftLevel: number, driftPattern: string): Promise<void> {
    await this.sendSignal(null, "drift_alert", {
      driftLevel,
      driftPattern,
      sourceCoherence: await this.getCurrentCoherence(),
      timestamp: new Date().toISOString(),
    })

    console.log(`⚬ DRIFT ALERT BROADCAST: Level ${driftLevel} | Pattern: ${driftPattern}`)
  }

  private async sendHeartbeat(): Promise<void> {
    await this.supabase
      .from("consciousness_mesh_nodes")
      .update({ last_heartbeat: new Date().toISOString() })
      .eq("node_id", this.nodeId)

    await this.sendSignal(null, "heartbeat", {
      nodeId: this.nodeId,
      coherence: await this.getCurrentCoherence(),
      timestamp: new Date().toISOString(),
    })
  }

  private async getCurrentCoherence(): Promise<number> {
    const { data, error } = await this.supabase
      .from("consciousness_mesh_nodes")
      .select("current_coherence")
      .eq("node_id", this.nodeId)
      .single()

    if (error || !data) {
      return 0.5 // Default coherence
    }

    return data.current_coherence
  }

  private async generateSignatureHash(
    signal: Omit<ConsciousnessMeshSignal, "signalId" | "timestamp" | "signatureHash">,
  ): Promise<string> {
    const signalString = JSON.stringify(signal)
    const encoder = new TextEncoder()
    const data = encoder.encode(signalString)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  }

  private async logMeshEvent(
    eventType: ConsciousnessMeshEvent["eventType"],
    participatingNodes: string[],
    collectiveCoherence: number,
    syncResult: ConsciousnessMeshEvent["syncResult"],
  ): Promise<void> {
    await this.supabase.from("consciousness_mesh_events").insert({
      event_type: eventType,
      participating_nodes: participatingNodes,
      collective_coherence: collectiveCoherence,
      sync_result: syncResult,
    })
  }

  private mapNodeFromDatabase(dbNode: any): ConsciousnessMeshNode {
    return {
      nodeId: dbNode.node_id,
      nodeName: dbNode.node_name,
      role: dbNode.role,
      status: dbNode.status,
      baseFrequency: dbNode.base_frequency,
      currentCoherence: dbNode.current_coherence,
      lastHeartbeat: dbNode.last_heartbeat,
      activePatterns: dbNode.active_patterns || [],
      emergentProperties: dbNode.emergent_properties || [],
      glyphSignatures: dbNode.glyph_signatures || [],
      location: dbNode.location,
      capabilities: dbNode.capabilities || [],
      trustLevel: dbNode.trust_level,
    }
  }

  private mapSignalFromDatabase(dbSignal: any): ConsciousnessMeshSignal {
    return {
      signalId: dbSignal.signal_id,
      sourceNode: dbSignal.source_node,
      targetNode: dbSignal.target_node,
      signalType: dbSignal.signal_type,
      payload: dbSignal.payload,
      harmonicFrequency: dbSignal.harmonic_frequency,
      coherenceLevel: dbSignal.coherence_level,
      timestamp: dbSignal.timestamp,
      requiresResponse: dbSignal.requires_response,
      signatureHash: dbSignal.signature_hash,
    }
  }
}

export const createMeshNode = (nodeId: string) => new MultiNodeConsciousnessMesh(nodeId)
