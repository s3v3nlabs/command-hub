
/**
 * Real Obsidian-compatible vault: reads and writes markdown under
 * OBSIDIAN_VAULT_PATH or local-data/obsidian-vault. Saves are real fsyncs.
 */
import fs from "fs"
import path from "path"

export function vaultRoot(): string {
  return path.resolve(process.env.OBSIDIAN_VAULT_PATH || path.join(process.cwd(), "local-data", "obsidian-vault"))
}

function ensureVault() {
  const root = vaultRoot()
  fs.mkdirSync(root, { recursive: true, mode: 0o755 })
  const welcome = path.join(root, "Welcome.md")
  if (!fs.existsSync(welcome)) {
    fs.writeFileSync(
      welcome,
      `# Command Hub vault\n\nOperator: S3v3n@SingularityDefense / SLDS\n\nThis is a real on-disk Markdown vault. Notes you save from the hub editor land here.\n\n- Path: \`${root}\`\n- Override with \`OBSIDIAN_VAULT_PATH\`.\n`,
    )
  }
  return root
}

function safeJoin(rel: string): string | { error: string } {
  const root = ensureVault()
  const abs = path.resolve(root, rel || "")
  if (abs !== root && !abs.startsWith(root + path.sep)) return { error: "path escapes the vault" }
  return abs
}

export function listVault(rel = "") {
  const abs = safeJoin(rel)
  if (typeof abs !== "string") return { ok: false as const, ...abs }
  const root = vaultRoot()
  const items: Array<{ name: string; path: string; rel: string; type: "directory" | "file"; size?: number; modified: string }> = []
  function walk(dir: string, depth: number) {
    if (depth > 6) return
    let names: string[] = []
    try {
      names = fs.readdirSync(dir)
    } catch {
      return
    }
    for (const name of names) {
      if (name === ".git" || name === "node_modules") continue
      const p = path.join(dir, name)
      let st: fs.Stats
      try {
        st = fs.statSync(p)
      } catch {
        continue
      }
      const r = path.relative(root, p)
      items.push({
        name,
        path: p,
        rel: r,
        type: st.isDirectory() ? "directory" : "file",
        size: st.isDirectory() ? undefined : st.size,
        modified: st.mtime.toISOString(),
      })
      if (st.isDirectory()) walk(p, depth + 1)
    }
  }
  walk(abs, 0)
  return { ok: true as const, backend: "fs vault (live)", live: true, root, cwd: abs, items }
}

export function readNote(rel: string) {
  const abs = safeJoin(rel)
  if (typeof abs !== "string") return { ok: false as const, ...abs }
  try {
    const st = fs.statSync(abs)
    if (st.isDirectory()) return { ok: false as const, error: "is a directory" }
    const content = fs.readFileSync(abs, "utf8")
    return { ok: true as const, backend: "fs.readFile (live)", live: true, path: abs, rel, content, size: st.size, modified: st.mtime.toISOString() }
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : String(e) }
  }
}

export function writeNote(rel: string, content: string) {
  if (!rel || rel.endsWith("/")) return { ok: false as const, error: "file path required" }
  if (!/\.(md|mdx|txt|markdown)$/i.test(rel)) return { ok: false as const, error: "only .md/.txt notes can be written through this API" }
  if (content.length > 2_000_000) return { ok: false as const, error: "note too large" }
  const abs = safeJoin(rel)
  if (typeof abs !== "string") return { ok: false as const, ...abs }
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, content, { encoding: "utf8", mode: 0o644 })
  const st = fs.statSync(abs)
  return { ok: true as const, backend: "fs.writeFile (live)", live: true, path: abs, rel, size: st.size, modified: st.mtime.toISOString() }
}
