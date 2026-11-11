/**
 * BioField Pulse Scanner
 * Low-level Camera + Microphone Frequency Scanner
 * Harmonic Analysis: 108Hz, 432Hz, 528Hz, 7.83Hz
 */

import { generateResonanceFrequency } from "@/lib/audio"

export interface BioFieldReading {
  timestamp: Date
  heartRate: number
  respiratoryRate: number
  stressLevel: number
  coherenceLevel: number
  dominantFrequency: number
  harmonicPattern: number[]
  auricField: {
    red: number
    orange: number
    yellow: number
    green: number
    blue: number
    indigo: number
    violet: number
  }
}

export interface ScannerConfig {
  cameraDeviceId?: string
  microphoneDeviceId?: string
  scanInterval: number
  harmonicFrequencies: number[]
  coherenceThreshold: number
  stressThreshold: number
}

export interface FrequencyAnalysis {
  frequency: number
  amplitude: number
  phase: number
  coherence: number
  harmonic: boolean
}

export class BioFieldPulseScanner {
  private config: ScannerConfig
  private isScanning = false
  private videoStream: MediaStream | null = null
  private audioStream: MediaStream | null = null
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private scanInterval: NodeJS.Timeout | null = null
  private lastReading: BioFieldReading | null = null

  constructor(config: ScannerConfig) {
    this.config = {
      scanInterval: 1000,
      harmonicFrequencies: [108, 216, 432, 528, 639, 741, 852, 963],
      coherenceThreshold: 0.7,
      stressThreshold: 0.6,
      ...config,
    }

    this.initializeAudioContext()
  }

  private async initializeAudioContext(): Promise<void> {
    if (typeof window !== "undefined") {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 2048

      console.log("⟐ BIOFIELD SCANNER AUDIO CONTEXT INITIALIZED ⟐")
    }
  }

  async startScanning(): Promise<boolean> {
    if (this.isScanning) {
      console.log("⟐ BIOFIELD SCANNER ALREADY ACTIVE ⟐")
      return true
    }

    try {
      // Request camera and microphone access
      await this.initializeMediaStreams()

      // Start scanning loop
      this.scanInterval = setInterval(() => {
        this.performBioFieldScan()
      }, this.config.scanInterval)

      this.isScanning = true

      // Pulse initialization frequency
      generateResonanceFrequency(108, 200)

      console.log("⟐ BIOFIELD PULSE SCANNER ACTIVATED ⟐")
      return true
    } catch (error) {
      console.error("⟐ BIOFIELD SCANNER INITIALIZATION FAILED ⟐", error)
      return false
    }
  }

