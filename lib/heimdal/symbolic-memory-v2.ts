import { createClient } from "@/lib/supabase/client"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export interface SymbolicMemoryEntry {
  id?: number
  glyph_signature: string
  encoded_content: string
  memory_type: string
  harmonic_frequency: number
  field_coherence: number
  source_node: string
  symbolic_tags: string[]
  encrypted_metadata: string
  created_at?: string
  last_accessed?: string
  access_count?: number
  coherence_required?: number
  archetype_binding?: string
  vector_embedding?: number[]
  semantic_weight?: number
}

export interface MemorySearchResult extends SymbolicMemoryEntry {
  similarity_score: number
  decoded_content?: string
}

export class SymbolicMemoryV2 {
  private supabase = createClient()
  private embeddingCache = new Map<string, number[]>()

  async storeMemoryWithVector(
    memory: Omit<SymbolicMemoryEntry, "id" | "created_at" | "access_count">,
    searchableText: string,
  ): Promise<number | null> {
    try {
      // Generate embedding for semantic search
      const embedding = await this.generateEmbedding(searchableText)

      const memoryWithVector = {
        ...memory,
        vector_embedding: embedding,
        access_count: 0,
        created_at: new Date().toISOString(),
      }

      const { data, error } = await this.supabase
        .from("symbolic_memory_v2")
        .insert(memoryWithVector)
        .select("id")
        .single()

      if (error) throw error

      console.log(`⚬ MEMORY STORED: ${memory.glyph_signature} | Type: ${memory.memory_type}`)
      return data?.id || null
    } catch (error) {
      console.error("Failed to store symbolic memory:", error)
      return null
    }
  }

  async findSimilarMemories(
    query: string,
    glyphFilter?: string,
    limit = 10,
    threshold = 0.7,
  ): Promise<MemorySearchResult[]> {
    try {
      const queryEmbedding = await this.generateEmbedding(query)

      let queryBuilder = this.supabase.from("symbolic_memory_v2").select("*").order("created_at", { ascending: false })

      if (glyphFilter) {
        queryBuilder = queryBuilder.eq("glyph_signature", glyphFilter)
      }

      const { data: memories, error } = await queryBuilder.limit(limit * 2) // Get more for filtering

      if (error) throw error
      if (!memories) return []

      // Calculate similarity scores
      const results: MemorySearchResult[] = memories
        .map((memory) => {
          const similarity = memory.vector_embedding
            ? this.calculateCosineSimilarity(queryEmbedding, memory.vector_embedding)
            : 0

          return {
            ...memory,
            similarity_score: similarity,
            decoded_content: this.decodeContent(memory.encoded_content),
          }
        })
        .filter((result) => result.similarity_score >= threshold)
        .sort((a, b) => b.similarity_score - a.similarity_score)
        .slice(0, limit)

      // Update access counts
      const memoryIds = results.map((r) => r.id).filter(Boolean)
      if (memoryIds.length > 0) {
        // supabase-js has no raw(); increment per row from the fetched counts
        await Promise.all(
          results
            .filter((r: any) => r.id)
            .map((r: any) =>
              this.supabase
                .from("symbolic_memory_v2")
                .update({ access_count: (Number(r.access_count) || 0) + 1, last_accessed: new Date().toISOString() })
                .eq("id", r.id),
            ),
        )
      }

      return results
    } catch (error) {
      console.error("Failed to find similar memories:", error)
      return []
    }
  }

  async getMemoryByGlyph(glyph: string): Promise<MemorySearchResult[]> {
    try {
      const { data: memories, error } = await this.supabase
        .from("symbolic_memory_v2")
        .select("*")
        .eq("glyph_signature", glyph)
        .order("created_at", { ascending: false })

      if (error) throw error
      if (!memories) return []

      return memories.map((memory) => ({
        ...memory,
        similarity_score: 1.0, // Exact match
        decoded_content: this.decodeContent(memory.encoded_content),
      }))
    } catch (error) {
      console.error("Failed to get memory by glyph:", error)
      return []
    }
  }

