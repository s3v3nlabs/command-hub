"use client"

/**
 * Shared legal banner + first-use acknowledgement modal for the offsec suite.
 * Ack is stored locally (per browser) and versioned so wording changes re-prompt.
 */

import { useEffect, useState } from "react"
import Link from "next/link"
import { Scale, X } from "lucide-react"
import { LEGAL_FULL, LEGAL_SHORT, LEGAL_VERSION, LEGAL_ENTITY } from "@/lib/offsec/legal"

const ACK_KEY = "offsec_legal_ack"

export function LegalModal({ open, onClose, requireAck }: { open: boolean; onClose: () => void; requireAck?: boolean }) {
  const [checked, setChecked] = useState(false)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="legal-title">
      <div className="ghost-glass ghost-brackets is-active w-full max-w-xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <div id="legal-title" className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[color:var(--ghost-ink)]">
            <Scale size={14} /> Legal notice · disclaimer · warning
          </div>
          {!requireAck && (
            <button type="button" className="ghost-icon-btn" onClick={onClose} aria-label="Close">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="space-y-2 text-[12px] leading-relaxed text-[color:var(--ghost-dim)]">
          {LEGAL_FULL.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
        <div className="mt-3 font-mono text-[10px] text-[color:var(--ghost-faint)]">
          {LEGAL_ENTITY} · notice v{LEGAL_VERSION} · full text in LEGAL.md
        </div>
        {requireAck && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-[12px] text-[color:var(--ghost-ink)]">
              <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
              I understand and will only use these tools lawfully and with authorization.
            </label>
            <button
              type="button"
              className="ghost-btn"
              data-on="true"
              disabled={!checked}
              onClick={() => {
                try {
                  localStorage.setItem(ACK_KEY, LEGAL_VERSION)
                } catch {
                  /* ignore */
                }
                onClose()
              }}
            >
              Acknowledge
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/** Thin strip shown on every suite page; prompts once per notice version. */
export function LegalBanner({ status }: { status?: "real" | "local" | "wip" }) {
  const [open, setOpen] = useState(false)
  const [needAck, setNeedAck] = useState(false)
  useEffect(() => {
    try {
      if (localStorage.getItem(ACK_KEY) !== LEGAL_VERSION) {
        setNeedAck(true)
        setOpen(true)
      }
    } catch {
      /* ignore */
    }
  }, [])
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b border-[color:var(--ghost-line)] bg-black/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[color:var(--ghost-dim)]">
        <Scale size={11} className="shrink-0" />
        <span className="normal-case tracking-normal">{LEGAL_SHORT}</span>
        {status === "wip" && <span className="ghost-chip warn">work in progress · non-functional</span>}
        {status === "local" && <span className="ghost-chip">drives your locally-installed tools</span>}
        {status === "real" && <span className="ghost-chip accent">live</span>}
        <button type="button" className="ml-auto underline-offset-2 hover:text-[color:var(--ghost-ink)] hover:underline" onClick={() => setOpen(true)}>
          Legal notice
        </button>
        <Link href="/offsec" className="hover:text-[color:var(--ghost-ink)]">
          Suite index
        </Link>
      </div>
      <LegalModal
        open={open}
        requireAck={needAck}
        onClose={() => {
          setOpen(false)
          setNeedAck(false)
        }}
      />
    </>
  )
}
