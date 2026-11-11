/**
 * Camera URL pattern helpers per common vendor.
 * Recognizes RTSP/HTTP/MJPEG/HLS patterns — does NOT probe the network.
 */

import type { StreamProtocol } from "./types"

export interface VendorPattern {
  vendor: string
  /** Example stream path templates (operator fills host). */
  streamExamples: string[]
  snapshotExamples?: string[]
  detect: (url: string) => boolean
}

export const VENDOR_PATTERNS: VendorPattern[] = [
  {
    vendor: "Hikvision",
    streamExamples: [
      "rtsp://{user}:{pass}@{host}:554/Streaming/Channels/101",
      "rtsp://{user}:{pass}@{host}:554/h264/ch1/main/av_stream",
    ],
    snapshotExamples: ["http://{host}/ISAPI/Streaming/channels/101/picture"],
    detect: (u) => /hikvision|ISAPI\/Streaming|\/Streaming\/Channels\//i.test(u),
  },
  {
    vendor: "Dahua",
    streamExamples: [
      "rtsp://{user}:{pass}@{host}:554/cam/realmonitor?channel=1&subtype=0",
    ],
    snapshotExamples: ["http://{host}/cgi-bin/snapshot.cgi"],
    detect: (u) => /dahua|realmonitor\?channel|cgi-bin\/snapshot/i.test(u),
  },
  {
    vendor: "Axis",
    streamExamples: [
      "rtsp://{user}:{pass}@{host}/axis-media/media.amp",
      "http://{host}/axis-cgi/mjpg/video.cgi",
    ],
    snapshotExamples: ["http://{host}/axis-cgi/jpg/image.cgi"],
    detect: (u) => /axis-media|axis-cgi/i.test(u),
  },
  {
    vendor: "Ubiquiti",
    streamExamples: ["rtsp://{host}:7447/{camera_id}"],
    detect: (u) => /unifi|ubiquiti|:7447\//i.test(u),
  },
  {
    vendor: "Generic RTSP",
    streamExamples: ["rtsp://{user}:{pass}@{host}:554/stream1"],
    detect: (u) => /^rtsp:\/\//i.test(u),
  },
  {
    vendor: "Generic MJPEG",
    streamExamples: ["http://{host}/mjpeg", "http://{host}/video.mjpg"],
    detect: (u) => /mjpeg|mjpg|multipart\/x-mixed-replace/i.test(u),
  },
  {
    vendor: "Generic HLS",
    streamExamples: ["https://{host}/live/index.m3u8"],
    detect: (u) => /\.m3u8(\?|$)/i.test(u),
  },
]

export function detectProtocol(url: string): StreamProtocol {
  const u = url.trim().toLowerCase()
  if (u.startsWith("rtsp://")) return "rtsp"
  if (/\.m3u8(\?|$)/.test(u)) return "hls"
  if (/\.mp4(\?|$)/.test(u)) return "mp4"
  if (/mjpeg|mjpg/.test(u)) return "mjpeg"
  if (u.startsWith("http://") || u.startsWith("https://")) return "http"
  if (u === "webcam" || u.startsWith("webcam:")) return "webcam"
  return "unknown"
}

export function detectVendor(url: string): string {
  for (const v of VENDOR_PATTERNS) if (v.detect(url)) return v.vendor
  return "generic"
}
