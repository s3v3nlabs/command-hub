import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import readline from "readline"
import { resolveAllowlistedFile } from "@/lib/evidence/paths"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const MAX_PAGE = 200
const MAX_JSON_BYTES = 8 * 1024 * 1024 // 8MB for full JSON files

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const id = sp.get("id") || ""
  const offset = Math.max(0, parseInt(sp.get("offset") || "0", 10) || 0)
  const limit = Math.min(MAX_PAGE, Math.max(1, parseInt(sp.get("limit") || "50", 10) || 50))
  const q = (sp.get("q") || "").trim().toLowerCase()

  try {
    const file = resolveAllowlistedFile(id)
    if (!file.exists) {
      return NextResponse.json({ ok: false, error: "file_not_found", id, rel: file.rel }, { status: 404 })
    }

    if (file.kind === "json") {
      const st = fs.statSync(file.abs)
      if (st.size > MAX_JSON_BYTES) {
        return NextResponse.json({ ok: false, error: "json_too_large", size: st.size }, { status: 413 })
      }
      const raw = fs.readFileSync(file.abs, "utf8")
      let data: unknown
      try {
        data = JSON.parse(raw)
      } catch {
        return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 })
      }
      // Optional filter for arrays / object-of-arrays
      let filtered: unknown = data
      let total = Array.isArray(data) ? data.length : 1
      if (q && Array.isArray(data)) {
        filtered = data.filter((row) => JSON.stringify(row).toLowerCase().includes(q))
        total = (filtered as unknown[]).length
      }
      if (Array.isArray(filtered)) {
        const page = (filtered as unknown[]).slice(offset, offset + limit)
        return NextResponse.json({
          ok: true,
          id,
          kind: "json",
          rel: file.rel,
          size: st.size,
          total,
          offset,
          limit,
          q: q || null,
          rows: page,
        })
      }
      return NextResponse.json({
        ok: true,
        id,
        kind: "json",
        rel: file.rel,
        size: st.size,
        total: 1,
        offset: 0,
        limit: 1,
        data: filtered,
      })
    }

    // JSONL — stream/page server-side
    const stream = fs.createReadStream(file.abs, { encoding: "utf8" })
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity })
    const rows: unknown[] = []
    let lineNo = 0
    let matched = 0
    let totalMatched = 0
    // First pass: if no q, we can skip until offset; with q we must scan
    for await (const line of rl) {
      if (!line.trim()) continue
      lineNo++
      let obj: unknown
      try {
        obj = JSON.parse(line)
      } catch {
        obj = { _raw: line.slice(0, 2000), _parse_error: true }
      }
      const hay = q ? JSON.stringify(obj).toLowerCase() : ""
      if (q && !hay.includes(q)) continue
      totalMatched++
      if (totalMatched <= offset) continue
      if (rows.length < limit) {
        rows.push({ _line: lineNo, ...(typeof obj === "object" && obj && !Array.isArray(obj) ? obj : { value: obj }) })
        matched++
      }
      // If no search, we can stop once we have the page — but still need total.
      // For large files without q, estimate total via second cheap count only when needed.
      if (!q && rows.length >= limit) {
        // Continue counting remaining lines for total
        for await (const rest of rl) {
          if (rest.trim()) totalMatched++
        }
        break
      }
    }
    // When q empty, totalMatched so far = offset + rows + remaining counted
    // When we didn't early-break, totalMatched is full match count
    const total = q ? totalMatched : totalMatched

    return NextResponse.json({
      ok: true,
      id,
      kind: "jsonl",
      rel: file.rel,
      size: fs.statSync(file.abs).size,
      total,
      offset,
      limit,
      q: q || null,
      rows,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error"
    return NextResponse.json({ ok: false, error: msg }, { status: 400 })
  }
}
