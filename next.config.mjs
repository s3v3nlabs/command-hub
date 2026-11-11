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
      "connect-src 'self' https: wss: http://127.0.0.1:* http://localhost:*",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
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
