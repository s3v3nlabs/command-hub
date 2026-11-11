/**
 * CMDHUB-04 // AUTONOMY LAYER
 * Type definitions for agent system
 */

export interface AgentResponse {
  status: "processed" | "error" | "pending"
  routing: any
  timestamp: number
  drift: DriftReport
  message?: string
  data?: any
}

export interface DriftReport {
  isDrifting: boolean
  reason: string
  severity: "none" | "low" | "medium" | "high" | "critical"
  details?: any
}

export interface AgentCommand {
  type: string
  payload: any
  source: string
  timestamp: number
  priority: "low" | "medium" | "high" | "critical"
}

export interface AgentState {
  isActive: boolean
  currentMode: "normal" | "maintenance" | "emergency" | "offline"
  lastActivity: number
  pendingCommands: number
  driftStatus: DriftReport
}
