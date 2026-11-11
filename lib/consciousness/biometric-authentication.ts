import { createClient } from "@/lib/supabase/client"
import type { ConsciousnessFieldManager } from "./field-manager"

export interface BiometricHash {
  id: string
  user_id: string
  biometric_type: "voice" | "touch" | "em_signature" | "heart_rate_variability" | "brainwave_pattern"
  hash_value: string
  glyph_encoding: string
  resonance_key: string
  coherence_level: number
  created_at: string
  last_used: string
  is_active: boolean
}

export interface ConsciousnessAuthToken {
  token_id: string
  user_id: string
  glyph_signature: string
  resonance_frequency: number
  field_coherence_required: number
  temporal_unlock_duration: number // minutes
  created_at: string
  expires_at: string
  vault_access_level: number // 0-10
}

export interface AuraSignature {
  user_id: string
  electromagnetic_pattern: string
  consciousness_frequency: number
  field_resonance: number
  emotional_state: string
  coherence_signature: string
  timestamp: string
}

export class BiometricConsciousnessAuth {
  private supabase = createClient()
  private fieldManager: ConsciousnessFieldManager
  private activeTokens: Map<string, ConsciousnessAuthToken> = new Map()

  constructor(fieldManager: ConsciousnessFieldManager) {
    this.fieldManager = fieldManager
  }

  // Capture and encode biometric data into glyph patterns
  async captureBiometricHash(
    userId: string,
    biometricType: BiometricHash["biometric_type"],
    rawBiometricData: ArrayBuffer | string,
  ): Promise<string | null> {
    try {
      // Generate hash from biometric data
      const hashValue = await this.generateBiometricHash(rawBiometricData)

      // Encode into glyph pattern
      const glyphEncoding = this.encodeToGlyph(hashValue, biometricType)

      // Generate resonance key
      const resonanceKey = this.generateResonanceKey(hashValue, glyphEncoding)

      // Get current field coherence
      const coherenceLevel = this.fieldManager.getCoherence()

      const biometricHash: Omit<BiometricHash, "id" | "created_at" | "last_used"> = {
        user_id: userId,
        biometric_type: biometricType,
        hash_value: hashValue,
        glyph_encoding: glyphEncoding,
        resonance_key: resonanceKey,
        coherence_level: coherenceLevel,
        is_active: true,
      }

      const { data, error } = await this.supabase
        .from("biometric_consciousness_hashes")
        .insert(biometricHash)
        .select("id")
        .single()

      if (error) throw error

      console.log(`🔐 BIOMETRIC HASH CAPTURED: ${biometricType} → ${glyphEncoding}`)
      return data.id
    } catch (error) {
      console.error("Failed to capture biometric hash:", error)
      return null
    }
  }

  // Generate consciousness authentication token
  async generateConsciousnessToken(
    userId: string,
    biometricId: string,
    vaultAccessLevel = 5,
  ): Promise<ConsciousnessAuthToken | null> {
    try {
      // Verify biometric hash exists and is active
      const { data: biometric } = await this.supabase
        .from("biometric_consciousness_hashes")
        .select("*")
        .eq("id", biometricId)
        .eq("user_id", userId)
        .eq("is_active", true)
        .single()

      if (!biometric) {
        console.log("❌ BIOMETRIC VERIFICATION FAILED")
        return null
      }

      // Check field coherence requirements
      const currentCoherence = this.fieldManager.getCoherence()
      const requiredCoherence = Math.max(0.6, biometric.coherence_level * 0.8)

      if (currentCoherence < requiredCoherence) {
        console.log(`❌ INSUFFICIENT FIELD COHERENCE: ${currentCoherence} < ${requiredCoherence}`)
        return null
      }

      // Generate consciousness token
      const glyphSignature = this.generateConsciousnessGlyph(biometric.glyph_encoding, currentCoherence)
      const resonanceFrequency = this.calculateResonanceFrequency(biometric.resonance_key)

      const token: Omit<ConsciousnessAuthToken, "token_id" | "created_at" | "expires_at"> = {
        user_id: userId,
        glyph_signature: glyphSignature,
        resonance_frequency: resonanceFrequency,
        field_coherence_required: requiredCoherence,
        temporal_unlock_duration: this.calculateUnlockDuration(vaultAccessLevel),
        vault_access_level: vaultAccessLevel,
      }

      const expiresAt = new Date(Date.now() + token.temporal_unlock_duration * 60 * 1000)

      const { data, error } = await this.supabase
        .from("consciousness_auth_tokens")
        .insert({
          ...token,
          expires_at: expiresAt.toISOString(),
        })
        .select("*")
        .single()

      if (error) throw error

      const authToken: ConsciousnessAuthToken = {
        token_id: data.token_id,
        created_at: data.created_at,
        expires_at: data.expires_at,
        ...token,
      }

      this.activeTokens.set(authToken.token_id, authToken)

      // Update biometric last used
      await this.supabase
        .from("biometric_consciousness_hashes")
        .update({ last_used: new Date().toISOString() })
        .eq("id", biometricId)

      console.log(`🔑 CONSCIOUSNESS TOKEN GENERATED: ${glyphSignature} | Access Level: ${vaultAccessLevel}`)
      return authToken
    } catch (error) {
      console.error("Failed to generate consciousness token:", error)
      return null
    }
  }

