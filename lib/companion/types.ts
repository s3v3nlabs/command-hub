/**
 * Device Bridge types — phone ↔ hub WebRTC + telemetry.
 *
 * Credit: Christian Wilford (s3v3n), AI Architect, Offensive Security Enthusiast,
 * Founder of Singular/ty Defense Solutions, LLC.
 */

export type CompanionRole = "phone" | "hub"

export type SignalKind =
  | "offer"
  | "answer"
  | "ice"
  | "hangup"
  | "media-state"
  | "navigate"
  | "presence"

export interface MediaState {
  phoneCam?: boolean
  phoneMic?: boolean
  hubCam?: boolean
  hubMic?: boolean
}

export interface CompanionTelemetry {
  ts: string
  geo?: {
    lat: number
    lon: number
    accuracy?: number
    altitude?: number
    heading?: number
    speed?: number
  }
  battery?: {
    level: number
    charging?: boolean
  }
  network?: {
    type?: string
    effectiveType?: string
    downlink?: number
    rtt?: number
  }
  label?: string
}

export interface CompanionSession {
  id: string
  label: string
  createdAt: string
  updatedAt: string
  expiresAt: string
  phoneJoinedAt?: string
  hubJoinedAt?: string
  endedAt?: string
  media: MediaState
  lastTelemetry?: CompanionTelemetry
  /** Cosmetic only — no lattice transport is implied. */
  lattice_sync: false
}

export interface SignalEnvelope {
  id: string
  seq: number
  sessionId: string
  from: CompanionRole
  kind: SignalKind
  payload: unknown
  ts: string
}

export interface CompanionTicket {
  /** sha256 hex of the raw ticket. The raw value is shown once. */
  hash: string
  sessionId: string
  role: CompanionRole
  createdAt: string
  expiresAt: string
}

export interface PublicCompanionStatus {
  ok: true
  surface: "companion"
  authRequired: boolean
  secureMode: boolean
  tokenConfigured: boolean
  liveSessionCount: number
  httpsRequired: true
  httpsHint: string
  limits: {
    webrtc: string
    stun: string
    turn: string
    signaling: string
    oneViewer: string
  }
  features: {
    phoneCam: true
    phoneMic: true
    telemetry: true
    hubCam: true
    remoteActions: string[]
  }
}

export const COMPANION_HTTPS_HINT =
  "Camera, microphone, and geolocation require a secure context: HTTPS, or http://localhost / http://127.0.0.1 for lab use. A raw LAN IP over HTTP will be blocked by the browser."

export const COMPANION_LIMITS = {
  webrtc: "Browser WebRTC only (RTP over ICE). Not an SFU or mesh.",
  stun: "Optional public STUN (stun.l.google.com:19302) for NAT traversal. Same-LAN and Tailscale usually work on host candidates alone.",
  turn: "No TURN server is shipped. Symmetric NAT or strict firewalls will fail — put both ends on the same Tailscale/LAN network.",
  signaling: "SDP/ICE are exchanged over SSE+POST in this Node process. Multi-instance / serverless deploys will not share the signaling bus.",
  oneViewer: "One phone and one hub viewer per session. Opening a second viewer steals the seat. The CCTV wall lists live bodycams and links here rather than embedding a second peer.",
} as const

export const FIELD_MODULES: Array<{ id: string; name: string; path: string }> = [
  { id: "hub-view", name: "Bridge viewer", path: "/companion/hub-view" },
  { id: "cctv", name: "CCTV Wall", path: "/intelligence/cctv" },
  { id: "operator", name: "Operator", path: "/operator" },
  { id: "offsec", name: "OffSec Arsenal", path: "/offsec" },
  { id: "signalframe", name: "SignalFrame", path: "/signalframe" },
  { id: "marketplace", name: "Marketplace", path: "/marketplace" },
  { id: "workspaces", name: "Workspaces", path: "/workspaces" },
  { id: "dev-operator", name: "Dev Operator", path: "/dev-operator" },
  { id: "android-lab", name: "Android Lab", path: "/offsec/android-lab" },
  { id: "compute", name: "Compute", path: "/compute" },
  { id: "help", name: "Help", path: "/help" },
  { id: "home", name: "Hub home", path: "/" },
]
