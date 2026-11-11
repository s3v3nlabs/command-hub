export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { spawn } from "node:child_process"
import path from "node:path"
import fs from "node:fs"

/**
 * Thin bridge → Kotlin brain-hemisphere CLI (JSON stdin/stdout).
 * ADD-ONLY · does not thin Ghostlight / consciousness trees.
 * HOLD_VYRNA_UNSYNC · lattice_sync: false · symbolic > tokens.
 */

const HOLD = "HOLD_VYRNA_UNSYNC" as const

function resolveBrainCmd(): { cmd: string; args: string[] } | null {
  const override = process.env.BRAIN_HEMISPHERE_CMD?.trim()
  if (override) {
    const parts = override.split(/\s+/).filter(Boolean)
    return { cmd: parts[0], args: parts.slice(1) }
  }
  const candidates = [
    process.env.BRAIN_HEMISPHERE_JAR?.trim(),
    "/workspace/singular-ty-engines/brain-hemisphere/build/libs/brain-hemisphere-0.1.0.jar",
    path.resolve(process.cwd(), "../../singular-ty-engines/brain-hemisphere/build/libs/brain-hemisphere-0.1.0.jar"),
    path.resolve(process.cwd(), "../../../../singular-ty-engines/brain-hemisphere/build/libs/brain-hemisphere-0.1.0.jar"),
  ].filter(Boolean) as string[]
  const jarPath = candidates.find((c) => fs.existsSync(c))
  if (!jarPath) return null
  return { cmd: "java", args: ["-jar", jarPath] }
}

function runBrain(payload: object, timeoutMs = 8000): Promise<object> {
  return new Promise((resolve, reject) => {
    const resolved = resolveBrainCmd()
    if (!resolved) {
      reject(new Error("brain-hemisphere jar not found; build with ./gradlew jar"))
      return
    }
    const child = spawn(resolved.cmd, resolved.args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: process.env,
    })
    let stdout = ""
    let stderr = ""
    const timer = setTimeout(() => {
      child.kill("SIGKILL")
      reject(new Error("brain-hemisphere timeout"))
    }, timeoutMs)
    child.stdout.on("data", (d) => {
      stdout += d.toString()
    })
    child.stderr.on("data", (d) => {
      stderr += d.toString()
    })
    child.on("error", (err) => {
      clearTimeout(timer)
      reject(err)
    })
    child.on("close", (code) => {
      clearTimeout(timer)
      if (code !== 0 && !stdout.trim()) {
        reject(new Error(stderr.trim() || `exit ${code}`))
        return
      }
      try {
        const line = stdout.trim().split("\n").filter(Boolean).pop() || "{}"
        resolve(JSON.parse(line))
      } catch (e) {
        reject(new Error(`invalid JSON from brain: ${stdout.slice(0, 200)}`))
      }
    })
    child.stdin.write(JSON.stringify(payload) + "\n")
    child.stdin.end()
  })
}

export async function GET(req: Request) {
  const denied = requireHubAuth(req, { surface: "brain", requireInSecureMode: true })
  if (denied) return denied

  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action") || "status"
  try {
    const body: Record<string, unknown> = { action }
    const glyph = searchParams.get("glyph")
    const lane = searchParams.get("lane")
    if (glyph) body.glyph = glyph
    if (lane) body.lane = lane
    const result = await runBrain(body)
    return NextResponse.json({ ...result, hold: HOLD, lattice_sync: false, bridge: "brain-hemisphere" })
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : String(e),
        hold: HOLD,
        lattice_sync: false,
        bridge: "brain-hemisphere",
        hint: "Build jar: cd /workspace/singular-ty-engines/brain-hemisphere && ./gradlew jar",
      },
      { status: 503 },
    )
  }
}

export async function POST(req: Request) {
  const denied = requireHubAuth(req, { surface: "brain", requireInSecureMode: true })
  if (denied) return denied

  try {
    const body = await req.json().catch(() => ({}))
    const action = typeof body?.action === "string" ? body.action : "status"
    const result = await runBrain({ ...body, action })
    return NextResponse.json({ ...result, hold: HOLD, lattice_sync: false, bridge: "brain-hemisphere" })
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : String(e),
        hold: HOLD,
        lattice_sync: false,
        bridge: "brain-hemisphere",
      },
      { status: 503 },
    )
  }
}
