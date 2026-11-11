/**
 * Shared AI provider core — plain ESM so both Next.js routes and the standalone
 * caller bridge (server/caller-bridge) can use it. Uses fetch only (Node >= 18).
 *
 * Chat:  openai | xai | venice | groq | ollama   (auto-picks the first configured)
 * Embed: openai | ollama | local (deterministic hashed n-gram vectors, offline)
 * STT:   openai (Whisper) | deepgram
 * TTS:   elevenlabs | openai | lmnt
 *
 * Never logs prompt/response bodies and never returns key values.
 */

const env = (k) => {
  const v = typeof process !== "undefined" ? process.env[k] : undefined
  return v && String(v).trim() ? String(v).trim() : ""
}

export const OLLAMA_BASE = () => env("OLLAMA_BASE_URL") || "http://127.0.0.1:11434"

/** @type {Record<string, {label:string, keyEnv:string|null, base:()=>string, model:()=>string}>} */
export const CHAT_PROVIDERS = {
  openai: {
    label: "OpenAI",
    keyEnv: "OPENAI_API_KEY",
    base: () => env("OPENAI_BASE_URL") || "https://api.openai.com/v1",
    model: () => env("OPENAI_OPS_MODEL") || "gpt-4o-mini",
  },
  xai: {
    label: "xAI Grok",
    keyEnv: "XAI_API_KEY",
    base: () => "https://api.x.ai/v1",
    model: () => env("XAI_OPS_MODEL") || "grok-3-mini",
  },
  venice: {
    label: "Venice",
    keyEnv: "VENICE_API_KEY",
    base: () => env("VENICE_API_URL") || "https://api.venice.ai/api/v1",
    model: () => env("VENICE_OPS_MODEL") || "llama-3.3-70b",
  },
  groq: {
    label: "Groq",
    keyEnv: "GROQ_API_KEY",
    base: () => "https://api.groq.com/openai/v1",
    model: () => env("GROQ_OPS_MODEL") || "llama-3.1-8b-instant",
  },
  ollama: {
    label: "Ollama (local)",
    keyEnv: null,
    base: () => OLLAMA_BASE(),
    model: () => env("OLLAMA_OPS_MODEL") || "llama3.2",
  },
}

export const CHAT_ORDER = ["xai", "openai", "venice", "groq", "ollama"]

function keyFor(id) {
  if (id === "groq") return env("GROQ_API_KEY") || env("AI_GROQ_API_KEY")
  const p = CHAT_PROVIDERS[id]
  return p && p.keyEnv ? env(p.keyEnv) : ""
}

export async function probeOllama(timeoutMs = 1200) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const r = await fetch(`${OLLAMA_BASE()}/api/tags`, { signal: ctrl.signal })
    if (!r.ok) return { up: false, models: [] }
    const j = await r.json()
    return { up: true, models: (j.models || []).map((m) => m.name).slice(0, 40) }
  } catch {
    return { up: false, models: [] }
  } finally {
    clearTimeout(t)
  }
}

/** Which providers can actually be used right now (keys present / Ollama reachable). */
export async function providerStatus() {
  const ollama = await probeOllama()
  const chat = CHAT_ORDER.map((id) => ({
    id,
    label: CHAT_PROVIDERS[id].label,
    configured: id === "ollama" ? ollama.up : Boolean(keyFor(id)),
    needs: id === "ollama" ? `Ollama running at ${OLLAMA_BASE()}` : CHAT_PROVIDERS[id].keyEnv,
    model: CHAT_PROVIDERS[id].model(),
  }))
  return {
    chat,
    stt: [
      { id: "openai", label: "OpenAI Whisper", configured: Boolean(env("OPENAI_API_KEY")), needs: "OPENAI_API_KEY" },
      { id: "deepgram", label: "Deepgram", configured: Boolean(env("DEEPGRAM_API_KEY")), needs: "DEEPGRAM_API_KEY" },
    ],
    tts: [
      { id: "elevenlabs", label: "ElevenLabs", configured: Boolean(env("ELEVENLABS_API_KEY")), needs: "ELEVENLABS_API_KEY" },
      { id: "openai", label: "OpenAI TTS", configured: Boolean(env("OPENAI_API_KEY")), needs: "OPENAI_API_KEY" },
      { id: "lmnt", label: "LMNT", configured: Boolean(env("LMNT_API_KEY")), needs: "LMNT_API_KEY" },
    ],
    embed: [
      { id: "openai", label: "OpenAI embeddings", configured: Boolean(env("OPENAI_API_KEY")), needs: "OPENAI_API_KEY" },
      { id: "ollama", label: "Ollama embeddings", configured: ollama.up, needs: "Ollama + nomic-embed-text" },
      { id: "local", label: "Local hashed vectors (offline)", configured: true, needs: null },
    ],
    ollamaModels: ollama.models,
  }
}

