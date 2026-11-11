import { type NextRequest, NextResponse } from "next/server"
import { adbTools } from "@/lib/graphene/adbTools"
import { requireHubAuth } from "@/lib/security/api-auth"
import { recordIdsThreat } from "@/lib/security/ids-status"

/**
 * ADB shell is high risk (arbitrary command → device). Hardened:
 *  - requireHubAuth (HUB_API_TOKEN / SECURE_MODE deny-by-default).
 *  - Off entirely unless ADB_SHELL_ENABLED=1 (isolated lab hosts only).
 *  - Command must match a conservative allowlist (no shell metacharacters).
 */
const SAFE_COMMAND = /^[a-zA-Z0-9 _./:@=+-]{1,256}$/
const META = /[;&|`$(){}<>\\\n\r"']/

export async function POST(request: NextRequest, { params: paramsPromise }: { params: Promise<{ deviceId: string }> }) {
  const params = await paramsPromise

  const denied = requireHubAuth(request, { surface: "adb:shell", requireInSecureMode: true })
  if (denied) return denied

  if (process.env.ADB_SHELL_ENABLED !== "1") {
    recordIdsThreat({
      severity: "high",
      source: "adb-shell",
      message: "ADB shell invoked while ADB_SHELL_ENABLED!=1",
      blocked: true,
    })
    return NextResponse.json(
      { error: "adb_shell_disabled", detail: "Set ADB_SHELL_ENABLED=1 on an isolated lab host to enable." },
      { status: 403 },
    )
  }

  try {
    const { command } = await request.json()
    if (!command || typeof command !== "string") {
      return NextResponse.json({ error: "Command is required" }, { status: 400 })
    }
    if (!SAFE_COMMAND.test(command) || META.test(command)) {
      recordIdsThreat({
        severity: "critical",
        source: "adb-shell",
        message: `Blocked ADB shell command with disallowed characters`,
        blocked: true,
      })
      return NextResponse.json(
        { error: "command_rejected", detail: "Command contains disallowed characters or shell metacharacters." },
        { status: 400 },
      )
    }

    const output = await adbTools.executeShellCommand(params.deviceId, command)
    return NextResponse.json({ output })
  } catch (error) {
    console.error("Failed to execute shell command:", error)
    return NextResponse.json(
      { error: "Failed to execute command", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
