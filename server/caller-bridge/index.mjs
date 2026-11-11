#!/usr/bin/env node
/**
 * AI Caller bridge — Twilio Media Streams ⇄ STT → LLM → TTS.
 *
 * Why a separate process: Next.js route handlers can't host WebSockets, and Twilio Media
 * Streams need a wss:// endpoint. This server:
 *   - accepts Twilio's WebSocket at  /media   (μ-law 8 kHz audio both ways)
 *   - reverse-proxies every other HTTP request to the Next app (default http://127.0.0.1:3000)
 *     so ONE tunnel (cloudflared / ngrok → this port) serves webhooks + media.
 *
 * Run:  npm run caller:bridge        (reads .env.local / .env from the repo root)
 * Env:  CALLER_BRIDGE_PORT=8788  NEXT_INTERNAL_URL=http://127.0.0.1:3000
 *
 * Safety: only streams carrying a valid HMAC token (issued in our TwiML) are accepted; the
 * fixed disclosure is spoken by Twilio <Say> before the stream starts; max call length is
 * enforced; "[DNC]" from the model adds the number to the do-not-call list.
 */
import http from "node:http"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { WebSocketServer } from "ws"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..")
loadEnvFiles([path.join(ROOT, ".env.local"), path.join(ROOT, ".env")])
process.chdir(ROOT) // so local-data/ resolves the same as the Next app

const C = await import("../../lib/caller/core.mjs")
const L = await import("../../lib/llm/core.mjs")

const PORT = Number(process.env.CALLER_BRIDGE_PORT || 8788)
const NEXT_URL = new URL(process.env.NEXT_INTERNAL_URL || "http://127.0.0.1:3000")

function loadEnvFiles(files) {
  for (const f of files) {
    let txt
    try {
      txt = fs.readFileSync(f, "utf8")
    } catch {
      continue
    }
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (!m || process.env[m[1]]) continue
      let v = m[2]
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
      process.env[m[1]] = v
    }
  }
}

const log = (...a) => console.log(new Date().toISOString(), "[caller-bridge]", ...a) // never logs audio or transcript text

// ------------------------------------------------------------------ HTTP: health + reverse proxy to Next
const server = http.createServer((req, res) => {
  if (req.url === "/bridge/health") {
    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ ok: true, mode: C.mode(), active: sessions.size }))
    return
  }
  const opts = {
    protocol: NEXT_URL.protocol,
    hostname: NEXT_URL.hostname,
    port: NEXT_URL.port,
    method: req.method,
    path: req.url,
    headers: { ...req.headers, host: NEXT_URL.host, "x-forwarded-host": req.headers.host || "" },
  }
  const up = http.request(opts, (r) => {
    res.writeHead(r.statusCode || 502, r.headers)
    r.pipe(res)
  })
  up.on("error", () => {
    res.writeHead(502, { "Content-Type": "text/plain" })
    res.end("Next app not reachable — start it with `npm run start` or `npm run dev`")
  })
  req.pipe(up)
})

// ------------------------------------------------------------------ WebSocket: Twilio Media Streams
const wss = new WebSocketServer({ noServer: true })
const sessions = new Map()

server.on("upgrade", (req, socket, head) => {
  if (!req.url || !req.url.startsWith("/media")) return socket.destroy()
  wss.handleUpgrade(req, socket, head, (ws) => handleStream(ws))
})

const FRAME_MS = 20
const SPEECH_ENERGY = Number(process.env.CALLER_VAD_THRESHOLD || 700)
const END_SILENCE_FRAMES = Math.round(Number(process.env.CALLER_VAD_SILENCE_MS || 800) / FRAME_MS)
const MIN_SPEECH_FRAMES = 12 // ~240 ms

function handleStream(ws) {
  /** @type {any} */
  const s = { ws, callId: null, streamSid: null, call: null, history: [], buf: [], speechFrames: 0, silence: 0, inSpeech: false, speaking: false, busy: false, ending: false, startedAt: Date.now(), timer: null }

  ws.on("message", async (raw) => {
    let msg
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      return
    }
    if (msg.event === "start") {
      const p = msg.start?.customParameters || {}
      if (!p.callId || !C.verifyStreamToken(p.callId, p.token)) {
        log("rejected stream with bad token")
        return ws.close()
      }
      s.callId = p.callId
      s.streamSid = msg.start.streamSid
      s.call = C.getCall(p.callId)
      if (!s.call) return ws.close()
      sessions.set(s.callId, s)
      C.upsertCall({ id: s.callId, status: "in-progress" })
      C.appendTranscript(s.callId, { speaker: "ai", text: C.disclosureLine(), meta: { fixed: true, via: "twilio-say" } })
      s.timer = setTimeout(() => endCall(s, "max duration reached"), C.maxCallSeconds() * 1000)
      log("stream started", s.callId)
      const opener = C.openingTurn(s.call)
      s.history.push({ role: "assistant", content: `${C.disclosureLine()} ${opener}` })
      await speak(s, opener)
    } else if (msg.event === "media" && s.callId) {
      onAudio(s, Buffer.from(msg.media.payload, "base64"))
    } else if (msg.event === "mark" && msg.mark?.name === "eot") {
      s.speaking = false
      if (s.ending) hangup(s)
    } else if (msg.event === "stop") {
      cleanup(s)
    }
  })
  ws.on("close", () => cleanup(s))
}

