import { NextRequest, NextResponse } from "next/server"
import { assertReadOnlySql } from "@/lib/evidence/paths"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getDsn(): string | null {
  return (
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.NEON_DATABASE_URL ||
    null
  )
}

export async function GET() {
  const present = !!getDsn()
  return NextResponse.json({
    ok: true,
    dsn_present: present,
    note: "Read-only SELECT only. No env values returned.",
  })
}

export async function POST(req: NextRequest) {
  const dsn = getDsn()
  if (!dsn) {
    return NextResponse.json({ ok: false, error: "postgres_dsn_missing" }, { status: 503 })
  }
  try {
    const body = await req.json()
    const sql = String(body.sql || "")
    const limit = Math.min(200, Math.max(1, Number(body.limit) || 50))
    assertReadOnlySql(sql)

    // Prefer node-postgres if available; never log DSN
    let Client: typeof import("pg").Client
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      Client = require("pg").Client
    } catch {
      return NextResponse.json({ ok: false, error: "pg_module_missing" }, { status: 503 })
    }

    const client = new Client({
      connectionString: dsn.replace(/([?&])sslmode=[^&]*/g, "$1").replace(/[?&]$/, ""),
      connectionTimeoutMillis: 12000,
      ssl: { rejectUnauthorized: false },
    })
    try {
      await client.connect()
      const capped = /^\s*(select|with|explain)\b/i.test(sql) && !/\blimit\b/i.test(sql)
        ? `${sql.replace(/;?\s*$/, "")} LIMIT ${limit}`
        : sql
      const res = await client.query(capped)
      const columns = res.fields?.map((f) => f.name) || []
      const rows = (res.rows || []).slice(0, limit).map((row) => columns.map((c) => {
        const v = row[c]
        if (v === null || v === undefined) return v
        if (typeof v === "object") return JSON.stringify(v)
        return v
      }))
      return NextResponse.json({ ok: true, columns, rows, row_count: rows.length })
    } finally {
      try { await client.end() } catch {}
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error"
    if (msg === "mutating_sql_blocked" || msg === "multi_statement_blocked" || msg === "empty_sql" || msg === "pragma_blocked") {
      return NextResponse.json({ ok: false, error: msg }, { status: 400 })
    }
    // sanitize potential credential leakage
    const safe = msg.replace(/[A-Za-z0-9+/=_\-.]{20,}/g, "<redacted>").replace(/@[^\s/]+/g, "@<host>").slice(0, 180)
    return NextResponse.json({ ok: false, error: "query_failed", detail: safe }, { status: 400 })
  }
}
