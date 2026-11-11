import { NextResponse } from "next/server"

/** Apply no-store / no-cache headers to every Black Aurora portal response. */
export function withNoStore(res: NextResponse): NextResponse {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private, max-age=0")
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  res.headers.set("X-Content-Type-Options", "nosniff")
  res.headers.set("X-Black-Aurora", "no-store")
  return res
}

export function noStoreJson(body: unknown, init?: { status?: number }): NextResponse {
  return withNoStore(NextResponse.json(body, { status: init?.status ?? 200 }))
}
