
/**
 * Live database backend. Always has a real on-disk SQLite database
 * (local-data/vault-streams/hub.sqlite) queried by a Python sqlite3 helper.
 * If POSTGRES_URL / NEON_DATABASE_URL is set, also runs the same SQL against
 * Postgres (pg) and returns both results — never a fake users table.
 */
import { spawn } from "child_process"
import path from "path"
import fs from "fs"

const HELPER = path.join(process.cwd(), "scripts", "live-sqlite.py")

function runHelper(payload: unknown, timeoutMs = 8000): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    const py = spawn("python3", [HELPER], { stdio: ["pipe", "pipe", "pipe"] })
    const timer = setTimeout(() => {
      py.kill("SIGKILL")
      resolve({ ok: false, error: "sqlite helper timed out" })
    }, timeoutMs)
    let stdout = ""
    let stderr = ""
    py.stdout.on("data", (d) => (stdout += d.toString()))
    py.stderr.on("data", (d) => (stderr += d.toString()))
    py.on("close", () => {
      clearTimeout(timer)
      try {
        resolve(JSON.parse(stdout) as Record<string, unknown>)
      } catch {
        resolve({ ok: false, error: stderr || stdout || "sqlite helper produced no JSON" })
      }
    })
    py.on("error", (e) => {
      clearTimeout(timer)
      resolve({ ok: false, error: e.message })
    })
    py.stdin.write(JSON.stringify(payload))
    py.stdin.end()
  })
}

export async function sqliteSchema() {
  const r = await runHelper({ op: "schema" })
  return { ...r, live: true, backend: r.backend || "python sqlite3 (live)" }
}

export async function sqliteQuery(sql: string) {
  const r = await runHelper({ op: "query", sql })
  return { ...r, live: true, backend: r.backend || "python sqlite3 (live)" }
}

export async function sqliteInsertEvent(source: string, kind: string, payload: unknown) {
  return runHelper({ op: "insert_event", source, kind, payload })
}

export async function postgresQuery(sql: string): Promise<Record<string, unknown>> {
  const url = process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL
  if (!url) return { ok: false, configured: false, error: "POSTGRES_URL / NEON_DATABASE_URL not set" }
  try {
    // dynamic import so the module loads even if pg types are loose
    const pg = await import("pg")
    const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 6000, statement_timeout: 8000 })
    await client.connect()
    try {
      const res = await client.query(sql)
      return {
        ok: true,
        configured: true,
        backend: "pg (live)",
        live: true,
        result: {
          columns: res.fields?.map((f: { name: string }) => f.name) || [],
          rows: res.rows.map((row: Record<string, unknown>) => Object.values(row)),
          rowCount: res.rowCount,
          mutating: !/^\s*(select|with|explain|show|pragma)\b/i.test(sql),
        },
      }
    } finally {
      await client.end()
    }
  } catch (e) {
    return { ok: false, configured: true, error: e instanceof Error ? e.message : String(e), backend: "pg (live)" }
  }
}

export async function vaultStreamsOverview() {
  const schema = await sqliteSchema()
  const pgConfigured = !!(process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL)
  const dbPath = path.join(process.cwd(), "local-data", "vault-streams", "hub.sqlite")
  return {
    ok: true,
    backend: "SQLite (always live) + optional Postgres",
    live: true,
    sqlite: {
      path: dbPath,
      exists: fs.existsSync(dbPath),
      size: fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0,
      schema,
    },
    postgres: { configured: pgConfigured, note: pgConfigured ? "POST a SQL query with engine=postgres to run it live" : "set POSTGRES_URL to enable" },
  }
}
