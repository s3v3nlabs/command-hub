/**
 * Assimilate free-tier / quota-mesh JOB outputs into Teacher lessons.
 *
 * HARD RULES:
 * - OPERATOR-OWNED accounts only (Module Bay plugins + quota mesh).
 * - Perishable = jobs/pods only — NEVER burner / trashable / perishable ACCOUNTS.
 * - No account farming. No spinning accounts. No paid pods from this path by default.
 * - Defense/learn only · HOLD_VYRNA_UNSYNC · lattice_sync: false
 */

import { emitLesson } from "./teacher"
import { HOLD, type StudentRoleId } from "./roles"
import type { LessonPack } from "./lessonStore"

/** Free-tier peers surfaced as Module Bay plugin ids (operator-owned). */
export const FREE_TIER_MODULE_PLUGINS = [
  { id: "mesh-kaggle-train", provider: "kaggle", moduleBay: "modules/mesh-kaggle", role: "train", freeTier: true },
  { id: "mesh-colab-notebook", provider: "colab", moduleBay: "modules/mesh-colab", role: "experiment", freeTier: true },
  { id: "mesh-hf-zerogpu", provider: "huggingface-zerogpu", moduleBay: "modules/mesh-hf-zerogpu", role: "train", freeTier: true },
  { id: "mesh-lightning-trial", provider: "lightning", moduleBay: "modules/mesh-lightning", role: "experiment", freeTier: true },
  { id: "mesh-paperspace-gradient", provider: "paperspace", moduleBay: "modules/mesh-paperspace", role: "train", freeTier: true },
] as const

export const QUOTA_MESH_POLICY = {
  operatorOwnedOnly: true,
  burnerAccountsForbidden: true,
  trashableAccountsForbidden: true,
  perishableMeans: "jobs_and_pods_only",
  accountFarming: "FORBIDDEN",
  note:
    "Free-tier peers are Module Bay plugins bound to Operator-owned accounts. " +
    "Destroy idle jobs/pods. Never create throwaway accounts.",
  hold: HOLD,
  lattice_sync: false as const,
}

const FORBIDDEN_ACCOUNT_FARM =
  /\b(burner\s*account|throwaway\s*account|trashable\s*account|perishable\s*account|farm\s*accounts?|account\s*farm)/i

export type AssimilateJobInput = {
  provider?: string
  jobId?: string
  summary: string
  title?: string
  modality?: "symbolic" | "text" | "sigil2vec" | "sim"
  students?: StudentRoleId[]
  metrics?: { loss?: number; steps?: number; score?: number }
  autoPush?: boolean
  /** Must never claim burner account creation */
  accountMode?: "operator-owned" | string
}

export function assimilateJobOutput(input: AssimilateJobInput): {
  ok: boolean
  assimilated: boolean
  pack: LessonPack | null
  encrypted?: boolean
  dimmPath?: string
  pushed?: { studentId: StudentRoleId; ok: boolean }[]
  policy: typeof QUOTA_MESH_POLICY
  error?: string
  hold: typeof HOLD
  lattice_sync: false
} {
  const summary = String(input.summary || "").trim()
  if (!summary) {
    return {
      ok: false,
      assimilated: false,
      pack: null,
      policy: QUOTA_MESH_POLICY,
      error: "summary required",
      hold: HOLD,
      lattice_sync: false,
    }
  }

  if (FORBIDDEN_ACCOUNT_FARM.test(summary) || FORBIDDEN_ACCOUNT_FARM.test(String(input.title || ""))) {
    return {
      ok: false,
      assimilated: false,
      pack: null,
      policy: QUOTA_MESH_POLICY,
      error: "FORBIDDEN: burner/trashable/perishable ACCOUNT farming. Perishable means jobs/pods only.",
      hold: HOLD,
      lattice_sync: false,
    }
  }

  if (input.accountMode && input.accountMode !== "operator-owned") {
    return {
      ok: false,
      assimilated: false,
      pack: null,
      policy: QUOTA_MESH_POLICY,
      error: "Only operator-owned accounts allowed for quota mesh assimilate",
      hold: HOLD,
      lattice_sync: false,
    }
  }

  const provider = (input.provider || "local-dry-run").slice(0, 64)
  const jobId = (input.jobId || "job-local").slice(0, 64)
  const title = (input.title || `Assimilate ${provider} job`).slice(0, 200)

  const result = emitLesson({
    title,
    summary: `[quota-mesh/${provider}] job=${jobId} · ${summary}`.slice(0, 1200),
    modality: input.modality || "text",
    tags: ["assimilate", "quota-mesh", provider, "operator-owned", "no-burner"],
    source: "assimilate",
    students: input.students,
    autoPush: input.autoPush !== false,
  })

  return {
    ok: result.ok,
    assimilated: result.ok,
    pack: result.pack,
    encrypted: result.encrypted,
    dimmPath: result.dimmPath,
    pushed: result.pushed,
    policy: QUOTA_MESH_POLICY,
    error: result.error,
    hold: HOLD,
    lattice_sync: false,
  }
}
