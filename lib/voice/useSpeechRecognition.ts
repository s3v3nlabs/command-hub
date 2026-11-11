"use client"

/**
 * Thin shared browser SpeechRecognition hook (ADD-ONLY).
 * Phase 3 VoiceBusPanel patterns reused — client-only, no server transcript logs.
 * HOLD_VYRNA_UNSYNC · lattice_sync: false
 */

import { useCallback, useEffect, useRef, useState } from "react"

export type SpeechRec = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((ev: Event) => void) | null
  onerror: ((ev: Event) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

export function getSpeechRecognitionCtor(): (new () => SpeechRec) | null {
  if (typeof window === "undefined") return null
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRec
    webkitSpeechRecognition?: new () => SpeechRec
  }
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

export type UseSpeechRecognitionOptions = {
  continuous?: boolean
  interimResults?: boolean
  lang?: string
  /** Fired on each final transcript chunk (client-only). */
  onFinal?: (text: string) => void
  /** Fired when recognition ends unexpectedly while still wanting to listen. */
  autoRestart?: boolean
}

export function useSpeechRecognition(opts: UseSpeechRecognitionOptions = {}) {
  const {
    continuous = true,
    interimResults = true,
    lang = "en-US",
    onFinal,
    autoRestart = false,
  } = opts

  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [interim, setInterim] = useState("")
  const [error, setError] = useState<string | null>(null)
  const recRef = useRef<SpeechRec | null>(null)
  const wantListenRef = useRef(false)
  const onFinalRef = useRef(onFinal)
  onFinalRef.current = onFinal

  useEffect(() => {
    setSupported(Boolean(getSpeechRecognitionCtor()))
  }, [])

  const stop = useCallback(() => {
    wantListenRef.current = false
    try {
      recRef.current?.stop()
    } catch {
      /* ignore */
    }
    recRef.current = null
    setListening(false)
    setInterim("")
  }, [])

  const start = useCallback(() => {
    setError(null)
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) {
      setError("SpeechRecognition not available (Chrome/Edge recommended)")
      return
    }
    try {
      // Stop any prior instance
      try {
        recRef.current?.stop()
      } catch {
        /* ignore */
      }
      const rec = new Ctor()
      rec.continuous = continuous
      rec.interimResults = interimResults
      rec.lang = lang
      rec.onresult = (ev: Event) => {
        const e = ev as unknown as {
          resultIndex: number
          results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>
        }
        let finalChunk = ""
        let interimChunk = ""
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i]
          if (r.isFinal) finalChunk += r[0].transcript
          else interimChunk += r[0].transcript
        }
        if (finalChunk) {
          const trimmed = finalChunk.trim()
          setTranscript((prev) => (prev ? `${prev} ${trimmed}` : trimmed).trim())
          onFinalRef.current?.(trimmed)
        }
        setInterim(interimChunk)
      }
      rec.onerror = (ev: Event) => {
        const err = (ev as unknown as { error?: string }).error || "recognition error"
        setError(err)
        setListening(false)
      }
      rec.onend = () => {
        setListening(false)
        setInterim("")
        if (wantListenRef.current && autoRestart) {
          try {
            rec.start()
            setListening(true)
          } catch {
            wantListenRef.current = false
          }
        }
      }
      recRef.current = rec
      wantListenRef.current = true
      rec.start()
      setListening(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "mic start failed")
      setListening(false)
      wantListenRef.current = false
    }
  }, [continuous, interimResults, lang, autoRestart])

  const clearTranscript = useCallback(() => {
    setTranscript("")
    setInterim("")
  }, [])

  useEffect(() => {
    return () => {
      wantListenRef.current = false
      try {
        recRef.current?.abort()
      } catch {
        /* ignore */
      }
    }
  }, [])

  return {
    supported,
    listening,
    transcript,
    interim,
    error,
    start,
    stop,
    clearTranscript,
    setTranscript,
  }
}
