/**
 * Pure parsers for avdmanager / emulator / adb text output.
 * No process execution — unit-tested against fixture strings.
 */

import type { AdbForward, PackageInfo, ParsedAdbDevice, ParsedAvd, ParsedPackage } from "./types"

export function isEmulatorSerial(serial: string): boolean {
  return /^emulator-\d+/.test(serial)
}

/**
 * Parse `adb devices -l` output.
 * Example:
 *   List of devices attached
 *   emulator-5554          device product:sdk_gphone64_x86_64 model:sdk_gphone64_x86_64 device:emu64xa transport_id:1
 *   R58M123ABCD            unauthorized usb:1-1.2 transport_id:2
 */
export function parseAdbDevices(output: string): ParsedAdbDevice[] {
  const devices: ParsedAdbDevice[] = []
  const lines = output.split(/\r?\n/)
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || /^list of devices/i.test(line) || line.startsWith("*")) continue
    const parts = line.split(/\s+/)
    if (parts.length < 2) continue
    const serial = parts[0]
    const state = parts[1]
    if (!serial || !state) continue
    const rest = line.slice(serial.length).trim()
    const kv: Record<string, string> = {}
    for (const m of rest.matchAll(/\b(product|model|device|transport_id|usb):(\S+)/g)) {
      kv[m[1]] = m[2]
    }
    devices.push({
      serial,
      state,
      product: kv.product,
      model: kv.model,
      device: kv.device,
      transportId: kv.transport_id,
      usb: kv.usb,
      isEmulator: isEmulatorSerial(serial) || /sdk_gphone|generic_x86|emulator/i.test(kv.model || kv.product || ""),
    })
  }
  return devices
}

/**
 * Parse `emulator -list-avds` (one name per line).
 */
export function parseEmulatorAvdNames(output: string): string[] {
  return output
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("INFO") && !l.startsWith("WARNING") && !l.startsWith("ERROR"))
}

/**
 * Parse `avdmanager list avd` blocks.
 */
export function parseAvdManagerList(output: string): ParsedAvd[] {
  const blocks = output.split(/^-{3,}\s*$/m)
  const avds: ParsedAvd[] = []
  for (const block of blocks) {
    const name = pickField(block, "Name")
    if (!name) continue
    const targetLine = pickField(block, "Target") || ""
    const based = block.match(/Based on:\s*(.+)$/m)?.[1]?.trim()
    const abi = block.match(/Tag\/ABI:\s*(\S+)/)?.[1]
    avds.push({
      name,
      device: pickField(block, "Device"),
      path: pickField(block, "Path"),
      target: [targetLine, based].filter(Boolean).join(" — ") || undefined,
      abi,
      sdcard: pickField(block, "Sdcard") || pickField(block, "SD Card"),
    })
  }
  return avds
}

function pickField(block: string, label: string): string | undefined {
  const re = new RegExp(`^\\s*${label}:\\s*(.+)$`, "im")
  const m = block.match(re)
  const v = m?.[1]?.trim()
  return v || undefined
}

/**
 * Parse `adb shell pm list packages` and `pm list packages -f`.
 *   package:com.android.settings
 *   package:/data/app/~~x/com.example-y/base.apk=com.example
 */
export function parsePmPackages(output: string): ParsedPackage[] {
  const out: ParsedPackage[] = []
  for (const raw of output.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line.startsWith("package:")) continue
    const body = line.slice("package:".length)
    const eq = body.lastIndexOf("=")
    if (eq > 0 && body.startsWith("/")) {
      out.push({ apkPath: body.slice(0, eq), packageName: body.slice(eq + 1) })
    } else {
      out.push({ packageName: body })
    }
  }
  return out
}

/**
 * Parse `adb shell getprop` (`[key]: [value]` lines) into a map.
 * Optionally restrict to a set of keys (caller already requested only those).
 */
