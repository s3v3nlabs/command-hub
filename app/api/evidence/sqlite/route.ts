import { NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import fs from "fs"
import { assertReadOnlySql, resolveSqlitePath } from "@/lib/evidence/paths"
import { recordIdsThreat } from "@/lib/security/ids-status"
import { inspectRequest } from "@/lib/security/request-guard"
import { requireHubAuth } from "@/lib/security/api-auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function runPython(payload: object): Promise<{ ok: boolean; [k: string]: unknown }> {
  return new Promise((resolve) => {
    const py = spawn(
      "python3",
      [
        "-c",
        `
import json, sqlite3, sys
req = json.load(sys.stdin)
db = req["db"]
action = req.get("action")
out = {"ok": True}
try:
    conn = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    if action == "tables":
        tables = [r[0] for r in cur.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        ).fetchall()]
        info = {}
        for t in tables:
            try:
                cols = [{"name": c[1], "type": c[2]} for c in cur.execute(f"PRAGMA table_info({t})").fetchall()]
                # quote table name safely — only from master list
                n = cur.execute(f'SELECT COUNT(*) FROM "{t}"').fetchone()[0]
                info[t] = {"columns": cols, "row_count": n}
            except Exception as e:
                info[t] = {"error": type(e).__name__}
        out["tables"] = tables
        out["info"] = info
    elif action == "query":
        sql = req.get("sql") or ""
        limit = min(int(req.get("limit") or 200), 500)
        # wrap to enforce limit if not present
        cur.execute(sql)
        cols = [d[0] for d in cur.description] if cur.description else []
        rows = []
        for i, row in enumerate(cur):
            if i >= limit:
                out["truncated"] = True
                break
            rows.append([row[c] if not isinstance(row[c], bytes) else f"<bytes:{len(row[c])}>" for c in cols])
        out["columns"] = cols
        out["rows"] = rows
        out["row_count"] = len(rows)
    else:
        out = {"ok": False, "error": "unknown_action"}
    conn.close()
except Exception as e:
    out = {"ok": False, "error": type(e).__name__, "detail": str(e)[:200]}
print(json.dumps(out))
`,
      ],
      { stdio: ["pipe", "pipe", "pipe"] },
    )
    let stdout = ""
    let stderr = ""
    py.stdout.on("data", (d) => (stdout += d.toString()))
    py.stderr.on("data", (d) => (stderr += d.toString()))
    py.on("close", () => {
      try {
        resolve(JSON.parse(stdout || "{}"))
      } catch {
        resolve({ ok: false, error: "python_parse_fail", detail: (stderr || stdout).slice(0, 300) })
      }
    })
    py.stdin.write(JSON.stringify(payload))
    py.stdin.end()
  })
}

export async function GET() {
  try {
    const db = resolveSqlitePath()
    if (!fs.existsSync(db)) {
      return NextResponse.json({ ok: false, error: "sqlite_missing" }, { status: 404 })
    }
    const result = await runPython({ db, action: "tables" })
    return NextResponse.json({ ...result, db_rel: "forensics/echonexus_v0_crosswalk/v0_messages.sqlite3", size: fs.statSync(db).size })
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const denied = requireHubAuth(req, { surface: "evidence:sqlite", requireInSecureMode: true })
    if (denied) return denied
    const body = await req.json()
    const sql = String(body.sql || "")
    const limit = Math.min(500, Math.max(1, Number(body.limit) || 200))
    const verdict = inspectRequest({ method: "POST", pathname: "/api/evidence/sqlite", search: "", bodySnippet: sql.slice(0, 400) })
    try {
      assertReadOnlySql(sql)
    } catch (e) {
      recordIdsThreat({ severity: "high", source: "evidence-sqlite", message: "mutating_sql_blocked", blocked: true })
      return NextResponse.json({ ok: false, error: "mutating_sql_blocked" }, { status: 400 })
    }
    if (verdict.reasons.includes("sqli_probe_signature")) {
      recordIdsThreat({ severity: "high", source: "evidence-sqlite", message: "sqli_probe", blocked: true })
    }
    const db = resolveSqlitePath()
    if (!fs.existsSync(db)) {
      return NextResponse.json({ ok: false, error: "sqlite_missing" }, { status: 404 })
    }
    const result = await runPython({ db, action: "query", sql, limit })
    return NextResponse.json(result)
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 400 })
  }
}
