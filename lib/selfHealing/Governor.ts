/**
 * Authorizes an action based on environment settings
 * @param action The action to authorize
 * @param metadata Additional metadata about the action
 * @returns Authorization result with approval status and reason
 */
export function authorize(action: string, metadata?: any) {
  // Check environment variables
  const replayApprovedOnly = process.env.REPLAY_APPROVED_ONLY === "true"
  const governorMode = process.env.GOVERNOR_MODE || "gatekeeper"
  const blackframeMode = process.env.BLACKFRAME_MODE || "autonomy"

  // Default to not approved
  let approved = false
  let reason = "Default denial: explicit approval required"

  // Check if action has explicit approval flag in metadata
  const hasApproval = metadata?.approved === true

  // Determine approval based on modes and settings
  if (blackframeMode === "manual") {
    // Manual mode always requires explicit approval
    approved = hasApproval
    reason = approved ? "Explicitly approved in manual mode" : "Manual mode requires explicit approval"
  } else if (blackframeMode === "passive") {
    // Passive mode allows monitoring actions but not modifications
    const isMonitoringAction = ["monitor", "analyze", "report", "log"].includes(action.toLowerCase())
    approved = isMonitoringAction || hasApproval
    reason = approved
      ? isMonitoringAction
        ? "Monitoring action allowed in passive mode"
        : "Explicitly approved"
      : "Passive mode only allows monitoring actions without approval"
  } else if (blackframeMode === "autonomy") {
    // Autonomy mode behavior depends on governor mode
    if (governorMode === "gatekeeper" && replayApprovedOnly) {
      // Gatekeeper with replay approval requires explicit approval
      approved = hasApproval
      reason = approved
        ? "Explicitly approved by gatekeeper"
        : "Gatekeeper requires explicit approval when REPLAY_APPROVED_ONLY is true"
    } else if (governorMode === "gatekeeper") {
      // Gatekeeper without replay approval allows low-risk actions
      const isLowRiskAction = ["monitor", "analyze", "report", "log", "retry"].includes(action.toLowerCase())
      approved = isLowRiskAction || hasApproval
      reason = approved
        ? isLowRiskAction
          ? "Low-risk action allowed by gatekeeper"
          : "Explicitly approved"
        : "High-risk action requires explicit approval from gatekeeper"
    } else {
      // Default autonomy mode allows most actions
      const isHighRiskAction = ["delete", "remove", "reset", "purge", "rebuild"].includes(action.toLowerCase())
      approved = !isHighRiskAction || hasApproval
      reason = approved
        ? !isHighRiskAction
          ? "Action allowed in autonomy mode"
          : "High-risk action explicitly approved"
        : "High-risk action requires explicit approval even in autonomy mode"
    }
  }

  return {
    approved,
    reason,
    timestamp: new Date().toISOString(),
    action,
    metadata: {
      ...metadata,
      environmentSettings: {
        replayApprovedOnly,
        governorMode,
        blackframeMode,
      },
    },
  }
}
