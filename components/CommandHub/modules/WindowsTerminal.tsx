"use client"

/**
 * Windows-syntax terminal backed by a REAL shell on this Linux host.
 * Commands like dir/type/ipconfig are translated and executed via child_process.
 * Paths shown are real host paths — we do not pretend this is a Windows VM.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { Terminal as TerminalIcon, RefreshCw } from "lucide-react"
import { livePost, liveGet } from "@/hooks/use-live"

type Line = { kind: "in" | "out" | "err" | "sys"; text: string }

export default function WindowsTerminal() {
  const [sessionId, setSessionId] = useState(() => `win-${Date.now()}`)
  const [cwd, setCwd] = useState("")
  const [lines, setLines] = useState<Line[]>([
    { kind: "sys", text: "Command Hub Windows-syntax shell — real execution on this Linux host (dir → ls, type → cat, ipconfig → ip). Type `help`. Operator: S3v3n@SingularityDefense." },
  ])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [token, setToken] = useState("")
  const bottom = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = window.localStorage.getItem("hub-api-token") || ""
    if (t) setToken(t)
  }, [])
  useEffect(() => {
    if (token) window.localStorage.setItem("hub-api-token", token)
  }, [token])
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" })
  }, [lines])

  const run = useCallback(
    async (raw: string) => {
      const text = raw.trim()
      if (!text) return
      if (text === "cls" || text === "clear") {
        setLines([])
        return
      }
      setLines((l) => [...l, { kind: "in", text: `${cwd || "C:?"}> ${text}` }])
      setBusy(true)
      try {
        const j = await livePost<{
          ok?: boolean
          cwd?: string
          stdout?: string
          stderr?: string
          exitCode?: number | null
          durationMs?: number
          note?: string
          translated?: string
          error?: string
          sessionId?: string
        }>("shell", { command: text, sessionId, flavor: "windows" }, token)
        if (j.sessionId) setSessionId(j.sessionId)
        if (j.cwd) setCwd(j.cwd)
        const out: Line[] = []
        if (j.note || j.translated) out.push({ kind: "sys", text: `# ${j.translated || ""} ${j.note ? "(" + j.note + ")" : ""}  ${j.durationMs ?? "?"}ms  exit ${j.exitCode ?? "?"}` })
        if (j.stdout) out.push({ kind: "out", text: j.stdout })
        if (j.stderr) out.push({ kind: "err", text: j.stderr })
        if (j.error && !j.stderr) out.push({ kind: "err", text: j.error })
        if (!j.ok && !j.stdout && !j.stderr && !j.error) out.push({ kind: "err", text: "request failed" })
        setLines((l) => [...l, ...out])
      } catch (e) {
        setLines((l) => [...l, { kind: "err", text: (e as Error).message }])
      } finally {
        setBusy(false)
      }
    },
    [cwd, sessionId, token],
  )

  return (
    <div className="flex h-[70vh] flex-col overflow-hidden rounded border border-sky-800 bg-black font-mono text-sm text-sky-100">
      <div className="flex items-center justify-between gap-2 border-b border-sky-900 bg-sky-950/40 px-3 py-1.5 text-[11px] uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <TerminalIcon size={14} />
          Windows syntax · live Linux host · {cwd || "cwd pending"}
        </div>
        <div className="flex items-center gap-2 normal-case">
          <input
            type="password"
            className="ghost-input !h-6 !w-40 !text-[10px]"
            placeholder="hub token (SECURE_MODE)"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
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
                    : "text-sky-100"
            }
          >
            {ln.text}
          </div>
        ))}
        <div ref={bottom} />
      </div>
      <form
        className="flex items-center gap-2 border-t border-sky-900 bg-black px-3 py-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (busy) return
          const v = input
          setInput("")
          void run(v)
        }}
      >
        <span className="text-cyan-300">{cwd ? cwd.split("/").slice(-1)[0] + ">" : ">"}</span>
        <input
          className="flex-1 bg-transparent outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={busy ? "running…" : "dir  |  whoami  |  help"}
          disabled={busy}
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
      </form>
    </div>
  )
}
