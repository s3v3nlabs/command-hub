export interface FrameMessage {
  id: string
  content: string
  timestamp: Date
  type: "user" | "assistant" | "system"
  metadata?: {
    tokens?: number
    model?: string
    latency?: number
  }
}

export interface FrameMetadata {
  sourcePingCount: number
  syncState: "synced" | "syncing" | "offline" | "error"
  mirrorStatus: "active" | "inactive" | "pending"
  timestampDrift: number
  lastActivity: Date
  memoryContext: string[]
}

export interface Frame {
  id: string
  title: string
  messages: FrameMessage[]
  metadata: FrameMetadata
  isActive: boolean
  position: { x: number; y: number }
  size: { width: number; height: number }
}

export interface BridgePayload {
  frameId: string
  action: "send" | "mirror" | "fork" | "mute" | "reveal"
  data: any
  timestamp: Date
}
