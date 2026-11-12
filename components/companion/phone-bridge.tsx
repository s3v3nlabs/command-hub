"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Camera, Mic, MicOff, Radio, RefreshCw, Shield, MapPin, Battery, Wifi, VideoOff } from "lucide-react"
import type { CompanionSession, CompanionTelemetry, PublicCompanionStatus, SignalEnvelope } from "@/lib/companion/types"
import { FIELD_MODULES } from "@/lib/companion/types"
import {
  attachSignalHandlers,
  authHeaders,
  collectTelemetry,
  companionFetch,
  isSecureMediaContext,
  loadLabel,
  loadSeat,
  loadToken,
  openEventSource,
  postSignal,
  saveLabel,
  saveSeat,
  saveToken,
} from "./client"
import { BridgePeer } from "./webrtc"
import { CompanionShell, HonestLimits, Led, Panel } from "./chrome"
import { PwaRegister } from "./pwa-register"

type Conn = RTCPeerConnectionState | "idle" | "signaling"

export function PhoneBridge({ mode }: { mode: "landing" | "bridge" }) {
  const [token, setToken] = useState("")
  const [label, setLabel] = useState("")
  const [status, setStatus] = useState<PublicCompanionStatus | null>(null)
  const [session, setSession] = useState<CompanionSession | null>(null)
  const [ticket, setTicket] = useState("")
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [secure, setSecure] = useState(true)
  const [conn, setConn] = useState<Conn>("idle")
  const [cam, setCam] = useState(false)
  const [mic, setMic] = useState(false)
  const [facing, setFacing] = useState<"environment" | "user">("environment")
  const [telemetry, setTelemetry] = useState<CompanionTelemetry | null>(null)
  const [navPrompt, setNavPrompt] = useState<string | null>(null)
  const [hubMedia, setHubMedia] = useState(false)

  const localRef = useRef<HTMLVideoElement>(null)
  const remoteRef = useRef<HTMLVideoElement>(null)
  const peerRef = useRef<BridgePeer | null>(null)
  const esRef = useRef<EventSource | null>(null)
  const ticketRef = useRef("")
  const sessionRef = useRef("")

  const refreshStatus = useCallback(async (tok?: string) => {
    const t = tok ?? token
    const { json } = await companionFetch("/api/companion/status", { token: t })
    if (json.ok) setStatus(json as unknown as PublicCompanionStatus)
  }, [token])

  useEffect(() => {
    setSecure(isSecureMediaContext())
    const t = loadToken()
    const l = loadLabel()
    if (t) setToken(t)
    if (l) setLabel(l)
    const seat = loadSeat()
    if (seat && seat.role === "phone") {
      setTicket(seat.ticket)
      ticketRef.current = seat.ticket
      sessionRef.current = seat.sessionId
    }
    void refreshStatus(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const attachRemote = (stream: MediaStream | null) => {
    const el = remoteRef.current
    if (el) el.srcObject = stream
    setHubMedia(!!stream)
  }
  const attachLocal = (stream: MediaStream | null) => {
    const el = localRef.current
    if (el) el.srcObject = stream
  }

  const closePeer = (stopLocal = false) => {
    peerRef.current?.close(stopLocal)
    peerRef.current = null
    setCam(false)
    setMic(false)
    setConn("idle")
  }

  const connectEvents = useCallback((sid: string, tick: string, tok: string) => {
    esRef.current?.close()
    const es = openEventSource(sid, tick, 0)
    esRef.current = es
    es.onerror = () => {
      setConn((c) => (c === "connected" ? c : "signaling"))
    }
    const un = attachSignalHandlers(es, (kind, data) => {
      if (kind === "session") {
        setSession(data as unknown as CompanionSession)
        return
      }
      if (kind === "navigate") {
        const payload = (data as SignalEnvelope).payload as { path?: string } | undefined
        const path = payload?.path || (data as { path?: string }).path
        if (path) setNavPrompt(path)
        return
      }
      if (kind === "presence") {
        void companionFetch(`/api/companion/sessions?id=${sid}`, { token: tok, ticket: tick }).then(({ json }) => {
          if (json.ok && json.session) {
            const s = json.session as CompanionSession
            setSession(s)
            if (s.lastTelemetry) setTelemetry(s.lastTelemetry)
          }
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

  useEffect(() => {
    if (!ticket || !sessionRef.current) return
    const stop = connectEvents(sessionRef.current, ticket, token)
    // Restore session metadata
    void companionFetch(`/api/companion/sessions?id=${sessionRef.current}`, { token, ticket }).then(({ json }) => {
      if (json.ok && json.session) setSession(json.session as CompanionSession)
    })
    return () => {
      stop()
    }
  }, [ticket, token, connectEvents])

  useEffect(() => {
    return () => {
      esRef.current?.close()
      peerRef.current?.close(true)
    }
  }, [])

  const pair = async () => {
    setErr(null)
    setMsg(null)
    saveToken(token)
    saveLabel(label)
    const { status: http, json } = await companionFetch("/api/companion/sessions", {
      method: "POST",
      token,
      body: { action: "create", role: "phone", label: label || "Phone bodycam" },
    })
    if (!json.ok) {
      setErr(
        http === 401 || http === 403
          ? "Hub rejected the token. Set HUB_API_TOKEN on the host and paste the same value here. In SECURE_MODE a token is required."
          : String(json.error || "pair failed"),
      )
      return
    }
    const s = json.session as CompanionSession
    const tick = String(json.ticket || "")
    setSession(s)
    setTicket(tick)
    ticketRef.current = tick
    sessionRef.current = s.id
    saveSeat({ ticket: tick, sessionId: s.id, role: "phone" })
    setMsg(`Paired. Session ${s.id}. Hub viewer: /companion/hub-view?session=${s.id}`)
    void refreshStatus(token)
  }

  const startMedia = async (wantCam: boolean, wantMic: boolean, nextFacing = facing) => {
    if (!ticket || !sessionRef.current) {
      setErr("Pair with the hub first.")
      return
    }
    if (!isSecureMediaContext()) {
      setErr("Camera and mic need HTTPS (or localhost). This page is not a secure context.")
      return
    }
    setErr(null)
    try {
      const constraints: MediaStreamConstraints = {
        video: wantCam ? { facingMode: { ideal: nextFacing }, width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        audio: wantMic,
      }
      closePeer(true)
      const peer = new BridgePeer({
        sessionId: sessionRef.current,
        ticket,
        token,
        role: "phone",
        onLocalStream: attachLocal,
        onRemoteStream: attachRemote,
        onState: (s) => setConn(s),
        onError: (m) => setErr(m),
      })
      peerRef.current = peer
      setConn("signaling")
      const stream = await peer.acquireLocal(constraints)
      peer.attachLocal(stream)
      setCam(stream.getVideoTracks().some((t) => t.enabled && t.readyState === "live"))
      setMic(stream.getAudioTracks().some((t) => t.enabled && t.readyState === "live"))
      await peer.offer()
      await postSignal({
        sessionId: sessionRef.current,
        ticket,
        token,
        from: "phone",
        kind: "media-state",
        payload: { phoneCam: wantCam, phoneMic: wantMic },
      })
    } catch (e) {
      const name = e instanceof DOMException ? e.name : ""
      if (name === "NotAllowedError") setErr("Permission denied. Grant camera / microphone in the browser prompt, then try again.")
      else if (name === "NotFoundError") setErr("No camera or microphone found on this device.")
      else if (name === "NotReadableError") setErr("The camera or mic is already in use by another app.")
      else setErr(e instanceof Error ? e.message : "getUserMedia failed")
      closePeer(true)
    }
  }

  const stopMedia = async () => {
    await peerRef.current?.hangup(true)
    peerRef.current = null
    setCam(false)
    setMic(false)
    setConn("idle")
  }

  const flip = async () => {
    const next = facing === "environment" ? "user" : "environment"
    setFacing(next)
    if (cam) await startMedia(true, mic, next)
  }

  // Telemetry + presence heartbeat while paired
  useEffect(() => {
    if (!ticket || !sessionRef.current) return
    let cancelled = false
    const tick = async () => {
      try {
        const tel = await collectTelemetry(label || session?.label)
        if (cancelled) return
        setTelemetry(tel)
        await companionFetch("/api/companion/telemetry", {
          method: "POST",
          token,
          ticket,
          body: { sessionId: sessionRef.current, ...tel },
        })
        await companionFetch("/api/companion/actions", {
          method: "POST",
          token,
          ticket,
          body: { action: "heartbeat", name: label || session?.label || "Phone bodycam", workspace: "companion" },
        })
      } catch {
        /* omit — honest degrade */
      }
    }
    void tick()
    const id = setInterval(tick, 15000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [ticket, token, label, session?.label])

  const end = async () => {
    await stopMedia()
    if (sessionRef.current) {
      await companionFetch("/api/companion/sessions", {
        method: "POST",
        token,
        ticket,
        body: { action: "end", sessionId: sessionRef.current },
      })
    }
    saveSeat(null)
    setSession(null)
    setTicket("")
    ticketRef.current = ""
    sessionRef.current = ""
    setMsg("Session ended.")
  }

  const showLandingIntro = mode === "landing" && !ticket

  return (
    <CompanionShell
      title="Device Bridge"
      eyebrow={session ? `${session.label} · ${session.id}` : "Phone ↔ hub  ·  PWA companion"}
      trailing={
        <div className="flex flex-col items-end gap-0.5">
          <Led on={conn === "connected"} label={conn === "idle" ? "idle" : conn} />
          <Led on={!!ticket} label={ticket ? "paired" : "unpaired"} />
        </div>
      }
    >
      {!secure ? (
        <Panel title="Secure context required">
          <p className="text-xs leading-relaxed text-[color:var(--ghost-danger)]">
            This page is not a secure context. Browsers will refuse camera, microphone, and (often) geolocation.
            Open the hub over HTTPS, or use <code>http://localhost</code> / <code>http://127.0.0.1</code> for lab.
            A raw LAN IP over HTTP will not work.
          </p>
        </Panel>
      ) : null}

      {showLandingIntro ? (
        <Panel title="What this is">
          <p className="text-xs leading-relaxed text-[color:var(--ghost-dim)]">
            An installable PWA served by your Command Hub. This phone can stream its camera and mic to the hub
            (a live bodycam on the CCTV wall&apos;s Device Bridge strip and at{" "}
            <a href="/companion/hub-view" className="underline">
              /companion/hub-view
            </a>
            ), push GPS / battery / network telemetry, and trigger safe hub actions. The hub can share its own
            webcam back when one is attached — otherwise the reverse feed honestly says so.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[color:var(--ghost-dim)]">
            The Termux companion stays the scripting / recon node. This PWA is the sensor bridge — better camera
            and WebRTC than Termux:API.
          </p>
          <div className="mt-3">
            <PwaRegister />
          </div>
        </Panel>
      ) : null}

      <Panel title="Pair with hub" icon={<Shield size={12} />}>
        <div className="space-y-2">
          <input
            type="password"
            autoComplete="off"
            placeholder="HUB_API_TOKEN (required when the host set one)"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="ghost-input w-full text-xs"
          />
          <input
            type="text"
            placeholder="Device label (e.g. Jerry's Pixel)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="ghost-input w-full text-xs"
          />
          <div className="flex gap-2">
            <button type="button" className="ghost-btn flex-1 !py-3 text-sm font-semibold" onClick={() => void pair()}>
              {ticket ? "New session" : "Pair & open session"}
            </button>
            {ticket ? (
              <button type="button" className="ghost-btn !py-3 !px-3" onClick={() => void end()} aria-label="End session">
                End
              </button>
            ) : null}
          </div>
          {status ? (
            <p className="font-mono text-[10px] text-[color:var(--ghost-dim)]">
              {status.tokenConfigured ? "Token configured on host" : "Open lab (no host token)"}
              {status.secureMode ? " · SECURE_MODE" : ""} · {status.liveSessionCount} live
            </p>
          ) : null}
        </div>
      </Panel>

      {err ? <p className="text-xs text-[color:var(--ghost-danger)]">{err}</p> : null}
      {msg ? <p className="text-xs text-[color:var(--ghost-dim)]">{msg}</p> : null}

      {navPrompt ? (
        <Panel title="Hub asked to open a module">
          <p className="mb-2 font-mono text-xs text-[color:var(--ghost-ink)]">{navPrompt}</p>
          <p className="mb-2 text-[11px] text-[color:var(--ghost-dim)]">
            Opening it in this tab will drop the live call. Use a new tab, or stop the bodycam first.
          </p>
          <div className="flex gap-2">
            <a href={navPrompt} target="_blank" rel="noreferrer" className="ghost-btn flex-1 !py-3 text-center text-sm">
              Open in new tab
            </a>
            <button type="button" className="ghost-btn !py-3" onClick={() => setNavPrompt(null)}>
              Dismiss
            </button>
          </div>
        </Panel>
      ) : null}

      <Panel title="Bodycam" icon={<Camera size={12} />}>
        <div className="relative aspect-video overflow-hidden rounded border border-[color:var(--ghost-line)] bg-[#05070a]">
          <video ref={localRef} className="h-full w-full object-cover" autoPlay muted playsInline />
          {!cam ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[color:var(--ghost-faint)]">
              <VideoOff size={22} />
              <span className="font-mono text-[10px]">local preview — not publishing</span>
            </div>
          ) : (
            <div className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-red-300">
              ● live to hub
            </div>
          )}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!ticket}
            className="ghost-btn !py-3 text-sm font-semibold disabled:opacity-40"
            onClick={() => void (cam ? stopMedia() : startMedia(true, true))}
          >
            {cam ? "Stop bodycam" : "Start bodycam"}
          </button>
          <button
            type="button"
            disabled={!ticket}
            className="ghost-btn !py-3 text-sm disabled:opacity-40"
            onClick={() => void (mic && !cam ? stopMedia() : startMedia(false, true))}
          >
            {mic && !cam ? (
              <span className="inline-flex items-center gap-1">
                <MicOff size={14} /> Stop mic
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Mic size={14} /> Mic only
              </span>
            )}
          </button>
        </div>
        <button
          type="button"
          disabled={!ticket}
          className="ghost-btn mt-2 w-full !py-2 text-xs disabled:opacity-40"
          onClick={() => void flip()}
        >
          Flip camera ({facing === "environment" ? "rear" : "front"})
        </button>
      </Panel>

      <Panel title="Hub feed" icon={<Radio size={12} />}>
        <div className="relative aspect-video overflow-hidden rounded border border-[color:var(--ghost-line)] bg-[#05070a]">
          <video ref={remoteRef} className="h-full w-full object-cover" autoPlay playsInline />
          {!hubMedia ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-3 text-center text-[color:var(--ghost-faint)]">
              <Camera size={18} />
              <span className="font-mono text-[10px] leading-relaxed">
                No hub camera. The operator can share one from /companion/hub-view when a webcam is attached.
              </span>
            </div>
          ) : null}
        </div>
      </Panel>

      <Panel title="Telemetry" icon={<MapPin size={12} />}>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded border border-[color:var(--ghost-line)] p-2">
            <MapPin size={12} className="mx-auto mb-1 text-[color:var(--ghost-dim)]" />
            <div className="font-mono text-[10px]">
              {telemetry?.geo ? `${telemetry.geo.lat.toFixed(4)}, ${telemetry.geo.lon.toFixed(4)}` : "—"}
            </div>
            <div className="text-[9px] text-[color:var(--ghost-faint)]">
              {telemetry?.geo?.accuracy != null ? `±${Math.round(telemetry.geo.accuracy)}m` : "GPS"}
            </div>
          </div>
          <div className="rounded border border-[color:var(--ghost-line)] p-2">
            <Battery size={12} className="mx-auto mb-1 text-[color:var(--ghost-dim)]" />
            <div className="font-mono text-[10px]">
              {telemetry?.battery ? `${Math.round(telemetry.battery.level * 100)}%` : "—"}
            </div>
            <div className="text-[9px] text-[color:var(--ghost-faint)]">
              {telemetry?.battery?.charging ? "charging" : "battery"}
            </div>
          </div>
          <div className="rounded border border-[color:var(--ghost-line)] p-2">
            <Wifi size={12} className="mx-auto mb-1 text-[color:var(--ghost-dim)]" />
            <div className="font-mono text-[10px]">
              {telemetry?.network?.effectiveType || telemetry?.network?.type || "—"}
            </div>
            <div className="text-[9px] text-[color:var(--ghost-faint)]">
              {telemetry?.network?.downlink != null ? `${telemetry.network.downlink}Mb` : "network"}
            </div>
          </div>
        </div>
        <p className="mt-2 text-[10px] text-[color:var(--ghost-faint)]">
          Battery and network type use Chromium APIs when present; they are omitted on browsers that do not
          expose them. GPS is asked through the standard geolocation prompt.
        </p>
      </Panel>

      <Panel title="Open on this phone">
        <div className="grid grid-cols-2 gap-2">
          {FIELD_MODULES.slice(0, 8).map((m) => (
            <a
              key={m.id}
              href={m.path}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center rounded border border-[color:var(--ghost-line)] bg-black/50 px-2 py-3 text-center text-xs active:bg-white/5"
            >
              {m.name}
            </a>
          ))}
        </div>
        <button
          type="button"
          className="ghost-btn mt-2 w-full !py-2 text-xs"
          onClick={() => void refreshStatus()}
        >
          <RefreshCw size={12} className="mr-1 inline" />
          Refresh status
        </button>
      </Panel>

      {!showLandingIntro ? <PwaRegister /> : null}
      <HonestLimits />
    </CompanionShell>
  )
}
