export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { createHash } from "crypto"
import { DEV_OPERATOR_SYSTEM_PROMPT } from "@/lib/dev-operator/system-prompt"
import { loadPrefs, savePrefs, appendLearnedNote, recentLearnedNotes } from "@/lib/dev-operator/prefs"
import { createModuleStub, writePatchProposal } from "@/lib/dev-operator/actions"
import { isModuleManifest } from "@/lib/modules/types"
import { hiveStatus } from "@/lib/hive/bus"
import { listModules } from "@/lib/modules/registry"
import {
  getLearnMetrics,
  retrieveContextForPrompt,
  learnFromChatTurn,
  learnCorrection,
  learnProposalAccepted,
  learnPreference,
} from "@/lib/dev-operator/learn"
import { emitFromSymbolicLearn } from "@/lib/train/teacher"
import {
  decideDevOperatorLane,
  sigmaLaneDevStatus,
  rememberDevOperatorLesson,
} from "@/lib/sigma-lane"
import { getDevOperatorBackendStatus } from "@/lib/dev-operator/backend-status"


function shapeHemispheres(h: ReturnType<typeof decideDevOperatorLane>["hemispheres"] | undefined) {
  if (!h) return undefined
  return {
    left: {
      label: h.left.label,
      active: h.left.active,
      weight: h.left.weight,
      meaning: h.left.meaning,
    },
    right: {
      label: h.right.label,
      active: h.right.active,
      weight: h.right.weight,
      meaning: h.right.meaning,
    },
    dominant: h.dominant,
    path: h.path,
  }
}

/**
 * Local Dev Operator AI — Sigma-lane FIRST, then private panel / Twin + learn loop.
 * Never logs prompt bodies. HOLD_VYRNA_UNSYNC · lattice_sync: false.
 */

