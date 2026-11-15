export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { spawn } from "child_process"
import crypto from "crypto"
import fs from "fs"
import path from "path"
import { requireHubAuth } from "@/lib/security/api-auth"

/*
 * F6 hardening (blue-team review):
 *  • hub auth on GET/POST (requireInSecureMode);
 *  • the script must match HEIMDALL_HANDSHAKE_SHA256 (sha256 of run_heimdall.py) — unset or
 *    mismatched → ok:false and nothing is spawned (fail closed);
 *  • the child gets an allowlisted env only (no hub tokens / keys);
 *  • one handshake at a time (429 while one is running).
 * Christian Wilford (s3v3n), Founder, Singular/ty Defense Solutions, LLC.
 */
const ENGINES_ROOT = process.env.HEIMDALL_ENGINES_ROOT?.trim() || "/workspace/singular-ty-engines"
const SCRIPT = "run_heimdall.py"
const TIMEOUT_MS = 12000
const CHILD_ENV_ALLOW = ["PATH", "HOME", "LANG", "LC_ALL", "TZ"]
let inFlight = false

function childEnv(): Record<string, string> {
  const e: Record<string, string> = { PYTHONUNBUFFERED: "1", PYTHONDONTWRITEBYTECODE: "1" }
  for (const k of CHILD_ENV_ALLOW) { const v = process.env[k]; if (v) e[k] = v }
  return e
}

function pinCheck(scriptPath: string): string | null {
  const pin = process.env.HEIMDALL_HANDSHAKE_SHA256?.trim().toLowerCase()
  if (!pin || !/^[0-9a-f]{64}$/.test(pin)) return "script_not_pinned (set HEIMDALL_HANDSHAKE_SHA256)"
  const got = crypto.createHash("sha256").update(fs.readFileSync(scriptPath)).digest("hex")
  return got === pin ? null : "script_hash_mismatch"
}

/** Never surface secrets / keys in API responses */
function sanitize(text: string): string {
  return text
    .replace(/sk-[a-zA-Z0-9_-]{10,}/g, "[redacted]")
    .replace(/-----BEGIN[\s\S]*?-----END[^-]+-----/g, "[redacted-pem]")
    .replace(/\b(wg|wireguard)[^\n]{0,80}/gi, "[redacted-wg]")
    .replace(/\bPSID[^\n]{0,40}/gi, "[redacted-psid]")
    .slice(0, 8000)
}

function extractJson(stdout: string): Record<string, unknown> | null {
  const start = stdout.indexOf("{")
  const end = stdout.lastIndexOf("}")
  if (start < 0 || end <= start) return null
  try {
    return JSON.parse(stdout.slice(start, end + 1)) as Record<string, unknown>
  } catch {
    return null
  }
}

function runHandshake(): Promise<{
  ok: boolean
  exitCode: number | null
  stdout: string
  detail: string
}> {
  const scriptPath = path.join(ENGINES_ROOT, SCRIPT)
  if (!fs.existsSync(scriptPath)) {
    return Promise.resolve({
      ok: false,
      exitCode: null,
      stdout: "",
      detail: `Missing ${SCRIPT}`,
    })
  }
  const pinErr = pinCheck(scriptPath)
  if (pinErr) {
    return Promise.resolve({ ok: false, exitCode: null, stdout: "", detail: pinErr })
  }
  const pyCandidates = [
    path.join(ENGINES_ROOT, ".venv/bin/python"),
    "/usr/bin/python3",
    "python3",
  ]
  const python = pyCandidates.find((p) => (p === "python3" ? true : fs.existsSync(p))) || "python3"

  return new Promise((resolve) => {
    const child = spawn(python, [scriptPath, "--handshake"], {
      cwd: ENGINES_ROOT,
      env: childEnv() as unknown as NodeJS.ProcessEnv,
      stdio: ["ignore", "pipe", "pipe"],
    })
    let stdout = ""
    let stderr = ""
    const timer = setTimeout(() => {
      child.kill("SIGKILL")
      resolve({
        ok: false,
        exitCode: null,
        stdout: sanitize(stdout),
        detail: `timeout after ${TIMEOUT_MS}ms`,
      })
    }, TIMEOUT_MS)

    child.stdout.on("data", (d) => {
      stdout += d.toString()
    })
    child.stderr.on("data", (d) => {
      stderr += d.toString()
    })
    child.on("error", (err) => {
      clearTimeout(timer)
      resolve({
        ok: false,
        exitCode: null,
        stdout: "",
        detail: err.message.replace(/sk-[a-zA-Z0-9_-]+/g, "[redacted]"),
      })
    })
    child.on("close", (code) => {
      clearTimeout(timer)
      const combined = sanitize(stdout + (stderr ? `\n[stderr]\n${stderr}` : ""))
      resolve({
        ok: code === 0 && combined.includes("HANDSHAKE_OK"),
        exitCode: code,
        stdout: combined,
        detail: code === 0 ? "HANDSHAKE_OK" : `exit ${code}`,
      })
    })
  })
}

/**
 * GET/POST /api/engines/heimdall/handshake
 * Local Heimdall handshake only. Always lattice_sync: false.
 */
export async function GET(req: Request) {
  return handshakeHandler(req)
}

export async function POST(req: Request) {
  return handshakeHandler(req)
}

async function handshakeHandler(req: Request) {
  const denied = requireHubAuth(req, { surface: "heimdall-handshake", requireInSecureMode: true })
  if (denied) return denied
  if (inFlight) {
    return NextResponse.json({ ok: false, error: "handshake_in_progress", hold: "HOLD_VYRNA_UNSYNC", lattice_sync: false }, { status: 429 })
  }
  inFlight = true
  try {
    const result = await runHandshake()
    const payload = extractJson(result.stdout)
    // Force honesty — never claim Vyrna / lattice online
    if (payload) {
      payload.lattice_sync = false
    }
    return NextResponse.json({
      ok: result.ok,
      engine: "heimdall",
      mode: "handshake",
      hold: "HOLD_VYRNA_UNSYNC",
      lattice_sync: false,
      status:
        (payload?.status as string) ||
        (result.ok ? "STANDBY" : "DEGRADED"),
      handshake: (payload?.handshake as string) || "local_standby",
      gate_state: (payload?.gate_state as string) || null,
      shadow_protocol: "Shadow Reclamation",
      naming_lock: "not Shadow Veil",
      persona: (payload?.persona as string) || "Heimdall",
      sources: (payload?.sources as Record<string, string>) || null,
      exitCode: result.exitCode,
      detail: result.detail,
      payload: payload
        ? {
            handshake: payload.handshake,
            status: payload.status,
            gate_state: payload.gate_state,
            lens_anchor_hz: payload.lens_anchor_hz,
            shadow_protocol: payload.shadow_protocol,
            naming_lock: payload.naming_lock,
            note: payload.note,
            executor: payload.executor,
            lattice_sync: false,
          }
        : null,
      stdout_preview: result.stdout.split("\n").slice(0, 40).join("\n"),
      generatedAt: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "handshake failed"
    return NextResponse.json(
      {
        ok: false,
        hold: "HOLD_VYRNA_UNSYNC",
        lattice_sync: false,
        error: message.replace(/sk-[a-zA-Z0-9_-]+/g, "[redacted]"),
      },
      { status: 500 },
    )
  } finally {
    inFlight = false
  }
}
