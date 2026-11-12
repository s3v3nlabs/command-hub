/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  // Typecheck is enforced. Legacy modules that no route imports are listed in tsconfig "exclude" (see docs/MODULE_STATUS.md).
  typescript: { ignoreBuildErrors: false },
  images: { unoptimized: true },
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "media-src 'self' blob:",
      "worker-src 'self'",
      "connect-src 'self' https: wss: http://127.0.0.1:* http://localhost:*",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
    const base = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-DNS-Prefetch-Control", value: "off" },
      { key: "Content-Security-Policy", value: csp },
    ]
    // Permissions-Policy is set path-aware in middleware.ts only. Sending both
    // camera=() and camera=(self) on the same response would intersect to deny.
    const allowSensors = { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(self)" }
    return [
      { source: "/:path*", headers: base },
      { source: "/companion", headers: [allowSensors] },
      { source: "/companion/:path*", headers: [allowSensors] },
      { source: "/intelligence/cctv", headers: [allowSensors] },
      { source: "/intelligence/cctv/:path*", headers: [allowSensors] },
      { source: "/companion/sw.js", headers: [{ key: "Service-Worker-Allowed", value: "/companion/" }, { key: "Cache-Control", value: "no-cache" }] },
    ]
  },
  transpilePackages: [
    "kepler.gl",
    "@kepler.gl/components",
    "@kepler.gl/reducers",
    "@kepler.gl/actions",
    "@kepler.gl/processors",
    "@kepler.gl/styles",
    "@kepler.gl/table",
    "@kepler.gl/layers",
    "@kepler.gl/utils",
    "@kepler.gl/constants",
    "@kepler.gl/schemas",
    "@kepler.gl/tasks",
    "@kepler.gl/common-utils",
    "@kepler.gl/deckgl-layers",
    "mapbox-gl",
    "react-map-gl",
    "@deck.gl/core",
    "@deck.gl/layers",
    "@deck.gl/aggregation-layers",
    "@deck.gl/mapbox",
  ],
  webpack: (config) => {
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false,
      path: false,
      os: false,
      child_process: false,
      net: false,
      tls: false,
      bufferutil: false,
      "utf-8-validate": false,
    }
    return config
  },
}
export default nextConfig