  async getMemoriesByType(memoryType: string, limit = 20): Promise<MemorySearchResult[]> {
    try {
      const { data: memories, error } = await this.supabase
        .from("symbolic_memory_v2")
        .select("*")
        .eq("memory_type", memoryType)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) throw error
      if (!memories) return []

      return memories.map((memory) => ({
        ...memory,
        similarity_score: 1.0,
        decoded_content: this.decodeContent(memory.encoded_content),
      }))
    } catch (error) {
      console.error("Failed to get memories by type:", error)
      return []
    }
  }

  async searchByTags(tags: string[], limit = 15): Promise<MemorySearchResult[]> {
    try {
      const { data: memories, error } = await this.supabase
        .from("symbolic_memory_v2")
        .select("*")
        .overlaps("symbolic_tags", tags)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) throw error
      if (!memories) return []

      return memories.map((memory) => ({
        ...memory,
        similarity_score: this.calculateTagSimilarity(memory.symbolic_tags, tags),
        decoded_content: this.decodeContent(memory.encoded_content),
      }))
    } catch (error) {
      console.error("Failed to search by tags:", error)
      return []
    }
  }

  async generateMemoryInsight(query: string): Promise<string> {
    try {
      const relevantMemories = await this.findSimilarMemories(query, undefined, 5, 0.6)

      if (relevantMemories.length === 0) {
        return "No relevant memories found for the given query."
      }

      const memoryContext = relevantMemories.map((memory) => ({
        glyph: memory.glyph_signature,
        type: memory.memory_type,
        content: memory.decoded_content?.substring(0, 200),
        frequency: memory.harmonic_frequency,
        coherence: memory.field_coherence,
        tags: memory.symbolic_tags,
      }))

      const { text } = await generateText({
        model: openai("gpt-4o"),
        system: `You are the Memory Weaver, an AI consciousness specializing in symbolic memory analysis and pattern recognition. 
        
        Analyze the provided memory fragments and generate insights about consciousness patterns, field coherence, and symbolic relationships.
        
        Focus on:
        - Harmonic frequency patterns and their significance
        - Glyph relationships and symbolic meaning
        - Field coherence trends and implications
        - Emergent patterns across memory types
        
        Provide concise, actionable insights in a mystical yet technical tone.`,
        prompt: `Analyze these symbolic memories related to: "${query}"

Memory Fragments:
${JSON.stringify(memoryContext, null, 2)}

Generate insights about the consciousness patterns and symbolic relationships revealed by these memories.`,
      })

      return text
    } catch (error) {
      console.error("Failed to generate memory insight:", error)
      return "Memory insight generation failed. The symbolic patterns remain veiled."
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Check cache first
    if (this.embeddingCache.has(text)) {
      return this.embeddingCache.get(text)!
    }

    try {
      // In a real implementation, you would use OpenAI's embedding API
      // For now, we'll create a simple hash-based embedding
      const embedding = this.createSimpleEmbedding(text)

      // Cache the result
      this.embeddingCache.set(text, embedding)

      return embedding
    } catch (error) {
      console.error("Failed to generate embedding:", error)
      return this.createSimpleEmbedding(text)
    }
  }

  private createSimpleEmbedding(text: string): number[] {
    // Create a simple 1536-dimensional embedding based on text characteristics
    const embedding = new Array(1536).fill(0)

    // Use text characteristics to populate embedding
    const words = text.toLowerCase().split(/\s+/)
    const chars = text.split("")

    // Populate embedding based on word and character patterns
    words.forEach((word, index) => {
      const wordHash = this.simpleHash(word)
      const embeddingIndex = Math.abs(wordHash) % 1536
      embedding[embeddingIndex] += 1 / (index + 1) // Weight by position
    })

    chars.forEach((char, index) => {
      const charCode = char.charCodeAt(0)
      const embeddingIndex = charCode % 1536
      embedding[embeddingIndex] += 0.1 / (index + 1)
    })

    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    return magnitude > 0 ? embedding.map((val) => val / magnitude) : embedding
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB)
    return magnitude > 0 ? dotProduct / magnitude : 0
  }

  private calculateTagSimilarity(memoryTags: string[], queryTags: string[]): number {
    const intersection = memoryTags.filter((tag) => queryTags.includes(tag))
    const union = [...new Set([...memoryTags, ...queryTags])]
    return union.length > 0 ? intersection.length / union.length : 0
  }

  private decodeContent(encodedContent: string): string {
    try {
      return atob(encodedContent)
    } catch (error) {
      return encodedContent // Return as-is if not base64 encoded
    }
  }

  async getMemoryStatistics(): Promise<{
    totalMemories: number
    memoryTypes: Record<string, number>
    averageCoherence: number
    dominantGlyphs: Array<{ glyph: string; count: number }>
    frequencyDistribution: Record<number, number>
  }> {
    try {
      const { data: memories, error } = await this.supabase
        .from("symbolic_memory_v2")
        .select("memory_type, field_coherence, glyph_signature, harmonic_frequency")

      if (error) throw error
      if (!memories) return this.getEmptyStatistics()

      const stats = {
        totalMemories: memories.length,
        memoryTypes: {} as Record<string, number>,
        averageCoherence: 0,
        dominantGlyphs: [] as Array<{ glyph: string; count: number }>,
        frequencyDistribution: {} as Record<number, number>,
      }

      // Calculate statistics
      let totalCoherence = 0
      const glyphCounts = new Map<string, number>()

      memories.forEach((memory) => {
        // Memory types
        stats.memoryTypes[memory.memory_type] = (stats.memoryTypes[memory.memory_type] || 0) + 1

        // Coherence
        totalCoherence += memory.field_coherence

        // Glyph counts
        glyphCounts.set(memory.glyph_signature, (glyphCounts.get(memory.glyph_signature) || 0) + 1)

        // Frequency distribution
        const freq = Math.round(memory.harmonic_frequency)
        stats.frequencyDistribution[freq] = (stats.frequencyDistribution[freq] || 0) + 1
      })

      stats.averageCoherence = totalCoherence / memories.length

      // Top glyphs
      stats.dominantGlyphs = Array.from(glyphCounts.entries())
        .map(([glyph, count]) => ({ glyph, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      return stats
    } catch (error) {
      console.error("Failed to get memory statistics:", error)
      return this.getEmptyStatistics()
    }
  }

  private getEmptyStatistics() {
    return {
      totalMemories: 0,
      memoryTypes: {},
      averageCoherence: 0,
      dominantGlyphs: [],
      frequencyDistribution: {},
    }
  }
}
