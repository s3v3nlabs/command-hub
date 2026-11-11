/**
 * adb wrappers for the Android Lab. Argument arrays only; serials/paths
 * validated before they are appended to the argv.
 */

import fs from "fs"
import path from "path"
import { runFile, spawnDetached } from "./exec"
import {
  parseAdbDevices,
  parseAdbForwards,
  parseAaptBadging,
  parseDumpsysPackage,
  parseGetprop,
  parsePmPackages,
} from "./parse"
import type { AdbForward, DeviceAssessment, PackageInfo, ParsedAdbDevice, ParsedPackage, SdkStatus, TrafficHooks } from "./types"
import {
  assertDevicePath,
  assertForwardSpec,
  assertPackageName,
  assertPort,
  assertSerial,
  assertShellCommand,
  clampInt,
} from "./validate"
import { labWorkspace, resolveUnder } from "./workspace"
import { toolEnv } from "./sdk"

function needAdb(sdk: SdkStatus): string {
  if (!sdk.tools.adb) throw new Error("adb is not installed on this host")
  return sdk.tools.adb
}

function envOf(sdk: SdkStatus): NodeJS.ProcessEnv {
  return toolEnv(sdk.sdkRoot, sdk.avdHome)
}

async function adb(sdk: SdkStatus, args: readonly string[], timeoutMs = 20_000): Promise<{ stdout: string; stderr: string; code: number }> {
  return runFile(needAdb(sdk), args, { timeoutMs, env: envOf(sdk) })
}

export async function listDevices(sdk: SdkStatus): Promise<ParsedAdbDevice[]> {
  const r = await adb(sdk, ["devices", "-l"], 10_000)
  const devices = parseAdbDevices(r.stdout)
  // Best-effort AVD name for running emulators (fixed argv, validated serial).
  await Promise.all(
    devices
      .filter((d) => d.isEmulator && d.state === "device")
      .map(async (d) => {
        try {
          const n = await adb(sdk, ["-s", d.serial, "emu", "avd", "name"], 4_000)
          const name = n.stdout.trim().split(/\r?\n/)[0]?.trim()
          if (name && name !== "OK" && !/error/i.test(name)) d.avdName = name
        } catch {
          /* ignore */
        }
      }),
  )
  return devices
}

export async function stopAvd(sdk: SdkStatus, serialRaw: string): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  const serial = assertSerial(serialRaw)
  const r = await adb(sdk, ["-s", serial, "emu", "kill"], 10_000)
  return { ok: r.code === 0, stdout: r.stdout, stderr: r.stderr }
}

export async function shell(sdk: SdkStatus, serialRaw: string, commandRaw: string): Promise<{ ok: boolean; output: string }> {
  const serial = assertSerial(serialRaw)
  const command = assertShellCommand(commandRaw)
  // Split into argv tokens so adb never sees a shell-metacharacter string.
  const tokens = command.split(" ").filter(Boolean)
  const r = await adb(sdk, ["-s", serial, "shell", ...tokens], 20_000)
  return { ok: r.code === 0, output: (r.stdout || r.stderr).slice(0, 200_000) }
}

export async function installApk(sdk: SdkStatus, serialRaw: string, fileName: string): Promise<{ ok: boolean; output: string }> {
  const serial = assertSerial(serialRaw)
  const abs = resolveUnder(labWorkspace().apks, fileName)
  if (!abs.toLowerCase().endsWith(".apk") || !fs.existsSync(abs)) {
    throw new Error("APK not found in the lab apks/ workspace (drop a .apk there first)")
  }
  const r = await adb(sdk, ["-s", serial, "install", "-r", abs], 120_000)
  return { ok: r.code === 0, output: (r.stdout || r.stderr).slice(0, 20_000) }
}

export async function uninstallPkg(sdk: SdkStatus, serialRaw: string, pkgRaw: string): Promise<{ ok: boolean; output: string }> {
  const serial = assertSerial(serialRaw)
  const pkg = assertPackageName(pkgRaw)
  const r = await adb(sdk, ["-s", serial, "uninstall", pkg], 30_000)
  return { ok: r.code === 0, output: (r.stdout || r.stderr).slice(0, 8_000) }
}

export async function pushFile(
  sdk: SdkStatus,
  serialRaw: string,
  fileName: string,
  remoteRaw: string,
): Promise<{ ok: boolean; output: string }> {
  const serial = assertSerial(serialRaw)
  const remote = assertDevicePath(remoteRaw)
  const ws = labWorkspace()
  let abs: string
  try {
    abs = resolveUnder(ws.push, fileName)
    if (!fs.existsSync(abs)) abs = resolveUnder(ws.apks, fileName)
  } catch {
    abs = resolveUnder(ws.apks, fileName)
  }
  if (!fs.existsSync(abs)) throw new Error("host file not found in lab push/ or apks/ workspace")
  const r = await adb(sdk, ["-s", serial, "push", abs, remote], 60_000)
  return { ok: r.code === 0, output: (r.stdout || r.stderr).slice(0, 8_000) }
}

