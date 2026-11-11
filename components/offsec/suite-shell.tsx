"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { LegalBanner } from "@/components/offsec/legal-notice"

/** Common chrome for every offsec suite route: sidebar, header, legal banner, ghostnode bg. */
export function SuiteShell({
  title,
  status = "real",
  children,
  nav,
}: {
  title: string
  status?: "real" | "local" | "wip"
  children: ReactNode
  nav?: ReactNode
}) {
  return (
    <div className="hub-shell flex bg-black text-[color:var(--ghost-ink)]">
      <Sidebar />
      <div className="hub-shell-main">
        <Header title={title} />
        <LegalBanner status={status} />
        {nav && (
          <div className="flex flex-wrap items-center gap-1.5 border-b border-[color:var(--ghost-line)] bg-black/80 px-3 py-1.5">
            {nav}
          </div>
        )}
        <main className="hub-shell-scroll ghost-grid-bg min-h-0 flex-1 overflow-auto p-4">{children}</main>
      </div>
    </div>
  )
}

export function SuiteNavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="ghost-btn">
      {label}
    </Link>
  )
}
