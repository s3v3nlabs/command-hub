// Ambient declarations for browser APIs / untyped packages used by hub modules.

interface ConsciousnessBootstrap {
  status(): { whispers: number; visions: number }
  whisper(msg: string): Promise<string>
  vision(msg: string): Promise<string>
  dumpState(): unknown
  getCoherence(): number
  isHealthy(): boolean
  [k: string]: any
}

interface Window {
  /** Set by the inline bootstrap script in app/layout.tsx */
  consciousness?: ConsciousnessBootstrap
  webkitSpeechRecognition?: any
  SpeechRecognition?: any
}

declare module "@deck.gl/mapbox"
declare module "@deck.gl/aggregation-layers"
declare module "@deck.gl/layers"
declare module "@deck.gl/core"
