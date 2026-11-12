/**
 * One-session WebRTC peer for the Device Bridge.
 * The phone is always the offerer; the hub answers. ICE is trickled over SSE+POST.
 * No SFU, no TURN. Honest about that at the call site.
 */

import type { CompanionRole, SignalEnvelope } from "@/lib/companion/types"
import { ICE_SERVERS, postSignal } from "./client"

export type PeerHandlers = {
  sessionId: string
  ticket: string
  token?: string
  role: CompanionRole
  onRemoteStream?: (stream: MediaStream | null) => void
  onLocalStream?: (stream: MediaStream | null) => void
  onState?: (state: RTCPeerConnectionState) => void
  onError?: (message: string) => void
}

export class BridgePeer {
  pc: RTCPeerConnection | null = null
  localStream: MediaStream | null = null
  remoteStream: MediaStream | null = null
  private pendingIce: RTCIceCandidateInit[] = []
  private remoteReady = false
  private handlers: PeerHandlers
  closed = false

  constructor(handlers: PeerHandlers) {
    this.handlers = handlers
  }

  private ensurePc(): RTCPeerConnection {
    if (this.pc) return this.pc
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    this.pc = pc
    pc.onicecandidate = (ev) => {
      if (this.closed) return
      void postSignal({
        sessionId: this.handlers.sessionId,
        ticket: this.handlers.ticket,
        token: this.handlers.token,
        from: this.handlers.role,
        kind: "ice",
        payload: ev.candidate ? ev.candidate.toJSON() : null,
      })
    }
    pc.ontrack = (ev) => {
      const stream = ev.streams[0] || new MediaStream(ev.track ? [ev.track] : [])
      this.remoteStream = stream
      this.handlers.onRemoteStream?.(stream)
    }
    pc.onconnectionstatechange = () => {
      this.handlers.onState?.(pc.connectionState)
      if (pc.connectionState === "failed") {
        this.handlers.onError?.(
          "WebRTC connection failed. Same-LAN or Tailscale usually works. Across the public internet, symmetric NAT will fail — no TURN server is shipped.",
        )
      }
    }
    return pc
  }

  async acquireLocal(constraints: MediaStreamConstraints): Promise<MediaStream> {
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    this.localStream = stream
    this.handlers.onLocalStream?.(stream)
    return stream
  }

  attachLocal(stream: MediaStream): void {
    const pc = this.ensurePc()
    for (const track of stream.getTracks()) {
      const existing = pc.getSenders().find((s) => s.track && s.track.kind === track.kind)
      if (existing) {
        void existing.replaceTrack(track)
      } else {
        pc.addTrack(track, stream)
      }
    }
    this.localStream = stream
    this.handlers.onLocalStream?.(stream)
  }

  async offer(): Promise<void> {
    const pc = this.ensurePc()
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    const ok = await postSignal({
      sessionId: this.handlers.sessionId,
      ticket: this.handlers.ticket,
      token: this.handlers.token,
      from: this.handlers.role,
      kind: "offer",
      payload: pc.localDescription,
    })
    if (!ok) this.handlers.onError?.("Failed to post SDP offer — check the token / ticket and that the session is still live.")
  }

  async handleSignal(sig: SignalEnvelope): Promise<void> {
    if (this.closed) return
    if (sig.from === this.handlers.role) return // ignore our own echoes
    if (sig.kind === "offer") {
      if (this.handlers.role !== "hub") return
      await this.answerOffer(sig.payload as RTCSessionDescriptionInit)
      return
    }
    if (sig.kind === "answer") {
      if (this.handlers.role !== "phone") return
      const pc = this.ensurePc()
      if (pc.signalingState === "have-local-offer" || pc.signalingState === "have-local-pranswer") {
        await pc.setRemoteDescription(sig.payload as RTCSessionDescriptionInit)
        this.remoteReady = true
        await this.flushIce()
      }
      return
    }
    if (sig.kind === "ice") {
      const cand = sig.payload as RTCIceCandidateInit | null
      if (!cand || (!cand.candidate && cand.candidate !== "")) return
      if (!this.remoteReady && this.handlers.role === "phone") {
        this.pendingIce.push(cand)
        return
      }
      try {
        await this.ensurePc().addIceCandidate(cand)
      } catch (err) {
        // Queue if remote description is not set yet
        this.pendingIce.push(cand)
        if (this.remoteReady) {
          this.handlers.onError?.(`ICE add failed: ${err instanceof Error ? err.message : "unknown"}`)
        }
      }
      return
    }
    if (sig.kind === "hangup") {
      this.handlers.onRemoteStream?.(null)
      // Keep local stream; the caller may re-offer.
    }
    if (sig.kind === "media-state") {
      const p = sig.payload as { wantRenegotiate?: boolean }
      if (p?.wantRenegotiate && this.handlers.role === "phone" && this.localStream) {
        await this.offer()
      }
    }
  }

  async answerOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.ensurePc()
    // If we already have a connection and a new offer arrives, take it (phone re-offer).
    if (pc.signalingState === "have-local-offer") {
      // Glare: we shouldn't be offering as hub. Roll back if possible.
      try {
        await pc.setLocalDescription({ type: "rollback" })
      } catch {
        this.rebuild()
      }
    }
    await this.ensurePc().setRemoteDescription(offer)
    this.remoteReady = true
    if (this.localStream) this.attachLocal(this.localStream)
    const answer = await this.ensurePc().createAnswer()
    await this.ensurePc().setLocalDescription(answer)
    await postSignal({
      sessionId: this.handlers.sessionId,
      ticket: this.handlers.ticket,
      token: this.handlers.token,
      from: this.handlers.role,
      kind: "answer",
      payload: this.ensurePc().localDescription,
    })
    await this.flushIce()
  }

  private async flushIce(): Promise<void> {
    const queued = this.pendingIce.splice(0)
    for (const c of queued) {
      try {
        await this.ensurePc().addIceCandidate(c)
      } catch {
        /* stale candidate */
      }
    }
  }

  private rebuild(): void {
    const local = this.localStream
    this.pc?.close()
    this.pc = null
    this.remoteReady = false
    this.pendingIce = []
    this.ensurePc()
    if (local) this.attachLocal(local)
  }

  async hangup(stopLocal = false): Promise<void> {
    await postSignal({
      sessionId: this.handlers.sessionId,
      ticket: this.handlers.ticket,
      token: this.handlers.token,
      from: this.handlers.role,
      kind: "hangup",
      payload: { reason: "operator" },
    })
    this.close(stopLocal)
  }

  close(stopLocal = false): void {
    this.closed = true
    try {
      this.pc?.close()
    } catch {
      /* ignore */
    }
    this.pc = null
    this.remoteReady = false
    this.pendingIce = []
    if (stopLocal && this.localStream) {
      for (const t of this.localStream.getTracks()) t.stop()
      this.localStream = null
      this.handlers.onLocalStream?.(null)
    }
    this.remoteStream = null
    this.handlers.onRemoteStream?.(null)
  }
}
