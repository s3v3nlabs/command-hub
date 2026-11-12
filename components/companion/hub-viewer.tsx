"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Camera, MapPin, Battery, Wifi, Radio, VideoOff, Phone } from "lucide-react"
import type { CompanionSession, CompanionTelemetry, PublicCompanionStatus, SignalEnvelope } from "@/lib/companion/types"
import { FIELD_MODULES } from "@/lib/companion/types"
import {
  attachSignalHandlers,
  companionFetch,
  isSecureMediaContext,
  loadSeat,
  loadToken,
  openEventSource,
  postSignal,
  saveSeat,
  saveToken,
} from "./client"
import { BridgePeer } from "./webrtc"
import { CompanionShell, HonestLimits, Led, Panel } from "./chrome"

type LiveRow = {
  id: string
  label: string
  updatedAt: string
  phoneJoinedAt?: string
  hubJoinedAt?: string
  media: CompanionSession["media"]
  telemetry?: { ts: string; battery?: CompanionTelemetry["battery"]; network?: CompanionTelemetry["network"]; hasGeo?: boolean }
}

export function HubViewer() {
  const params = useSearchParams()
  const paramSession = params.get("session") || ""
  const [token, setToken] = useState("")
  const [status, setStatus] = useState<(PublicCompanionStatus & { sessions?: LiveRow[]; authorized?: boolean }) | null>(null)
  const [session, setSession] = useState<CompanionSession | null>(null)
  const [ticket, setTicket] = useState("")
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [conn, setConn] = useState<RTCPeerConnectionState | "idle" | "signaling">("idle")
  const [shareCam, setShareCam] = useState(false)
  const [shareMic, setShareMic] = useState(false)
  const [remoteOn, setRemoteOn] = useState(false)
  const [secure, setSecure] = useState(true)
  const [actionMsg, setActionMsg] = useState<string | null>(null)

  const remoteRef = useRef<HTMLVideoElement>(null)
  const localRef = useRef<HTMLVideoElement>(null)
  const peerRef = useRef<BridgePeer | null>(null)
  const esRef = useRef<EventSource | null>(null)
  const ticketRef = useRef("")
  const sessionRef = useRef("")
  const joiningRef = useRef(false)

  const refresh = useCallback(
    async (tok?: string) => {
      const { json } = await companionFetch("/api/companion/status", { token: tok ?? token })
      if (json.ok) setStatus(json as unknown as PublicCompanionStatus & { sessions?: LiveRow[]; authorized?: boolean })
    },
    [token],
  )

  useEffect(() => {
    setSecure(isSecureMediaContext())
    const t = loadToken()
    if (t) setToken(t)
    void refresh(t)
    const seat = loadSeat()
    if (seat && seat.role === "hub" && (!paramSession || seat.sessionId === paramSession)) {
      setTicket(seat.ticket)
      ticketRef.current = seat.ticket
      sessionRef.current = seat.sessionId
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const attachRemote = (stream: MediaStream | null) => {
    if (remoteRef.current) remoteRef.current.srcObject = stream
    setRemoteOn(!!stream)
  }
  const attachLocal = (stream: MediaStream | null) => {
    if (localRef.current) localRef.current.srcObject = stream
  }

  const connectEvents = useCallback((sid: string, tick: string, tok: string) => {
    esRef.current?.close()
    const es = openEventSource(sid, tick, 0)
    esRef.current = es
    const un = attachSignalHandlers(es, (kind, data) => {
      if (kind === "session") {
        setSession(data as unknown as CompanionSession)
        return
      }
      if (kind === "presence") {
        void companionFetch(`/api/companion/sessions?id=${sid}`, { token: tok, ticket: tick }).then(({ json }) => {
          if (json.ok && json.session) setSession(json.session as CompanionSession)
        })
        return
      }
      const sig = data as SignalEnvelope
      if (sig && sig.kind) void peerRef.current?.handleSignal(sig)
    })
    return () => {
      un()
      es.close()
    }
  }, [])

  const join = async (sessionId: string) => {
    if (joiningRef.current) return
    joiningRef.current = true
    setErr(null)
    setMsg(null)
    saveToken(token)
    const { status: http, json } = await companionFetch("/api/companion/sessions", {
      method: "POST",
      token,
      body: { action: "join", role: "hub", sessionId },
    })
    if (!json.ok) {
      setErr(
        http === 401 || http === 403
          ? "Hub rejected the token. Paste the same HUB_API_TOKEN the host is running with."
          : String(json.error || "join failed"),
      )
      joiningRef.current = false
      return
    }
    const s = json.session as CompanionSession
    const tick = String(json.ticket || "")
    peerRef.current?.close(true)
    peerRef.current = new BridgePeer({
      sessionId: s.id,
      ticket: tick,
      token,
      role: "hub",
      onRemoteStream: attachRemote,
      onLocalStream: attachLocal,
      onState: (st) => setConn(st),
      onError: (m) => setErr(m),
    })
    setSession(s)
    setTicket(tick)
    ticketRef.current = tick
    sessionRef.current = s.id
    saveSeat({ ticket: tick, sessionId: s.id, role: "hub" })
    setMsg(`Seated on ${s.label} (${s.id}). One viewer per session — a second seat steals this one.`)
    setConn("signaling")
    void refresh(token)
    joiningRef.current = false
  }

  useEffect(() => {
    if (!ticket || !sessionRef.current) return
    if (!peerRef.current) {
      peerRef.current = new BridgePeer({
        sessionId: sessionRef.current,
        ticket,
        token,
        role: "hub",
        onRemoteStream: attachRemote,
        onLocalStream: attachLocal,
        onState: (st) => setConn(st),
        onError: (m) => setErr(m),
      })
    }
    const stop = connectEvents(sessionRef.current, ticket, token)
    void companionFetch(`/api/companion/sessions?id=${sessionRef.current}`, { token, ticket }).then(({ json }) => {
      if (json.ok && json.session) setSession(json.session as CompanionSession)
    })
    // Catch an offer already sitting in the signal log
    void companionFetch(`/api/companion/signal?session=${sessionRef.current}`, { token, ticket }).then(({ json }) => {
      const signals = Array.isArray(json.signals) ? (json.signals as SignalEnvelope[]) : []
      const lastOffer = [...signals].reverse().find((s) => s.kind === "offer")
      if (lastOffer) void peerRef.current?.handleSignal(lastOffer)
      for (const s of signals) {
        if (s.kind === "ice" && lastOffer && s.seq > lastOffer.seq) void peerRef.current?.handleSignal(s)
      }
    })
    return () => stop()
  }, [ticket, token, connectEvents])

  useEffect(() => {
    return () => {
      esRef.current?.close()
      peerRef.current?.close(true)
    }
  }, [])

  // Auto-join ?session= once we have a token (or open lab)
  useEffect(() => {
    if (paramSession && !ticket && token !== undefined) {
      // Wait a beat for loadToken; if status says auth not required, join anyway
      if (token || (status && !status.authRequired)) {
        void join(paramSession)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramSession, token, status?.authRequired])

  const toggleHubMedia = async (cam: boolean, mic: boolean) => {
    if (!peerRef.current || !sessionRef.current) {
      setErr("Join a session first.")
      return
    }
    if (!isSecureMediaContext()) {
      setErr("Hub camera needs HTTPS or localhost.")
      return
    }
    try {
      if (!cam && !mic) {
        if (peerRef.current.localStream) {
          for (const t of peerRef.current.localStream.getTracks()) t.stop()
        }
        setShareCam(false)
        setShareMic(false)
        attachLocal(null)
        await postSignal({
          sessionId: sessionRef.current,
          ticket,
          token,
          from: "hub",
          kind: "media-state",
          payload: { hubCam: false, hubMic: false, wantRenegotiate: true },
        })
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: cam, audio: mic })
      peerRef.current.attachLocal(stream)
      setShareCam(cam)
      setShareMic(mic)
      await postSignal({
        sessionId: sessionRef.current,
        ticket,
        token,
        from: "hub",
        kind: "media-state",
        payload: { hubCam: cam, hubMic: mic, wantRenegotiate: true },
      })
    } catch (e) {
      const name = e instanceof DOMException ? e.name : ""
      if (name === "NotAllowedError" || name === "NotFoundError") {
        setErr(
          name === "NotFoundError"
            ? "No webcam or mic on this hub host. The phone feed still works — this is an honest empty reverse channel."
            : "Permission denied for the hub webcam / mic.",
        )
      } else {
        setErr(e instanceof Error ? e.message : "hub getUserMedia failed")
      }
    }
  }

  const leave = async () => {
    peerRef.current?.close(true)
    peerRef.current = null
    esRef.current?.close()
    saveSeat(null)
    setTicket("")
    ticketRef.current = ""
    sessionRef.current = ""
    setSession(null)
    setRemoteOn(false)
    setConn("idle")
    setMsg("Left the seat. The phone session stays live until it ends it.")
  }

  const sendOpen = async (path: string) => {
    if (!sessionRef.current) return
    const { json } = await companionFetch("/api/companion/actions", {
      method: "POST",
      token,
      ticket,
      body: { action: "open", path, sessionId: sessionRef.current, from: "hub" },
    })
    setActionMsg(json.ok ? `Asked the phone to open ${path}` : String(json.error || "failed"))
  }

  const tel = session?.lastTelemetry
  const live = status?.sessions || []

  return (
    <CompanionShell
      title="Bridge viewer"
      eyebrow="Hub seat  ·  watch phone bodycam + telemetry"
      trailing={
        <div className="flex flex-col items-end gap-0.5">
          <Led on={conn === "connected"} label={String(conn)} />
          <Led on={remoteOn} label={remoteOn ? "bodycam" : "no video"} />
        </div>
      }
    >
      {!secure ? (
        <Panel title="Secure context">
          <p className="text-xs text-[color:var(--ghost-danger)]">
            Not a secure context — the hub cannot share its own webcam, and some browsers may also block playback.
            Use HTTPS or localhost.
          </p>
        </Panel>
      ) : null}

      <Panel title="Operator token">
        <input
          type="password"
          autoComplete="off"
          placeholder="HUB_API_TOKEN"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="ghost-input w-full text-xs"
        />
        <button type="button" className="ghost-btn mt-2 w-full !py-2 text-xs" onClick={() => { saveToken(token); void refresh() }}>
          Save & refresh live sessions
        </button>
        {status ? (
          <p className="mt-2 font-mono text-[10px] text-[color:var(--ghost-dim)]">
            {status.tokenConfigured ? "Token configured" : "Open lab"}
            {status.secureMode ? " · SECURE_MODE" : ""}
            {status.authorized === true || Array.isArray(status.sessions) ? ` · ${live.length} live` : " · authorize to list sessions"}
          </p>
        ) : null}
      </Panel>

      <Panel title="Live bodycams" icon={<Phone size={12} />}>
        {live.length === 0 ? (
          <p className="text-xs text-[color:var(--ghost-dim)]">
            No live phone sessions. On the phone, open <code>/companion</code>, pair, and start the bodycam.
          </p>
        ) : (
          <ul className="space-y-2">
            {live.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 rounded border border-[color:var(--ghost-line)] px-2 py-2">
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold">{s.label}</div>
                  <div className="font-mono text-[9px] text-[color:var(--ghost-faint)]">
                    {s.id}
                    {s.media.phoneCam ? " · cam" : ""}
                    {s.media.phoneMic ? " · mic" : ""}
                    {s.telemetry?.battery ? ` · ${Math.round(s.telemetry.battery.level * 100)}%` : ""}
                  </div>
                </div>
                <button
                  type="button"
                  className="ghost-btn shrink-0 !py-2 !px-3 text-xs"
                  onClick={() => void join(s.id)}
                >
                  {sessionRef.current === s.id ? "Re-seat" : "Take seat"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {err ? <p className="text-xs text-[color:var(--ghost-danger)]">{err}</p> : null}
      {msg ? <p className="text-xs text-[color:var(--ghost-dim)]">{msg}</p> : null}

      <Panel title="Phone bodycam" icon={<Camera size={12} />}>
        <div className="relative aspect-video overflow-hidden rounded border border-[color:var(--ghost-line)] bg-[#05070a]">
          <video ref={remoteRef} className="h-full w-full object-cover" autoPlay playsInline controls />
          {!remoteOn ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-3 text-center text-[color:var(--ghost-faint)]">
              <VideoOff size={22} />
              <span className="font-mono text-[10px] leading-relaxed">
                Waiting for a phone offer. Start the bodycam on /companion. If you joined mid-stream, ask the
                phone to Stop and Start again so it re-offers.
              </span>
            </div>
          ) : (
            <div className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-red-300">
              ● phone live
            </div>
          )}
        </div>
        {ticket ? (
          <button type="button" className="ghost-btn mt-2 w-full !py-2 text-xs" onClick={() => void leave()}>
            Leave seat
          </button>
        ) : null}
      </Panel>

      <Panel title="Telemetry" icon={<MapPin size={12} />}>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded border border-[color:var(--ghost-line)] p-2">
            <MapPin size={12} className="mx-auto mb-1 text-[color:var(--ghost-dim)]" />
            <div className="font-mono text-[10px]">
              {tel?.geo ? `${tel.geo.lat.toFixed(5)}, ${tel.geo.lon.toFixed(5)}` : "—"}
            </div>
            <div className="text-[9px] text-[color:var(--ghost-faint)]">
              {tel?.geo?.accuracy != null ? `±${Math.round(tel.geo.accuracy)}m` : "GPS"}
            </div>
          </div>
          <div className="rounded border border-[color:var(--ghost-line)] p-2">
            <Battery size={12} className="mx-auto mb-1 text-[color:var(--ghost-dim)]" />
            <div className="font-mono text-[10px]">{tel?.battery ? `${Math.round(tel.battery.level * 100)}%` : "—"}</div>
            <div className="text-[9px] text-[color:var(--ghost-faint)]">{tel?.battery?.charging ? "charging" : "battery"}</div>
          </div>
          <div className="rounded border border-[color:var(--ghost-line)] p-2">
            <Wifi size={12} className="mx-auto mb-1 text-[color:var(--ghost-dim)]" />
            <div className="font-mono text-[10px]">{tel?.network?.effectiveType || tel?.network?.type || "—"}</div>
            <div className="text-[9px] text-[color:var(--ghost-faint)]">
              {tel?.network?.downlink != null ? `${tel.network.downlink}Mb` : "network"}
            </div>
          </div>
        </div>
        {tel?.ts ? (
          <p className="mt-2 font-mono text-[9px] text-[color:var(--ghost-faint)]">Last fix {tel.ts}</p>
        ) : (
          <p className="mt-2 text-[10px] text-[color:var(--ghost-faint)]">No telemetry yet — the phone pushes a fix about every 15s once paired.</p>
        )}
      </Panel>

      <Panel title="Share this hub's camera" icon={<Radio size={12} />}>
        <p className="mb-2 text-[11px] leading-relaxed text-[color:var(--ghost-dim)]">
          Optional reverse channel. If this machine has no webcam, leave this off — the phone will show an honest
          empty feed. Sharing triggers a renegotiation (the phone re-offers).
        </p>
        <div className="relative mb-2 aspect-video overflow-hidden rounded border border-[color:var(--ghost-line)] bg-[#05070a]">
          <video ref={localRef} className="h-full w-full object-cover" autoPlay muted playsInline />
          {!shareCam ? (
            <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-[color:var(--ghost-faint)]">
              hub cam off
            </div>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!ticket}
            className="ghost-btn !py-3 text-sm disabled:opacity-40"
            onClick={() => void toggleHubMedia(!shareCam, shareMic)}
          >
            {shareCam ? "Stop hub cam" : "Share hub cam"}
          </button>
          <button
            type="button"
            disabled={!ticket}
            className="ghost-btn !py-3 text-sm disabled:opacity-40"
            onClick={() => void toggleHubMedia(shareCam, !shareMic)}
          >
            {shareMic ? "Stop hub mic" : "Share hub mic"}
          </button>
        </div>
      </Panel>

      <Panel title="Ask the phone to open">
        <div className="grid grid-cols-2 gap-2">
          {FIELD_MODULES.filter((m) => m.id !== "hub-view").slice(0, 8).map((m) => (
            <button
              key={m.id}
              type="button"
              disabled={!ticket}
              className="rounded border border-[color:var(--ghost-line)] px-2 py-3 text-xs disabled:opacity-40"
              onClick={() => void sendOpen(m.path)}
            >
              {m.name}
            </button>
          ))}
        </div>
        {actionMsg ? <p className="mt-2 text-[10px] text-[color:var(--ghost-dim)]">{actionMsg}</p> : null}
        <p className="mt-2 text-[10px] text-[color:var(--ghost-faint)]">
          The phone shows a prompt — it will not auto-navigate, because that would drop the live call.
        </p>
      </Panel>

      <HonestLimits />
    </CompanionShell>
  )
}
