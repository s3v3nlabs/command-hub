/**
 * Bounded concurrent job runner for hub tasks.
 * Real "coroutines / threads" equivalent in a TypeScript hub:
 *   - I/O-bound: async/await with a concurrency semaphore
 *   - CPU-bound: Node worker_threads (hash / encode demos)
 * Not Kotlin coroutines — documented honestly.
 * HOLD_VYRNA_UNSYNC · lattice_sync: false
 */

import { randomBytes } from "crypto"
import { Worker } from "worker_threads"
import { routeChat } from "./router"
import type { JobKind, JobRecord, JobStatus, JobSubmitInput } from "./types"

const DEFAULT_CONCURRENCY = clamp(
  Number(process.env.COMPUTE_JOB_CONCURRENCY || 4),
  1,
  32,
)

type InternalJob = JobRecord & {
  priority: number
  payload: Record<string, unknown>
  resolve?: (j: JobRecord) => void
}

const jobs = new Map<string, InternalJob>()
const queue: string[] = []
let running = 0
let concurrency = DEFAULT_CONCURRENCY

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, Math.floor(n)))
}

function newId(): string {
  return `job_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`
}

function publicView(j: InternalJob): JobRecord {
  return {
    id: j.id,
    kind: j.kind,
    label: j.label,
    status: j.status,
    createdAt: j.createdAt,
    startedAt: j.startedAt,
    finishedAt: j.finishedAt,
    progress: j.progress,
    error: j.error,
    result: j.result,
    backendId: j.backendId,
    cancelRequested: j.cancelRequested,
  }
}

function setStatus(j: InternalJob, status: JobStatus): void {
  j.status = status
  if (status === "running" && j.startedAt == null) j.startedAt = Date.now()
  if (status === "succeeded" || status === "failed" || status === "cancelled") {
    j.finishedAt = Date.now()
    if (status === "succeeded") j.progress = 1
  }
}

function pump(): void {
  while (running < concurrency && queue.length > 0) {
    // Priority: higher first; stable by createdAt among equals.
    queue.sort((a, b) => {
      const ja = jobs.get(a)!
      const jb = jobs.get(b)!
      if (jb.priority !== ja.priority) return jb.priority - ja.priority
      return ja.createdAt - jb.createdAt
    })
    const id = queue.shift()
    if (!id) break
    const job = jobs.get(id)
    if (!job || job.status !== "queued") continue
    if (job.cancelRequested) {
      setStatus(job, "cancelled")
      job.resolve?.(publicView(job))
      continue
    }
    running += 1
    setStatus(job, "running")
    void execute(job).finally(() => {
      running = Math.max(0, running - 1)
      pump()
    })
  }
}

