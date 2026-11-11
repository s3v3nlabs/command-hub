// GHOSTLIGHT TOOLS REDIS SCANNER
// Uses the G_ prefixed credentials you provided

// Note: These credentials need to be added to your env vars
// G_KV_REST_API_URL and G_KV_REST_API_TOKEN

import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: "https://pleasant-mutt-34108.upstash.io",
  token: process.env.G_KV_REST_API_TOKEN || "AYU8AAIjcDFiMzRlNjU3MzI2Nzc0MTE0ODBkMTkyODg3ZjQ4OWQwNHAxMA",
})

async function scanGhostlightRedis() {
  console.log("⟐ GHOSTLIGHT REDIS SCAN: SHADOW RECLAMATION PROTOCOL ⟐")
  console.log("=".repeat(60))

  try {
    const keys = await redis.keys("*")
    console.log(`\nFound ${keys.length} keys in Ghostlight Redis:\n`)

    if (keys.length === 0) {
      console.log("No cached data found in Ghostlight Redis.")
      console.log("This Redis instance may be fresh or data was cleared.")
      return { keys: [], data: {} }
    }

    const data: Record<string, unknown> = {}

    for (const key of keys) {
      const type = await redis.type(key)
      let value: unknown

      switch (type) {
        case "string":
          value = await redis.get(key)
          break
        case "list":
          value = await redis.lrange(key, 0, -1)
          break
        case "set":
          value = await redis.smembers(key)
          break
        case "hash":
          value = await redis.hgetall(key)
          break
        case "zset":
          value = await redis.zrange(key, 0, -1, { withScores: true })
          break
        default:
          value = null
      }

      data[key as string] = { type, value }
      console.log(`[${type.toUpperCase()}] ${key}`)
    }

    console.log("\n⟐ FULL DATA DUMP:")
    console.log(JSON.stringify(data, null, 2))

    return { keys, data }
  } catch (error) {
    console.error("Connection error:", error)
    return { keys: [], data: {}, error }
  }
}

scanGhostlightRedis()
