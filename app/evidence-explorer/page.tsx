"use client"

import { useCallback, useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileSearch, Database, Server, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"

type FileMeta = {
  id: string
  label: string
  kind: "json" | "jsonl"
  rel: string
  exists: boolean
  size: number
}

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export default function EvidenceExplorerPage() {
  const [files, setFiles] = useState<FileMeta[]>([])
  const [evidenceRoot, setEvidenceRoot] = useState("")
  const [sqliteMeta, setSqliteMeta] = useState<{ exists: boolean; size: number } | null>(null)
  const [pgPresent, setPgPresent] = useState(false)
  const [selected, setSelected] = useState<string>("")
  const [q, setQ] = useState("")
  const [offset, setOffset] = useState(0)
  const [limit] = useState(40)
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState<unknown[]>([])
  const [jsonData, setJsonData] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // SQLite
  const [tables, setTables] = useState<string[]>([])
  const [tableInfo, setTableInfo] = useState<Record<string, { columns?: { name: string; type: string }[]; row_count?: number }>>({})
  const [sql, setSql] = useState("SELECT chat_id, msg_id, role, created_at_mt, substr(text,1,200) AS text_preview FROM messages ORDER BY created_at DESC LIMIT 50")
  const [sqlCols, setSqlCols] = useState<string[]>([])
  const [sqlRows, setSqlRows] = useState<unknown[][]>([])
  const [sqlErr, setSqlErr] = useState<string | null>(null)
  const [sqlLoading, setSqlLoading] = useState(false)

  // Postgres
  const [pgSql, setPgSql] = useState("SELECT 1 AS ok")
  const [pgCols, setPgCols] = useState<string[]>([])
  const [pgRows, setPgRows] = useState<unknown[][]>([])
  const [pgErr, setPgErr] = useState<string | null>(null)
  const [pgLoading, setPgLoading] = useState(false)

  const loadCatalog = useCallback(async () => {
    const res = await fetch("/api/evidence/files")
    const data = await res.json()
    if (data.ok) {
      setFiles(data.files || [])
      setEvidenceRoot(data.evidence_root || "")
      setSqliteMeta(data.sqlite || null)
      setPgPresent(!!data.postgres_env_present)
      if (!selected && data.files?.length) {
        const first = data.files.find((f: FileMeta) => f.exists) || data.files[0]
        setSelected(first.id)
      }
    }
  }, [selected])

  const loadJson = useCallback(async () => {
    if (!selected) return
    setLoading(true)
    setErr(null)
    setJsonData(null)
    setRows([])
    try {
      const params = new URLSearchParams({
        id: selected,
        offset: String(offset),
        limit: String(limit),
      })
      if (q.trim()) params.set("q", q.trim())
      const res = await fetch(`/api/evidence/json?${params}`)
      const data = await res.json()
      if (!data.ok) {
        setErr(data.error || "load_failed")
        return
      }
      setTotal(data.total || 0)
      if (data.rows) setRows(data.rows)
      if (data.data !== undefined) setJsonData(data.data)
    } catch (e) {
      setErr(e instanceof Error ? e.message : "fetch_failed")
    } finally {
      setLoading(false)
    }
  }, [selected, offset, limit, q])

  const loadSqliteTables = useCallback(async () => {
    try {
      const res = await fetch("/api/evidence/sqlite")
      const data = await res.json()
      if (data.ok) {
        setTables(data.tables || [])
        setTableInfo(data.info || {})
      }
    } catch {}
  }, [])

  const runSqlite = async () => {
    setSqlLoading(true)
    setSqlErr(null)
    try {
      const res = await fetch("/api/evidence/sqlite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql, limit: 200 }),
      })
      const data = await res.json()
      if (!data.ok) {
        setSqlErr(data.error || data.detail || "query_failed")
        setSqlCols([])
        setSqlRows([])
        return
      }
      setSqlCols(data.columns || [])
      setSqlRows(data.rows || [])
    } catch (e) {
      setSqlErr(e instanceof Error ? e.message : "fetch_failed")
    } finally {
      setSqlLoading(false)
    }
  }

  const runPostgres = async () => {
    setPgLoading(true)
    setPgErr(null)
    try {
      const res = await fetch("/api/evidence/postgres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql: pgSql, limit: 50 }),
      })
      const data = await res.json()
      if (!data.ok) {
        setPgErr([data.error, data.detail].filter(Boolean).join(": "))
        setPgCols([])
        setPgRows([])
        return
      }
      setPgCols(data.columns || [])
      setPgRows(data.rows || [])
    } catch (e) {
      setPgErr(e instanceof Error ? e.message : "fetch_failed")
    } finally {
      setPgLoading(false)
    }
  }

  useEffect(() => {
    loadCatalog()
    loadSqliteTables()
  }, [loadCatalog, loadSqliteTables])

  useEffect(() => {
    loadJson()
  }, [loadJson])

  return (
    <AppShell>
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <FileSearch className="h-6 w-6" />
              Evidence Explorer
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Read-only reclaim dumps — JSON/JSONL + SQLite (+ optional Postgres). Evidence mode: message text kept; no env dump endpoint.
            </p>
            {evidenceRoot && (
              <p className="text-xs text-muted-foreground mt-1 font-mono">EVIDENCE_ROOT={evidenceRoot}</p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => { loadCatalog(); loadSqliteTables(); loadJson() }}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>

        <Tabs defaultValue="json" className="w-full">
          <TabsList>
            <TabsTrigger value="json">JSON / JSONL</TabsTrigger>
            <TabsTrigger value="sqlite">
              SQLite {sqliteMeta?.exists ? <Badge className="ml-2" variant="secondary">{fmtBytes(sqliteMeta.size)}</Badge> : null}
            </TabsTrigger>
            <TabsTrigger value="postgres">
              Postgres {pgPresent ? <Badge className="ml-2" variant="secondary">DSN</Badge> : <Badge className="ml-2" variant="outline">n/a</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="json" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-1 border rounded-lg p-3 space-y-2 bg-card">
                <div className="text-xs font-semibold uppercase text-muted-foreground">Sources</div>
                {files.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => { setSelected(f.id); setOffset(0) }}
                    className={`w-full text-left rounded-md px-2 py-2 text-sm border transition ${
                      selected === f.id ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted/50"
                    }`}
                  >
                    <div className="font-medium truncate">{f.label}</div>
                    <div className="text-[11px] text-muted-foreground font-mono truncate">{f.rel}</div>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={f.exists ? "secondary" : "destructive"}>{f.exists ? f.kind : "missing"}</Badge>
                      {f.exists && <span className="text-[11px] text-muted-foreground">{fmtBytes(f.size)}</span>}
                    </div>
                  </button>
                ))}
              </div>

              <div className="lg:col-span-3 space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <Input
                    placeholder="Filter / search (server-side for JSONL)…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { setOffset(0); loadJson() } }}
                    className="flex-1 min-w-[200px]"
                  />
                  <Button onClick={() => { setOffset(0); loadJson() }} disabled={loading}>Search</Button>
                  <Button variant="outline" disabled={offset <= 0 || loading} onClick={() => setOffset(Math.max(0, offset - limit))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" disabled={loading || offset + limit >= total} onClick={() => setOffset(offset + limit)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  {loading ? "Loading…" : err ? `Error: ${err}` : `Showing ${rows.length || (jsonData ? 1 : 0)} / ${total} · offset ${offset}`}
                </div>
                <ScrollArea className="h-[65vh] border rounded-lg bg-black/40 p-3">
                  {jsonData !== null && (
                    <pre className="text-xs font-mono whitespace-pre-wrap break-all text-green-200/90">
                      {JSON.stringify(jsonData, null, 2)}
                    </pre>
                  )}
                  {rows.map((row, i) => (
                    <pre key={i} className="text-xs font-mono whitespace-pre-wrap break-all text-green-200/90 border-b border-white/5 py-2">
                      {JSON.stringify(row, null, 2)}
                    </pre>
                  ))}
                  {!loading && !err && rows.length === 0 && jsonData === null && (
                    <div className="text-sm text-muted-foreground p-4">No rows.</div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sqlite" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-1 border rounded-lg p-3 space-y-2 bg-card">
                <div className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
                  <Database className="h-3.5 w-3.5" /> Tables
                </div>
                {tables.map((t) => (
                  <button
                    key={t}
                    className="w-full text-left rounded-md px-2 py-2 text-sm hover:bg-muted/50"
                    onClick={() => setSql(`SELECT * FROM "${t}" LIMIT 50`)}
                  >
                    <div className="font-medium">{t}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {tableInfo[t]?.row_count ?? "?"} rows · {(tableInfo[t]?.columns || []).map((c) => c.name).join(", ")}
                    </div>
                  </button>
                ))}
                {!tables.length && <div className="text-xs text-muted-foreground">No tables (or DB missing).</div>}
              </div>
              <div className="lg:col-span-3 space-y-3">
                <textarea
                  className="w-full h-28 font-mono text-xs rounded-md border bg-background p-3"
                  value={sql}
                  onChange={(e) => setSql(e.target.value)}
                  spellCheck={false}
                />
                <div className="flex gap-2 items-center">
                  <Button onClick={runSqlite} disabled={sqlLoading}>
                    {sqlLoading ? "Running…" : "Run SELECT"}
                  </Button>
                  <span className="text-xs text-muted-foreground">Read-only · INSERT/UPDATE/DELETE/DROP blocked</span>
                </div>
                {sqlErr && <div className="text-sm text-red-400">{sqlErr}</div>}
                <ScrollArea className="h-[55vh] border rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-card">
                      <tr>
                        {sqlCols.map((c) => (
                          <th key={c} className="text-left p-2 border-b font-semibold">{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sqlRows.map((r, i) => (
                        <tr key={i} className="border-b border-white/5 align-top">
                          {r.map((cell, j) => (
                            <td key={j} className="p-2 font-mono whitespace-pre-wrap break-all max-w-[28rem]">
                              {cell === null || cell === undefined ? "∅" : String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="postgres" className="space-y-4 mt-4">
            <div className="border rounded-lg p-4 space-y-3 bg-card">
              <div className="flex items-center gap-2 text-sm">
                <Server className="h-4 w-4" />
                Optional remote Postgres / Neon — DSN from env (never echoed). SELECT only.
              </div>
              {!pgPresent && (
                <div className="text-sm text-amber-400">No POSTGRES_URL / NEON_DATABASE_URL present in process env.</div>
              )}
              <textarea
                className="w-full h-24 font-mono text-xs rounded-md border bg-background p-3"
                value={pgSql}
                onChange={(e) => setPgSql(e.target.value)}
                spellCheck={false}
              />
              <Button onClick={runPostgres} disabled={pgLoading || !pgPresent}>
                {pgLoading ? "Running…" : "Run SELECT"}
              </Button>
              {pgErr && <div className="text-sm text-red-400">{pgErr}</div>}
              <ScrollArea className="h-[40vh] border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card">
                    <tr>
                      {pgCols.map((c) => (
                        <th key={c} className="text-left p-2 border-b font-semibold">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pgRows.map((r, i) => (
                      <tr key={i} className="border-b border-white/5">
                        {r.map((cell, j) => (
                          <td key={j} className="p-2 font-mono whitespace-pre-wrap break-all">
                            {cell === null || cell === undefined ? "∅" : String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