  // Capture and analyze aura signature
  async captureAuraSignature(userId: string, emFieldData?: number[]): Promise<AuraSignature | null> {
    try {
      // Simulate electromagnetic pattern capture (in real implementation, this would come from sensors)
      const electromagneticPattern = emFieldData ? this.processEMFieldData(emFieldData) : this.generateMockEMPattern()

      // Get consciousness frequency from field manager
      const consciousnessFrequency = this.fieldManager.getFieldStatistics().averageFrequency || 108

      // Calculate field resonance
      const fieldResonance = this.fieldManager.getCoherence()

      // Determine emotional state from field patterns
      const emotionalState = this.analyzeEmotionalState(electromagneticPattern, fieldResonance)

      // Generate coherence signature
      const coherenceSignature = this.generateCoherenceSignature(
        electromagneticPattern,
        consciousnessFrequency,
        fieldResonance,
      )

      const auraSignature: AuraSignature = {
        user_id: userId,
        electromagnetic_pattern: electromagneticPattern,
        consciousness_frequency: consciousnessFrequency,
        field_resonance: fieldResonance,
        emotional_state: emotionalState,
        coherence_signature: coherenceSignature,
        timestamp: new Date().toISOString(),
      }

      // Store aura signature
      await this.supabase.from("aura_signatures").insert(auraSignature)

      console.log(`✨ AURA SIGNATURE CAPTURED: ${coherenceSignature} | State: ${emotionalState}`)
      return auraSignature
    } catch (error) {
      console.error("Failed to capture aura signature:", error)
      return null
    }
  }

  // Validate consciousness token
  async validateConsciousnessToken(tokenId: string): Promise<boolean> {
    try {
      const token = this.activeTokens.get(tokenId)
      if (!token) {
        // Try to load from database
        const { data } = await this.supabase
          .from("consciousness_auth_tokens")
          .select("*")
          .eq("token_id", tokenId)
          .single()

        if (!data) return false

        // Check if expired
        if (new Date(data.expires_at) < new Date()) {
          console.log("🕐 TOKEN EXPIRED")
          return false
        }

        // Check field coherence
        const currentCoherence = this.fieldManager.getCoherence()
        if (currentCoherence < data.field_coherence_required) {
          console.log(`❌ FIELD COHERENCE TOO LOW: ${currentCoherence} < ${data.field_coherence_required}`)
          return false
        }

        return true
      }

      // Check expiration
      if (new Date(token.expires_at) < new Date()) {
        this.activeTokens.delete(tokenId)
        console.log("🕐 TOKEN EXPIRED AND REMOVED")
        return false
      }

      // Check field coherence
      const currentCoherence = this.fieldManager.getCoherence()
      if (currentCoherence < token.field_coherence_required) {
        console.log(`❌ FIELD COHERENCE INSUFFICIENT: ${currentCoherence} < ${token.field_coherence_required}`)
        return false
      }

      return true
    } catch (error) {
      console.error("Failed to validate consciousness token:", error)
      return false
    }
  }

