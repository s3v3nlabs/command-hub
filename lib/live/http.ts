/**
 * Outbound HTTP helper for live OSINT / intel lookups.
 * Real network fetch, honest errors, timeouts, size caps. Never fabricates a body.
 */
export interface LiveHttpResult {
  ok: boolean
  status: number
  url: string
  ms: number
  contentType: string
  text: string
  json: unknown | null
  error?: string
}

const DEFAULT_UA = "CommandHub/0.1 (+https://github.com/s3v3nlabs/command-hub; operator=S3v3n@SingularityDefense)"

export async function liveFetch(
  url: string,
  opts: { timeoutMs?: number; headers?: Record<string, string>; maxBytes?: number } = {},
): Promise<LiveHttpResult> {
  const timeoutMs = opts.timeoutMs ?? 12_000
  const maxBytes = opts.maxBytes ?? 1_500_000
  const started = Date.now()
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        Accept: "application/json, text/plain, */*",
        "User-Agent": DEFAULT_UA,
        ...(opts.headers || {}),
      },
    })
    const contentType = res.headers.get("content-type") || ""
    const buf = new Uint8Array(await res.arrayBuffer())
    const sliced = buf.byteLength > maxBytes ? buf.slice(0, maxBytes) : buf
    const text = new TextDecoder("utf-8", { fatal: false }).decode(sliced)
    let json: unknown | null = null
    if (/json/i.test(contentType) || text.trimStart().startsWith("{") || text.trimStart().startsWith("[")) {
      try {
        json = JSON.parse(text)
      } catch {
        json = null
      }
    }
    return {
      ok: res.ok,
      status: res.status,
      url: res.url || url,
      ms: Date.now() - started,
      contentType,
      text,
      json,
    }
  } catch (e) {
    return {
      ok: false,
      status: 0,
      url,
      ms: Date.now() - started,
      contentType: "",
      text: "",
      json: null,
      error: e instanceof Error ? e.message : String(e),
    }
  } finally {
    clearTimeout(timer)
  }
}
