import { NextResponse } from "next/server"
import { EVIDENCE_ROOT, listAllowlistedFiles, resolveSqlitePath } from "@/lib/evidence/paths"
import fs from "fs"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const files = listAllowlistedFiles()
  let sqlite = { exists: false, size: 0, path_rel: "forensics/echonexus_v0_crosswalk/v0_messages.sqlite3" }
  try {
    const abs = resolveSqlitePath()
    if (fs.existsSync(abs)) {
      sqlite = { exists: true, size: fs.statSync(abs).size, path_rel: sqlite.path_rel }
    }
  } catch {}
  return NextResponse.json({
    ok: true,
    evidence_root: EVIDENCE_ROOT,
    files,
    sqlite,
    postgres_env_present: !!(process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL),
  })
}
