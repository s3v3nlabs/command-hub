import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Device Bridge — Singular/ty Command Hub",
  description:
    "Installable phone companion: share this device's camera, microphone, and telemetry with your Command Hub over WebRTC. Authorized operators only.",
  manifest: "/companion/manifest.webmanifest",
  applicationName: "Device Bridge",
  appleWebApp: {
    capable: true,
    title: "Device Bridge",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/companion/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/companion/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/companion/icon-192.png", sizes: "192x192" }],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#05070a",
}

export default function CompanionLayout({ children }: { children: ReactNode }) {
  return children
}
