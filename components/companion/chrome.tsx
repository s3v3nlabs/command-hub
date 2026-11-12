"use client"

import Link from "next/link"
import { Radio, Smartphone } from "lucide-react"
import type { ReactNode } from "react"

export function CompanionShell({
  title,
  eyebrow,
  children,
  trailing,
}: {
  title: string
  eyebrow?: string
  children: ReactNode
  trailing?: ReactNode
}) {
  return (
    <div className="min-h-dvh bg-black text-[color:var(--ghost-ink)]">
      <div className="sticky top-0 z-10 border-b border-[color:var(--ghost-line)] bg-black/90 px-3 py-2.5 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold tracking-wide">
              <Smartphone size={16} />
              {title}
            </div>
            {eyebrow ? <div className="truncate text-[10px] text-[color:var(--ghost-dim)]">{eyebrow}</div> : null}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">{trailing}</div>
        </div>
      </div>
      <div className="mx-auto max-w-lg space-y-3 p-3 pb-10">{children}</div>
      <footer className="mx-auto max-w-lg px-3 pb-8 text-center text-[9px] leading-relaxed text-[color:var(--ghost-faint)]">
        Shares this device&apos;s camera, mic, and telemetry with{" "}
        <span className="text-[color:var(--ghost-dim)]">your</span> Command Hub. Use only on devices and hubs
        you operate. Not a covert implant.
        <br />
        Christian Wilford (s3v3n), AI Architect, Offensive Security Enthusiast, Founder of Singular/ty Defense
        Solutions, LLC.
        <div className="mt-2 flex justify-center gap-3 text-[10px]">
          <Link href="/companion" className="text-[color:var(--ghost-dim)] underline-offset-2 hover:underline">
            Phone
          </Link>
          <Link href="/companion/bridge" className="text-[color:var(--ghost-dim)] underline-offset-2 hover:underline">
            Bridge
          </Link>
          <Link href="/companion/hub-view" className="text-[color:var(--ghost-dim)] underline-offset-2 hover:underline">
            Hub view
          </Link>
          <Link href="/intelligence/cctv" className="text-[color:var(--ghost-dim)] underline-offset-2 hover:underline">
            CCTV
          </Link>
        </div>
      </footer>
    </div>
  )
}

export function Led({ on, label }: { on: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[color:var(--ghost-dim)]">
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: on ? "var(--ghost-accent)" : "var(--ghost-faint)", boxShadow: on ? "0 0 8px var(--ghost-accent)" : "none" }}
      />
      {label}
    </span>
  )
}

export function Panel({ children, title, icon }: { children: ReactNode; title?: string; icon?: ReactNode }) {
  return (
    <section className="rounded border border-[color:var(--ghost-line)] bg-black/50 p-3">
      {title ? (
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[color:var(--ghost-dim)]">
          {icon || <Radio size={12} />}
          {title}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function HonestLimits() {
  return (
    <details className="rounded border border-dashed border-[color:var(--ghost-line)] p-3 text-[11px] leading-relaxed text-[color:var(--ghost-dim)]">
      <summary className="cursor-pointer font-semibold text-[color:var(--ghost-ink)]">Honest limits</summary>
      <ul className="mt-2 list-disc space-y-1 pl-4">
        <li>Camera / mic / GPS need a secure context: HTTPS, or localhost for lab. A raw LAN HTTP IP is blocked by the browser.</li>
        <li>WebRTC is peer-to-peer, one phone + one hub viewer per session. No SFU is shipped.</li>
        <li>No TURN server. Same LAN or Tailscale usually works. Symmetric NAT on the public internet will fail.</li>
        <li>Signaling is SSE+POST in this Node process — do not split the hub across multiple instances and expect the bridge to work.</li>
        <li>Live media is gated by <code className="text-[color:var(--ghost-ink)]">HUB_API_TOKEN</code> when set, and denied outright in <code className="text-[color:var(--ghost-ink)]">SECURE_MODE</code> if no token is configured.</li>
        <li>This is your device talking to your hub. It is not a hidden listener and does not bypass phone permissions.</li>
      </ul>
    </details>
  )
}
