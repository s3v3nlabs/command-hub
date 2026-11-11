/**
 * Compute / AI Acceleration — public barrel.
 * HOLD_VYRNA_UNSYNC · lattice_sync: false
 */

export { HOLD } from "./types"
export type {
  BackendKind,
  BackendHealth,
  RouterPolicy,
  ComputeBackend,
  BackendRuntimeState,
  BackendSnapshot,
  ChatMessage,
  ChatRequest,
  ChatResponse,
  JobStatus,
  JobKind,
  JobRecord,
  JobSubmitInput,
  PerformanceSetting,
  ComputePoolStatus,
} from "./types"

export { discoverBackends, apiKeyPresent, chatEndpoint, healthEndpoint } from "./backends"

export {
  selectBackend,
  rankBackendsForSpeculative,
  probeBackend,
  refreshPoolHealth,
  routeChat,
  warmBackend,
  getPoolStatus,
  setDefaultPolicy,
  getDefaultPolicy,
  __resetRouterStateForTests,
  __getStateForTests,
} from "./router"

export {
  submitJob,
  getJob,
  cancelJob,
  listJobs,
  jobStats,
  setJobConcurrency,
  getJobConcurrency,
  __resetJobsForTests,
} from "./jobs"

export { recordLatency, getMetricsSnapshot, __resetMetricsForTests } from "./metrics"

export {
  listPerformanceSettings,
  getSpeculativeEnabled,
  setSpeculativeEnabled,
  getWarmOnStart,
  setWarmOnStart,
} from "./settings"
