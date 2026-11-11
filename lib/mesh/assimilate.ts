/**
 * Assimilate mesh job outputs → Teacher lesson store / DIMM symbols.
 * Reuses lib/train when present; stub hooks otherwise.
 * HOLD_VYRNA_UNSYNC · lattice_sync: false · never store secrets
 */

import fs from "fs"
import path from "path"
import { HOLD, scanBodyForBurnerIntent } from "./policy"

export type AssimilateInput = {
  jobId?: string
  providerId?: string
  role?: string
  title?: string
  summary?: string
  content?: string
  tags?: string[]
  dimmSymbolHint?: string
}

export type AssimilateResult = {
  ok: boolean
  lessonId?: string
  dimmPaths?: string[]
  encrypted?: boolean
  stub?: boolean
  error?: string
  status?: number
  hold: typeof HOLD
  lattice_sync: false
  forbidsBurnerAccounts: true
  mesh: "assimilated" | "stub"
}

const MESH_DIR =
  process.env.S3V3N_MESH_DIR || path.join(process.cwd(), "data", "mesh")
const ASSIM_LOG = path.join(MESH_DIR, "assimilate-log.jsonl")

function ensure(): void {
  fs.mkdirSync(MESH_DIR, { recursive: true, mode: 0o700 })
}

function appendLog(row: Record<string, unknown>): void {
  ensure()
  fs.appendFileSync(ASSIM_LOG, JSON.stringify(row) + "\n", { mode: 0o600 })
}

function sanitize(s: string, max: number): string {
  return String(s || "")
    .replace(/sk-[a-zA-Z0-9_-]{8,}/g, "[redacted]")
    .replace(/BEGIN (RSA |OPENSSH )?PRIVATE KEY[\s\S]*?END [^\n]+KEY/g, "[redacted-key]")
    .slice(0, max)
}

function writeStub(
  title: string,
  summary: string,
  content: string,
  tags: string[],
  input: AssimilateInput,
  errMsg?: string,
): AssimilateResult {
  ensure()
  const stubId = `mesh-stub-${Date.now()}`
  const stubPath = path.join(MESH_DIR, "assimilate-stubs", `${stubId}.json`)
  fs.mkdirSync(path.dirname(stubPath), { recursive: true, mode: 0o700 })
  fs.writeFileSync(
    stubPath,
    JSON.stringify(
      {
        id: stubId,
        title,
        summary,
        content,
        tags,
        jobId: input.jobId,
        providerId: input.providerId,
        dimmSymbolHint: input.dimmSymbolHint || null,
        hold: HOLD,
        lattice_sync: false,
        createdAt: new Date().toISOString(),
        error: errMsg || null,
      },
      null,
      2,
    ) + "\n",
    { mode: 0o600 },
  )
  appendLog({
    at: new Date().toISOString(),
    stubId,
    error: errMsg || null,
    hold: HOLD,
  })
  return {
    ok: true,
    lessonId: stubId,
    dimmPaths: [stubPath],
    stub: true,
    hold: HOLD,
    lattice_sync: false,
    forbidsBurnerAccounts: true,
    mesh: "stub",
  }
}

/** Light write into train lesson store when available. */
export async function assimilateToTrain(input: AssimilateInput): Promise<AssimilateResult> {
  const scan = scanBodyForBurnerIntent(input)
  if (!scan.ok) {
    return {
      ok: false,
      error: scan.reason,
      status: 403,
      hold: HOLD,
      lattice_sync: false,
      forbidsBurnerAccounts: true,
      mesh: "stub",
    }
  }

  const title = sanitize(input.title || `Mesh assimilate ${input.providerId || "peer"}`, 200)
  const summary = sanitize(
    input.summary ||
      `Assimilated output from Operator-owned mesh seat ${input.providerId || "unknown"} role=${input.role || "train"}`,
    1200,
  )
  const content = sanitize(input.content || summary, 4000)
  const sigilLabel =
    input.role === "sigil2vec"
      ? (() => {
          try {
            const cfgPath = process.env.DIMM_CONFIG || "/workspace/dimm-drive/config.json"
            const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8")) as {
              sigil2vec?: { badge?: string; opencvAvailable?: boolean; mode?: string }
            }
            const s = cfg?.sigil2vec || {}
            // OpenCV is a local descriptor probe, not a trained Sigil2vec pack.
            // Keep assimilated lesson metadata honest until a real pack exists.
            if (s.opencvAvailable || s.badge === "LIVE_OPENCV" || s.mode === "opencv") return "STUB_HASH"
            return "STUB_HASH"
          } catch {
            return "STUB_HASH"
          }
        })()
      : null
  const tags = [
    "mesh",
    "assimilate",
    ...(input.providerId ? [input.providerId] : []),
    ...(input.role ? [String(input.role)] : []),
    ...(sigilLabel ? [sigilLabel] : []),
    ...(input.tags || []),
  ].slice(0, 24)

  try {
    const train = await import("@/lib/train")
    const pack = train.createLessonPack({
      students: ["axios", "heimdall", "twin", "s3v3n-panel"],
      modality: input.role === "sigil2vec" ? "sigil2vec" : "symbolic",
      title,
      summary,
      content,
      tags,
      metrics: { dryRun: true, mesh: "dry-run" },
      source: "mesh",
    })
    const saved = train.saveLesson(pack)
    appendLog({
      at: new Date().toISOString(),
      lessonId: saved.pack.id,
      jobId: input.jobId || null,
      providerId: input.providerId || null,
      hold: HOLD,
    })
    return {
      ok: true,
      lessonId: saved.pack.id,
      dimmPaths: saved.pack.dimmPaths,
      encrypted: saved.encrypted,
      hold: HOLD,
      lattice_sync: false,
      forbidsBurnerAccounts: true,
      mesh: "assimilated",
    }
  } catch (e) {
    return writeStub(
      title,
      summary,
      content,
      tags,
      input,
      e instanceof Error ? e.message : "train unavailable",
    )
  }
}