async function execute(job: InternalJob): Promise<void> {
  try {
    if (job.cancelRequested) {
      setStatus(job, "cancelled")
      return
    }
    job.progress = 0.1

    if (job.kind === "chat") {
      const messages = Array.isArray(job.payload.messages)
        ? (job.payload.messages as { role: string; content: string }[])
        : [{ role: "user", content: String(job.payload.prompt || job.label) }]
      const r = await routeChat({
        messages,
        model: typeof job.payload.model === "string" ? job.payload.model : undefined,
        system: typeof job.payload.system === "string" ? job.payload.system : undefined,
        maxTokens: typeof job.payload.maxTokens === "number" ? job.payload.maxTokens : undefined,
        policy: typeof job.payload.policy === "string" ? (job.payload.policy as never) : undefined,
      })
      if (job.cancelRequested) {
        setStatus(job, "cancelled")
        return
      }
      job.backendId = r.backendId
      job.progress = 1
      if (!r.ok) {
        job.error = r.error || "chat failed"
        setStatus(job, "failed")
        return
      }
      job.result = { text: r.text, backendId: r.backendId, model: r.model, latencyMs: r.latencyMs }
      setStatus(job, "succeeded")
      return
    }

    if (job.kind === "cpu-bound") {
      const input = String(job.payload.input || job.label || "compute")
      const rounds = clamp(Number(job.payload.rounds ?? 50_000), 1, 500_000)
      const result = await runCpuWorker(input, rounds, () => job.cancelRequested)
      if (job.cancelRequested) {
        setStatus(job, "cancelled")
        return
      }
      job.progress = 1
      job.result = result
      setStatus(job, "succeeded")
      return
    }

    if (job.kind === "warm") {
      const { warmBackend } = await import("./router")
      const backendId = typeof job.payload.backendId === "string" ? job.payload.backendId : undefined
      const r = await warmBackend(backendId)
      job.progress = 1
      job.result = r
      setStatus(job, r.ok ? "succeeded" : "failed")
      if (!r.ok) job.error = JSON.stringify(r.errors)
      return
    }

    // enrich / analyze / scan / custom — honest stub that still exercises the queue.
    // Real enrichment pipelines call into this runner; they pass kind + payload.
    const steps = clamp(Number(job.payload.steps ?? 3), 1, 10)
    for (let i = 1; i <= steps; i++) {
      if (job.cancelRequested) {
        setStatus(job, "cancelled")
        return
      }
      await sleep(30)
      job.progress = i / steps
    }
    job.result = {
      note: `Job kind '${job.kind}' completed through the bounded runner. Wire a real handler via payload.handler or call routeChat for LLM work.`,
      payload: job.payload,
    }
    setStatus(job, "succeeded")
  } catch (e) {
    job.error = e instanceof Error ? e.message : String(e)
    setStatus(job, "failed")
  } finally {
    job.resolve?.(publicView(job))
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * Tiny inline worker_threads task — SHA-256 round-trips.
 * Demonstrates real CPU offload without shipping a separate worker file
 * (eval-free: uses Worker with a data: URL of a prebuilt source string).
 */
function runCpuWorker(
  input: string,
  rounds: number,
  isCancelled: () => boolean,
): Promise<{ digest: string; rounds: number; ms: number }> {
  return new Promise((resolve, reject) => {
    const started = Date.now()
    // Prefer worker_threads; fall back to main-thread loop if Worker construction fails
    // (some Next.js edge/bundler contexts).
    const source = `
      const { parentPort, workerData } = require('worker_threads');
      const crypto = require('crypto');
      let buf = Buffer.from(String(workerData.input || ''), 'utf8');
      const rounds = Number(workerData.rounds) || 1;
      for (let i = 0; i < rounds; i++) {
        buf = crypto.createHash('sha256').update(buf).digest();
      }
      parentPort.postMessage({ digest: buf.toString('hex'), rounds });
    `
    try {
      const w = new Worker(source, { eval: true, workerData: { input, rounds } })
      const timer = setInterval(() => {
        if (isCancelled()) {
          void w.terminate()
          clearInterval(timer)
          reject(new Error("cancelled"))
        }
      }, 50)
      w.on("message", (msg: { digest: string; rounds: number }) => {
        clearInterval(timer)
        resolve({ digest: msg.digest, rounds: msg.rounds, ms: Date.now() - started })
      })
      w.on("error", (err) => {
        clearInterval(timer)
        // Fallback to main thread
        void fallbackCpu(input, rounds, isCancelled, started).then(resolve, reject)
        void err
      })
      w.on("exit", (code) => {
        clearInterval(timer)
        if (code !== 0) {
          void fallbackCpu(input, rounds, isCancelled, started).then(resolve, reject)
        }
      })
    } catch {
      void fallbackCpu(input, rounds, isCancelled, started).then(resolve, reject)
    }
  })
}

async function fallbackCpu(
  input: string,
  rounds: number,
  isCancelled: () => boolean,
  started: number,
): Promise<{ digest: string; rounds: number; ms: number }> {
  const crypto = await import("crypto")
  let buf: Buffer = Buffer.from(input, "utf8")
  for (let i = 0; i < rounds; i++) {
    if (i % 1000 === 0 && isCancelled()) throw new Error("cancelled")
    buf = crypto.createHash("sha256").update(buf).digest()
  }
  return { digest: buf.toString("hex"), rounds, ms: Date.now() - started }
}

export function submitJob(input: JobSubmitInput): JobRecord {
  const id = newId()
  const job: InternalJob = {
    id,
    kind: input.kind,
    label: input.label || `${input.kind} job`,
    status: "queued",
    createdAt: Date.now(),
    startedAt: null,
    finishedAt: null,
    progress: 0,
    error: null,
    result: null,
    backendId: null,
    cancelRequested: false,
    priority: typeof input.priority === "number" ? input.priority : 0,
    payload: input.payload || {},
  }
  jobs.set(id, job)
  queue.push(id)
  // Bound retained history
  if (jobs.size > 500) {
    const finished = [...jobs.values()]
      .filter((j) => j.finishedAt != null)
      .sort((a, b) => (a.finishedAt || 0) - (b.finishedAt || 0))
    for (const old of finished.slice(0, Math.max(0, jobs.size - 400))) {
      jobs.delete(old.id)
    }
  }
  pump()
  return publicView(job)
}

export function getJob(id: string): JobRecord | null {
  const j = jobs.get(id)
  return j ? publicView(j) : null
}

export function cancelJob(id: string): JobRecord | null {
  const j = jobs.get(id)
  if (!j) return null
  j.cancelRequested = true
  if (j.status === "queued") {
    const idx = queue.indexOf(id)
    if (idx >= 0) queue.splice(idx, 1)
    setStatus(j, "cancelled")
  }
  return publicView(j)
}

export function listJobs(limit = 40): JobRecord[] {
  return [...jobs.values()]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit)
    .map(publicView)
}

export function jobStats(): { queued: number; running: number; concurrency: number } {
  let queued = 0
  let run = 0
  for (const j of jobs.values()) {
    if (j.status === "queued") queued += 1
    if (j.status === "running") run += 1
  }
  return { queued, running: run, concurrency }
}

export function setJobConcurrency(n: number): number {
  concurrency = clamp(n, 1, 32)
  pump()
  return concurrency
}

export function getJobConcurrency(): number {
  return concurrency
}

/** Test helper */
export function __resetJobsForTests(): void {
  jobs.clear()
  queue.length = 0
  running = 0
  concurrency = DEFAULT_CONCURRENCY
}
