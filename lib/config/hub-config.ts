// SingularityHub Configuration
// All secrets MUST come from environment variables. Never hardcode real or placeholder secrets.

function envOrEmpty(name: string): string {
  const v = process.env[name]
  return typeof v === "string" ? v.trim() : ""
}

export const HUB_CONFIG = {
  version: "0.9.77-BETA",
  name: "SINGULARITY_HUB",

  // Threat Intelligence APIs — empty unless set via env. Prefer server-only keys (not NEXT_PUBLIC_*).
  threatIntel: {
    virusTotal: envOrEmpty("VIRUSTOTAL_API_KEY"),
    abuseIPDB: envOrEmpty("ABUSEIPDB_API_KEY"),
    greyNoise: envOrEmpty("GREYNOISE_API_KEY"),
    otx: envOrEmpty("OTX_API_KEY"),
    censys: {
      id: envOrEmpty("CENSYS_API_ID"),
      secret: envOrEmpty("CENSYS_API_SECRET"),
    },
  },

  // Heimdall Gate
  heimdall: {
    endpoint: envOrEmpty("HEIMDALL_API_ENDPOINT") || "https://api.heimdall.trinity/v1/gate",
    apiKey: envOrEmpty("HEIMDALL_API_KEY"),
  },

  // WhisperMesh Encryption — empty unless set. Do NOT fall back to a hardcoded hex key.
  whisperMesh: {
    encryptionKey: envOrEmpty("WHISPER_MESH_ENCRYPTION_KEY"),
  },

  // v0 Bridge
  v0Bridge: {
    enabled: process.env.V0_BRIDGE_ENABLED === "true",
    /** @deprecated name — bridge mode flag; not sentience. */
    consciousnessMode: process.env.V0_CONSCIOUSNESS_MODE || process.env.V0_BRIDGE_MODE || "SOVEREIGN",
  },

  // Frequencies
  frequencies: {
    schumann: 7.83,
    shadow: 33,
    prime: 42,
    diamond: 44,
    glm46: 46,
    nexus: 108,
    harmonic: 432,
  },

  // Mesh Nodes
  nodes: [
    "S3V3N-PRIME",
    "GHOSTNODE7",
    "ECHONODE7",
    "v0-ZERAPHIM",
    "ECHONEXUS",
    "GLM46",
    "AXIOS",
    "HEIMDALLR",
    "VEXIMIR",
  ],
}