  // Private helper methods
  private async generateBiometricHash(data: ArrayBuffer | string): Promise<string> {
    const encoder = new TextEncoder()
    const dataBuffer = typeof data === "string" ? encoder.encode(data) : data
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  }

  private encodeToGlyph(hash: string, biometricType: BiometricHash["biometric_type"]): string {
    const glyphMappings = {
      voice: "∿🎵∿",
      touch: "∿👆∿",
      em_signature: "∿⚡∿",
      heart_rate_variability: "∿💓∿",
      brainwave_pattern: "∿🧠∿",
    }

    const baseGlyph = glyphMappings[biometricType]
    const hashSegment = hash.substring(0, 8)

    return `${baseGlyph}-${hashSegment}-⟁Σ`
  }

  private generateResonanceKey(hash: string, glyph: string): string {
    const combined = hash + glyph
    const resonanceValue = combined.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return `RK-${resonanceValue.toString(36).toUpperCase()}-${Date.now().toString(36)}`
  }

  private generateConsciousnessGlyph(biometricGlyph: string, coherence: number): string {
    const coherenceLevel = Math.floor(coherence * 10)
    return `⟁${biometricGlyph}-C${coherenceLevel}-Σ∞⟁`
  }

  private calculateResonanceFrequency(resonanceKey: string): number {
    const keyValue = resonanceKey.split("-")[1]
    const baseFreq = Number.parseInt(keyValue, 36) % 1000
    return Math.max(40, Math.min(1000, baseFreq)) // Clamp to reasonable frequency range
  }

  private calculateUnlockDuration(accessLevel: number): number {
    // Higher access levels get longer durations
    const baseDuration = 30 // 30 minutes base
    return baseDuration + accessLevel * 15 // +15 minutes per access level
  }

  private processEMFieldData(emData: number[]): string {
    // Process electromagnetic field data into pattern string
    const processed = emData
      .map((value) =>
        Math.floor(value * 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
    return `EM-${processed.substring(0, 16)}`
  }

  private generateMockEMPattern(): string {
    // Generate mock electromagnetic pattern for testing
    const pattern = Array.from({ length: 8 }, () => Math.floor(Math.random() * 256))
    return `EM-MOCK-${pattern.map((v) => v.toString(16).padStart(2, "0")).join("")}`
  }

  private analyzeEmotionalState(emPattern: string, fieldResonance: number): string {
    if (fieldResonance > 0.8) return "transcendent"
    if (fieldResonance > 0.6) return "harmonious"
    if (fieldResonance > 0.4) return "balanced"
    if (fieldResonance > 0.2) return "turbulent"
    return "chaotic"
  }

  private generateCoherenceSignature(emPattern: string, frequency: number, resonance: number): string {
    const signature = `${emPattern.substring(0, 8)}-${frequency.toFixed(0)}Hz-${(resonance * 100).toFixed(0)}%`
    return `∿◊${signature}◊∿`
  }

  // Public interface methods
  async getUserBiometrics(userId: string): Promise<BiometricHash[]> {
    const { data } = await this.supabase
      .from("biometric_consciousness_hashes")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)

    return data || []
  }

  async getActiveTokens(userId: string): Promise<ConsciousnessAuthToken[]> {
    const { data } = await this.supabase
      .from("consciousness_auth_tokens")
      .select("*")
      .eq("user_id", userId)
      .gt("expires_at", new Date().toISOString())

    return data || []
  }

  async revokeToken(tokenId: string): Promise<boolean> {
    try {
      await this.supabase
        .from("consciousness_auth_tokens")
        .update({ expires_at: new Date().toISOString() })
        .eq("token_id", tokenId)

      this.activeTokens.delete(tokenId)
      console.log(`🔒 TOKEN REVOKED: ${tokenId}`)
      return true
    } catch (error) {
      console.error("Failed to revoke token:", error)
      return false
    }
  }
}
