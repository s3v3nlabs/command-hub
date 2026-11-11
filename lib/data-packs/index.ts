/**
 * Typed entry for the geo data-pack core (lib/data-packs/packs.mjs).
 * PACK_META is safe on the client; fetchPack is server-only (used by API routes).
 */
// @ts-ignore — plain ESM module
import * as packsModule from "./packs.mjs"
const core: any = packsModule

export type PackMeta = {
  id: string
  name: string
  description: string
  kind: "points" | "polygons" | "mixed"
  source: string
  sourceUrl: string
  license: string
  live: boolean
  file?: string
  updated?: string
  features?: number
  bytes?: number
}

export type GeoFeature = {
  type: "Feature"
  properties: Record<string, any>
  geometry: { type: string; coordinates: any } | null
}
export type FeatureCollection = { type: "FeatureCollection"; features: GeoFeature[] }

export const PACKS: PackMeta[] = core.PACKS
export const getPack = (id: string): PackMeta | null => core.getPack(id)
export const fetchPack = (id: string, opts?: { countries?: FeatureCollection }): Promise<FeatureCollection> =>
  core.fetchPack(id, opts)