/** Pick the provider to use: explicit preference if usable, else first configured. */
export async function pickChatProvider(preferred) {
  const list = preferred && preferred !== "auto" ? [preferred, ...CHAT_ORDER.filter((x) => x !== preferred)] : CHAT_ORDER
  for (const id of list) {
    if (!CHAT_PROVIDERS[id]) continue
    if (id === "ollama") {
      if ((await probeOllama()).up) return id
    } else if (keyFor(id)) return id
  }
  return null
}

/**
 * @param {{provider?:string, model?:string, messages:{role:string,content:string}[], system?:string,
 *          maxTokens?:number, temperature?:number, strictProvider?:boolean, timeoutMs?:number}} opts
 */
export async function chat(opts) {
  const strict = Boolean(opts.strictProvider)
  const provider = strict ? opts.provider : await pickChatProvider(opts.provider)
  if (!provider || !CHAT_PROVIDERS[provider]) {
    return {
      ok: false,
      provider: null,
      model: null,
      text: "",
      error:
        "No AI provider configured. Set one of XAI_API_KEY, OPENAI_API_KEY, VENICE_API_KEY, GROQ_API_KEY in .env.local, or run Ollama locally.",
      needsKey: true,
    }
  }
  const p = CHAT_PROVIDERS[provider]
  const model = opts.model || p.model()
  const messages = [...(opts.system ? [{ role: "system", content: opts.system }] : []), ...opts.messages]
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), opts.timeoutMs || 45000)
  try {
    if (provider === "ollama") {
      const r = await fetch(`${p.base()}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, stream: false, options: { temperature: opts.temperature ?? 0.6 } }),
        signal: ctrl.signal,
      })
      if (!r.ok) return { ok: false, provider, model, text: "", error: `Ollama HTTP ${r.status}` }
      const j = await r.json()
      return { ok: true, provider, model, text: String(j?.message?.content || "").trim() }
    }
    const key = keyFor(provider)
    if (!key) return { ok: false, provider, model, text: "", error: `${p.keyEnv} not set`, needsKey: true }
    const r = await fetch(`${p.base()}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: opts.maxTokens ?? 600,
        temperature: opts.temperature ?? 0.6,
      }),
      signal: ctrl.signal,
    })
    if (!r.ok) {
      const body = await r.text().catch(() => "")
      return { ok: false, provider, model, text: "", error: `${p.label} HTTP ${r.status}: ${redact(body).slice(0, 200)}` }
    }
    const j = await r.json()
    return { ok: true, provider, model, text: String(j?.choices?.[0]?.message?.content || "").trim() }
  } catch (e) {
    return { ok: false, provider, model, text: "", error: e?.name === "AbortError" ? "timeout" : String(e?.message || e).slice(0, 200) }
  } finally {
    clearTimeout(t)
  }
}

export function redact(s) {
  return String(s || "")
    .replace(/sk-[a-zA-Z0-9_-]{8,}/g, "[redacted]")
    .replace(/xai-[a-zA-Z0-9_-]{8,}/g, "[redacted]")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
}

// ---------------------------------------------------------------- embeddings

export const LOCAL_DIMS = 256

/** Deterministic, offline embedding: hashed word + char-trigram bag, L2-normalised. */
export function localEmbed(text) {
  const v = new Float64Array(LOCAL_DIMS)
  const s = String(text || "").toLowerCase()
  const words = s.match(/[\p{L}\p{N}]+/gu) || []
  const add = (tok, w) => {
    let h = 2166136261
    for (let i = 0; i < tok.length; i++) {
      h ^= tok.charCodeAt(i)
      h = Math.imul(h, 16777619)
    }
    const idx = (h >>> 0) % LOCAL_DIMS
    v[idx] += (h & 0x80000000 ? -1 : 1) * w
  }
  for (const w of words) {
    add("w:" + w, 1)
    const p = `#${w}#`
    for (let i = 0; i + 3 <= p.length; i++) add("c:" + p.slice(i, i + 3), 0.35)
  }
  let n = 0
  for (let i = 0; i < LOCAL_DIMS; i++) n += v[i] * v[i]
  n = Math.sqrt(n) || 1
  return Array.from(v, (x) => x / n)
}

