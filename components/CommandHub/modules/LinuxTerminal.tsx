"use client"

/**
 * Real hub-host terminal. Every command is an allowlisted verb executed on
 * this machine via /api/lab/shell (child_process). No mock filesystem, no
 * canned output.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { Terminal as TerminalIcon, RefreshCw } from "lucide-react"

type Verb = { id: string; summary: string }
type Line = { kind: "in" | "out" | "err" | "sys"; text: string }

export default function LinuxTerminal() {
  const [verbs, setVerbs] = useState<Verb[]>([])
  const [lines, setLines] = useState<Line[]>([
    { kind: "sys", text: "Command Hub lab shell — real execution on this host. Type `help` or a verb from the allowlist. No mock filesystem." },
  ])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [token, setToken] = useState("")
  const bottom = useRef<HTMLDivElement>(null)

  const headers = useCallback((): Record<string, string> => ({ "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }), [token])

  const loadVerbs = useCallback(async () => {
    try {
      const r = await fetch("/api/lab/shell", { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      const j = await r.json()
      if (j.ok) setVerbs(j.verbs || [])
      else setLines((l) => [...l, { kind: "err", text: `verb catalog: ${j.error || r.status}` }])
    } catch (e) {
      setLines((l) => [...l, { kind: "err", text: `verb catalog failed: ${(e as Error).message}` }])
    }
  }, [token])

  useEffect(() => {
    loadVerbs()
  }, [loadVerbs])

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" })
  }, [lines])

  const run = useCallback(
    async (raw: string) => {
      const text = raw.trim()
      if (!text) return
      setLines((l) => [...l, { kind: "in", text: `$ ${text}` }])
      if (text === "help" || text === "?") {
        const catalog = verbs.length
          ? verbs.map((v) => `  ${v.id.padEnd(18)} ${v.summary}`).join("\n")
          : "  (catalog not loaded — check hub auth / token)"
        setLines((l) => [...l, { kind: "out", text: `Allowlisted verbs (real child_process on this host):\n${catalog}\n  help               this message\n  clear              clear the scrollback\nOptional argument after the verb, e.g.  curl-local http://127.0.0.1:3000/` }])
        return
      }
      if (text === "clear") {
        setLines([])
        return
      }
      const [verb, ...rest] = text.split(/\s+/)
      const arg = rest.join(" ") || undefined
      setBusy(true)
      try {
        const r = await fetch("/api/lab/shell", { method: "POST", headers: headers(), body: JSON.stringify({ verb, arg }) })
        const j = await r.json()
        const result = j.result || {}
        const out: Line[] = []
        if (result.argv?.length) out.push({ kind: "sys", text: `# ${result.argv.join(" ")}  (${result.durationMs ?? "?"}ms, exit ${result.exitCode ?? "?"})` })
        if (result.stdout) out.push({ kind: "out", text: result.stdout })
        if (result.stderr) out.push({ kind: "err", text: result.stderr })
        if (result.error) out.push({ kind: "err", text: result.error })
        if (!j.ok && !result.stdout && !result.stderr && !result.error) out.push({ kind: "err", text: j.error || `HTTP ${r.status}` })
        setLines((l) => [...l, ...out])
      } catch (e) {
        setLines((l) => [...l, { kind: "err", text: (e as Error).message }])
      } finally {
        setBusy(false)
      }
    },
    [headers, verbs],
  )

  return (
    <div className="flex h-[70vh] flex-col overflow-hidden rounded border border-emerald-800 bg-black font-mono text-sm text-emerald-100">
      <div className="flex items-center justify-between gap-2 border-b border-emerald-900 bg-emerald-950/40 px-3 py-1.5 text-[11px] uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <TerminalIcon size={14} />
          Lab shell · this host · allowlisted verbs only
        </div>
        <div className="flex items-center gap-2 normal-case">
          <input
            type="password"
            className="ghost-input !h-6 !w-40 !text-[10px]"
            placeholder="hub token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <button className="ghost-btn !px-1.5 !py-0.5" onClick={() => void loadVerbs()} title="reload verb catalog">
            <RefreshCw size={10} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto whitespace-pre-wrap p-3 text-[12px] leading-relaxed">
        {lines.map((ln, i) => (
          <div
            key={i}
            className={
              ln.kind === "in"
                ? "text-cyan-200"
                : ln.kind === "err"
                  ? "text-red-300"
                  : ln.kind === "sys"
                    ? "text-zinc-400"
                    : "text-emerald-100"
            }
          >
            {ln.text}
          </div>
        ))}
        <div ref={bottom} />
      </div>
      <form
        className="flex items-center gap-2 border-t border-emerald-900 bg-black px-3 py-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (busy) return
          const v = input
          setInput("")
          void run(v)
        }}
      >
        <span className="text-cyan-300">$</span>
        <input
          className="flex-1 bg-transparent outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={busy ? "running…" : "whoami  |  recon  |  help"}
          disabled={busy}
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
      </form>
    </div>
  )
}
