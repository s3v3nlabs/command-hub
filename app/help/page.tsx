"use client"

import Link from "next/link"
import { BookOpen, ExternalLink } from "lucide-react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

const LINKS: Array<{ href: string; title: string; blurb: string; external?: boolean }> = [
  { href: "/offsec", title: "OffSec Arsenal", blurb: "Kill-chain + CTF catalog and command builders." },
  { href: "/offsec/hardware", title: "Hardware & RF", blurb: "BT, CAN, USB/Ducky, LAN, Shodan+Censys, VoIP, SDR, Flipper." },
  { href: "/offsec/phone", title: "Phone Suite", blurb: "scrcpy + ADB for your authorized device." },
  { href: "/offsec/android-lab", title: "Android Lab", blurb: "Disposable Android emulators + adb for app QA/security testing on this host." },
  { href: "/offsec/threat-field", title: "Threat Field", blurb: "Nash / Fourier / Monte-Carlo model field." },
  { href: "/intelligence/cctv", title: "CCTV Wall", blurb: "Multi-feed wall with per-tile recon metadata." },
  { href: "/companion", title: "Device Bridge", blurb: "Installable PWA: phone cam/mic/telemetry ↔ hub over WebRTC." },
  { href: "/operator", title: "Operator view", blurb: "Mobile/tablet field deck." },
  { href: "/dev-operator", title: "Dev Operator", blurb: "Defensive coding assistant (HOLD_VYRNA_UNSYNC)." },
  { href: "/compute", title: "Compute / AI Pool", blurb: "Multi-backend router, job queue, warm-pool, honest performance surface." },
  { href: "/vault", title: "Ghostlight Vault", blurb: "Search a local ChatGPT export. MCP + REST for GPT and other AI nodes." },
  { href: "/offsec/engagements", title: "Engagements", blurb: "Scope, RoE, findings log." },
  { href: "/signalframe", title: "SignalFrame", blurb: "Ghostnode mil-tech window manager." },
]

const DOCS = [
  { name: "INSTALL.md", path: "https://github.com/s3v3nlabs/command-hub/blob/main/INSTALL.md" },
  { name: "USAGE.md", path: "https://github.com/s3v3nlabs/command-hub/blob/main/USAGE.md" },
  { name: "UPDATING.md", path: "https://github.com/s3v3nlabs/command-hub/blob/main/UPDATING.md" },
  { name: "CONTRIBUTING.md", path: "https://github.com/s3v3nlabs/command-hub/blob/main/CONTRIBUTING.md" },
  { name: "SECURITY.md", path: "https://github.com/s3v3nlabs/command-hub/blob/main/SECURITY.md" },
  { name: "LEGAL.md", path: "https://github.com/s3v3nlabs/command-hub/blob/main/LEGAL.md" },
  { name: "docs/GHOSTLIGHT_VAULT.md", path: "https://github.com/s3v3nlabs/command-hub/blob/main/docs/GHOSTLIGHT_VAULT.md" },
  { name: "docs/OFFSEC_SUITE.md", path: "https://github.com/s3v3nlabs/command-hub/blob/main/docs/OFFSEC_SUITE.md" },
  { name: "docs/MODULE_STATUS.md", path: "https://github.com/s3v3nlabs/command-hub/blob/main/docs/MODULE_STATUS.md" },
]

export default function HelpPage() {
  return (
    <div className="hub-shell flex bg-black text-[color:var(--ghost-ink)]">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title="HELP / DOCS" />
        <main className="hub-shell-scroll ghost-grid-bg min-h-0 flex-1 overflow-auto p-4">
          <div className="mx-auto max-w-4xl space-y-4">
            <div className="ghost-glass ghost-brackets rounded-[2px] p-4">
              <div className="flex items-center gap-2 font-mono text-sm uppercase tracking-[0.14em]">
                <BookOpen size={15} /> Command Hub help
              </div>
              <p className="mt-1 text-[12px] text-[color:var(--ghost-dim)]">
                In-hub index of operator docs and major modules. Authorized, lawful use only — see LEGAL.md.
              </p>
            </div>

            <section>
              <h2 className="mb-2 font-mono text-sm uppercase tracking-[0.12em]">Modules</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="ghost-glass ghost-brackets block rounded-[2px] p-3 hover:bg-white/5"
                  >
                    <div className="font-mono text-[12px] uppercase tracking-[0.08em] text-[color:var(--ghost-ink)]">
                      {l.title}
                    </div>
                    <p className="mt-1 text-[11px] text-[color:var(--ghost-dim)]">{l.blurb}</p>
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-2 font-mono text-sm uppercase tracking-[0.12em]">Repository docs</h2>
              <ul className="space-y-1">
                {DOCS.map((d) => (
                  <li key={d.name}>
                    <a
                      href={d.path}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 font-mono text-[12px] text-[color:var(--ghost-dim)] hover:text-[color:var(--ghost-ink)]"
                    >
                      <ExternalLink size={11} /> {d.name}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
