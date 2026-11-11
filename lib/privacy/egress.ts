/**
 * Egress profiles for server-side fetches (Operator-owned stack only).
 * Modes: direct | vpn | tor | proxy-chain
 *
 * Operator must run WireGuard / Tor / upstream proxies themselves.
 * This module only honors proxy env for non-direct modes — no tunnel setup,
 * no offense, no unauthorized access tooling.
 *
 * Env (names only):
 *   S3V3N_EGRESS_MODE   = direct | vpn | tor | proxy-chain  (default: direct)
 *   S3V3N_HTTP_PROXY    = http(s)://host:port  (vpn / proxy-chain / optional Tor HTTP bridge)
 *   S3V3N_TOR_SOCKS     = socks5://127.0.0.1:9050  (default)
 */

import net from "net"
import { URL } from "url"

export type EgressMode = "direct" | "vpn" | "tor" | "proxy-chain"

export type EgressConfig = {
  mode: EgressMode
  httpProxy: string | null
  torSocks: string
  /** True when mode != direct and a usable HTTP proxy URL is configured. */
  proxyActive: boolean
  /** Tor SOCKS URL configured (reachability checked separately). */
  torConfigured: boolean
  note: string
}

const DEFAULT_TOR_SOCKS = "socks5://127.0.0.1:9050"

function parseMode(raw: string | undefined): EgressMode {
  const m = (raw || "direct").trim().toLowerCase()
  if (m === "vpn" || m === "tor" || m === "proxy-chain" || m === "direct") return m
  return "direct"
}

export function getEgressConfig(): EgressConfig {
  const mode = parseMode(process.env.S3V3N_EGRESS_MODE)
  const httpProxy =
    typeof process.env.S3V3N_HTTP_PROXY === "string" && process.env.S3V3N_HTTP_PROXY.trim()
      ? process.env.S3V3N_HTTP_PROXY.trim()
      : null
  const torSocks =
    typeof process.env.S3V3N_TOR_SOCKS === "string" && process.env.S3V3N_TOR_SOCKS.trim()
      ? process.env.S3V3N_TOR_SOCKS.trim()
      : DEFAULT_TOR_SOCKS

  const needsProxy = mode === "vpn" || mode === "tor" || mode === "proxy-chain"
  // undici ProxyAgent needs HTTP(S) proxy URL. For Tor SOCKS, Operator should
  // point S3V3N_HTTP_PROXY at an HTTP→SOCKS bridge, or run torsocks externally.
  const proxyUrl =
    httpProxy && /^https?:\/\//i.test(httpProxy)
      ? httpProxy
      : null

  let note =
    mode === "direct"
      ? "Direct egress — no proxy agent applied."
      : "Operator-run WireGuard/Tor/proxy required. App honors S3V3N_HTTP_PROXY for server fetches when set to http(s)://."

  if (mode === "proxy-chain") {
    if (proxyUrl) {
      note =
        "proxy-chain READY — first-hop HTTP(S) proxy configured; further hops are Operator infra. App attaches one ProxyAgent only."
    } else if (httpProxy) {
      note =
        "proxy-chain SELECTED but S3V3N_HTTP_PROXY is not http(s):// — ProxyAgent idle (NOT READY)."
    } else {
      note =
        "proxy-chain SELECTED but S3V3N_HTTP_PROXY unset — NOT CONFIGURED / NOT READY."
    }
  }

  if (mode === "tor" && !proxyUrl) {
    note +=
      " Tor SOCKS is configured for reachability checks; native undici needs an HTTP proxy bridge for fetch (set S3V3N_HTTP_PROXY)."
  }

  return {
    mode,
    httpProxy,
    torSocks,
    proxyActive: needsProxy && Boolean(proxyUrl),
    torConfigured: Boolean(torSocks),
    note,
  }
}

/** Parse host:port from socks5://127.0.0.1:9050 (TCP reachability only — no Tor protocol probe). */
export function parseSocksHostPort(socksUrl: string): { host: string; port: number } | null {
  try {
    const normalized = socksUrl.includes("://") ? socksUrl : `socks5://${socksUrl}`
    const u = new URL(normalized)
    const port = u.port ? Number(u.port) : 9050
    if (!u.hostname || !Number.isFinite(port)) return null
    return { host: u.hostname, port }
  } catch {
    return null
  }
}

/**
 * Passive TCP connect check to Tor SOCKS port (default 9050).
 * Does not speak SOCKS/Tor protocol — only "is something listening".
 */
export function checkTorSocksReachable(
  socksUrl?: string,
  timeoutMs = 800,
): Promise<{ reachable: boolean; host: string; port: number; detail: string }> {
  const cfg = getEgressConfig()
  const parsed = parseSocksHostPort(socksUrl || cfg.torSocks)
  if (!parsed) {
    return Promise.resolve({
      reachable: false,
      host: "?",
      port: 0,
      detail: "invalid S3V3N_TOR_SOCKS",
    })
  }
  return new Promise((resolve) => {
    const socket = new net.Socket()
    let settled = false
    const done = (reachable: boolean, detail: string) => {
      if (settled) return
      settled = true
      try {
        socket.destroy()
      } catch {
        /* ignore */
      }
      resolve({ reachable, host: parsed.host, port: parsed.port, detail })
    }
    socket.setTimeout(timeoutMs)
    socket.once("connect", () => done(true, "tcp-open"))
    socket.once("timeout", () => done(false, "tcp-timeout"))
    socket.once("error", (err) => done(false, err.message.slice(0, 80)))
    socket.connect(parsed.port, parsed.host)
  })
}

/**
 * privacyFetch — wraps fetch with undici ProxyAgent when egress mode != direct
 * and S3V3N_HTTP_PROXY is an http(s) URL. Best-effort; falls back to global fetch.
 * Loopback / local seats should call fetch directly (skip this helper).
 */
export async function privacyFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const cfg = getEgressConfig()
  if (cfg.mode === "direct" || !cfg.proxyActive || !cfg.httpProxy) {
    return fetch(input, init)
  }

  try {
    // Dynamic require so edge/runtime without undici still builds
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const undici = require("undici") as {
      ProxyAgent: new (opts: string | { uri: string }) => unknown
      fetch: (url: string | URL, opts?: Record<string, unknown>) => Promise<Response>
    }
    const agent = new undici.ProxyAgent(cfg.httpProxy)
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as Request).url

    const headers = init?.headers
    const body = init?.body
    return (await undici.fetch(url, {
      method: init?.method || "GET",
      headers,
      body: body as string | Buffer | undefined,
      dispatcher: agent,
      signal: init?.signal as AbortSignal | undefined,
    })) as unknown as Response
  } catch {
    // Best-effort fallback — never throw solely because proxy agent missing
    return fetch(input, init)
  }
}

/** True when URL is loopback / local seat (never route through egress proxy). */
export function isLocalSeatUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return (
      u.hostname === "127.0.0.1" ||
      u.hostname === "localhost" ||
      u.hostname === "::1" ||
      u.hostname.endsWith(".local")
    )
  } catch {
    return false
  }
}

/**
 * Fetch helper that auto-skips proxy for local URLs.
 */
export async function egressAwareFetch(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  if (isLocalSeatUrl(input)) return fetch(input, init)
  const cfg = getEgressConfig()
  if (cfg.mode === "direct") return fetch(input, init)
  return privacyFetch(input, init)
}