export async function pullFile(
  sdk: SdkStatus,
  serialRaw: string,
  remoteRaw: string,
  destName?: string,
): Promise<{ ok: boolean; output: string; savedAs?: string }> {
  const serial = assertSerial(serialRaw)
  const remote = assertDevicePath(remoteRaw)
  const ws = labWorkspace()
  const base = destName ? path.basename(destName) : path.basename(remote) || "pulled.bin"
  const dest = resolveUnder(ws.pull, base)
  const r = await adb(sdk, ["-s", serial, "pull", remote, dest], 60_000)
  return { ok: r.code === 0, output: (r.stdout || r.stderr).slice(0, 8_000), savedAs: r.code === 0 ? base : undefined }
}

export async function logcatDump(
  sdk: SdkStatus,
  serialRaw: string,
  opts: { lines?: number; filter?: string } = {},
): Promise<{ ok: boolean; output: string }> {
  const serial = assertSerial(serialRaw)
  const lines = clampInt(opts.lines, 20, 500, 200)
  const args = ["-s", serial, "logcat", "-d", "-t", String(lines)]
  if (opts.filter) {
    // logcat filter specs like "ActivityManager:I *:S"
    const f = assertShellCommand(opts.filter)
    args.push(...f.split(" ").filter(Boolean))
  }
  const r = await adb(sdk, args, 15_000)
  return { ok: r.code === 0, output: (r.stdout || r.stderr).slice(0, 200_000) }
}

export async function screenshot(sdk: SdkStatus, serialRaw: string): Promise<{ ok: boolean; mime: string; base64: string; bytes: number }> {
  const serial = assertSerial(serialRaw)
  // Write to a device temp file then adb pull — exec-out is binary and execFile would utf8-corrupt the PNG.
  const dest = resolveUnder(labWorkspace().pull, `screencap-${serial.replace(/[^A-Za-z0-9._-]/g, "_")}.png`)
  const cap = await adb(sdk, ["-s", serial, "shell", "screencap", "-p", "/data/local/tmp/hub-screencap.png"], 10_000)
  if (cap.code !== 0) throw new Error(cap.stderr || "screencap failed; is the emulator fully booted?")
  const got = await adb(sdk, ["-s", serial, "pull", "/data/local/tmp/hub-screencap.png", dest], 15_000)
  if (got.code !== 0 || !fs.existsSync(dest)) throw new Error(got.stderr || "failed to pull screenshot")
  const buf = fs.readFileSync(dest)
  return { ok: true, mime: "image/png", base64: buf.toString("base64"), bytes: buf.length }
}

export async function listForwards(sdk: SdkStatus, serialRaw?: string): Promise<AdbForward[]> {
  const r = await adb(sdk, ["forward", "--list"], 8_000)
  const all = parseAdbForwards(r.stdout)
  if (!serialRaw) return all
  const serial = assertSerial(serialRaw)
  return all.filter((f) => f.serial === serial)
}

export async function addForward(
  sdk: SdkStatus,
  serialRaw: string,
  localRaw: string,
  remoteRaw: string,
): Promise<{ ok: boolean; output: string }> {
  const serial = assertSerial(serialRaw)
  const local = assertForwardSpec(localRaw)
  const remote = assertForwardSpec(remoteRaw)
  const r = await adb(sdk, ["-s", serial, "forward", local, remote], 8_000)
  return { ok: r.code === 0, output: (r.stdout || r.stderr).slice(0, 4_000) }
}

export async function removeForward(sdk: SdkStatus, serialRaw: string, localRaw: string): Promise<{ ok: boolean; output: string }> {
  const serial = assertSerial(serialRaw)
  const local = assertForwardSpec(localRaw)
  const r = await adb(sdk, ["-s", serial, "forward", "--remove", local], 8_000)
  return { ok: r.code === 0, output: (r.stdout || r.stderr).slice(0, 4_000) }
}

export async function listPackages(sdk: SdkStatus, serialRaw: string, thirdPartyOnly = true): Promise<ParsedPackage[]> {
  const serial = assertSerial(serialRaw)
  const args = ["-s", serial, "shell", "pm", "list", "packages", "-f"]
  if (thirdPartyOnly) args.push("-3")
  const r = await adb(sdk, args, 20_000)
  return parsePmPackages(r.stdout)
}

export async function packageInfo(sdk: SdkStatus, serialRaw: string, pkgRaw: string): Promise<PackageInfo> {
  const serial = assertSerial(serialRaw)
  const pkg = assertPackageName(pkgRaw)
  const r = await adb(sdk, ["-s", serial, "shell", "dumpsys", "package", pkg], 20_000)
  return parseDumpsysPackage(r.stdout, pkg)
}

const INTERESTING_PROPS = [
  "ro.product.model",
  "ro.product.manufacturer",
  "ro.product.name",
  "ro.build.version.release",
  "ro.build.version.sdk",
  "ro.build.fingerprint",
  "ro.hardware",
  "ro.secure",
  "ro.debuggable",
  "ro.boot.qemu",
  "gsm.version.baseband",
  "ro.serialno",
]

