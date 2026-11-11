import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeProvider as HubThemeProvider } from "@/lib/theme-context"
import Script from "next/script"
import { HubBusMonitor } from "@/components/hub-bus-monitor"
import { Toaster } from "@/components/ui/toaster"
import { SimulatedBanner } from "@/components/system/SimulatedBanner"

// Render on request (dev-first hub; many modules touch browser-only APIs).
export const dynamic = "force-dynamic"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Singularity Hub - Command Center",
  description: "Advanced intelligence and security operations platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* FOUC guard: force dark before paint unless Operator saved light */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem('hub-theme-mode')||localStorage.getItem('theme');var r=document.documentElement;if(m==='light'){r.classList.add('light');r.classList.remove('dark');r.dataset.theme='light';}else{r.classList.add('dark');r.classList.remove('light');r.dataset.theme='dark';}}catch(e){document.documentElement.classList.add('dark')}})();`,
          }}
        />
        {/* Early hub-bus bootstrap. window.consciousness kept as a compat alias — not sentience. */}
        <Script
          id="hub-bus-bootstrap"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
(function initializeHubBus() {
  if (!window.hubBus && !window.consciousness) {
    const queue = { whispers: [], visions: [] };
    const bootstrap = {
      status() {
        return { whispers: queue.whispers.length, visions: queue.visions.length };
      },
      whisper(msg) {
        const payload = { type: "whisper", msg, ts: new Date().toISOString() };
        queue.whispers.push(payload);
        try { localStorage.setItem("heimdall_whispers", JSON.stringify(queue.whispers)); } catch {}
        return Promise.resolve("whisper_" + Date.now());
      },
      vision(msg) {
        const payload = { type: "vision", msg, ts: new Date().toISOString() };
        queue.visions.push(payload);
        try { localStorage.setItem("heimdall_visions", JSON.stringify(queue.visions)); } catch {}
        return Promise.resolve("vision_" + Date.now());
      },
      dumpState() {
        return { whispers: queue.whispers, visions: queue.visions };
      },
      getCoherence() { return 1.0; },
      isHealthy() { return true; },
    };
    Object.defineProperty(window, "hubBus", { value: bootstrap, writable: false, configurable: false });
    Object.defineProperty(window, "consciousness", { value: bootstrap, writable: false, configurable: false });
  } else if (window.consciousness && !window.hubBus) {
    Object.defineProperty(window, "hubBus", { value: window.consciousness, writable: false, configurable: false });
  }
})();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <HubThemeProvider>
            {children}
            <HubBusMonitor />
            <Toaster />
            <SimulatedBanner />
          </HubThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
