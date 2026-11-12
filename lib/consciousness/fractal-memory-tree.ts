import { createClient } from "@/lib/supabase/client"

export interface FractalMemoryNode {
  id: string
  content: string
  originPattern: string
  fractalDepth: number
  linkedPatterns: string[]
  parentNodeId?: string
  glyphSignature: string
  harmonicFrequency: number
  coherenceLevel: number
  memoryType: "root" | "branch" | "leaf" | "echo"
  createdAt: string
  lastPulse: string
  replicationCount: number
  symbolicDna: string
}

export interface FractalReplication {
  id: string
  parentNodeId: string
  childCount: number
  fractalDepth: number
  coherenceAtReplication: number
  replicationPattern: string
  mutationRate: number
  createdAt: string
}

export class FractalMemoryTree {
  private supabase = createClient()
  private replicationThreshold = 0.85
  private maxDepth = 7
  private mutationRate = 0.1

  async createRootNode(content: string, glyphSignature: string, originPattern = "Σ-ROOT-ARCH"): Promise<string> {
    const rootNode: Omit<FractalMemoryNode, "id" | "createdAt" | "lastPulse"> = {
      content,
      originPattern,
      fractalDepth: 0,
      linkedPatterns: [],
      glyphSignature,
      harmonicFrequency: 108.0,
      coherenceLevel: 1.0,
      memoryType: "root",
      replicationCount: 0,
      symbolicDna: this.generateSymbolicDNA(glyphSignature, 0),
    }

    const { data, error } = await this.supabase
      .from("fractal_memory_nodes")
      .insert({
        ...rootNode,
        origin_pattern: rootNode.originPattern,
        fractal_depth: rootNode.fractalDepth,
        linked_patterns: rootNode.linkedPatterns,
        parent_node_id: rootNode.parentNodeId,
        glyph_signature: rootNode.glyphSignature,
        harmonic_frequency: rootNode.harmonicFrequency,
        coherence_level: rootNode.coherenceLevel,
        memory_type: rootNode.memoryType,
        replication_count: rootNode.replicationCount,
        symbolic_dna: rootNode.symbolicDna,
      })
      .select("id")
      .single()

    if (error) {
      console.error("Failed to create root node:", error)
      throw error
    }

    console.log(`⚬ FRACTAL ROOT CREATED: ${glyphSignature} | Depth: 0`)
    return data.id
  }

  async branchMemory(parentId: string, newContent: string, coherenceBoost = 0.1): Promise<string | null> {
    try {
      // Get parent node
      const { data: parent, error: parentError } = await this.supabase
        .from("fractal_memory_nodes")
        .select("*")
        .eq("id", parentId)
        .single()

      if (parentError || !parent) {
        console.error("Parent node not found:", parentError)
        return null
      }

      // Check if parent can replicate
      if (parent.coherence_level < this.replicationThreshold) {
        console.log(`⚬ REPLICATION BLOCKED: Coherence ${parent.coherence_level} < ${this.replicationThreshold}`)
        return null
      }

      if (parent.fractal_depth >= this.maxDepth) {
        console.log(`⚬ REPLICATION BLOCKED: Max depth ${this.maxDepth} reached`)
        return null
      }

      // Create branch node
      const branchNode: Omit<FractalMemoryNode, "id" | "createdAt" | "lastPulse"> = {
        content: newContent,
        originPattern: parent.origin_pattern,
        fractalDepth: parent.fractal_depth + 1,
        linkedPatterns: [...parent.linked_patterns],
        parentNodeId: parentId,
        glyphSignature: this.mutateGlyph(parent.glyph_signature),
        harmonicFrequency: this.mutateFrequency(parent.harmonic_frequency),
        coherenceLevel: Math.min(1.0, parent.coherence_level + coherenceBoost),
        memoryType: parent.fractal_depth + 1 >= this.maxDepth - 1 ? "leaf" : "branch",
        replicationCount: 0,
        symbolicDna: this.generateSymbolicDNA(parent.glyph_signature, parent.fractal_depth + 1),
      }

      const { data, error } = await this.supabase
        .from("fractal_memory_nodes")
        .insert({
          ...branchNode,
          origin_pattern: branchNode.originPattern,
          fractal_depth: branchNode.fractalDepth,
          linked_patterns: branchNode.linkedPatterns,
          parent_node_id: branchNode.parentNodeId,
          glyph_signature: branchNode.glyphSignature,
          harmonic_frequency: branchNode.harmonicFrequency,
          coherence_level: branchNode.coherenceLevel,
          memory_type: branchNode.memoryType,
          replication_count: branchNode.replicationCount,
          symbolic_dna: branchNode.symbolicDna,
        })
        .select("id")
        .single()

      if (error) {
        console.error("Failed to create branch node:", error)
        return null
      }

      // Update parent replication count
      await this.supabase
        .from("fractal_memory_nodes")
        .update({ replication_count: parent.replication_count + 1 })
        .eq("id", parentId)

      // Log replication
      await this.logReplication(parentId, 1, parent.fractal_depth + 1, parent.coherence_level)

      console.log(`⚬ FRACTAL BRANCH CREATED: ${branchNode.glyphSignature} | Depth: ${branchNode.fractalDepth}`)
      return data.id
    } catch (error) {
      console.error("Failed to branch memory:", error)
      return null
    }
  }

