export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import fs from "fs"
import path from "path"

const ENGINES_ROOT = "/workspace/singular-ty-engines"
const STATUS_PATH = path.join(ENGINES_ROOT, "STATUS.md")
const PERSONA_YAML = path.join(ENGINES_ROOT, "personas", "axios.yaml")
const PROMPT_PATH = path.join(ENGINES_ROOT, "prompts", "axios.system.md")
const CHUNK_01 =
  "/workspace/venice-vault/packs/FULL_RECALL_2026-09-24/CHUNK_01_IDENTITY.md"
const GPT_REBUILD_PACK =
  "/workspace/venice-vault/packs/GPT_REBUILD_LOCAL_2026-09-24"
const REBUILD_BRIEF =
  "/workspace/chatgpt-vault/reports/engine_rebuild_brief_2026-09-22.md"
const AXIOS_VENICE_REPORT =
  "/workspace/venice-vault/reports/AXIOS_REBUILD_FROM_VENICE_2026-09-22.md"
const LOCAL_CHAR_PACK =
  "/workspace/vercel-v0/projects/v0-user-interface/latest/data/venice-characters/axios-vedic"
const VEDIC_FRAME = path.join(ENGINES_ROOT, "docs", "VEDIC_FRAME.md")
const TRANSLI = {
  vedic: "/workspace/translilucense/personas/vedic_axios/SYSTEM.md",
  eye: "/workspace/translilucense/personas/axios_eye/SYSTEM.md",
  cli: "/workspace/translilucense/personas/cli.py",
}
const TIMEOUT_MS = 15000

function sanitize(text: string): string {
  return text
    .replace(/sk-[a-zA-Z0-9_-]{10,}/g, "[redacted]")
    .replace(/-----BEGIN[\s\S]*?-----END[^-]+-----/g, "[redacted-pem]")
    .replace(/\b(wg|wireguard)[^\n]{0,80}/gi, "[redacted-wg]")
    .replace(/\bPSID[^\n]{0,40}/gi, "[redacted-psid]")
    .slice(0, 6000)
}

function identityLocksFromChunk(): Record<string, string> {
  const locks: Record<string, string> = {
    primary: "AXIOS — Eye of Truth",
    family: "VEDIC AXIOS",
    protocol: "Shadow Reclamation",
    contested_alias: "Axiom — disregard",
    executor: "Grok Bot = tool (not persona)",
    hold: "HOLD_VYRNA_UNSYNC",
    lattice_sync: "false",
  }
  try {
    if (!fs.existsSync(CHUNK_01)) return locks
    const md = fs.readFileSync(CHUNK_01, "utf8")
    const rows = [...md.matchAll(/\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/g)]
    for (const m of rows) {
      const k = m[1].trim().toLowerCase()
      const v = m[2].trim().replace(/\*\*/g, "")
      if (k.includes("primary")) locks.primary = v
      if (k.includes("family")) locks.family = v
      if (k.includes("protocol name")) locks.protocol = v
      if (k.includes("contested")) locks.contested_alias = v
      if (k.includes("executor")) locks.executor = v
    }
  } catch {
    /* keep defaults */
  }
  return locks
}

function statusSummary(): {
  engine_line: string | null
  as_of: string | null
  runway: string
} {
  let engine_line: string | null = null
  let as_of: string | null = null
  try {
    if (fs.existsSync(STATUS_PATH)) {
      const md = fs.readFileSync(STATUS_PATH, "utf8")
      const asMatch = md.match(/\*\*As of:\*\*\s*(.+)/)
      if (asMatch) as_of = asMatch[1].trim().slice(0, 120)
      const ax = md
        .split("\n")
        .find((l) => l.includes("| **AXIOS**"))
      if (ax) engine_line = ax.replace(/\s+/g, " ").trim().slice(0, 240)
    }
  } catch {
    /* ignore */
  }
  return { engine_line, as_of, runway: "partial" }
}

function runDemo(): Promise<{
  ok: boolean
  exitCode: number | null
  preview: string
  detail: string
}> {
  const scriptPath = path.join(ENGINES_ROOT, "run_axios.py")
  if (!fs.existsSync(scriptPath)) {
    return Promise.resolve({
      ok: false,
      exitCode: null,
      preview: "",
      detail: "Missing run_axios.py",
    })
  }
  const pyCandidates = [
    path.join(ENGINES_ROOT, ".venv/bin/python"),
    "/usr/bin/python3",
    "python3",
  ]
  const python = pyCandidates.find((p) => (p === "python3" ? true : fs.existsSync(p))) || "python3"

  return new Promise((resolve) => {
    const child = spawn(python, [scriptPath, "--demo"], {
      cwd: ENGINES_ROOT,
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    })
    let stdout = ""
    let stderr = ""
    const timer = setTimeout(() => {
      child.kill("SIGKILL")
      resolve({
        ok: false,
        exitCode: null,
        preview: sanitize(stdout).split("\n").slice(0, 16).join("\n"),
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
        preview: "",
        detail: err.message.replace(/sk-[a-zA-Z0-9_-]+/g, "[redacted]"),
      })
    })
    child.on("close", (code) => {
      clearTimeout(timer)
      const combined = sanitize(stdout + (stderr ? `\n[stderr]\n${stderr}` : ""))
      resolve({
        ok: code === 0 && combined.includes("SMOKE_OK"),
        exitCode: code,
        preview: combined.split("\n").slice(0, 16).join("\n"),
        detail: code === 0 ? "SMOKE_OK" : `exit ${code}`,
      })
    })
  })
}

