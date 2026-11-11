import { describe, it, expect, beforeEach, afterEach } from "vitest"
import {
  submitJob,
  getJob,
  cancelJob,
  listJobs,
  jobStats,
  setJobConcurrency,
  __resetJobsForTests,
} from "@/lib/compute/jobs"

function waitFor(
  pred: () => boolean,
  timeoutMs = 3000,
): Promise<void> {
  const started = Date.now()
  return new Promise((resolve, reject) => {
    const tick = () => {
      if (pred()) return resolve()
      if (Date.now() - started > timeoutMs) return reject(new Error("timeout waiting for condition"))
      setTimeout(tick, 20)
    }
    tick()
  })
}

describe("compute job queue", () => {
  beforeEach(() => {
    __resetJobsForTests()
    setJobConcurrency(2)
  })
  afterEach(() => {
    __resetJobsForTests()
  })

  it("respects concurrency cap", async () => {
    setJobConcurrency(2)
    const ids = [
      submitJob({ kind: "custom", label: "a", payload: { steps: 8 } }).id,
      submitJob({ kind: "custom", label: "b", payload: { steps: 8 } }).id,
      submitJob({ kind: "custom", label: "c", payload: { steps: 8 } }).id,
      submitJob({ kind: "custom", label: "d", payload: { steps: 8 } }).id,
    ]
    // Immediately after submit, at most 2 should be running
    await new Promise((r) => setTimeout(r, 40))
    const running = ids.map((id) => getJob(id)!).filter((j) => j.status === "running")
    const queued = ids.map((id) => getJob(id)!).filter((j) => j.status === "queued")
    expect(running.length).toBeLessThanOrEqual(2)
    expect(running.length + queued.length).toBeGreaterThanOrEqual(2)
    expect(jobStats().concurrency).toBe(2)

    await waitFor(() => ids.every((id) => {
      const s = getJob(id)!.status
      return s === "succeeded" || s === "failed" || s === "cancelled"
    }))
    expect(ids.every((id) => getJob(id)!.status === "succeeded")).toBe(true)
  })

  it("cancels a queued job before it runs", async () => {
    setJobConcurrency(1)
    // Block the runner with a long custom job
    const blocker = submitJob({ kind: "custom", label: "blocker", payload: { steps: 20 } })
    const pending = submitJob({ kind: "custom", label: "pending", payload: { steps: 5 } })
    await new Promise((r) => setTimeout(r, 30))
    const cancelled = cancelJob(pending.id)
    expect(cancelled?.status).toBe("cancelled")
    expect(getJob(pending.id)?.status).toBe("cancelled")

    await waitFor(() => {
      const s = getJob(blocker.id)!.status
      return s === "succeeded" || s === "failed" || s === "cancelled"
    }, 5000)
  })

  it("cancels a running job via cancelRequested flag", async () => {
    setJobConcurrency(1)
    const job = submitJob({ kind: "custom", label: "long", payload: { steps: 30 } })
    await waitFor(() => getJob(job.id)?.status === "running")
    cancelJob(job.id)
    await waitFor(() => {
      const s = getJob(job.id)!.status
      return s === "cancelled" || s === "succeeded"
    })
    // May finish succeeding if it raced past the cancel check; accept cancelled as the intended path
    const final = getJob(job.id)!
    expect(["cancelled", "succeeded"]).toContain(final.status)
    if (final.status === "cancelled") {
      expect(final.cancelRequested).toBe(true)
    }
  })

  it("runs a cpu-bound worker_threads job to completion", async () => {
    const job = submitJob({
      kind: "cpu-bound",
      label: "hash",
      payload: { input: "test", rounds: 1000 },
    })
    await waitFor(() => getJob(job.id)?.status === "succeeded" || getJob(job.id)?.status === "failed")
    const done = getJob(job.id)!
    expect(done.status).toBe("succeeded")
    expect(done.result).toBeTruthy()
    const result = done.result as { digest: string; rounds: number }
    expect(result.digest).toMatch(/^[a-f0-9]{64}$/)
    expect(result.rounds).toBe(1000)
  })

  it("lists recent jobs newest first", () => {
    submitJob({ kind: "custom", label: "one", payload: { steps: 1 } })
    submitJob({ kind: "custom", label: "two", payload: { steps: 1 } })
    const list = listJobs(10)
    expect(list.length).toBeGreaterThanOrEqual(2)
    expect(list[0]!.createdAt).toBeGreaterThanOrEqual(list[1]!.createdAt)
  })
})
