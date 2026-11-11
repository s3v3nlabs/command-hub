export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import * as C from "@/lib/caller"

/** GET /api/caller/events?id= — SSE stream of transcript lines + call status (tails local-data). */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id") || ""
  if (!C.getCall(id)) return new Response("not found", { status: 404 })
  const enc = new TextEncoder()
  let sent = 0
  let lastStatus = ""
  let timer: NodeJS.Timeout | undefined
  const stream = new ReadableStream({
    start(controller) {
      const push = (event: string, data: unknown) => controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      const tick = () => {
        try {
          const lines = C.readTranscript(id)
          for (; sent < lines.length; sent++) push("line", lines[sent])
          const call = C.getCall(id)
          if (call && call.status !== lastStatus) {
            lastStatus = call.status
            push("status", { status: call.status, mode: call.mode, durationSec: call.durationSec })
          }
        } catch {
          /* ignore */
        }
      }
      tick()
      timer = setInterval(tick, 700)
      req.signal.addEventListener("abort", () => {
        clearInterval(timer)
        try {
          controller.close()
        } catch {}
      })
    },
    cancel() {
      clearInterval(timer)
    },
  })
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" } })
}