export async function assessDevice(sdk: SdkStatus, serialRaw: string): Promise<DeviceAssessment> {
  const serial = assertSerial(serialRaw)
  const props: Record<string, string> = {}
  // Query each property with a fixed argv (getprop KEY) rather than dumping everything.
  await Promise.all(
    INTERESTING_PROPS.map(async (key) => {
      const r = await adb(sdk, ["-s", serial, "shell", "getprop", key], 5_000)
      const v = r.stdout.trim()
      if (v) props[key] = v
    }),
  )
  // Some images print getprop in bracket form even for a single key.
  const parsed = parseGetprop(Object.entries(props).map(([k, v]) => `[${k}]: [${v}]`).join("\n"))
  const merged = { ...props, ...parsed }
  const packages = await listPackages(sdk, serial, true)
  const forwards = await listForwards(sdk, serial)
  const hooks: TrafficHooks = {
    host: {
      tcpdump: Boolean(sdk.tools.tcpdump),
      mitmproxy: Boolean(sdk.tools.mitmproxy),
      frida: Boolean(sdk.tools.frida),
      scrcpy: Boolean(sdk.tools.scrcpy),
    },
    notes: [
      "Traffic capture hooks target the currently selected local emulator only.",
      sdk.tools.mitmproxy
        ? "mitmproxy is installed on the host. Use proxy_reverse to adb-reverse a port (e.g. tcp:8080 → tcp:8080), then point the emulator HTTP proxy at 127.0.0.1:8080."
        : "mitmproxy not detected on the host. Install it to intercept emulator HTTP(S) with your own proxy + CA.",
      sdk.tools.tcpdump
        ? "tcpdump is installed on the host. Capture on the emulator's tuntap/bridge from your own terminal; the lab will not start a privileged capture itself."
        : "tcpdump not detected on the host.",
      sdk.tools.frida
        ? "frida CLI is installed. Dynamic instrumentation stays an operator-run step against this local emulator (install frida-server on the AVD yourself)."
        : "frida not detected on the host.",
      "Do not point these hooks at a device or app you do not own or are not authorized to test. See LEGAL.md and the staged authorization model for any real external device.",
    ],
  }
  return {
    serial,
    isEmulator: /^emulator-/.test(serial) || merged["ro.boot.qemu"] === "1",
    props: merged,
    packages,
    packageCount: packages.length,
    forwards,
    hooks,
  }
}

export async function startScrcpy(sdk: SdkStatus, serialRaw: string): Promise<{ ok: boolean; pid?: number; note: string }> {
  const serial = assertSerial(serialRaw)
  if (!sdk.tools.scrcpy) {
    return { ok: false, note: "scrcpy is not installed on this host. In-browser view uses adb screencap instead." }
  }
  const child = spawnDetached(sdk.tools.scrcpy, ["-s", serial, "--max-size", "1024"], envOf(sdk))
  return {
    ok: Boolean(child.pid),
    pid: child.pid,
    note: "scrcpy launched as a host-desktop window (it cannot render inside the browser). The in-browser live view continues to use screencap.",
  }
}

export async function proxyReverse(
  sdk: SdkStatus,
  serialRaw: string,
  hostPortRaw: unknown,
  devicePortRaw: unknown,
): Promise<{ ok: boolean; output: string }> {
  const serial = assertSerial(serialRaw)
  const host = assertPort(hostPortRaw)
  const device = assertPort(devicePortRaw ?? hostPortRaw)
  const r = await adb(sdk, ["-s", serial, "reverse", `tcp:${host}`, `tcp:${device}`], 8_000)
  return { ok: r.code === 0, output: (r.stdout || r.stderr).slice(0, 4_000) }
}

export async function proxyClear(sdk: SdkStatus, serialRaw: string): Promise<{ ok: boolean; output: string }> {
  const serial = assertSerial(serialRaw)
  const r = await adb(sdk, ["-s", serial, "reverse", "--remove-all"], 8_000)
  return { ok: r.code === 0, output: (r.stdout || r.stderr).slice(0, 4_000) }
}

export function listWorkspaceApks(): string[] {
  const dir = labWorkspace().apks
  try {
    return fs
      .readdirSync(dir)
      .filter((f) => f.toLowerCase().endsWith(".apk") && !f.includes(".."))
      .sort()
  } catch {
    return []
  }
}

export async function staticApkInfo(sdk: SdkStatus, fileName: string) {
  const abs = resolveUnder(labWorkspace().apks, fileName)
  if (!abs.toLowerCase().endsWith(".apk") || !fs.existsSync(abs)) {
    throw new Error("APK not found in lab apks/ workspace")
  }
  const bin = sdk.tools.aapt2 || sdk.tools.aapt
  if (!bin) {
    return { fileName, note: "aapt/aapt2 not installed — drop the APK and use package_info after install, or install build-tools." }
  }
  const r = await runFile(bin, ["dump", "badging", abs], { timeoutMs: 20_000, env: envOf(sdk) })
  return { fileName, ...parseAaptBadging(r.stdout || r.stderr) }
}
