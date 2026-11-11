"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ScanlineOverlay } from "@/components/black-aurora/scanline-overlay"
import { ClassificationHeader } from "@/components/black-aurora/classification-header"
import { TimestampFooter } from "@/components/black-aurora/timestamp-footer"
import { StatusBadge } from "@/components/black-aurora/status-badge"
import { GlitchText } from "@/components/black-aurora/glitch-text"

type InviteRow = {
  code: string
  label: string
  instructions: string
  expiresAt: string | null
  maxUses: number
  uses: number
  revoked: boolean
  downloads: number
  redeemedBy: string | null
  redeemedAt: string | null
  status: "active" | "exhausted" | "expired" | "revoked"
  hasGrant: boolean
  audit: Array<{ at: string; action: string; detail?: string }>
}

export default function BlackAuroraAdminPage() {
  const [token, setToken] = useState("")
  const [invites, setInvites] = useState<InviteRow[]>([])
  const [mode, setMode] = useState("bundle")
  const [honesty, setHonesty] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [createdCode, setCreatedCode] = useState<string | null>(null)

  const [label, setLabel] = useState("")
  const [instructions, setInstructions] = useState("")
  const [expiresInHours, setExpiresInHours] = useState("168")
  const [maxUses, setMaxUses] = useState("1")

  const headers = useCallback((): Record<string, string> => {
    const h: Record<string, string> = { "Content-Type": "application/json", "Cache-Control": "no-store" }
    if (token) h.Authorization = `Bearer ${token}`
    return h
  }, [token])

  const refresh = useCallback(async () => {
    setError("")
    try {
      const res = await fetch("/api/black-aurora/invites", { headers: headers(), cache: "no-store" })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.error || data.detail || `HTTP ${res.status}`)
        return
      }
      setInvites(data.invites || [])
      setMode(data.mode || "bundle")
      setHonesty(data.honesty || "")
    } catch (e) {
      setError(String(e))
    }
  }, [headers])

  useEffect(() => {
    // Attempt load; will 401/403 without token in SECURE_MODE
    void refresh()
  }, [refresh])

  const create = async () => {
    setBusy(true)
    setCreatedCode(null)
    setError("")
    try {
      const res = await fetch("/api/black-aurora/invites", {
        method: "POST",
        headers: headers(),
        cache: "no-store",
        body: JSON.stringify({
          action: "create",
          label: label || "invite",
          instructions: instructions || undefined,
          expiresInHours: expiresInHours === "" ? null : Number(expiresInHours),
          maxUses: Number(maxUses) || 1,
        }),
      })
      const data = await res.json()
      if (!data.ok) {
        setError(data.error || "create failed")
      } else {
        setCreatedCode(data.code)
        setLabel("")
        setInstructions("")
        await refresh()
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setBusy(false)
    }
  }

  const revoke = async (code: string) => {
    if (!confirm(`Revoke ${code}?`)) return
    setBusy(true)
    try {
      const res = await fetch("/api/black-aurora/invites", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ action: "revoke", code }),
      })
      const data = await res.json()
      if (!data.ok) setError(data.error || "revoke failed")
      await refresh()
    } catch (e) {
      setError(String(e))
    } finally {
      setBusy(false)
    }
  }

  const copyInvite = (code: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const text = [
      `BLACK AURORA LABS — Command Hub invite`,
      ``,
      `Code: ${code}`,
      `Drop URL: ${origin}/black-aurora/drop/${code}`,
      `Verify: ${origin}/black-aurora/verify`,
      ``,
      `Enter the code (or open the drop URL), unlock the install package, download the gated bundle.`,
      `A public GitHub repo cannot be code-gated for git clone — the portal gates a server-side bundle.`,
    ].join("\n")
    void navigator.clipboard.writeText(text)
  }

  return (
    <main className="min-h-screen bg-black flex flex-col ba-no-print">
      <ScanlineOverlay intensity="light" />
      <ClassificationHeader level="restricted" />

      <div className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full space-y-8">
        <div className="text-center space-y-2">
          <GlitchText
            text="BLACK AURORA LABS"
            className="text-2xl tracking-[0.3em] text-white"
            intensity="low"
          />
          <p className="font-mono text-xs tracking-[0.2em] text-white/40">INVITE ADMIN // OPERATOR ONLY</p>
          <p className="font-mono text-xs text-white/30">
            MODE: {mode} · <Link href="/black-aurora" className="underline underline-offset-4">portal</Link>
          </p>
        </div>

        <div className="border border-white/30 p-4 space-y-3 rounded-none">
          <p className="font-mono text-xs tracking-widest text-white/50">HUB AUTH</p>
          <input
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="HUB_API_TOKEN"
            className="w-full bg-black border border-white/30 px-3 py-2 font-mono text-sm text-white focus:border-white focus:outline-none rounded-none"
          />
          <button
            onClick={() => void refresh()}
            className="border border-white px-4 py-2 font-mono text-xs tracking-widest text-white hover:bg-white hover:text-black rounded-none"
          >
            REFRESH LIST
          </button>
          {error ? <p className="font-mono text-xs text-white/70">{error}</p> : null}
          {honesty ? <p className="font-mono text-xs text-white/30">{honesty}</p> : null}
        </div>

        <div className="border border-white/30 p-4 space-y-3 rounded-none">
          <p className="font-mono text-xs tracking-widest text-white/50">MINT INVITE</p>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Recipient label (e.g. zerocipher/Jerry)"
            className="w-full bg-black border border-white/30 px-3 py-2 font-mono text-sm text-white focus:border-white focus:outline-none rounded-none"
          />
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Instructions (optional — defaults to install steps)"
            rows={5}
            className="w-full bg-black border border-white/30 px-3 py-2 font-mono text-sm text-white focus:border-white focus:outline-none rounded-none"
          />
          <div className="flex flex-wrap gap-3">
            <label className="font-mono text-xs text-white/40 flex items-center gap-2">
              EXPIRES (h)
              <input
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(e.target.value)}
                className="w-20 bg-black border border-white/30 px-2 py-1 font-mono text-sm text-white rounded-none"
              />
            </label>
            <label className="font-mono text-xs text-white/40 flex items-center gap-2">
              MAX USES
              <input
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                className="w-16 bg-black border border-white/30 px-2 py-1 font-mono text-sm text-white rounded-none"
              />
            </label>
          </div>
          <button
            onClick={() => void create()}
            disabled={busy}
            className="border border-white px-6 py-2 font-mono text-xs tracking-widest text-white hover:bg-white hover:text-black disabled:opacity-40 rounded-none"
          >
            GENERATE CODE
          </button>
          {createdCode ? (
            <div className="border border-white/40 p-3 space-y-2">
              <StatusBadge status="verified" />
              <p className="font-mono text-lg tracking-[0.4em] text-white">GhostNode::{createdCode}</p>
              <p className="font-mono text-xs text-white/40 break-all">
                /black-aurora/drop/{createdCode}
              </p>
              <button
                onClick={() => copyInvite(createdCode)}
                className="font-mono text-xs tracking-wider text-white/60 underline underline-offset-4"
              >
                COPY INVITE MESSAGE
              </button>
            </div>
          ) : null}
        </div>

        <div className="border border-white/30 p-4 space-y-4 rounded-none">
          <p className="font-mono text-xs tracking-widest text-white/50">
            INVITES ({invites.length})
          </p>
          {invites.length === 0 ? (
            <p className="font-mono text-xs text-white/30">No invites yet.</p>
          ) : (
            <ul className="space-y-4">
              {invites.map((inv) => (
                <li key={inv.code} className="border border-white/20 p-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-sm tracking-widest text-white">
                      GhostNode::{inv.code}
                    </span>
                    <StatusBadge
                      status={
                        inv.status === "active"
                          ? "active"
                          : inv.status === "revoked"
                            ? "destroyed"
                            : inv.status === "expired"
                              ? "expired"
                              : "pending"
                      }
                    />
                  </div>
                  <p className="font-mono text-xs text-white/50">
                    {inv.label} · uses {inv.uses}/{inv.maxUses} · downloads {inv.downloads}
                    {inv.expiresAt ? ` · exp ${inv.expiresAt}` : ""}
                    {inv.redeemedAt ? ` · redeemed ${inv.redeemedAt}` : ""}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => copyInvite(inv.code)}
                      className="font-mono text-xs text-white/50 underline underline-offset-4"
                    >
                      COPY INVITE
                    </button>
                    <Link
                      href={`/black-aurora/drop/${inv.code}`}
                      className="font-mono text-xs text-white/50 underline underline-offset-4"
                    >
                      OPEN DROP
                    </Link>
                    {!inv.revoked ? (
                      <button
                        onClick={() => void revoke(inv.code)}
                        className="font-mono text-xs text-white/50 underline underline-offset-4"
                      >
                        REVOKE
                      </button>
                    ) : null}
                  </div>
                  {inv.audit?.length ? (
                    <details className="font-mono text-xs text-white/30">
                      <summary className="cursor-pointer">audit ({inv.audit.length})</summary>
                      <ul className="mt-2 space-y-1 pl-2">
                        {inv.audit.slice().reverse().map((a, i) => (
                          <li key={i}>
                            {a.at} · {a.action}
                            {a.detail ? ` · ${a.detail}` : ""}
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <TimestampFooter />
    </main>
  )
}
