import fs from "fs"
import path from "path"

export const EVIDENCE_ROOT = process.env.EVIDENCE_ROOT || "./local-data/evidence"

/** Allowlisted relative paths under EVIDENCE_ROOT (and absolute aliases). */
export const EVIDENCE_FILES: Record<
  string,
  { rel: string; kind: "json" | "jsonl"; label: string; fallbackRel?: string }
> = {
  messages_jsonl: {
    rel: "forensics/echonexus_v0_crosswalk/messages_FULL.jsonl",
    fallbackRel: "forensics/echonexus_v0_crosswalk/messages_scrubbed.jsonl",
    kind: "jsonl",
    label: "EchoNexus messages (JSONL)",
  },
  chat_manifest: {
    rel: "v0-history/user-interface/chat_attachments/MANIFEST.jsonl",
    kind: "jsonl",
    label: "Chat attachments MANIFEST",
  },
  reconstruct_report: {
    rel: "projects/v0-user-interface/RECONSTRUCT_REPORT.json",
    kind: "json",
    label: "RECONSTRUCT_REPORT",
  },
  version_index: {
    rel: "projects/v0-user-interface/VERSION_INDEX.json",
    kind: "json",
    label: "VERSION_INDEX",
  },
  term_hits_v0: {
    rel: "forensics/echonexus_v0_crosswalk/term_hits_v0.json",
    kind: "json",
    label: "term_hits_v0",
  },
  term_hits_vault: {
    rel: "forensics/echonexus_v0_crosswalk/term_hits_vault.json",
    kind: "json",
    label: "term_hits_vault",
  },
}

export const SQLITE_DB_REL = "forensics/echonexus_v0_crosswalk/v0_messages.sqlite3"

export function resolveEvidencePath(rel: string): string {
  const root = path.resolve(EVIDENCE_ROOT)
  const abs = path.resolve(root, rel)
  if (!abs.startsWith(root + path.sep) && abs !== root) {
    throw new Error("path_escape_blocked")
  }
  return abs
}

export function resolveAllowlistedFile(id: string): {
  id: string
  abs: string
  kind: "json" | "jsonl"
  label: string
  rel: string
  exists: boolean
  size: number
} {
  const meta = EVIDENCE_FILES[id]
  if (!meta) throw new Error("unknown_file_id")
  let rel = meta.rel
  let abs = resolveEvidencePath(rel)
  if (!fs.existsSync(abs) && meta.fallbackRel) {
    rel = meta.fallbackRel
    abs = resolveEvidencePath(rel)
  }
  const exists = fs.existsSync(abs)
  const size = exists ? fs.statSync(abs).size : 0
  return { id, abs, kind: meta.kind, label: meta.label, rel, exists, size }
}

export function listAllowlistedFiles() {
  return Object.keys(EVIDENCE_FILES).map((id) => {
    try {
      const r = resolveAllowlistedFile(id)
      return {
        id: r.id,
        label: r.label,
        kind: r.kind,
        rel: r.rel,
        exists: r.exists,
        size: r.size,
      }
    } catch {
      return { id, label: EVIDENCE_FILES[id].label, kind: EVIDENCE_FILES[id].kind, rel: EVIDENCE_FILES[id].rel, exists: false, size: 0 }
    }
  })
}

export function resolveSqlitePath(): string {
  return resolveEvidencePath(SQLITE_DB_REL)
}

/** Hard-block mutating SQL. */
export function assertReadOnlySql(sql: string): void {
  const stripped = sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ")
    .trim()
  if (!stripped) throw new Error("empty_sql")
  // Disallow multiple statements
  const withoutStrings = stripped.replace(/'(?:[^']|'')*'/g, "''")
  if (withoutStrings.includes(";")) {
    const parts = withoutStrings.split(";").map((s) => s.trim()).filter(Boolean)
    if (parts.length > 1) throw new Error("multi_statement_blocked")
  }
  const first = stripped.replace(/^\(+/, "").trim().split(/\s+/)[0]?.toUpperCase() || ""
  const allowed = new Set(["SELECT", "WITH", "EXPLAIN", "PRAGMA"])
  if (!allowed.has(first)) throw new Error("mutating_sql_blocked")
  const upper = stripped.toUpperCase()
  for (const bad of ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "ATTACH", "DETACH", "REPLACE", "TRUNCATE", "VACUUM", "REINDEX"]) {
    // word-boundary-ish
    if (new RegExp(`\\b${bad}\\b`).test(upper) && first !== "PRAGMA") {
      // allow EXPLAIN QUERY PLAN which doesn't contain these as verbs typically
      if (first === "SELECT" || first === "WITH" || first === "EXPLAIN") {
        if (bad !== "CREATE" || !upper.includes("EXPLAIN")) {
          // still block if present as statement keywords outside CTE names — pragmatic
          if (["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "ATTACH", "DETACH", "TRUNCATE"].includes(bad)) {
            throw new Error("mutating_sql_blocked")
          }
        }
      } else if (first === "PRAGMA") {
        // only allow table_info / schema style
        if (!/^PRAGMA\s+(table_info|table_list|database_list|schema_version|user_version|compile_options)\b/i.test(stripped)) {
          throw new Error("pragma_blocked")
        }
      }
    }
  }
}
