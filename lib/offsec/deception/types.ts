/** Deception mesh types. Defensive only. All events flow to Heimdall IDS. */

export type DecoyKind = "usb" | "serial" | "service" | "route" | "canary"

export interface Decoy {
  id: string
  kind: DecoyKind
  label: string
  /** Emulated interface surface descriptor (e.g. "COM3", "/dev/ttyUSB-decoy", removable "E:"). */
  surface: string
  /** Believable banner/handshake presented to attacker tooling. */
  banner?: string
  /** Tarpit slow-drip delay in ms for automated scanners. */
  tarpitMs?: number
  createdAt: string
  hits: number
  lastHitAt?: string
  engagementId?: string
  active: boolean
}

export interface CanaryToken {
  id: string
  label: string
  /** The planted secret-looking value (NOT a real secret). */
  token: string
  placement: string
  createdAt: string
  triggered: boolean
  triggeredAt?: string
  engagementId?: string
}

export interface CapturedSample {
  id: string
  sha256: string
  sizeBytes: number
  filename?: string
  mime?: string
  decoyId?: string
  engagementId?: string
  capturedAt: string
  /** Quarantine path under local-data (gitignored). */
  quarantinePath: string
  metadata: Record<string, unknown>
  vt?: {
    submitted: boolean
    submittedAt?: string
    permalink?: string
    positives?: number
    total?: number
    note?: string
  }
}

export interface AttackerProfile {
  id: string
  fingerprint: string
  firstSeen: string
  lastSeen: string
  hitCount: number
  tooling: string[]
  ttps: string[]
  timingMs: number[]
  sourceHints: string[]
}

export interface DeceptionEvent {
  id: string
  ts: string
  kind: "decoy_hit" | "canary_trigger" | "sample_capture" | "scan"
  decoyId?: string
  canaryId?: string
  sampleSha256?: string
  message: string
  severity: "info" | "low" | "medium" | "high" | "critical"
  fingerprint?: string
  meta?: Record<string, unknown>
}
