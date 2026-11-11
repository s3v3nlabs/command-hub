/**
 * CCTV video-wall tile metadata model.
 *
 * Populated from Shodan/Censys/dork recon when a cam is sent to a tile, and
 * editable/augmentable by the operator. File-backed per engagement under
 * data/cctv/ (gitignored). Connecting to third-party targets is staged-unlock
 * gated (CCTV_CONNECT_ENABLED=1 + hub auth + per-tile authorization ack).
 * Metadata display itself is fine while locked.
 */

export type StreamProtocol = "rtsp" | "http" | "mjpeg" | "hls" | "mp4" | "webcam" | "unknown"

export type AuthState = "open" | "auth-required" | "unknown"

export type AuthorizationStatus = "unconfirmed" | "confirmed" | "denied" | "in-scope"

export interface CctvNetworkMeta {
  ip?: string
  host?: string
  hostname?: string
  asn?: string
  org?: string
  reverseDns?: string
  openPorts?: number[]
  protocol: StreamProtocol
  streamUrl?: string
  snapshotUrl?: string
}

export interface CctvGeoMeta {
  country?: string
  city?: string
  lat?: number
  lon?: number
  /** Optional map pin label. */
  pinLabel?: string
}

export interface CctvDeviceMeta {
  vendor?: string
  model?: string
  firmware?: string
  banner?: string
}

export interface CctvExposureMeta {
  shodanTags?: string[]
  censysTags?: string[]
  banner?: string
  cves?: string[]
  defaultCredNotes?: string[]
  authState: AuthState
  lastSeen?: string
  /** 0..1 modeled confidence of the enrichment — not a guarantee. */
  confidence?: number
  source?: "shodan" | "censys" | "dork" | "manual" | "mixed"
}

export interface CctvEngagementMeta {
  engagementId?: string
  addedBy?: string
  addedAt: string
  authorizationStatus: AuthorizationStatus
  authorizationNote?: string
}

export interface CctvTileMeta {
  network: CctvNetworkMeta
  geo: CctvGeoMeta
  device: CctvDeviceMeta
  exposure: CctvExposureMeta
  engagement: CctvEngagementMeta
  /** Free-form operator notes. */
  notes?: string
}

export interface CctvTile {
  id: string
  title: string
  /** Layout grid position. */
  col: number
  row: number
  colSpan?: number
  rowSpan?: number
  meta: CctvTileMeta
  /** Local webcam deviceId when protocol=webcam. */
  webcamDeviceId?: string
  /** Whether the operator has expanded the detail panel. */
  detailOpen?: boolean
}

export interface CctvLayout {
  id: string
  name: string
  engagementId?: string
  cols: number
  rows: number
  tiles: CctvTile[]
  createdAt: string
  updatedAt: string
  /** First-use legal acknowledgement timestamp. */
  legalAckAt?: string
  lattice_sync: false
}

export function emptyTileMeta(partial?: Partial<CctvTileMeta>): CctvTileMeta {
  const now = new Date().toISOString()
  return {
    network: {
      protocol: "unknown",
      ...(partial?.network || {}),
    },
    geo: { ...(partial?.geo || {}) },
    device: { ...(partial?.device || {}) },
    exposure: {
      authState: "unknown",
      confidence: 0,
      source: "manual",
      ...(partial?.exposure || {}),
    },
    engagement: {
      addedAt: now,
      authorizationStatus: "unconfirmed",
      ...(partial?.engagement || {}),
    },
    notes: partial?.notes,
  }
}