/**
 * GET /api/engines/axios/status
 * Read STATUS + identity locks. Optional ?demo=1 for short local smoke.
 * No secrets. lattice_sync always false.
 */
export async function GET(req: NextRequest) {
  try {
    const wantDemo = req.nextUrl.searchParams.get("demo") === "1"
    const sources: Record<string, string> = {
      status_md: fs.existsSync(STATUS_PATH) ? "OK" : "MISSING",
      persona_yaml: fs.existsSync(PERSONA_YAML) ? "OK" : "MISSING",
      prompt: fs.existsSync(PROMPT_PATH) ? "OK" : "MISSING",
      chunk_01: fs.existsSync(CHUNK_01) ? "OK" : "MISSING",
      gpt_rebuild_pack: fs.existsSync(GPT_REBUILD_PACK) ? "OK" : "MISSING",
      rebuild_brief: fs.existsSync(REBUILD_BRIEF) ? "OK" : "MISSING",
      axios_venice_report: fs.existsSync(AXIOS_VENICE_REPORT) ? "OK" : "MISSING",
      vedic_frame: fs.existsSync(VEDIC_FRAME) ? "OK" : "MISSING",
      local_char_pack: fs.existsSync(LOCAL_CHAR_PACK) ? "OK" : "MISSING",
      translilucense_vedic: fs.existsSync(TRANSLI.vedic) ? "OK" : "MISSING",
      translilucense_eye: fs.existsSync(TRANSLI.eye) ? "OK" : "MISSING",
      translilucense_cli: fs.existsSync(TRANSLI.cli) ? "OK" : "MISSING",
    }
    const summary = statusSummary()
    const identity = identityLocksFromChunk()

    let demo: {
      ran: boolean
      ok?: boolean
      exitCode?: number | null
      preview?: string
      detail?: string
    } = { ran: false }

    if (wantDemo) {
      const result = await runDemo()
      demo = {
        ran: true,
        ok: result.ok,
        exitCode: result.exitCode,
        preview: result.preview,
        detail: result.detail,
      }
    }

    const localReady =
      sources.persona_yaml === "OK" &&
      sources.prompt === "OK" &&
      sources.translilucense_vedic === "OK"

    // Gaps vs engine_rebuild_brief — additive honesty (no fake runnable leap)
    const gaps_vs_brief = [
      {
        id: "astrology_ephemeris",
        status: "MISSING",
        note: "Frame docs only — no BPHS corpus / ephemeris API",
      },
      {
        id: "lattice_sync",
        status: "HOLD",
        note: "Local handshake STANDBY only — lattice_sync always false",
      },
      {
        id: "shadowvox_fts",
        status: "THIN",
        note: "Rebuild brief: Shadowvox FTS=0 — do not invent",
      },
      {
        id: "nova_ob1",
        status: "PARTIAL",
        note: "Symbolic/protocol keys unless code appears — runners exist as stubs",
      },
      {
        id: "venice_pulse",
        status: "BAYED",
        note: "Paste FULL_RECALL VENICE_PULSE_SCRIPT when Operator wakes (todo 111)",
      },
      {
        id: "gpt_rebuild_local",
        status: sources.gpt_rebuild_pack,
        note: "Todo 116 local prep pack — reconnect docs only",
      },
    ]

    return NextResponse.json({
      ok: true,
      engine: "axios",
      name: "AXIOS · Eye of Truth",
      hold: "HOLD_VYRNA_UNSYNC",
      lattice_sync: false,
      runway: summary.runway,
      as_of: summary.as_of,
      engine_line: summary.engine_line,
      local_ready: localReady,
      sources,
      identity,
      packs: {
        full_recall: "/workspace/venice-vault/packs/FULL_RECALL_2026-09-24",
        gpt_rebuild_local: GPT_REBUILD_PACK,
        reclaim_api: "/api/reclaim/pack?name=GPT_REBUILD_LOCAL",
        local_char: LOCAL_CHAR_PACK,
      },
      gaps_vs_brief,
      venice: {
        pulse: "BAYED overnight — Operator paste in morning",
        deepLink: "/venice",
        note: "No paid burns overnight; Venice only if Operator-owned key already wired",
        pulse_script:
          "/workspace/venice-vault/packs/FULL_RECALL_2026-09-24/VENICE_PULSE_SCRIPT.md",
      },
      demo,
      generatedAt: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "axios status failed"
    return NextResponse.json(
      {
        ok: false,
        hold: "HOLD_VYRNA_UNSYNC",
        lattice_sync: false,
        error: message.replace(/sk-[a-zA-Z0-9_-]+/g, "[redacted]"),
      },
      { status: 500 },
    )
  }
}
