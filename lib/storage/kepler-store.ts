import { openDB, type DBSchema, type IDBPDatabase } from "idb"

interface KeplerDB extends DBSchema {
  datasets: {
    key: string
    value: {
      id: string
      name: string
      data: any
      metadata: {
        source: string
        entityCount: number
        tags: string[]
        createdAt: string
        updatedAt: string
      }
    }
  }
  entities: {
    key: string
    value: {
      id: string
      name: string
      type: string
      datasetId: string
      coordinates?: [number, number]
      confidence: number
      metadata: Record<string, any>
    }
  }
}

class KeplerStore {
  private db: IDBPDatabase<KeplerDB> | null = null
  private readonly DB_NAME = "CommandHubKeplerDB"
  private readonly DB_VERSION = 1

  async init(): Promise<void> {
    if (this.db) return

    this.db = await openDB<KeplerDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Create datasets store
        if (!db.objectStoreNames.contains("datasets")) {
          const datasetStore = db.createObjectStore("datasets", { keyPath: "id" })
          datasetStore.createIndex("name", "name")
          datasetStore.createIndex("createdAt", "metadata.createdAt")
        }

        // Create entities store
        if (!db.objectStoreNames.contains("entities")) {
          const entityStore = db.createObjectStore("entities", { keyPath: "id" })
          entityStore.createIndex("datasetId", "datasetId")
          entityStore.createIndex("type", "type")
          entityStore.createIndex("name", "name")
        }
      },
    })
  }

  async storeDataset(dataset: {
    id: string
    name: string
    data: any
    metadata: {
      source: string
      entityCount: number
      tags: string[]
    }
  }): Promise<void> {
    await this.init()

    const now = new Date().toISOString()
    const datasetWithTimestamps = {
      ...dataset,
      metadata: {
        ...dataset.metadata,
        createdAt: now,
        updatedAt: now,
      },
    }

    await this.db!.put("datasets", datasetWithTimestamps)

    // Store individual entities for easier querying
    if (dataset.data.data && dataset.data.data.rows) {
      const entities = dataset.data.data.rows.map((row: any[], index: number) => ({
        id: `${dataset.id}_entity_${index}`,
        name: row[0],
        type: row[1],
        datasetId: dataset.id,
        coordinates: row[2] && row[3] ? [row[2], row[3]] : undefined,
        confidence: row[4] || 0,
        metadata: row[5] ? JSON.parse(row[5]) : {},
      }))

      const tx = this.db!.transaction("entities", "readwrite")
      for (const entity of entities) {
        await tx.store.put(entity)
      }
      await tx.done
    }
  }

  async getDataset(id: string): Promise<any> {
    await this.init()
    return await this.db!.get("datasets", id)
  }

  async getAllDatasets(): Promise<any[]> {
    await this.init()
    return await this.db!.getAll("datasets")
  }

  async getEntitiesByDataset(datasetId: string): Promise<any[]> {
    await this.init()
    return await this.db!.getAllFromIndex("entities", "datasetId", datasetId)
  }

  async getAllEntities(): Promise<any[]> {
    await this.init()
    return await this.db!.getAll("entities")
  }

  async searchEntities(query: string): Promise<any[]> {
    await this.init()
    const allEntities = await this.getAllEntities()

    return allEntities.filter(
      (entity) =>
        entity.name.toLowerCase().includes(query.toLowerCase()) ||
        entity.type.toLowerCase().includes(query.toLowerCase()),
    )
  }

  async getEntitiesByType(type: string): Promise<any[]> {
    await this.init()
    return await this.db!.getAllFromIndex("entities", "type", type)
  }

  async deleteDataset(id: string): Promise<void> {
    await this.init()

    // Delete the dataset
    await this.db!.delete("datasets", id)

    // Delete associated entities
    const entities = await this.getEntitiesByDataset(id)
    const tx = this.db!.transaction("entities", "readwrite")
    for (const entity of entities) {
      await tx.store.delete(entity.id)
    }
    await tx.done
  }

  async getStats(): Promise<{
    totalDatasets: number
    totalEntities: number
    entitiesByType: Record<string, number>
    recentDatasets: any[]
  }> {
    await this.init()

    const datasets = await this.getAllDatasets()
    const entities = await this.getAllEntities()

    const entitiesByType = entities.reduce(
      (acc, entity) => {
        acc[entity.type] = (acc[entity.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const recentDatasets = datasets
      .sort((a, b) => new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime())
      .slice(0, 5)

    return {
      totalDatasets: datasets.length,
      totalEntities: entities.length,
      entitiesByType,
      recentDatasets,
    }
  }

  async clear(): Promise<void> {
    await this.init()

    const tx = this.db!.transaction(["datasets", "entities"], "readwrite")
    await tx.objectStore("datasets").clear()
    await tx.objectStore("entities").clear()
    await tx.done
  }
}

export const keplerStore = new KeplerStore()
export default keplerStore
