/**
 * SignalFrame team-bus SSE stream — ADD-ONLY multi-tab reconnect path.
 * Polls existing team-bus store; streams text/event-stream.
 * Privacy Fortress: never console.log message bodies.
 * HOLD_VYRNA_UNSYNC · lattice_sync: false · LOCAL MULTI-TAB (not live mesh)
 */
export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const preferredRegion = "auto"

import {
  listTeamMessagesSince,
  teamBusStatus,
  type TeamChannel,
} from "@/lib/signalframe/team-bus"

const POLL_MS = 1200
const HEARTBEAT_MS = 15000
const MAX_MS = 5 * 60 * 1000 // 5 min then client reconnects

function encodeSse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const channelParam = url.searchParams.get("channel") || "whisper"
  const channel: TeamChannel | "all" =
    channelParam === "team" ||
    channelParam === "whisper" ||
    channelParam === "system" ||
    channelParam === "all"
      ? (channelParam as TeamChannel | "all")
      : "whisper"
  let cursor =
    url.searchParams.get("since") || new Date(Date.now() - 10_000).toISOString()
  const seen = new Set<string>()

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      let closed = false
      const startedAt = Date.now()

      const push = (chunk: string) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(chunk))
        } catch {
          closed = true
        }
      }

      // Hello — metadata only
      push(
        encodeSse("hello", {
          ok: true,
          transport: "sse",
          badge: "LOCAL MULTI-TAB",
          hold: "HOLD_VYRNA_UNSYNC",
          lattice_sync: false,
          channel,
          note: "Same-origin multi-tab reconnect. Not live mesh / Vyrna lattice.",
          bus: {
            count: teamBusStatus().count,
            encryptionAvailable: teamBusStatus().encryptionAvailable,
          },
        }),
      )

      const tick = () => {
        if (closed) return
        if (Date.now() - startedAt > MAX_MS) {
          push(
            encodeSse("bye", {
              ok: true,
              reason: "max_duration",
              lattice_sync: false,
              hold: "HOLD_VYRNA_UNSYNC",
              reconnect: true,
            }),
          )
          cleanup()
          try {
            controller.close()
          } catch {
            /* ignore */
          }
          return
        }

        try {
          const msgs = listTeamMessagesSince({ channel, since: cursor, limit: 40 })
          for (const m of msgs) {
            if (seen.has(m.id)) continue
            seen.add(m.id)
            // Advance cursor past this message
            if (m.createdAt > cursor) cursor = m.createdAt
            // Stream full message to authorized local client — never log body
            push(
              encodeSse("bus", {
                id: m.id,
                channel: m.channel,
                from: m.from,
                body: m.body,
                createdAt: m.createdAt,
                lattice_sync: false as const,
                hold: "HOLD_VYRNA_UNSYNC" as const,
                source: "sse",
                bodyLen: typeof m.body === "string" ? m.body.length : 0,
              }),
            )
          }
        } catch {
          // Do not log details that might include bodies
          push(
            encodeSse("error", {
              ok: false,
              error: "poll_failed",
              lattice_sync: false,
              hold: "HOLD_VYRNA_UNSYNC",
            }),
          )
        }
      }

      const pollTimer = setInterval(tick, POLL_MS)
      const hbTimer = setInterval(() => {
        push(
          encodeSse("heartbeat", {
            ok: true,
            at: new Date().toISOString(),
            cursor,
            lattice_sync: false,
            hold: "HOLD_VYRNA_UNSYNC",
            badge: "LOCAL MULTI-TAB",
          }),
        )
      }, HEARTBEAT_MS)

      // Initial poll
      tick()

      const cleanup = () => {
        if (closed) return
        closed = true
        clearInterval(pollTimer)
        clearInterval(hbTimer)
      }

      req.signal.addEventListener("abort", () => {
        cleanup()
        try {
          controller.close()
        } catch {
          /* ignore */
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "X-Whisper-Bridge": "LOCAL-MULTI-TAB",
      "X-Lattice-Sync": "false",
    },
  })
}