export function parseGetprop(output: string): Record<string, string> {
  const props: Record<string, string> = {}
  for (const raw of output.split(/\r?\n/)) {
    const m = raw.match(/^\s*\[([^\]]+)\]\s*:\s*\[([^\]]*)\]\s*$/)
    if (m) props[m[1]] = m[2]
  }
  return props
}

/**
 * Parse `adb forward --list`:
 *   emulator-5554 tcp:8080 tcp:8080
 */
export function parseAdbForwards(output: string): AdbForward[] {
  const out: AdbForward[] = []
  for (const raw of output.split(/\r?\n/)) {
    const parts = raw.trim().split(/\s+/)
    if (parts.length >= 3) out.push({ serial: parts[0], local: parts[1], remote: parts[2] })
  }
  return out
}

/**
 * Best-effort extract of `dumpsys package <name>` fields we show in the UI.
 */
export function parseDumpsysPackage(output: string, packageName: string): PackageInfo {
  const versionName = output.match(/versionName=(\S+)/)?.[1]
  const versionCode = output.match(/versionCode=(\S+)/)?.[1]
  const firstInstallTime = output.match(/firstInstallTime=([^\n]+)/)?.[1]?.trim()
  const lastUpdateTime = output.match(/lastUpdateTime=([^\n]+)/)?.[1]?.trim()
  const apkPath =
    output.match(/^\s*(?:path|codePath)=(\/\S+)/m)?.[1] ||
    output.match(/^\s*codePath=(\/\S+)/m)?.[1]
  const targetSdk = output.match(/targetSdk=(\d+)/)?.[1]
  const permissions: string[] = []
  const permSection = output.match(/requested permissions:\s*\n([\s\S]*?)(?:^\s*\S.*:$|\n\s*install permissions:)/m)
  const block = permSection?.[1] || ""
  for (const raw of block.split(/\r?\n/)) {
    const p = raw.trim()
    if (/^[A-Za-z][A-Za-z0-9._]+$/.test(p)) permissions.push(p)
  }
  return {
    packageName,
    versionName,
    versionCode,
    firstInstallTime,
    lastUpdateTime,
    apkPath,
    permissions,
    targetSdk,
  }
}

/**
 * Parse aapt/aapt2 `dump badging` of an APK sitting in the lab workspace.
 */
export function parseAaptBadging(output: string): { packageName?: string; versionName?: string; versionCode?: string; label?: string; sdkVersion?: string; targetSdk?: string; permissions: string[] } {
  const packageName = output.match(/package: name='([^']+)'/)?.[1]
  const versionName = output.match(/versionName='([^']+)'/)?.[1]
  const versionCode = output.match(/versionCode='([^']+)'/)?.[1]
  const label = output.match(/application-label:'([^']+)'/)?.[1]
  const sdkVersion = output.match(/sdkVersion:'([^']+)'/)?.[1]
  const targetSdk = output.match(/targetSdkVersion:'([^']+)'/)?.[1]
  const permissions: string[] = []
  for (const m of output.matchAll(/uses-permission: name='([^']+)'/g)) permissions.push(m[1])
  return { packageName, versionName, versionCode, label, sdkVersion, targetSdk, permissions }
}

/**
 * Walk relative dir entries under system-images/ into sdkmanager package paths.
 * Input is POSIX-style relative paths like "android-34/google_apis/x86_64".
 */
export function systemImageEntriesToPackages(relPaths: string[]): string[] {
  const pkgs = new Set<string>()
  for (const rel of relPaths) {
    const parts = rel.replace(/\\/g, "/").split("/").filter(Boolean)
    // expect api/tag/abi  (optionally prefixed with "system-images")
    const i = parts[0] === "system-images" ? 1 : 0
    if (parts.length >= i + 3) {
      pkgs.add(`system-images;${parts[i]};${parts[i + 1]};${parts[i + 2]}`)
    }
  }
  return [...pkgs].sort()
}
