"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import type { Frame, Message } from "@/types/signalframe"
import { getTemplateById, createFrameFromTemplate } from "@/lib/frame-templates"
import {
  startWhisperBridge,
  subscribeWhisperBridge,
  publishWhisperBridgeEvent,
  type WhisperBridgeEvent,
} from "@/lib/signalframe/whisper-bridge-client"

const STORAGE_KEY = "signalframe_data"

type ApiTeamMsg = {
  id: string
  channel: string
  from: string
  body: string
  createdAt: string
}

function makeMessage(
  content: string,
  sender: Message["sender"],
  type: Message["type"] = "text",
  extra?: Message["metadata"],
): Message {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    content,
    sender,
    timestamp: new Date(),
    type,
    metadata: extra,
  }
}

export function useSignalFrame() {
  const [frames, setFrames] = useState<Frame[]>([])
  const [activeFrameId, setActiveFrameId] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const bootstrappedRef = useRef(false)
  const framesRef = useRef<Frame[]>([])
  useEffect(() => {
    framesRef.current = frames
  }, [frames])

  // ADD-ONLY: multi-tab BroadcastChannel + SSE — remote whispers appear in active/default frame
  useEffect(() => {
    if (!hydrated) return
    startWhisperBridge({ sse: true, channel: "whisper" })
    const unsub = subscribeWhisperBridge((ev: WhisperBridgeEvent) => {
      if (ev.source === "local") return
      const content =
        ev.body && ev.body.trim()
          ? ev.body
          : `**Peer whisper** · id \`${ev.id.slice(0, 8)}\` · from \`${ev.from}\` · via ${ev.source}`
      const peerMsg = makeMessage(
        content,
        ev.from === "operator" || ev.from === "user" ? "user" : "ai",
        ev.channel === "system" ? "system" : "text",
        { tokens: Math.max(1, Math.round((ev.bodyLen || content.length) / 4)), model: `bridge:${ev.source}` },
      )
      const tag = makeMessage(
        `**LOCAL MULTI-TAB** · peer via ${ev.source} · tab=${ev.tabId} · id \`${ev.id.slice(0, 8)}\` · lattice_sync: false`,
        "ai",
        "system",
        { tokens: 8, model: "whisper-bridge", processingTime: 0 },
      )
      setFrames((prev) => {
        if (prev.length === 0) return prev
        const targetId = activeFrameId && prev.some((f) => f.id === activeFrameId) ? activeFrameId : prev[0].id
        return prev.map((f) =>
          f.id === targetId
            ? {
                ...f,
                messages: [...f.messages, peerMsg, tag],
                metadata: { ...f.metadata, lastActivity: new Date(), syncState: "synced" },
              }
            : f,
        )
      })
    })
    return () => {
      unsub()
    }
    // activeFrameId read at event time via closure; re-subscribe when it changes is fine
  }, [hydrated, activeFrameId])

  // Load frames from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        const loaded: Frame[] = (data.frames || []).map((f: Frame) => ({
          ...f,
          messages: (f.messages || []).map((m: Message) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
          metadata: {
            ...f.metadata,
            lastActivity: f.metadata?.lastActivity
              ? new Date(f.metadata.lastActivity)
              : new Date(),
          },
        }))
        setFrames(loaded)
        setActiveFrameId(data.activeFrameId || null)
      }
    } catch (error) {
      console.error("Failed to load frames from storage:", error)
    } finally {
      setHydrated(true)
    }
  }, [])

  // Save frames to localStorage whenever they change (after hydrate)
  useEffect(() => {
    if (!hydrated) return
    try {
      const data = {
        frames,
        activeFrameId,
        timestamp: Date.now(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error("Failed to save frames to storage:", error)
    }
  }, [frames, activeFrameId, hydrated])

  const createFrame = useCallback((title?: string, templateId?: string) => {
    let frameData: Partial<Frame> = {}

    if (templateId && templateId !== "custom") {
      const template = getTemplateById(templateId)
      if (template) {
        frameData = createFrameFromTemplate(template, title)
      } else {
        frameData = { title: title || "Frame", messages: [] }
      }
    } else {
      frameData = { title: title || "Frame", messages: [] }
    }

    const newFrame: Frame = {
      id: `frame-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      messages: frameData.messages || [],
      position: {
        x: 48,
        y: 56,
      },
      size: frameData.size || { width: 520, height: 380 },
      inputMode: frameData.inputMode || "filtered",
      isActive: false,
      isMinimized: false,
      isMuted: false,
      theme: {
        name: "default",
        primary: "#3b82f6",
        background: "#1a1a1a",
        messageUser: "#2563eb",
        messageAI: "#059669",
        toolbar: "#374151",
        metadata: "#6b7280",
      },
      ...frameData,
      metadata: {
        sourcePingCount: 0,
        syncState: "synced",
        mirrorStatus: "none",
        timestampDrift: 0,
        lastActivity: new Date(),
        memoryUsage: 0,
        connectionQuality: "excellent",
        ...frameData.metadata,
      },
      title: frameData.title || title || "WhisperMesh",
      preferSeat: frameData.preferSeat || "twin-rag",
    }

    setFrames((prev) => {
      const offset = prev.length
      return [
        ...prev,
        {
          ...newFrame,
          position: {
            x: 48 + offset * 36,
            y: 56 + offset * 28,
          },
        },
      ]
    })
    setActiveFrameId(newFrame.id)
    return newFrame.id
  }, [])

  // Auto-create one default WhisperMesh frame when workspace is empty after hydrate
  useEffect(() => {
    if (!hydrated || bootstrappedRef.current) return
    bootstrappedRef.current = true
    if (frames.length > 0) return

    const frameId = createFrame("WhisperMesh")

    // Optionally hydrate recent whisper bus messages into the default frame
    ;(async () => {
      try {
        const res = await fetch("/api/signalframe/messages?channel=whisper&limit=12")
        const data = await res.json()
        if (!data?.ok || !Array.isArray(data.messages) || data.messages.length === 0) {
          setFrames((prev) =>
            prev.map((f) =>
              f.id === frameId && f.messages.length === 0
                ? {
                    ...f,
                    messages: [
                      makeMessage(
                        "**WhisperMesh online**\n\nGlass relay ready. Messages post to the team bus (channel: whisper). lattice_sync: false · HOLD_VYRNA_UNSYNC.",
                        "ai",
                        "system",
                      ),
                    ],
                  }
                : f,
            ),
          )
          return
        }
        const hydratedMsgs: Message[] = (data.messages as ApiTeamMsg[])
          .slice()
          .reverse()
          .map((m) =>
            makeMessage(
              m.body,
              m.from === "operator" || m.from === "user" ? "user" : "ai",
              m.channel === "system" ? "system" : "text",
            ),
          )
        setFrames((prev) =>
          prev.map((f) =>
            f.id === frameId
              ? {
                  ...f,
                  messages:
                    f.messages.length === 0
                      ? [
                          makeMessage(
                            "**WhisperMesh** — loaded recent whisper bus traffic (local). lattice_sync: false.",
                            "ai",
                            "system",
                          ),
                          ...hydratedMsgs,
                        ]
                      : f.messages,
                }
              : f,
          ),
        )
      } catch {
        // Network optional — local frame still works
      }
    })()
  }, [hydrated, frames.length, createFrame])

  const sendMessage = useCallback((frameId: string, content: string) => {
    const trimmed = content.trim()
    if (!trimmed) return

    // Mute gate — system ack only (no bus / no seat burn)
    if (framesRef.current.find((f) => f.id === frameId)?.isMuted) {
      setFrames((prev) =>
        prev.map((frame) =>
          frame.id === frameId
            ? {
                ...frame,
                messages: [
                  ...frame.messages,
                  makeMessage(
                    "**Muted** · message not sent. Use Reveal to unmute. lattice_sync: false.",
                    "ai",
                    "system",
                  ),
                ],
                metadata: { ...frame.metadata, lastActivity: new Date() },
              }
            : frame,
        ),
      )
      console.log("⟐ sendMessage blocked · muted · id=" + frameId.slice(0, 12))
      return
    }

    const userMessage = makeMessage(trimmed, "user", "text", {
      tokens: trimmed.split(/\s+/).length * 1.3,
      processingTime: 0,
    })

    // Resolve preferSeat from current frame (template default or WhisperMesh twin-rag)
    let preferSeat = "twin-rag"
    setFrames((prev) => {
      const target = prev.find((f) => f.id === frameId)
      if (target?.preferSeat) preferSeat = target.preferSeat
      return prev.map((frame) =>
        frame.id === frameId
          ? {
              ...frame,
              messages: [...frame.messages, userMessage],
              metadata: {
                ...frame.metadata,
                sourcePingCount: frame.metadata.sourcePingCount + 1,
                lastActivity: new Date(),
                syncState: "syncing",
              },
            }
          : frame,
      )
    })

    // 1) Persist to whisper bus  2) Call local-first S3v3n panel — never log bodies
    ;(async () => {
      let busOk = false
      let busAck = "Relay queued (offline)."
      try {
        const res = await fetch("/api/signalframe/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel: "whisper",
            body: trimmed,
            from: "operator",
          }),
        })
        const data = await res.json().catch(() => ({}))
        busOk = Boolean(data?.ok)
        busAck = busOk
          ? `**Whisper relayed** · id \`${String(data.id || "").slice(0, 8)}\` · channel ${data.channel || "whisper"} · lattice_sync: false · LOCAL MULTI-TAB`
          : `**Relay failed** · ${data?.error || res.statusText || "error"}`
        if (busOk) {
          try {
            publishWhisperBridgeEvent({
              id: typeof data.id === "string" ? data.id : undefined,
              channel: "whisper",
              from: "operator",
              body: trimmed,
            })
          } catch {
            /* bridge optional */
          }
        }
      } catch {
        busOk = false
        busAck = "**Relay failed** · network error (message kept locally)."
      }

      const busMessage = makeMessage(busAck, "ai", "system", {
        tokens: 12,
        processingTime: 0,
      })

      // Panel probe — local seats only (includeOwnedCloud: false → no Venice burn)
      let aiMessage: Message | null = null
      let seatOk = false
      try {
        const panelRes = await fetch("/api/s3v3n-panel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: trimmed,
            preferSeat,
            includeOwnedCloud: false,
          }),
        })
        const panel = await panelRes.json().catch(() => ({}))
        const agg = panel?.aggregate
        const replyText =
          typeof agg?.response === "string" && agg.response.trim()
            ? agg.response.trim()
            : ""
        const seatUsed = (agg?.seat || preferSeat) as string
        const modelUsed = (agg?.model || seatUsed) as string

        if (panel?.ok && replyText) {
          seatOk = true
          aiMessage = makeMessage(replyText, "ai", "text", {
            tokens: Math.max(1, Math.round(replyText.split(/\s+/).length * 1.3)),
            model: `${seatUsed}:${modelUsed}`,
            processingTime: 0,
          })
        } else {
          const adapters = Array.isArray(panel?.adapters) ? panel.adapters : []
          const skipped = adapters
            .filter((a: { status?: string }) => a?.status === "skipped" || a?.status === "offline")
            .map((a: { seat?: string; status?: string; detail?: string }) =>
              `${a.seat || "?"}:${a.status || "offline"}${a.detail ? ` (${String(a.detail).slice(0, 60)})` : ""}`,
            )
            .slice(0, 4)
          const detail =
            skipped.length > 0
              ? skipped.join("; ")
              : panel?.error || "no local seat reply"
          aiMessage = makeMessage(
            `**Seat offline / skipped** · preferSeat=\`${preferSeat}\` · ${detail} · lattice_sync: false · (not a fake reply)`,
            "ai",
            "system",
            { tokens: 16, model: preferSeat, processingTime: 0 },
          )
        }
      } catch {
        aiMessage = makeMessage(
          `**Seat unreachable** · preferSeat=\`${preferSeat}\` · panel network error · lattice_sync: false · (not a fake reply)`,
          "ai",
          "system",
          { tokens: 12, model: preferSeat, processingTime: 0 },
        )
      }

      setFrames((prev) =>
        prev.map((frame) =>
          frame.id === frameId
            ? {
                ...frame,
                messages: [
                  ...frame.messages,
                  busMessage,
                  ...(aiMessage ? [aiMessage] : []),
                ],
                metadata: {
                  ...frame.metadata,
                  syncState: busOk && seatOk ? "synced" : busOk ? "syncing" : "error",
                  lastActivity: new Date(),
                  connectionQuality: seatOk ? "excellent" : busOk ? "good" : "poor",
                },
              }
            : frame,
        ),
      )
    })()
  }, [])

  const updateFrame = useCallback((frameId: string, updates: Partial<Frame>) => {
    setFrames((prev) => prev.map((frame) => (frame.id === frameId ? { ...frame, ...updates } : frame)))
  }, [])

  const deleteFrame = useCallback((frameId: string) => {
    setFrames((prev) => prev.filter((frame) => frame.id !== frameId))
    setActiveFrameId((prev) => (prev === frameId ? null : prev))
  }, [])

  const clearAllFrames = useCallback(() => {
    setFrames([])
    setActiveFrameId(null)
  }, [])

  const exportFrames = useCallback(() => {
    const data = {
      frames,
      activeFrameId,
      exportedAt: new Date().toISOString(),
      version: "1.0.0",
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `signalframe-export-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [frames, activeFrameId])

  const mirrorFrame = useCallback((frameId: string) => {
    setFrames((prev) => {
      const source = prev.find((f) => f.id === frameId)
      if (!source) return prev
      const mirrorId = `frame-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const mirrored: Frame = {
        ...source,
        id: mirrorId,
        title: `${source.title} (Mirror)`,
        position: {
          x: source.position.x + 48,
          y: source.position.y + 32,
        },
        isActive: false,
        isMuted: false,
        mirrorSourceId: source.id,
        messages: source.messages.map((m) => ({ ...m, id: `${m.id}-m-${mirrorId.slice(-4)}` })),
        metadata: {
          ...source.metadata,
          mirrorStatus: "mirrored",
          lastActivity: new Date(),
          syncState: "synced",
        },
      }
      console.log("⟐ mirrorFrame · src=" + frameId.slice(0, 12) + " → " + mirrorId.slice(0, 12) + " · lattice_sync: false")
      setActiveFrameId(mirrorId)
      return [
        ...prev.map((f) =>
          f.id === frameId
            ? {
                ...f,
                metadata: {
                  ...f.metadata,
                  mirrorStatus: "mirroring" as const,
                  lastActivity: new Date(),
                },
              }
            : f,
        ),
        mirrored,
      ]
    })
  }, [])

  const forkFrame = useCallback(
    (frameId: string) => {
      const sourceFrame = frames.find((frame) => frame.id === frameId)
      if (sourceFrame) {
        const forkedFrame: Frame = {
          ...sourceFrame,
          id: `frame-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: `${sourceFrame.title} (Fork)`,
          position: {
            x: sourceFrame.position.x + 40,
            y: sourceFrame.position.y + 40,
          },
          isMuted: false,
          mirrorSourceId: undefined,
          metadata: {
            ...sourceFrame.metadata,
            mirrorStatus: "none",
            lastActivity: new Date(),
          },
          // Deep-copy messages so fork diverges independently
          messages: sourceFrame.messages.map((m) => ({ ...m })),
        }
        setFrames((prev) => [...prev, forkedFrame])
        setActiveFrameId(forkedFrame.id)
        console.log("⟐ forkFrame · src=" + frameId.slice(0, 12) + " → " + forkedFrame.id.slice(0, 12) + " · lattice_sync: false")
      }
    },
    [frames],
  )

  const muteFrame = useCallback((frameId: string) => {
    setFrames((prev) =>
      prev.map((f) =>
        f.id === frameId
          ? {
              ...f,
              isMuted: true,
              metadata: { ...f.metadata, lastActivity: new Date() },
              messages: [
                ...f.messages,
                makeMessage(
                  "**Frame muted** · SEND blocked until Reveal. lattice_sync: false · HOLD_VYRNA_UNSYNC.",
                  "ai",
                  "system",
                ),
              ],
            }
          : f,
      ),
    )
    console.log("⟐ muteFrame · id=" + frameId.slice(0, 12) + " · lattice_sync: false")
  }, [])

  const revealFrame = useCallback((frameId: string) => {
    setFrames((prev) =>
      prev.map((f) =>
        f.id === frameId
          ? {
              ...f,
              isMuted: false,
              isMinimized: false,
              metadata: { ...f.metadata, lastActivity: new Date() },
              messages: [
                ...f.messages,
                makeMessage(
                  "**Frame revealed** · SEND restored · unmuted. lattice_sync: false · HOLD_VYRNA_UNSYNC.",
                  "ai",
                  "system",
                ),
              ],
            }
          : f,
      ),
    )
    setActiveFrameId(frameId)
    console.log("⟐ revealFrame · id=" + frameId.slice(0, 12) + " · lattice_sync: false")
  }, [])

  return {
    frames,
    activeFrameId,
    setActiveFrameId,
    createFrame,
    sendMessage,
    updateFrame,
    deleteFrame,
    clearAllFrames,
    exportFrames,
    mirrorFrame,
    forkFrame,
    muteFrame,
    revealFrame,
    hydrated,
  }
}
