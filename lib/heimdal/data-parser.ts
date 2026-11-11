interface ParsedEntity {
  id: string
  name: string
  type: "person" | "organization" | "location" | "patent" | "technology" | "unknown"
  latitude?: number
  longitude?: number
  confidence: number
  metadata: Record<string, any>
  source: string
}

interface ParsedData {
  entities: ParsedEntity[]
  relationships: Array<{
    from: string
    to: string
    type: string
    confidence: number
  }>
  metadata: {
    filename: string
    parseDate: string
    entityCount: number
  }
}

class HeimdallDataParser {
  private entityPatterns = {
    organization: [
      /\b([A-Z][a-z]+ (?:Labs?|Laboratory|Laboratories|Corporation|Corp|Inc|LLC|Ltd|Company|Co|Institute|University|National|International))\b/g,
      /\b(CBMM|Sandia|Los Alamos|DARPA|NASA|DOE|DOD)\b/g,
    ],
    person: [/\b([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\b/g],
    location: [
      /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s*[A-Z]{2})\b/g,
      /\b(Albuquerque|Los Alamos|Santa Fe|New Mexico|Brazil|China|Russia)\b/g,
    ],
    patent: [/\b(?:Patent|US Patent|Patent No\.?)\s*#?(\d{7,8})\b/gi, /\b(US\d{7,8})\b/g],
    technology: [
      /\b(laser|niobium|superconductor|quantum|AI|artificial intelligence|machine learning|neural network)\b/gi,
    ],
  }

  private locationCoordinates: Record<string, [number, number]> = {
    "Sandia National Laboratories": [35.0844, -106.5348],
    "Los Alamos National Laboratory": [35.8869, -106.2978],
    "Albuquerque, NM": [35.0844, -106.6504],
    "Santa Fe, NM": [35.687, -105.9378],
    CBMM: [-19.5936, -46.9408],
    Brazil: [-14.235, -51.9253],
    China: [35.8617, 104.1954],
    Russia: [61.524, 105.3188],
  }

  async parseFile(file: File): Promise<ParsedData> {
    const content = await this.readFileContent(file)
    const entities = this.extractEntities(content, file.name)
    const relationships = this.findRelationships(entities, content)

    return {
      entities,
      relationships,
      metadata: {
        filename: file.name,
        parseDate: new Date().toISOString(),
        entityCount: entities.length,
      },
    }
  }

  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  private extractEntities(content: string, source: string): ParsedEntity[] {
    const entities: ParsedEntity[] = []
    const seen = new Set<string>()

    Object.entries(this.entityPatterns).forEach(([type, patterns]) => {
      patterns.forEach((pattern) => {
        const matches = content.matchAll(pattern)
        for (const match of matches) {
          const name = match[1] || match[0]
          const normalizedName = name.trim()

          if (!seen.has(normalizedName) && normalizedName.length > 2) {
            seen.add(normalizedName)

            const coordinates = this.locationCoordinates[normalizedName]
            const entity: ParsedEntity = {
              id: `${type}_${entities.length}`,
              name: normalizedName,
              type: type as ParsedEntity["type"],
              latitude: coordinates?.[0],
              longitude: coordinates?.[1],
              confidence: this.calculateConfidence(normalizedName, type, content),
              metadata: {
                context: this.extractContext(content, normalizedName),
                matchPattern: pattern.source,
              },
              source,
            }

            entities.push(entity)
          }
        }
      })
    })

    return entities.sort((a, b) => b.confidence - a.confidence)
  }

  private calculateConfidence(name: string, type: string, content: string): number {
    let confidence = 0.5 // Base confidence

    // Increase confidence based on frequency
    const occurrences = (content.match(new RegExp(name, "gi")) || []).length
    confidence += Math.min(occurrences * 0.1, 0.3)

    // Increase confidence for known entities
    if (this.locationCoordinates[name]) {
      confidence += 0.2
    }

    // Type-specific confidence adjustments
    switch (type) {
      case "organization":
        if (name.includes("Labs") || name.includes("Laboratory")) confidence += 0.1
        break
      case "patent":
        if (/^\d{7,8}$/.test(name)) confidence += 0.2
        break
      case "location":
        if (name.includes(",")) confidence += 0.1
        break
    }

    return Math.min(confidence, 1.0)
  }

  private extractContext(content: string, entityName: string): string {
    const index = content.toLowerCase().indexOf(entityName.toLowerCase())
    if (index === -1) return ""

    const start = Math.max(0, index - 50)
    const end = Math.min(content.length, index + entityName.length + 50)

    return content.substring(start, end).trim()
  }

  private findRelationships(
    entities: ParsedEntity[],
    content: string,
  ): Array<{
    from: string
    to: string
    type: string
    confidence: number
  }> {
    const relationships: Array<{
      from: string
      to: string
      type: string
      confidence: number
    }> = []

    // Find entities that appear near each other
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entity1 = entities[i]
        const entity2 = entities[j]

        const proximity = this.calculateProximity(entity1.name, entity2.name, content)
        if (proximity > 0.3) {
          relationships.push({
            from: entity1.id,
            to: entity2.id,
            type: "proximity",
            confidence: proximity,
          })
        }
      }
    }

    return relationships
  }

  private calculateProximity(name1: string, name2: string, content: string): number {
    const index1 = content.toLowerCase().indexOf(name1.toLowerCase())
    const index2 = content.toLowerCase().indexOf(name2.toLowerCase())

    if (index1 === -1 || index2 === -1) return 0

    const distance = Math.abs(index1 - index2)
    const maxDistance = 200 // characters

    return Math.max(0, 1 - distance / maxDistance)
  }

  toKeplerDataset(parsedData: ParsedData, datasetId: string) {
    return {
      info: {
        id: datasetId,
        label: parsedData.metadata.filename,
        color: [255, 165, 0] as [number, number, number],
      },
      data: {
        fields: [
          { name: "name", type: "string" },
          { name: "type", type: "string" },
          { name: "latitude", type: "real" },
          { name: "longitude", type: "real" },
          { name: "confidence", type: "real" },
          { name: "metadata", type: "string" },
          { name: "source", type: "string" },
        ],
        rows: parsedData.entities.map((entity) => [
          entity.name,
          entity.type,
          entity.latitude || null,
          entity.longitude || null,
          entity.confidence,
          JSON.stringify(entity.metadata),
          entity.source,
        ]),
      },
    }
  }
}

export const heimdallParser = new HeimdallDataParser()
export default heimdallParser
