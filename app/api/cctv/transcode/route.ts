export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { requireHubAuth, isSecureMode } from "@/lib/security/api-auth"
import { assertSafeOutboundUrl } from "@/lib/security/request-guard"
import { recordIdsThreat } from "@/lib/security/ids-status"
import { enforceLadder } from "@/lib/offsec/scope-ladder"
import { spawn } from "child_process"
import fs from "fs"
import path from "path"
import { randomUUID } from "crypto"

/**
 * Staged-unlock gate: connecting to third-party stream targets requires
 * CCTV_CONNECT_ENABLED=1 + hub auth (and SECURE_MODE denials when unset).
 * Metadata display stays available via /api/cctv/layouts without this flag.
 */
function connectAllowed(): boolean {
  return process.env.CCTV_CONNECT_ENABLED === "1" || process.env.CCTV_CONNECT_ENABLED === "true"
}

const OUT_ROOT = path.join(process.cwd(), "local-data", "cctv-hls")

function ensureOut(): void {
  fs.mkdirSync(OUT_ROOT, { recursive: true, mode: 0o700 })
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    connectEnabled: connectAllowed(),
    secureMode: isSecureMode(),
    note: "Set CCTV_CONNECT_ENABLED=1 and HUB_API_TOKEN to allow server-side ffmpeg transcode of authorized targets. Metadata display does not require this flag.",
  })
}

export async function POST(request: NextRequest) {
  const denied = requireHubAuth(request, { surface: "cctv:transcode", requireInSecureMode: true })
  if (denied) return denied

  if (!connectAllowed()) {
    recordIdsThreat({
      severity: "medium",
      source: "cctv-transcode",
      message: "CCTV connect blocked — CCTV_CONNECT_ENABLED not set",
      blocked: true,
    })
    return NextResponse.json(
      {
        ok: false,
        error: "connect_gated",
        detail: "Connecting to third-party camera targets is staged-unlock gated. Set CCTV_CONNECT_ENABLED=1 on an authorized lab host after confirming per-tile authorization.",
      },
      { status: 403 },
    )
  }

  const body = await request.json().catch(() => ({}))
  const url = String(body.url || "").trim()
  if (!url || url.length > 2048) {
    return NextResponse.json({ ok: false, error: "url required" }, { status: 400 })
  }

  // STAGED LADDER: stage1 = CCTV_CONNECT_ENABLED (checked above), stage2 = active
  // in-window engagement scope authorizing this target, stage3 = attestation.
  let targetHost = url
  try {
    targetHost = new URL(url.replace(/^rtsp:/i, "http:")).hostname || url
  } catch {
    /* keep raw */
  }
  const ladder = enforceLadder({
    capability: "cctv:transcode",
    scopeId: body.scopeId || null,
    target: targetHost,
    attestation: String(body.attestation || ""),
    stage1Enabled: connectAllowed(),
    operator: body.operator,
  })
  if (ladder.blocked) {
    return NextResponse.json(
      { ok: false, error: "ladder_blocked", stage: ladder.check.stage, detail: ladder.check.reason },
      { status: 403 },
    )
  }

  // Block non-http(s)/rtsp and private targets for http(s). RTSP checked via host extract.
  const scheme = url.split(":")[0]?.toLowerCase()
  if (!["rtsp", "http", "https"].includes(scheme)) {
    return NextResponse.json({ ok: false, error: "unsupported_scheme" }, { status: 400 })
  }
  try {
    const probe = scheme === "rtsp" ? url.replace(/^rtsp:/i, "http:") : url
    assertSafeOutboundUrl(probe)
  } catch {
    return NextResponse.json(
      { ok: false, error: "target_blocked", detail: "loopback / RFC1918 / link-local / metadata blocked" },
      { status: 403 },
    )
  }

  ensureOut()
  const id = randomUUID().slice(0, 12)
  const dir = path.join(OUT_ROOT, id)
  fs.mkdirSync(dir, { mode: 0o700 })
  const playlist = path.join(dir, "index.m3u8")

  // Short bounded ffmpeg → HLS. Operator must have ffmpeg installed.
  const args = [
    "-hide_banner",
    "-loglevel",
    "error",
    "-rtsp_transport",
    "tcp",
    "-i",
    url,
    "-t",
    "30", // hard cap 30s sample for safety
    "-c:v",
    "libx264",
    "-an",
    "-f",
    "hls",
    "-hls_time",
    "2",
    "-hls_list_size",
    "6",
    "-hls_flags",
    "delete_segments",
    playlist,
  ]

  const result = await new Promise<{ ok: boolean; detail?: string }>((resolve) => {
    const child = spawn("ffmpeg", args, { timeout: 45000 })
    let err = ""
    child.stderr?.on("data", (d) => {
      err += String(d).slice(0, 400)
    })
    child.on("error", (e) => resolve({ ok: false, detail: e.message }))
    child.on("close", (code) => {
      if (code === 0 && fs.existsSync(playlist)) resolve({ ok: true })
      else resolve({ ok: false, detail: err || `ffmpeg_exit_${code}` })
    })
  })

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: "transcode_failed", detail: result.detail?.slice(0, 300) },
      { status: 502 },
    )
  }

  return NextResponse.json({
    ok: true,
    id,
    playlistPath: `local-data/cctv-hls/${id}/index.m3u8`,
    note: "30s bounded HLS sample written under local-data/ (gitignored). Serve via authenticated static path or open locally. Not a continuous relay.",
  })
}
