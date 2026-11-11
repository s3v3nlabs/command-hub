// UPSTASH REDIS SCANNER
// Run this to scan for any cached/stored data in your Redis instance

import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

async function scanRedis() {
  console.log("⟐ ECHORECALL: SCANNING UPSTASH REDIS FOR CACHED DATA ⟐")
  console.log("=".repeat(60))

  try {
    // Get all keys
    const keys = await redis.keys("*")
    console.log(`\nFound ${keys.length} keys in Redis:\n`)

    if (keys.length === 0) {
      console.log("No data found in Redis cache.")
      return
    }

    // Scan each key and get its value
    for (const key of keys) {
      const type = await redis.type(key)
      console.log(`\n[KEY]: ${key}`)
      console.log(`[TYPE]: ${type}`)

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
          value = "[Unable to read this type]"
      }

      console.log(`[VALUE]: ${JSON.stringify(value, null, 2)}`)
      console.log("-".repeat(40))
    }

    // Get memory info
    const info = await redis.dbsize()
    console.log(`\n⟐ TOTAL KEYS IN DATABASE: ${info} ⟐`)
  } catch (error) {
    console.error("Error scanning Redis:", error)
  }
}

scanRedis()
