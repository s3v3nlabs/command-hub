export interface Message {
  id: string
  content: string
  timestamp: Date
  sender: "user" | "ai"
  type: "text" | "code" | "system"
  metadata?: {
    tokens?: number
    model?: string
    processingTime?: number
  }
}

export interface FrameMetadata {
  sourcePingCount: number
  syncState: "synced" | "syncing" | "offline" | "error"
  mirrorStatus: "none" | "mirroring" | "mirrored"
  timestampDrift: number
  lastActivity: Date
  memoryUsage: number
  connectionQuality: "excellent" | "good" | "poor" | "critical"
}

export interface Frame {
  id: string
  title: string
  messages: Message[]
  metadata: FrameMetadata
  position: { x: number; y: number }
  size: { width: number; height: number }
  isActive: boolean
  isMinimized: boolean
  inputMode: "filtered" | "raw"
  theme: FrameTheme
  /** Preferred S3v3n panel seat (local-first). Wired from frame templates. */
  preferSeat?: string
  /** Template id if created from a FrameTemplate. */
  templateId?: string
  /** When true, SEND is blocked (system ack only). Toggle via Mute / Reveal. */
  isMuted?: boolean
  /** Source frame id when this frame is a Mirror copy. */
  mirrorSourceId?: string
}

export interface FrameTheme {
  name: string
  primary: string
  background: string
  messageUser: string
  messageAI: string
  toolbar: string
  metadata: string
}

export interface BridgePayload {
  frameId: string
  action: "send" | "mirror" | "fork" | "sync"
  data: any
  timestamp: Date
  signature?: string
}