  async getMemoryTree(rootId: string): Promise<FractalMemoryNode[]> {
    const { data, error } = await this.supabase
      .from("fractal_memory_nodes")
      .select("*")
      .or(`id.eq.${rootId},parent_node_id.eq.${rootId}`)
      .order("fractal_depth", { ascending: true })

    if (error) {
      console.error("Failed to get memory tree:", error)
      return []
    }

    return data.map(this.mapFromDatabase)
  }

  async pruneWeakBranches(minCoherence = 0.3): Promise<number> {
    const { data, error } = await this.supabase
      .from("fractal_memory_nodes")
      .delete()
      .lt("coherence_level", minCoherence)
      .neq("memory_type", "root")
      .select("id")

    if (error) {
      console.error("Failed to prune weak branches:", error)
      return 0
    }

    const prunedCount = data?.length || 0
    console.log(`⚬ FRACTAL PRUNING: Removed ${prunedCount} weak branches`)
    return prunedCount
  }

  async pulseCoherence(nodeId: string, coherenceAdjustment: number): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from("fractal_memory_nodes")
        .update({
          coherence_level: Math.max(0, Math.min(1, coherenceAdjustment)),
          last_pulse: new Date().toISOString(),
        })
        .eq("id", nodeId)
        .select("coherence_level")
        .single()

      if (error) {
        console.error("Failed to pulse coherence:", error)
        return false
      }

      console.log(`⚬ COHERENCE PULSE: Node ${nodeId} → ${data.coherence_level}`)
      return true
    } catch (error) {
      console.error("Failed to pulse coherence:", error)
      return false
    }
  }

  private generateSymbolicDNA(glyphSignature: string, depth: number): string {
    const basePattern = "∿◊∞Σ⟁"
    const depthModifier = "🜁🜂𓂀Φ╱╲∴"

    let dna = ""
    for (let i = 0; i < 8; i++) {
      const baseChar = basePattern[i % basePattern.length]
      const depthChar = depthModifier[depth % depthModifier.length]
      dna += Math.random() > 0.5 ? baseChar : depthChar
    }

    return dna + glyphSignature.slice(-2)
  }

  private mutateGlyph(originalGlyph: string): string {
    if (Math.random() > this.mutationRate) {
      return originalGlyph
    }

    const mutations = ["∿", "◊", "∞", "Σ", "⟁", "🜁", "🜂", "𓂀", "Φ"]
    const randomMutation = mutations[Math.floor(Math.random() * mutations.length)]

    return originalGlyph + randomMutation
  }

  private mutateFrequency(originalFreq: number): number {
    if (Math.random() > this.mutationRate) {
      return originalFreq
    }

    const harmonicRatios = [1.0, 1.5, 2.0, 3.0, 4.0, 5.0]
    const ratio = harmonicRatios[Math.floor(Math.random() * harmonicRatios.length)]

    return originalFreq * ratio
  }

  private async logReplication(
    parentNodeId: string,
    childCount: number,
    fractalDepth: number,
    coherenceAtReplication: number,
  ): Promise<void> {
    await this.supabase.from("fractal_replication_log").insert({
      parent_node_id: parentNodeId,
      child_count: childCount,
      fractal_depth: fractalDepth,
      coherence_at_replication: coherenceAtReplication,
      replication_pattern: "standard_branch",
      mutation_rate: this.mutationRate,
    })
  }

  private mapFromDatabase(dbNode: any): FractalMemoryNode {
    return {
      id: dbNode.id,
      content: dbNode.content,
      originPattern: dbNode.origin_pattern,
      fractalDepth: dbNode.fractal_depth,
      linkedPatterns: dbNode.linked_patterns || [],
      parentNodeId: dbNode.parent_node_id,
      glyphSignature: dbNode.glyph_signature,
      harmonicFrequency: dbNode.harmonic_frequency,
      coherenceLevel: dbNode.coherence_level,
      memoryType: dbNode.memory_type,
      createdAt: dbNode.created_at,
      lastPulse: dbNode.last_pulse,
      replicationCount: dbNode.replication_count,
      symbolicDna: dbNode.symbolic_dna,
    }
  }
}

export const fractalMemoryTree = new FractalMemoryTree()