export async function GET() {
  const backend = await getDevOperatorBackendStatus()
  return NextResponse.json({
    ok: true,
    service: "dev-operator",
    backend,
    prefs: loadPrefs(),
    learnedNotes: recentLearnedNotes(8),
    learn: getLearnMetrics(),
    sigmaLane: sigmaLaneDevStatus(),
    modules: listModules({ includeDevOnly: true }).map((m) => ({
      id: m.id,
      route: m.route,
      name: m.name,
    })),
    hive: hiveStatus(),
    hold: "HOLD_VYRNA_UNSYNC",
    lattice_sync: false,
    note: "POST { message, action? }. Sigma-lane preferred over tokenized LLM. No exploit generation.",
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>))
    const action = typeof body?.action === "string" ? body.action : "chat"
    const message = typeof body?.message === "string" ? body.message : ""

    if (action === "save_pref") {
      const prefs = body?.prefs && typeof body.prefs === "object" ? (body.prefs as Record<string, unknown>) : {}
      const saved = savePrefs(prefs as Parameters<typeof savePrefs>[0])
      if (typeof prefs.tone === "string") {
        learnPreference(`tone:${prefs.tone}`, 1)
      }
      return NextResponse.json({ ...saved, ok: true, action, learn: getLearnMetrics(), lattice_sync: false })
    }

    if (action === "learn" || action === "correction") {
      const note = typeof body?.note === "string" ? body.note : message
      const lesson = learnCorrection(note)
      const r = appendLearnedNote(note, { source: "operator" })
      try {
        rememberDevOperatorLesson("correction", note.slice(0, 400), ["correction"])
      } catch {
        /* optional glyph store */
      }
      return NextResponse.json({ ...r, action, lesson, learn: getLearnMetrics(), lattice_sync: false })
    }

    if (action === "proposal_accepted") {
      const summary = typeof body?.summary === "string" ? body.summary : message
      const lesson = learnProposalAccepted(summary || "proposal accepted")
      return NextResponse.json({ ok: true, action, lesson, learn: getLearnMetrics(), lattice_sync: false })
    }

    if (action === "create_module_stub") {
      const raw = body?.manifest
      if (!isModuleManifest(raw)) {
        return NextResponse.json({ ok: false, error: "manifest required", lattice_sync: false }, { status: 400 })
      }
      const r = createModuleStub(raw)
      if (r.ok) {
        learnProposalAccepted(`Module stub created: ${raw.id} → ${raw.route || "(no route)"}`)
      }
      return NextResponse.json({ ...r, action, learn: getLearnMetrics(), lattice_sync: false }, { status: r.ok ? 200 : 400 })
    }

    if (action === "propose_patch") {
      const title = typeof body?.title === "string" ? body.title : "dev-operator-proposal"
      const markdown = typeof body?.markdown === "string" ? body.markdown : message
      const r = writePatchProposal(title, markdown)
      if (r.ok) learnProposalAccepted(`Patch proposal written: ${title}`)
      return NextResponse.json({ ...r, action, learn: getLearnMetrics(), lattice_sync: false }, { status: r.ok ? 200 : 400 })
    }

    if (action === "hive_status") {
      return NextResponse.json({ ok: true, action, hive: hiveStatus(), learn: getLearnMetrics(), lattice_sync: false })
    }

    if (action === "open_module_bay") {
      return NextResponse.json({ ok: true, action, href: "/modules", lattice_sync: false })
    }

    if (action === "learn_metrics") {
      return NextResponse.json({ ok: true, action, learn: getLearnMetrics(), lattice_sync: false })
    }

    if (action === "sigma_status") {
      return NextResponse.json({ ok: true, action, sigmaLane: sigmaLaneDevStatus(), lattice_sync: false })
    }

    if (!message.trim()) {
      return NextResponse.json({ ok: false, error: "message is required", lattice_sync: false }, { status: 400 })
    }

    // ——— Sigma-lane FIRST (preferred over tokenized LLM) ———
    const lane = decideDevOperatorLane(message)
    if (lane.preferSymbolic && lane.reply) {
      const promptHash = createHash("sha256").update(message).digest("hex").slice(0, 16)
      const { lesson, metrics } = learnFromChatTurn(message, lane.reply)
      let trainEmit: { ok?: boolean; lessonId?: string; skipped?: boolean } | null = null
      try {
        if (lesson?.text) {
          const emitted = emitFromSymbolicLearn({
            lessonText: lesson.text,
            lessonId: lesson.id,
            laneId: lane.result?.laneId,
            autoPush: true,
          })
          trainEmit = {
            ok: emitted.ok,
            lessonId: emitted.pack?.id,
            skipped: Boolean((emitted as { skipped?: boolean }).skipped),
          }
        }
      } catch {
        trainEmit = { ok: false }
      }
      return NextResponse.json({
        ok: true,
        action: "chat",
        reply: lane.reply,
        source: "sigma-lane",
        promptHash,
        learned: lesson ? { id: lesson.id, kind: lesson.kind, text: lesson.text.slice(0, 200) } : null,
        learn: metrics,
        trainEmit,
        lessonsUsed: 0,
        sigmaLane: {
          path: lane.path,
          preferSymbolic: true,
          laneId: lane.result.laneId,
          hzCombo: lane.result.hzCombo,
          symbolicCount: lane.result.symbolicCount,
          hemispheres: shapeHemispheres(lane.hemispheres),
          pulseMs: lane.pulseMs,
        },
        links: { modules: "/modules", bounty: "/bounty", hive: "/api/hive", privacy: "/privacy" },
        hold: "HOLD_VYRNA_UNSYNC",
        lattice_sync: false,
      })
    }

    // ——— Tokenized fallback with sigma context injected ———
    const prefs = loadPrefs()
    const notes = recentLearnedNotes(8)
    const modules = listModules({ includeDevOnly: true })
    const hive = hiveStatus()
    const retrieved = retrieveContextForPrompt(message, 6)

    const contextBlock = [
      DEV_OPERATOR_SYSTEM_PROMPT,
      "",
      "## Operator prefs",
      JSON.stringify(prefs),
      "",
      "## Preference weights",
      JSON.stringify(getLearnMetrics().preference_weights || {}),
      "",
      retrieved.block,
      "",
      lane.contextBlock,
      "",
      "## Recent learned notes",
      notes.length ? notes.map((n, i) => `${i + 1}. ${n}`).join("\n") : "(none)",
      "",
      "## Module registry (ids)",
      modules.map((m) => `- ${m.id} → ${m.route || "(no route)"}`).join("\n"),
      "",
      "## Hive",
      `peers=${(hive as { peerCount?: number }).peerCount ?? (hive as { peers?: string[] }).peers?.length ?? 0} lattice_sync=false`,
      "",
      "## Operator message",
      message,
    ].join("\n")

    let reply = ""
    let source = "fallback"
    try {
      const { runS3v3nPanel } = await import("@/lib/selfHealing/S3v3nPanel")
      const result = await runS3v3nPanel(contextBlock, {
        preferSeat: prefs.preferLocalPanel === false ? undefined : "twin-rag",
        includeOwnedCloud: false,
      })
      source = result.source || "s3v3n-panel"
      const top = result.responses?.slice().sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))?.[0]
      reply =
        result.aggregate?.response ||
        top?.response ||
        "Panel returned no text. Propose a module stub or patch under modules/proposals/."
    } catch {
      try {
        const { queryTwin } = await import("@/lib/ai/operator-twin")
        const twin = await queryTwin({ query: message, topK: 6 })
        source = "operator-twin"
        reply =
          twin?.answer ||
          "Twin unavailable. I can still create module stubs / patch proposals via actions."
      } catch {
        reply = [
          "Local panel/Twin briefly unavailable — still in defensive Dev Operator mode.",
          "Sigma-lane chose TOKEN_FALLBACK; panel unavailable.",
          "Actions: create_module_stub, propose_patch, hive_status, open_module_bay, correction.",
          "HOLD_VYRNA_UNSYNC · lattice_sync: false · no exploit generation.",
          "",
          `Retrieved lessons: ${retrieved.lessons.length}`,
          `You said: ${message.slice(0, 400)}`,
        ].join("\n")
        source = "fallback"
      }
    }

    const promptHash = createHash("sha256").update(message).digest("hex").slice(0, 16)
    const { lesson, metrics } = learnFromChatTurn(message, reply)
    let trainEmit: { ok?: boolean; lessonId?: string } | null = null
    try {
      if (lesson?.text) {
        const emitted = emitFromSymbolicLearn({
          lessonText: lesson.text,
          lessonId: lesson.id,
          autoPush: true,
        })
        trainEmit = { ok: emitted.ok, lessonId: emitted.pack?.id }
      }
    } catch {
      trainEmit = { ok: false }
    }

    return NextResponse.json({
      ok: true,
      action: "chat",
      reply,
      source,
      promptHash,
      learned: lesson ? { id: lesson.id, kind: lesson.kind, text: lesson.text.slice(0, 200) } : null,
      learn: metrics,
      trainEmit,
      lessonsUsed: retrieved.lessons.length,
      sigmaLane: {
        path: lane.path,
        preferSymbolic: false,
        laneId: lane.result.laneId,
        hzCombo: lane.result.hzCombo,
        tokenFallbackHint: lane.result.tokenFallbackHint,
        hemispheres: shapeHemispheres(lane.hemispheres),
        pulseMs: lane.pulseMs,
      },
      links: { modules: "/modules", bounty: "/bounty", hive: "/api/hive", privacy: "/privacy" },
      hold: "HOLD_VYRNA_UNSYNC",
      lattice_sync: false,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "dev-operator failed"
    return NextResponse.json(
      {
        ok: false,
        error: msg.replace(/sk-[a-zA-Z0-9_-]+/g, "[redacted]").slice(0, 300),
        lattice_sync: false,
      },
      { status: 500 },
    )
  }
}
