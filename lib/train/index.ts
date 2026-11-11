/**
 * Train Lane / Σ3D-SYMTRAIN hub bus
 * Teacher (Dev Operator) → Students · Omniverse optional/unavailable · mesh dry-run
 */

export * from "./roles"
export * from "./lessonStore"
export * from "./teacher"
export * from "./student"
export * from "./strain"
export { listAdapterRecords, readAdapterLesson } from "./adapters/record"
export {
  assimilateJobOutput,
  FREE_TIER_MODULE_PLUGINS,
  QUOTA_MESH_POLICY,
} from "./assimilate"

import { spawnSync } from "child_process"
import fs from "fs"
import { HOLD, DEFAULT_TEACHER, listStudents } from "./roles"
import { listLessons, loadRoster, resolveDimmSymtrainDir, saveLesson, createLessonPack } from "./lessonStore"
import { listAdapterRecords } from "./adapters/record"
import { listStrainModes } from "./strain"
import { FREE_TIER_MODULE_PLUGINS, QUOTA_MESH_POLICY } from "./assimilate"

const ENGINES_TRAINER =
  process.env.S3V3N_SYMTRAIN_TRAINER ||
  "/workspace/singular-ty-engines/symtrain/python/trainer.py"
const OV_ADAPTER =
  process.env.S3V3N_OMNIVERSE_ADAPTER ||
  "/workspace/singular-ty-engines/symtrain/omniverse/adapter.py"

export function omniverseStatus(): {
  available: false
  status: "unavailable"
  optional: true
  reason: string
  lattice_sync: false
  hold: typeof HOLD
} {
  try {
    if (fs.existsSync(OV_ADAPTER)) {
      const r = spawnSync("python3", [OV_ADAPTER], { encoding: "utf8", timeout: 5000 })
      if (r.status === 0 && r.stdout) {
        const j = JSON.parse(r.stdout)
        return {
          available: false,
          status: "unavailable",
          optional: true,
          reason: j.reason || "Omniverse stub reports unavailable",
          lattice_sync: false,
          hold: HOLD,
        }
      }
    }
  } catch {
    /* fall through */
  }
  return {
    available: false,
    status: "unavailable",
    optional: true,
    reason: "No Omniverse SDK/license on this host; stub interface only",
    lattice_sync: false,
    hold: HOLD,
  }
}

export function dryRunTrain(opts?: { title?: string; modality?: string }): {
  ok: boolean
  lessonId?: string
  paths?: Record<string, string>
  metrics?: Record<string, unknown>
  packSaved?: boolean
  error?: string
  mesh: "dry-run"
  omniverse: ReturnType<typeof omniverseStatus>
  lattice_sync: false
  hold: typeof HOLD
} {
  const ov = omniverseStatus()
  try {
    if (!fs.existsSync(ENGINES_TRAINER)) {
      // Pure TS fallback dry-run
      const pack = createLessonPack({
        students: ["axios", "heimdall", "twin", "s3v3n-panel"],
        modality: (opts?.modality as "symbolic") || "symbolic",
        title: opts?.title || "SYMTRAIN dry-run (TS fallback)",
        summary: "Hub TS dry-run — engines trainer missing; wrote LessonPack locally.",
        tags: ["symtrain", "dry-run", "ts-fallback"],
        metrics: { dryRun: true, loss: 0.5, steps: 4, mesh: "dry-run", score: 0.5 },
        source: "symtrain-dry-run",
      })
      const saved = saveLesson(pack)
      return {
        ok: true,
        lessonId: saved.pack.id,
        paths: { lesson: saved.dimmPath, dir: resolveDimmSymtrainDir() },
        metrics: saved.pack.metrics,
        packSaved: true,
        mesh: "dry-run",
        omniverse: ov,
        lattice_sync: false,
        hold: HOLD,
      }
    }
    const args = [ENGINES_TRAINER, "--dry-run"]
    if (opts?.modality) args.push("--modality", opts.modality)
    if (opts?.title) args.push("--title", opts.title)
    const r = spawnSync("python3", args, { encoding: "utf8", timeout: 15000 })
    if (r.status !== 0) {
      return {
        ok: false,
        error: (r.stderr || r.stdout || "trainer failed").slice(0, 300),
        mesh: "dry-run",
        omniverse: ov,
        lattice_sync: false,
        hold: HOLD,
      }
    }
    const out = JSON.parse(r.stdout || "{}")
    // Mirror into hub store
    const pack = createLessonPack({
      students: ["axios", "heimdall", "twin", "s3v3n-panel"],
      modality: (opts?.modality as "symbolic") || "symbolic",
      title: opts?.title || "SYMTRAIN dry-run lesson",
      summary: `Engines dry-run trainer lesson ${out.lessonId || ""}`.trim(),
      tags: ["symtrain", "dry-run", "engines"],
      metrics: {
        dryRun: true,
        loss: out.metrics?.loss,
        steps: out.metrics?.steps,
        mesh: "dry-run",
        score: out.metrics?.loss != null ? Math.max(0, 1 - Number(out.metrics.loss)) : 0.5,
      },
      source: "symtrain-dry-run",
    })
    // Keep engines id if present
    if (out.lessonId) pack.id = out.lessonId
    const saved = saveLesson(pack)
    return {
      ok: true,
      lessonId: saved.pack.id,
      paths: out.paths || { lesson: saved.dimmPath },
      metrics: out.metrics || saved.pack.metrics,
      packSaved: true,
      mesh: "dry-run",
      omniverse: ov,
      lattice_sync: false,
      hold: HOLD,
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "dryRunTrain failed",
      mesh: "dry-run",
      omniverse: ov,
      lattice_sync: false,
      hold: HOLD,
    }
  }
}

export function symtrainStatus() {
  const roster = loadRoster()
  const lessons = listLessons(12)
  const adapters = listAdapterRecords()
  const dimm = resolveDimmSymtrainDir()
  return {
    ok: true,
    name: "Σ3D-SYMTRAIN",
    teacher: DEFAULT_TEACHER,
    teacherId: roster.teacherId,
    students: listStudents(),
    roster,
    lastLessons: lessons.map((l) => ({
      id: l.id,
      title: l.title,
      modality: l.modality,
      students: l.students,
      createdAt: l.createdAt,
      source: l.source,
    })),
    lastStrainScores: roster.lastStrainScores,
    adapters: adapters.map((a) => ({
      studentId: a.studentId,
      lastLessonId: a.lastLessonId,
      updatedAt: a.updatedAt,
    })),
    strainModes: listStrainModes(),
    omniverse: omniverseStatus(),
    mesh: "dry-run" as const,
    quotaMesh: QUOTA_MESH_POLICY,
    freeTierPlugins: FREE_TIER_MODULE_PLUGINS.map((p) => ({
      id: p.id,
      provider: p.provider,
      moduleBay: p.moduleBay,
      role: p.role,
      freeTier: p.freeTier,
    })),
    gpu: "none — widget skipped, no paid pods",
    dimmPath: dimm,
    enginesTrainer: ENGINES_TRAINER,
    enginesTrainerPresent: fs.existsSync(ENGINES_TRAINER),
    hold: HOLD,
    lattice_sync: false as const,
  }
}
