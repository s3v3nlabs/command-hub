/**
 * Input validation + whitelisting for the Android Lab.
 *
 * Every value that reaches a child-process argument array passes through here.
 * We never build shell strings; callers use execFile/spawn with arg arrays, and
 * these validators reject anything with shell metacharacters or path traversal
 * so a rejected value can never be smuggled into an argument.
 */

export class LabInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "LabInputError"
  }
}

const META = /[;&|`$(){}<>\\\n\r"'*?~!#\s]/

/** adb serials: emulator-5554, 192.168.1.5:5555, or alnum device ids. */
const SERIAL_RE = /^(emulator-\d{2,6}|[A-Za-z0-9.:_-]{2,128})$/

/** AVD names: Android allows letters, digits, dot, underscore, dash, space. */
const AVD_NAME_RE = /^[A-Za-z0-9._-]{1,64}$/

/** sdkmanager package paths, e.g. system-images;android-34;google_apis;x86_64. */
const SDK_PACKAGE_RE = /^[A-Za-z0-9;._-]{1,120}$/

/** android device profile ids used by avdmanager --device, e.g. pixel_6, "Nexus 5". */
const DEVICE_PROFILE_RE = /^[A-Za-z0-9._-]{1,48}$/

const PORT_RE = /^\d{1,5}$/

export function assertSerial(v: unknown): string {
  if (typeof v !== "string" || !SERIAL_RE.test(v) || META.test(v)) {
    throw new LabInputError("invalid device serial")
  }
  return v
}

export function assertAvdName(v: unknown): string {
  if (typeof v !== "string" || !AVD_NAME_RE.test(v)) {
    throw new LabInputError("invalid AVD name (allowed: letters, digits, . _ -, max 64)")
  }
  return v
}

export function assertSdkPackage(v: unknown): string {
  if (typeof v !== "string" || !SDK_PACKAGE_RE.test(v)) {
    throw new LabInputError("invalid SDK package path")
  }
  return v
}

export function assertDeviceProfile(v: unknown): string {
  if (typeof v !== "string" || !DEVICE_PROFILE_RE.test(v)) {
    throw new LabInputError("invalid device profile id")
  }
  return v
}

export function assertPort(v: unknown): number {
  const s = typeof v === "number" ? String(v) : v
  if (typeof s !== "string" || !PORT_RE.test(s)) throw new LabInputError("invalid port")
  const n = Number.parseInt(s, 10)
  if (n < 1 || n > 65535) throw new LabInputError("port out of range")
  return n
}

export function assertForwardSpec(v: unknown): string {
  // tcp:PORT or localabstract:NAME — conservative, no metacharacters.
  if (typeof v !== "string" || !/^(tcp:\d{1,5}|localabstract:[A-Za-z0-9._-]{1,64})$/.test(v)) {
    throw new LabInputError("invalid forward spec (tcp:PORT or localabstract:NAME)")
  }
  return v
}

/** Android package names: dotted segments of [a-zA-Z0-9_]. */
export function assertPackageName(v: unknown): string {
  if (typeof v !== "string" || !/^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z0-9_]+)+$/.test(v) || v.length > 255) {
    throw new LabInputError("invalid Android package name")
  }
  return v
}

/**
 * A shell command the engineer runs on their own emulator via `adb shell`.
 * Conservative allowlist (no shell metacharacters) — mirrors the existing
 * /api/adb shell route so a web form can never inject a chained command.
 */
const SAFE_SHELL = /^[A-Za-z0-9 _./:@=+,-]{1,256}$/
export function assertShellCommand(v: unknown): string {
  if (typeof v !== "string" || !SAFE_SHELL.test(v) || META.test(v.replace(/ /g, ""))) {
    throw new LabInputError("shell command rejected (disallowed characters or metacharacters)")
  }
  return v
}

/**
 * A relative path confined to the lab workspace. No absolute paths, no `..`.
 * Used for APK/push/pull file names provided by the client.
 */
export function assertWorkspaceRelPath(v: unknown): string {
  if (typeof v !== "string" || v.length === 0 || v.length > 200) {
    throw new LabInputError("invalid file path")
  }
  if (v.startsWith("/") || v.includes("..") || META.test(v.replace(/[./-]/g, ""))) {
    throw new LabInputError("file path must be a safe name inside the lab workspace")
  }
  return v
}

/**
 * A remote (on-device) absolute path for push/pull targets, e.g. /sdcard/x.
 * Device paths are absolute but still must not contain shell metacharacters.
 */
export function assertDevicePath(v: unknown): string {
  if (typeof v !== "string" || !/^\/[A-Za-z0-9 _./-]{1,200}$/.test(v) || v.includes("..")) {
    throw new LabInputError("invalid device path")
  }
  return v
}

export function clampInt(v: unknown, min: number, max: number, dflt: number): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number.parseInt(v, 10) : NaN
  if (!Number.isFinite(n)) return dflt
  return Math.min(Math.max(Math.trunc(n), min), max)
}