function onAudio(s, chunk) {
  const e = L.mulawEnergy(chunk)
  if (e > SPEECH_ENERGY) {
    if (s.speaking && s.speechFrames > 6) {
      // barge-in: caller talks over us → stop our audio
      s.ws.send(JSON.stringify({ event: "clear", streamSid: s.streamSid }))
      s.speaking = false
    }
    s.inSpeech = true
    s.speechFrames++
    s.silence = 0
    s.buf.push(chunk)
  } else if (s.inSpeech) {
    s.silence++
    s.buf.push(chunk)
    if (s.silence >= END_SILENCE_FRAMES) {
      const audio = Buffer.concat(s.buf)
      const enough = s.speechFrames >= MIN_SPEECH_FRAMES
      s.buf = []
      s.inSpeech = false
      s.speechFrames = 0
      s.silence = 0
      if (enough) void respond(s, audio)
    }
  }
  if (s.buf.length > 1500) s.buf = s.buf.slice(-1500) // cap ~30 s
}

async function respond(s, audio) {
  if (s.busy || s.ending) return
  s.busy = true
  try {
    const stt = await L.transcribeMulaw(audio)
    if (!stt.ok) {
      C.appendTranscript(s.callId, { speaker: "system", text: `STT error: ${stt.error}` })
      return
    }
    if (!stt.text) return
    C.appendTranscript(s.callId, { speaker: "callee", text: stt.text, meta: { stt: stt.provider } })
    s.history.push({ role: "user", content: stt.text })
    const r = await L.chat({ provider: s.call.llmProvider || "auto", system: C.callSystemPrompt(s.call), messages: s.history.slice(-20), maxTokens: 140, timeoutMs: 20000 })
    let text = r.ok ? r.text : "Sorry, I'm having a technical issue. I'll let them know to follow up. Goodbye. [END_CALL]"
    const dnc = /\[DNC\]/.test(text)
    const end = /\[END_CALL\]/.test(text)
    text = text.replace(/\[(DNC|END_CALL)\]/g, "").trim()
    s.history.push({ role: "assistant", content: text })
    if (dnc) {
      C.addDnc(s.call.to, "callee requested during call")
      C.appendTranscript(s.callId, { speaker: "system", text: "Number added to do-not-call list at callee's request." })
    }
    if (end) s.ending = true
    await speak(s, text, r.ok ? `${r.provider}:${r.model}` : "fallback")
  } finally {
    s.busy = false
  }
}

async function speak(s, text, llm) {
  if (!text) return
  C.appendTranscript(s.callId, { speaker: "ai", text, meta: llm ? { llm } : undefined })
  const t = await L.synthesizeMulaw(text)
  if (!t.ok || !t.mulaw) {
    C.appendTranscript(s.callId, { speaker: "system", text: `TTS error: ${t.error}` })
    if (s.ending) hangup(s)
    return
  }
  s.speaking = true
  // 20 ms frames (160 bytes) — Twilio buffers and plays in order
  for (let i = 0; i < t.mulaw.length; i += 160) {
    if (s.ws.readyState !== 1) return
    s.ws.send(JSON.stringify({ event: "media", streamSid: s.streamSid, media: { payload: t.mulaw.subarray(i, i + 160).toString("base64") } }))
  }
  s.ws.send(JSON.stringify({ event: "mark", streamSid: s.streamSid, mark: { name: "eot" } }))
}

function endCall(s, reason) {
  C.appendTranscript(s.callId, { speaker: "system", text: `Ending call: ${reason}` })
  hangup(s)
}

async function hangup(s) {
  if (s.hungUp) return
  s.hungUp = true
  const call = C.getCall(s.callId)
  try {
    if (call?.twilioSid) await C.twilioHangup(call.twilioSid)
  } catch (e) {
    log("hangup error", String(e.message || e).slice(0, 120))
  }
}

function cleanup(s) {
  if (!s.callId || s.cleaned) return
  s.cleaned = true
  clearTimeout(s.timer)
  sessions.delete(s.callId)
  const call = C.getCall(s.callId)
  if (call && !call.endedAt) C.upsertCall({ id: s.callId, status: "completed", endedAt: new Date().toISOString(), durationSec: Math.round((Date.now() - s.startedAt) / 1000) })
  log("stream closed", s.callId)
}

server.listen(PORT, () => {
  log(`listening on :${PORT} — media at /media, proxying HTTP to ${NEXT_URL.origin}; mode=${C.mode()}`)
  if (C.mode() !== "live") log("Twilio env or PUBLIC_BASE_URL missing → hub runs AI Caller in DEMO mode")
})
