import type { ReactNode } from "react"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "BLACK AURORA LABS — Secure Client Portal",
  description: "Invite-gated Singular/ty Command Hub access portal",
  robots: { index: false, follow: false, nocache: true },
}

/**
 * Standalone monochrome portal layout — no hub chrome.
 * Pure black / cold white / monospace. No colors, gradients, shadows, or rounded corners.
 */
export default function BlackAuroraLayout({ children }: { children: ReactNode }) {
  return (
    <div className="ba-root min-h-screen bg-black text-white font-mono antialiased">
      <style
        dangerouslySetInnerHTML={{
          __html: `
.ba-root {
  --ba-bg: #000000;
  --ba-fg: #ffffff;
  --ba-off: #0a0a0a;
  background: #000;
  color: #fff;
  font-family: "JetBrains Mono", "SF Mono", "Fira Code", ui-monospace, monospace;
}
.ba-cursor-blink { animation: ba-blink 1s step-end infinite; }
@keyframes ba-blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
.ba-no-select { user-select: none; -webkit-user-select: none; }
.ba-root ::selection { background: #fff; color: #000; }
@media print {
  .ba-root, .ba-no-print { display: none !important; }
}
`,
        }}
      />
      {children}
    </div>
  )
}
