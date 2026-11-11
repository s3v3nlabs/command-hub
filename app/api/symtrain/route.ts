export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import {
  symtrainStatus,
  dryRunTrain,
  listLessons,
  getLesson,
  setTeacher,
  emitLesson,
  pushLessonToStudents,
  runStrain,
  listStrainModes,
  omniverseStatus,
  isStudentRoleId,
  type StudentRoleId,
  type StrainMode,
  HOLD,
  assimilateJobOutput,
} from "@/lib/train"

/**
 * Σ3D-SYMTRAIN / Teacher→Student bus API.
 * Actions: status, dryRunTrain, listLessons, setTeacher, pushLessonToStudents, strain, emitLesson
 * Omniverse = unavailable · mesh = dry-run · HOLD_VYRNA_UNSYNC
 * Never logs lesson body / secrets to console.
 */

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action") || "status"

  if (action === "lessons" || action === "listLessons") {
    const limit = Number(searchParams.get("limit") || "40")
    return NextResponse.json({
      ok: true,
      lessons: listLessons(limit),
      hold: HOLD,
      lattice_sync: false,
    })
  }

  if (action === "omniverse") {
    return NextResponse.json({ ok: true, omniverse: omniverseStatus(), mesh: "dry-run", lattice_sync: false })
  }

  if (action === "strainModes") {
    return NextResponse.json({ ok: true, modes: listStrainModes(), lattice_sync: false, hold: HOLD })
  }

  if (action === "lesson") {
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ ok: false, error: "id required", lattice_sync: false }, { status: 400 })
    }
    const lesson = getLesson(id)
    return NextResponse.json({
      ok: Boolean(lesson),
      lesson,
      hold: HOLD,
      lattice_sync: false,
    })
  }

  return NextResponse.json(symtrainStatus())
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const action = typeof body?.action === "string" ? body.action : "status"

    if (action === "status") {
      return NextResponse.json(symtrainStatus())
    }

    if (action === "dryRunTrain") {
      const result = dryRunTrain({
        title: typeof body?.title === "string" ? body.title : undefined,
        modality: typeof body?.modality === "string" ? body.modality : undefined,
      })
      return NextResponse.json(result)
    }

    if (action === "listLessons") {
      return NextResponse.json({
        ok: true,
        lessons: listLessons(Number(body?.limit) || 40),
        hold: HOLD,
        lattice_sync: false,
      })
    }

    if (action === "setTeacher") {
      const id = body?.teacherId === "dev-operator" ? "dev-operator" : "dev-operator"
      return NextResponse.json({ ok: true, ...setTeacher(id) })
    }

    if (action === "emitLesson") {
      const students = Array.isArray(body?.students)
        ? (body.students.filter(isStudentRoleId) as StudentRoleId[])
        : undefined
      const result = emitLesson({
        title: String(body?.title || ""),
        summary: String(body?.summary || ""),
        content: typeof body?.content === "string" ? body.content : undefined,
        students,
        modality: body?.modality,
        tags: Array.isArray(body?.tags) ? body.tags.map(String) : undefined,
        source: body?.source || "manual",
        autoPush: body?.autoPush !== false,
      })
      return NextResponse.json({ ...result, hold: HOLD, lattice_sync: false }, { status: result.ok ? 200 : 400 })
    }

    if (action === "pushLessonToStudents" || action === "push") {
      const lessonId = typeof body?.lessonId === "string" ? body.lessonId : ""
      const pack = lessonId ? getLesson(lessonId) : null
      if (!pack) {
        return NextResponse.json(
          { ok: false, error: "lessonId not found", hold: HOLD, lattice_sync: false },
          { status: 404 },
        )
      }
      const students = Array.isArray(body?.students)
        ? (body.students.filter(isStudentRoleId) as StudentRoleId[])
        : undefined
      const result = pushLessonToStudents(pack, students)
      return NextResponse.json(result)
    }

    if (action === "strain") {
      const mode = (typeof body?.mode === "string" ? body.mode : "symbolic_miss_drill") as StrainMode
      const students = Array.isArray(body?.students)
        ? (body.students.filter(isStudentRoleId) as StudentRoleId[])
        : undefined
      const result = runStrain({
        mode,
        students,
        seed: typeof body?.seed === "string" ? body.seed : undefined,
        emitLesson: body?.emitLesson !== false,
      })
      return NextResponse.json({ ok: true, strain: result, roster: symtrainStatus().roster })
    }


    if (action === "assimilateJob" || action === "assimilate") {
      const result = assimilateJobOutput({
        provider: typeof body?.provider === "string" ? body.provider : undefined,
        jobId: typeof body?.jobId === "string" ? body.jobId : undefined,
        summary: String(body?.summary || ""),
        title: typeof body?.title === "string" ? body.title : undefined,
        modality: body?.modality,
        students: Array.isArray(body?.students)
          ? (body.students.filter(isStudentRoleId) as StudentRoleId[])
          : undefined,
        autoPush: body?.autoPush !== false,
        accountMode: typeof body?.accountMode === "string" ? body.accountMode : "operator-owned",
      })
      return NextResponse.json(result, { status: result.ok ? 200 : 400 })
    }

    return NextResponse.json(
      { ok: false, error: `unknown action: ${action}`, hold: HOLD, lattice_sync: false },
      { status: 400 },
    )
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "symtrain error",
        hold: HOLD,
        lattice_sync: false,
      },
      { status: 500 },
    )
  }
}
