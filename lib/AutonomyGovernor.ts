interface AuthorizationResult {
  authorized: boolean
  reason: string
  timestamp: string
  commanderId?: string
}

/**
 * Checks if an action is authorized based on current governor mode
 */
export function authorize(action: string): AuthorizationResult {
  const governorMode = process.env.GOVERNOR_MODE || "gatekeeper"
  const blackframeMode = process.env.BLACKFRAME_MODE || "autonomy"
  const replayApprovedOnly = process.env.REPLAY_APPROVED_ONLY === "true"

  // Mock commander approval check
  const hasCommanderApproval = Math.random() > 0.3 // 70% chance of approval for demo

  // In passive mode, no actions are authorized automatically
  if (blackframeMode === "passive") {
    return {
      authorized: false,
      reason: "BLACKFRAME is in passive mode, all actions require manual approval",
      timestamp: new Date().toISOString(),
    }
  }

  // In gatekeeper mode, critical actions require commander approval
  if (governorMode === "gatekeeper" && isCriticalAction(action)) {
    if (hasCommanderApproval) {
      return {
        authorized: true,
        reason: "Critical action approved by commander",
        timestamp: new Date().toISOString(),
        commanderId: "CMD-" + Math.floor(Math.random() * 1000),
      }
    } else {
      return {
        authorized: false,
        reason: "Critical action requires commander approval",
        timestamp: new Date().toISOString(),
      }
    }
  }

  // In autonomy mode with replay approval required
  if (replayApprovedOnly && action.includes("heal")) {
    return {
      authorized: hasCommanderApproval,
      reason: hasCommanderApproval
        ? "Healing action approved after replay verification"
        : "Healing action requires replay verification and approval",
      timestamp: new Date().toISOString(),
      commanderId: hasCommanderApproval ? "CMD-" + Math.floor(Math.random() * 1000) : undefined,
    }
  }

  // Default case: authorized in autonomy mode
  return {
    authorized: true,
    reason: "Action authorized under current autonomy settings",
    timestamp: new Date().toISOString(),
  }
}

/**
 * Determines if an action is considered critical
 */
function isCriticalAction(action: string): boolean {
  const criticalKeywords = [
    "delete",
    "remove",
    "reset",
    "overwrite",
    "purge",
    "critical",
    "emergency",
    "override",
    "heal",
    "repair",
  ]

  return criticalKeywords.some((keyword) => action.toLowerCase().includes(keyword))
}
