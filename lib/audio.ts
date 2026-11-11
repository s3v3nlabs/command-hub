export function speak(text: string): void {
  // Only run in browser environment
  if (typeof window === "undefined") {
    console.log(`[TTS-SERVER-FALLBACK] ${text}`)
    return
  }

  // Check if speech synthesis is supported
  if (!("speechSynthesis" in window)) {
    console.log(`[TTS-FALLBACK] ${text}`)
    return
  }

  try {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text)

    // Configure voice settings
    utterance.rate = 0.9
    utterance.pitch = 1.0
    utterance.volume = 0.7

    // Try to use a more robotic/synthetic voice if available
    const voices = window.speechSynthesis.getVoices()
    const preferredVoices = voices.filter(
      (voice) =>
        voice.name.toLowerCase().includes("robot") ||
        voice.name.toLowerCase().includes("synthetic") ||
        voice.name.toLowerCase().includes("computer") ||
        voice.name.toLowerCase().includes("microsoft") ||
        voice.name.toLowerCase().includes("google"),
    )

    if (preferredVoices.length > 0) {
      utterance.voice = preferredVoices[0]
    } else if (voices.length > 0) {
      // Fallback to first available voice
      utterance.voice = voices[0]
    }

    // Error handling
    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event.error)
      console.log(`[TTS-ERROR-FALLBACK] ${text}`)
    }

    utterance.onend = () => {
      // Optional: Log completion for debugging
      // console.log("Speech synthesis completed")
    }

    // Speak the text
    window.speechSynthesis.speak(utterance)
  } catch (error) {
    console.error("Speech synthesis failed:", error)
    console.log(`[TTS-EXCEPTION-FALLBACK] ${text}`)
  }
}

// Enhanced audio functions for the tactical interface
export function playAlertSound(type: "info" | "warning" | "error" | "success" = "info"): void {
  if (typeof window === "undefined") return

  try {
    // Create audio context for synthetic sounds
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Configure sound based on alert type
    switch (type) {
      case "info":
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1)
        break
      case "warning":
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.15)
        break
      case "error":
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3)
        break
      case "success":
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(900, audioContext.currentTime + 0.1)
        break
    }

    oscillator.type = "sine"
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.2)
  } catch (error) {
    console.error("Alert sound failed:", error)
  }
}

export function speakWithAlert(text: string, alertType: "info" | "warning" | "error" | "success" = "info"): void {
  playAlertSound(alertType)

  // Small delay before speaking to let alert sound play
  setTimeout(() => {
    speak(text)
  }, 300)
}

// Tactical command acknowledgment
export function acknowledgeCommand(command: string): void {
  const acknowledgments = [
    "Command acknowledged",
    "Roger that",
    "Affirmative",
    "Command received",
    "Executing",
    "Copy that",
  ]

  const ack = acknowledgments[Math.floor(Math.random() * acknowledgments.length)]
  speak(`${ack}. ${command}`)
}

// System status announcements
export function announceSystemStatus(status: "online" | "offline" | "error" | "connecting"): void {
  const messages = {
    online: "System online. All modules operational.",
    offline: "System offline. Connection lost.",
    error: "System error detected. Running diagnostics.",
    connecting: "Establishing connection. Please standby.",
  }

  speakWithAlert(messages[status], status === "online" ? "success" : status === "error" ? "error" : "info")
}

// Resonance frequency generator for UI feedback
export function generateResonanceFrequency(frequency = 440, duration = 100): void {
  if (typeof window === "undefined") return

  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
    oscillator.type = "sine"

    gainNode.gain.setValueAtTime(0.05, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + duration / 1000)
  } catch (error) {
    console.error("Resonance frequency generation failed:", error)
  }
}