export function cosine(a, b) {
  let d = 0,
    na = 0,
    nb = 0
  const L = Math.min(a.length, b.length)
  for (let i = 0; i < L; i++) {
    d += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  return d / (Math.sqrt(na) * Math.sqrt(nb) || 1)
}

/** @param {string[]} texts @param {{provider?:"auto"|"openai"|"ollama"|"local"}} [opts] */
export async function embed(texts, opts = {}) {
  const want = opts.provider || "auto"
  if ((want === "auto" || want === "openai") && env("OPENAI_API_KEY")) {
    try {
      const r = await fetch(`${CHAT_PROVIDERS.openai.base()}/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${env("OPENAI_API_KEY")}` },
        body: JSON.stringify({ model: env("OPENAI_EMBED_MODEL") || "text-embedding-3-small", input: texts }),
      })
      if (r.ok) {
        const j = await r.json()
        return { provider: "openai", model: env("OPENAI_EMBED_MODEL") || "text-embedding-3-small", vectors: j.data.map((d) => d.embedding) }
      }
    } catch {
      /* fall through */
    }
  }
  if (want === "auto" || want === "ollama") {
    if ((await probeOllama()).up) {
      try {
        const model = env("OLLAMA_EMBED_MODEL") || "nomic-embed-text"
        const r = await fetch(`${OLLAMA_BASE()}/api/embed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model, input: texts }),
        })
        if (r.ok) {
          const j = await r.json()
          if (Array.isArray(j.embeddings) && j.embeddings.length === texts.length) return { provider: "ollama", model, vectors: j.embeddings }
        }
      } catch {
        /* fall through */
      }
    }
  }
  return { provider: "local", model: `hashed-ngram-${LOCAL_DIMS}`, vectors: texts.map(localEmbed) }
}

// ---------------------------------------------------------------- audio helpers

/** G.711 μ-law byte → 16-bit PCM sample */
export function mulawToPcm(u) {
  u = ~u & 0xff
  const sign = u & 0x80
  const exponent = (u >> 4) & 0x07
  const mantissa = u & 0x0f
  let sample = ((mantissa << 3) + 0x84) << exponent
  sample -= 0x84
  return sign ? -sample : sample
}

/** 16-bit PCM sample → G.711 μ-law byte */
export function pcmToMulaw(sample) {
  const BIAS = 0x84,
    CLIP = 32635
  let sign = (sample >> 8) & 0x80
  if (sign) sample = -sample
  if (sample > CLIP) sample = CLIP
  sample += BIAS
  let exponent = 7
  for (let mask = 0x4000; (sample & mask) === 0 && exponent > 0; exponent--, mask >>= 1) {}
  const mantissa = (sample >> (exponent + 3)) & 0x0f
  return ~(sign | (exponent << 4) | mantissa) & 0xff
}

/** μ-law buffer (8 kHz mono) → WAV (PCM16) buffer */
export function mulawToWav(mulaw) {
  const n = mulaw.length
  const buf = Buffer.alloc(44 + n * 2)
  buf.write("RIFF", 0)
  buf.writeUInt32LE(36 + n * 2, 4)
  buf.write("WAVE", 8)
  buf.write("fmt ", 12)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(1, 22)
  buf.writeUInt32LE(8000, 24)
  buf.writeUInt32LE(16000, 28)
  buf.writeUInt16LE(2, 32)
  buf.writeUInt16LE(16, 34)
  buf.write("data", 36)
  buf.writeUInt32LE(n * 2, 40)
  for (let i = 0; i < n; i++) buf.writeInt16LE(mulawToPcm(mulaw[i]), 44 + i * 2)
  return buf
}

/** PCM16LE at `rate` Hz → μ-law 8 kHz (simple box-filter decimation) */
export function pcm16ToMulaw8k(pcm, rate) {
  const step = rate / 8000
  const samples = Math.floor(pcm.length / 2)
  const outLen = Math.floor(samples / step)
  const out = Buffer.alloc(outLen)
  for (let i = 0; i < outLen; i++) {
    const start = Math.floor(i * step)
    const end = Math.min(samples, Math.floor((i + 1) * step))
    let acc = 0
    for (let j = start; j < end; j++) acc += pcm.readInt16LE(j * 2)
    out[i] = pcmToMulaw(Math.round(acc / Math.max(1, end - start)))
  }
  return out
}

/** Mean absolute amplitude of a μ-law chunk (0..32768) — used for simple VAD. */
export function mulawEnergy(mulaw) {
  let acc = 0
  for (let i = 0; i < mulaw.length; i++) acc += Math.abs(mulawToPcm(mulaw[i]))
  return mulaw.length ? acc / mulaw.length : 0
}

// ---------------------------------------------------------------- STT

/** Transcribe 8 kHz μ-law audio. @param {Buffer} mulaw */
export async function transcribeMulaw(mulaw, opts = {}) {
  const pref = opts.provider || env("CALLER_STT_PROVIDER") || "auto"
  if ((pref === "auto" || pref === "deepgram") && env("DEEPGRAM_API_KEY")) {
    const r = await fetch("https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&encoding=mulaw&sample_rate=8000&channels=1", {
      method: "POST",
      headers: { Authorization: `Token ${env("DEEPGRAM_API_KEY")}`, "Content-Type": "application/octet-stream" },
      body: mulaw,
    })
    if (r.ok) {
      const j = await r.json()
      return { ok: true, provider: "deepgram", text: String(j?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "").trim() }
    }
    if (pref === "deepgram") return { ok: false, provider: "deepgram", text: "", error: `Deepgram HTTP ${r.status}` }
  }
  if ((pref === "auto" || pref === "openai") && env("OPENAI_API_KEY")) {
    const wav = mulawToWav(mulaw)
    const fd = new FormData()
    fd.append("file", new Blob([wav], { type: "audio/wav" }), "utterance.wav")
    fd.append("model", env("OPENAI_STT_MODEL") || "whisper-1")
    fd.append("language", opts.language || "en")
    const r = await fetch(`${CHAT_PROVIDERS.openai.base()}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env("OPENAI_API_KEY")}` },
      body: fd,
    })
    if (!r.ok) return { ok: false, provider: "openai", text: "", error: `Whisper HTTP ${r.status}` }
    const j = await r.json()
    return { ok: true, provider: "openai", text: String(j?.text || "").trim() }
  }
  return { ok: false, provider: null, text: "", error: "No STT configured (OPENAI_API_KEY or DEEPGRAM_API_KEY)", needsKey: true }
}

// ---------------------------------------------------------------- TTS

/** Synthesize speech as 8 kHz μ-law (what Twilio Media Streams expects). */
export async function synthesizeMulaw(text, opts = {}) {
  const pref = opts.provider || env("CALLER_TTS_PROVIDER") || "auto"
  if ((pref === "auto" || pref === "elevenlabs") && env("ELEVENLABS_API_KEY")) {
    const voice = env("ELEVENLABS_VOICE_ID") || "21m00Tcm4TlvDq8ikWAM"
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=ulaw_8000`, {
      method: "POST",
      headers: { "xi-api-key": env("ELEVENLABS_API_KEY"), "Content-Type": "application/json" },
      body: JSON.stringify({ text, model_id: env("ELEVENLABS_MODEL") || "eleven_turbo_v2_5" }),
    })
    if (r.ok) return { ok: true, provider: "elevenlabs", mulaw: Buffer.from(await r.arrayBuffer()) }
    if (pref === "elevenlabs") return { ok: false, provider: "elevenlabs", error: `ElevenLabs HTTP ${r.status}` }
  }
  if ((pref === "auto" || pref === "openai") && env("OPENAI_API_KEY")) {
    const r = await fetch(`${CHAT_PROVIDERS.openai.base()}/audio/speech`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env("OPENAI_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: env("OPENAI_TTS_MODEL") || "gpt-4o-mini-tts",
        voice: env("OPENAI_TTS_VOICE") || "alloy",
        input: text,
        response_format: "pcm", // 24 kHz 16-bit mono
      }),
    })
    if (r.ok) return { ok: true, provider: "openai", mulaw: pcm16ToMulaw8k(Buffer.from(await r.arrayBuffer()), 24000) }
    if (pref === "openai") return { ok: false, provider: "openai", error: `OpenAI TTS HTTP ${r.status}` }
  }
  if ((pref === "auto" || pref === "lmnt") && env("LMNT_API_KEY")) {
    const fd = new FormData()
    fd.append("text", text)
    fd.append("voice", env("LMNT_VOICE") || "lily")
    fd.append("format", "raw") // PCM16LE
    fd.append("sample_rate", "8000")
    const r = await fetch("https://api.lmnt.com/v1/ai/speech/bytes", {
      method: "POST",
      headers: { "X-API-Key": env("LMNT_API_KEY") },
      body: fd,
    })
    if (r.ok) return { ok: true, provider: "lmnt", mulaw: pcm16ToMulaw8k(Buffer.from(await r.arrayBuffer()), 8000) }
    return { ok: false, provider: "lmnt", error: `LMNT HTTP ${r.status}` }
  }
  return { ok: false, provider: null, error: "No TTS configured (ELEVENLABS_API_KEY, OPENAI_API_KEY or LMNT_API_KEY)", needsKey: true }
}