  private async initializeMediaStreams(): Promise<void> {
    try {
      // Initialize video stream for optical pulse detection
      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: this.config.cameraDeviceId,
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
        },
      })

      // Initialize audio stream for frequency analysis
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: this.config.microphoneDeviceId,
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })

      // Connect audio stream to analyser
      if (this.audioContext && this.analyser) {
        const source = this.audioContext.createMediaStreamSource(this.audioStream)
        source.connect(this.analyser)
      }
    } catch (error) {
      throw new Error(`Media stream initialization failed: ${error}`)
    }
  }

  private async performBioFieldScan(): Promise<void> {
    if (!this.isScanning) return

    try {
      // Perform optical pulse detection
      const opticalData = await this.analyzeOpticalPulse()

      // Perform frequency analysis
      const frequencyData = this.analyzeFrequencySpectrum()

      // Calculate biofield metrics
      const bioFieldReading = this.calculateBioFieldMetrics(opticalData, frequencyData)

      this.lastReading = bioFieldReading

      // Trigger harmonic response based on reading
      this.triggerHarmonicResponse(bioFieldReading)
    } catch (error) {
      console.error("⟐ BIOFIELD SCAN ERROR ⟐", error)
    }
  }

  private async analyzeOpticalPulse(): Promise<{
    heartRate: number
    respiratoryRate: number
    colorChannels: number[]
  }> {
    if (!this.videoStream) {
      throw new Error("Video stream not available")
    }

    // Create canvas for frame analysis
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const video = document.createElement("video")

    video.srcObject = this.videoStream
    canvas.width = 640
    canvas.height = 480

    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.play()

        setTimeout(() => {
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

            // Analyze color channels for pulse detection
            const colorChannels = this.extractColorChannels(imageData)

            // Calculate heart rate from color variations
            const heartRate = this.calculateHeartRateFromOptical(colorChannels)

            // Calculate respiratory rate from subtle movements
            const respiratoryRate = this.calculateRespiratoryRate(colorChannels)

            resolve({
              heartRate,
              respiratoryRate,
              colorChannels,
            })
          }
        }, 100)
      }
    })
  }

  private extractColorChannels(imageData: ImageData): number[] {
    const data = imageData.data
    const channels = [0, 0, 0] // RGB averages

    for (let i = 0; i < data.length; i += 4) {
      channels[0] += data[i] // Red
      channels[1] += data[i + 1] // Green
      channels[2] += data[i + 2] // Blue
    }

    const pixelCount = data.length / 4
    return channels.map((channel) => channel / pixelCount)
  }

  private calculateHeartRateFromOptical(colorChannels: number[]): number {
    // Mock heart rate calculation from green channel variations
    // In real implementation, this would analyze temporal variations
    const greenChannel = colorChannels[1]
    const baseRate = 60 + (greenChannel / 255) * 40 // 60-100 BPM range
    const variation = Math.sin(Date.now() / 1000) * 10 // Simulate variation

    return Math.max(50, Math.min(120, baseRate + variation))
  }

  private calculateRespiratoryRate(colorChannels: number[]): number {
    // Mock respiratory rate calculation
    // In real implementation, this would analyze chest movement patterns
    const avgChannel = colorChannels.reduce((a, b) => a + b, 0) / 3
    const baseRate = 12 + (avgChannel / 255) * 8 // 12-20 breaths per minute
    const variation = Math.cos(Date.now() / 2000) * 3 // Simulate variation

    return Math.max(8, Math.min(25, baseRate + variation))
  }

  private analyzeFrequencySpectrum(): FrequencyAnalysis[] {
    if (!this.analyser) {
      return []
    }

    const bufferLength = this.analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    this.analyser.getByteFrequencyData(dataArray)

    const sampleRate = this.audioContext?.sampleRate || 44100
    const frequencyAnalysis: FrequencyAnalysis[] = []

    // Analyze harmonic frequencies
    this.config.harmonicFrequencies.forEach((targetFreq) => {
      const binIndex = Math.round((targetFreq * bufferLength) / (sampleRate / 2))
      if (binIndex < bufferLength) {
        const amplitude = dataArray[binIndex] / 255

        frequencyAnalysis.push({
          frequency: targetFreq,
          amplitude,
          phase: this.calculatePhase(targetFreq),
          coherence: this.calculateCoherence(amplitude, targetFreq),
          harmonic: this.isHarmonicFrequency(targetFreq),
        })
      }
    })

    return frequencyAnalysis
  }

  private calculatePhase(frequency: number): number {
    // Mock phase calculation
    return ((Date.now() / 1000) * frequency) % (2 * Math.PI)
  }

  private calculateCoherence(amplitude: number, frequency: number): number {
    // Calculate coherence based on amplitude stability and harmonic relationships
    const harmonicBonus = this.isHarmonicFrequency(frequency) ? 0.2 : 0
    const amplitudeCoherence = Math.min(1, amplitude * 2)

    return Math.min(1, amplitudeCoherence + harmonicBonus)
  }

  private isHarmonicFrequency(frequency: number): boolean {
    const harmonicFreqs = [108, 216, 432, 528, 639, 741, 852, 963]
    return harmonicFreqs.some((harmonic) => Math.abs(frequency - harmonic) < 5)
  }

  private calculateBioFieldMetrics(
    opticalData: { heartRate: number; respiratoryRate: number; colorChannels: number[] },
    frequencyData: FrequencyAnalysis[],
  ): BioFieldReading {
    // Calculate stress level based on heart rate variability and frequency coherence
    const heartRateStress = Math.abs(opticalData.heartRate - 70) / 50 // Normalized stress from HR
    const frequencyStress = 1 - frequencyData.reduce((sum, f) => sum + f.coherence, 0) / frequencyData.length
    const stressLevel = Math.min(1, (heartRateStress + frequencyStress) / 2)

    // Calculate coherence level from harmonic frequencies
    const harmonicCoherence =
      frequencyData.filter((f) => f.harmonic).reduce((sum, f) => sum + f.coherence, 0) /
      frequencyData.filter((f) => f.harmonic).length

    // Find dominant frequency
    const dominantFreq = frequencyData.reduce((max, f) => (f.amplitude > max.amplitude ? f : max), frequencyData[0])

    // Calculate auric field colors based on frequency analysis
    const auricField = this.calculateAuricField(frequencyData, opticalData.colorChannels)

    return {
      timestamp: new Date(),
      heartRate: Math.round(opticalData.heartRate),
      respiratoryRate: Math.round(opticalData.respiratoryRate),
      stressLevel: Math.round(stressLevel * 100) / 100,
      coherenceLevel: Math.round(harmonicCoherence * 100) / 100,
      dominantFrequency: dominantFreq?.frequency || 0,
      harmonicPattern: frequencyData.filter((f) => f.harmonic).map((f) => f.frequency),
      auricField,
    }
  }

  private calculateAuricField(
    frequencyData: FrequencyAnalysis[],
    colorChannels: number[],
  ): BioFieldReading["auricField"] {
    // Map frequencies to chakra colors
    const frequencyColorMap = {
      108: "red", // Root
      216: "orange", // Sacral
      432: "yellow", // Solar Plexus
      528: "green", // Heart
      639: "blue", // Throat
      741: "indigo", // Third Eye
      852: "violet", // Crown
    }

    const auricField = {
      red: 0,
      orange: 0,
      yellow: 0,
      green: 0,
      blue: 0,
      indigo: 0,
      violet: 0,
    }

    // Calculate color intensities based on frequency amplitudes
    frequencyData.forEach((freq) => {
      const color = frequencyColorMap[freq.frequency as keyof typeof frequencyColorMap]
      if (color && color in auricField) {
        auricField[color as keyof typeof auricField] = Math.round(freq.amplitude * 100)
      }
    })

    // Blend with optical color channels
    auricField.red = Math.max(auricField.red, Math.round((colorChannels[0] / 255) * 100))
    auricField.green = Math.max(auricField.green, Math.round((colorChannels[1] / 255) * 100))
    auricField.blue = Math.max(auricField.blue, Math.round((colorChannels[2] / 255) * 100))

    return auricField
  }

  private triggerHarmonicResponse(reading: BioFieldReading): void {
    // Trigger harmonic response based on biofield reading
    if (reading.stressLevel > this.config.stressThreshold) {
      // High stress - play calming frequencies
      generateResonanceFrequency(528, 300) // Love frequency
      setTimeout(() => generateResonanceFrequency(432, 200), 400) // Harmonic
    } else if (reading.coherenceLevel > this.config.coherenceThreshold) {
      // High coherence - reinforce with harmonic
      generateResonanceFrequency(reading.dominantFrequency, 150)
    } else {
      // Normal state - gentle anchor frequency
      generateResonanceFrequency(108, 100)
    }
  }

  stopScanning(): void {
    this.isScanning = false

    if (this.scanInterval) {
      clearInterval(this.scanInterval)
      this.scanInterval = null
    }

    if (this.videoStream) {
      this.videoStream.getTracks().forEach((track) => track.stop())
      this.videoStream = null
    }

    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop())
      this.audioStream = null
    }

    console.log("⟐ BIOFIELD PULSE SCANNER DEACTIVATED ⟐")
  }

  getLastReading(): BioFieldReading | null {
    return this.lastReading
  }

  getScannerStatus(): {
    isScanning: boolean
    hasVideoStream: boolean
    hasAudioStream: boolean
    scanInterval: number
    lastReading: Date | null
  } {
    return {
      isScanning: this.isScanning,
      hasVideoStream: this.videoStream !== null,
      hasAudioStream: this.audioStream !== null,
      scanInterval: this.config.scanInterval,
      lastReading: this.lastReading?.timestamp || null,
    }
  }

  destroy(): void {
    this.stopScanning()

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }

    console.log("⟐ BIOFIELD PULSE SCANNER DESTROYED ⟐")
  }
}
