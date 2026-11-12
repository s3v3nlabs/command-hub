/* Device Bridge service worker.
 * Caches the companion shell so an installed PWA can open offline and say so.
 * Live media, signaling, and APIs are network-only — a call cannot run offline.
 */
const CACHE = "companion-shell-v1"
const SHELL = [
  "/companion",
  "/companion/bridge",
  "/companion/hub-view",
  "/companion/manifest.webmanifest",
  "/companion/icon-192.png",
  "/companion/icon-512.png",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const req = event.request
  if (req.method !== "GET") return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith("/api/")) return // always network
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && res.type === "basic") {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {})
        }
        return res
      })
      .catch(async () => {
        const hit = await caches.match(req)
        if (hit) return hit
        if (url.pathname.startsWith("/companion")) {
          const shell = await caches.match("/companion")
          if (shell) return shell
        }
        return new Response("Device Bridge is offline. Live camera, mic, and signaling need a network.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
      }),
  )
})
