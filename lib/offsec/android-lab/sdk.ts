/**
 * Server-side Android SDK / emulator / adb detection.
 * Takes no client input. Paths come from the environment and a fixed list of
 * well-known SDK locations, plus `which` for a fixed tool-name allowlist.
 */

import fs from "fs"
import os from "os"
import path from "path"
import { runFile } from "./exec"
import { systemImageEntriesToPackages } from "./parse"
import type { SdkStatus, SdkToolPaths } from "./types"

const TOOL_NAMES = [
  "adb",
  "emulator",
  "avdmanager",
  "sdkmanager",
  "scrcpy",
  "aapt",
  "aapt2",
  "tcpdump",
  "mitmproxy",
  "frida",
] as const

export type ToolName = (typeof TOOL_NAMES)[number]

function exe(name: string): string {
  return process.platform === "win32" ? `${name}.exe` : name
}

function exists(p: string): boolean {
  try {
    return Boolean(p) && fs.existsSync(p)
  } catch {
    return false
  }
}

function candidateSdkRoots(): string[] {
  const env = [
    process.env.ANDROID_SDK_ROOT,
    process.env.ANDROID_HOME,
  ]
    .map((s) => s?.trim())
    .filter((s): s is string => Boolean(s))
  const home = os.homedir()
  const known =
    process.platform === "darwin"
      ? [
          path.join(home, "Library", "Android", "sdk"),
          path.join(home, "Android", "Sdk"),
          "/usr/local/android-sdk",
          "/opt/android-sdk",
        ]
      : process.platform === "win32"
        ? [
            path.join(home, "AppData", "Local", "Android", "Sdk"),
            "C:\\Android\\Sdk",
            "C:\\Android\\android-sdk",
          ]
        : [
            path.join(home, "Android", "Sdk"),
            path.join(home, "Android", "sdk"),
            path.join(home, ".android", "sdk"),
            "/usr/local/android-sdk",
            "/opt/android-sdk",
            "/usr/lib/android-sdk",
            "/opt/android-studio/sdk",
          ]
  return [...new Set([...env, ...known])]
}

function sdkLooksValid(root: string): boolean {
  return (
    exists(path.join(root, "platform-tools", exe("adb"))) ||
    exists(path.join(root, "emulator", exe("emulator"))) ||
    exists(path.join(root, "cmdline-tools", "latest", "bin", exe("sdkmanager"))) ||
    exists(path.join(root, "tools", "bin", exe("sdkmanager")))
  )
}

export function resolveSdkRoot(): string | null {
  for (const root of candidateSdkRoots()) {
    if (sdkLooksValid(root)) return root
  }
  return null
}

export function resolveAvdHome(sdkRoot: string | null): string | null {
  const env = process.env.ANDROID_AVD_HOME?.trim()
  if (env && exists(env)) return env
  const homeAvd = path.join(os.homedir(), ".android", "avd")
  if (exists(homeAvd)) return homeAvd
  if (sdkRoot) {
    const under = path.join(sdkRoot, "avd")
    if (exists(under)) return under
  }
  return path.join(os.homedir(), ".android", "avd")
}

function toolUnderSdk(sdkRoot: string | null, name: ToolName): string | null {
  if (!sdkRoot) return null
  const candidates: string[] = []
  if (name === "adb") candidates.push(path.join(sdkRoot, "platform-tools", exe("adb")))
  if (name === "emulator") candidates.push(path.join(sdkRoot, "emulator", exe("emulator")))
  if (name === "avdmanager" || name === "sdkmanager") {
    candidates.push(
      path.join(sdkRoot, "cmdline-tools", "latest", "bin", exe(name)),
      path.join(sdkRoot, "cmdline-tools", "bin", exe(name)),
      path.join(sdkRoot, "tools", "bin", exe(name)),
    )
  }
  if (name === "aapt" || name === "aapt2") {
    // Prefer the newest build-tools dir if present.
    const bt = path.join(sdkRoot, "build-tools")
    try {
      const vers = fs.readdirSync(bt).sort().reverse()
      for (const v of vers) candidates.push(path.join(bt, v, exe(name)))
    } catch {
      /* no build-tools */
    }
  }
  return candidates.find(exists) || null
}

async function whichAllowlisted(name: ToolName): Promise<string | null> {
  // name is taken from TOOL_NAMES only — never from the client.
  const bin = process.platform === "win32" ? "where" : "which"
  try {
    const r = await runFile(bin, [name], { timeoutMs: 2500 })
    const p = r.stdout
      .trim()
      .split(/\r?\n/)[0]
      ?.trim()
    return p && exists(p) ? p : null
  } catch {
    return null
  }
}

export async function resolveTool(name: ToolName, sdkRoot: string | null): Promise<string | null> {
  return toolUnderSdk(sdkRoot, name) || (await whichAllowlisted(name))
}

function listSystemImages(sdkRoot: string | null): string[] {
  if (!sdkRoot) return []
  const root = path.join(sdkRoot, "system-images")
  const rels: string[] = []
  try {
    const apis = fs.readdirSync(root)
    for (const api of apis) {
      const apiDir = path.join(root, api)
      if (!fs.statSync(apiDir).isDirectory()) continue
      const tags = fs.readdirSync(apiDir)
      for (const tag of tags) {
        const tagDir = path.join(apiDir, tag)
        if (!fs.statSync(tagDir).isDirectory()) continue
        const abis = fs.readdirSync(tagDir)
        for (const abi of abis) {
          const abiDir = path.join(tagDir, abi)
          try {
            if (fs.statSync(abiDir).isDirectory()) rels.push(`${api}/${tag}/${abi}`)
          } catch {
            /* skip */
          }
        }
      }
    }
  } catch {
    return []
  }
  return systemImageEntriesToPackages(rels)
}

export function probeKvm(): SdkStatus["kvm"] {
  const p = "/dev/kvm"
  if (process.platform !== "linux") {
    return { present: false, writable: false, path: p }
  }
  const present = exists(p)
  let writable = false
  if (present) {
    try {
      fs.accessSync(p, fs.constants.R_OK | fs.constants.W_OK)
      writable = true
    } catch {
      writable = false
    }
  }
  return { present, writable, path: p }
}

export function installGuidance(status: {
  sdkRoot: string | null
  tools: SdkToolPaths
  kvm: SdkStatus["kvm"]
}): string[] {
  const lines: string[] = [
    "The Android Lab drives local Android Virtual Devices via the official Android SDK (emulator + adb). It will not invent a device if the SDK is missing.",
    "1. Download Android command-line tools: https://developer.android.com/studio#command-tools",
    "2. Unpack into a SDK root, e.g.:",
    "     mkdir -p \"$HOME/Android/Sdk/cmdline-tools\" && unzip commandlinetools-*.zip -d /tmp/android-clt && mv /tmp/android-clt/cmdline-tools \"$HOME/Android/Sdk/cmdline-tools/latest\"",
    "3. Point the hub at that root (add to .env.local, then restart):",
    "     ANDROID_SDK_ROOT=$HOME/Android/Sdk",
    "     ANDROID_AVD_HOME=$HOME/.android/avd",
    "4. Install platform-tools, the emulator, and a system image (argument arrays; no shell interpolation):",
    "     \"$ANDROID_SDK_ROOT/cmdline-tools/latest/bin/sdkmanager\" --sdk_root=\"$ANDROID_SDK_ROOT\" --licenses",
    "     \"$ANDROID_SDK_ROOT/cmdline-tools/latest/bin/sdkmanager\" --sdk_root=\"$ANDROID_SDK_ROOT\" platform-tools emulator \"platform-tools\" \"cmdline-tools;latest\" \"system-images;android-34;google_apis;x86_64\"",
    "5. Create an AVD (or use the lab UI once the SDK is detected):",
    "     \"$ANDROID_SDK_ROOT/cmdline-tools/latest/bin/avdmanager\" create avd -n hub-lab-34 -k \"system-images;android-34;google_apis;x86_64\" --device pixel --force",
    "Debian/Ubuntu packages (often incomplete vs. the official SDK — prefer the steps above):",
    "     sudo apt-get update && sudo apt-get install -y adb qemu-kvm unzip wget",
    "     # optional: sudo apt-get install -y android-sdk android-sdk-platform-tools-common",
  ]
  if (status.kvm.present && !status.kvm.writable) {
    lines.push(
      "KVM is present at /dev/kvm but not writable by this process. Add your user to the kvm group and re-login: sudo usermod -aG kvm \"$USER\"",
    )
  } else if (!status.kvm.present && process.platform === "linux") {
    lines.push(
      "No /dev/kvm detected. Hardware acceleration will be unavailable; the emulator can still start with -accel off (slow). On Debian/Ubuntu: sudo apt-get install -y qemu-kvm && sudo usermod -aG kvm \"$USER\"",
    )
  }
  if (!status.tools.scrcpy) {
    lines.push("Optional live window on the host desktop: install scrcpy (https://github.com/Genymobile/scrcpy). The in-browser view uses adb screencap and does not require it.")
  }
  return lines
}

export async function detectSdk(): Promise<SdkStatus> {
  const sdkRoot = resolveSdkRoot()
  const avdHome = resolveAvdHome(sdkRoot)
  const tools: SdkToolPaths = {
    adb: await resolveTool("adb", sdkRoot),
    emulator: await resolveTool("emulator", sdkRoot),
    avdmanager: await resolveTool("avdmanager", sdkRoot),
    sdkmanager: await resolveTool("sdkmanager", sdkRoot),
    scrcpy: await resolveTool("scrcpy", sdkRoot),
    aapt: await resolveTool("aapt", sdkRoot),
    aapt2: await resolveTool("aapt2", sdkRoot),
    tcpdump: await resolveTool("tcpdump", sdkRoot),
    mitmproxy: await resolveTool("mitmproxy", sdkRoot),
    frida: await resolveTool("frida", sdkRoot),
  }
  const kvm = probeKvm()
  const systemImages = listSystemImages(sdkRoot)
  const installed = Boolean(tools.adb || tools.emulator || tools.avdmanager || sdkRoot)
  const guidance = installed ? [] : installGuidance({ sdkRoot, tools, kvm })
  // Even when partially installed, surface remaining gaps as short notes.
  const notes: string[] = []
  if (installed) {
    if (!tools.adb) notes.push("adb not found — install platform-tools.")
    if (!tools.emulator) notes.push("emulator binary not found — install the emulator package via sdkmanager.")
    if (!tools.avdmanager) notes.push("avdmanager not found — install cmdline-tools;latest.")
    if (systemImages.length === 0) {
      notes.push('No system images detected. Install one, e.g. sdkmanager "system-images;android-34;google_apis;x86_64".')
    }
  }
  return {
    installed,
    sdkRoot,
    avdHome,
    tools,
    kvm,
    systemImages,
    guidance: installed ? notes : guidance,
    note: installed
      ? "SDK probe is server-side only (env + well-known paths + allowlisted `which`). No client input is used."
      : "SDK not installed — no devices are fabricated. Follow the install guidance, then refresh.",
  }
}

export function toolEnv(sdkRoot: string | null, avdHome: string | null): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env }
  if (sdkRoot) {
    env.ANDROID_SDK_ROOT = sdkRoot
    env.ANDROID_HOME = sdkRoot
    const extras = [
      path.join(sdkRoot, "platform-tools"),
      path.join(sdkRoot, "emulator"),
      path.join(sdkRoot, "cmdline-tools", "latest", "bin"),
    ]
    env.PATH = `${extras.join(path.delimiter)}${path.delimiter}${env.PATH || ""}`
  }
  if (avdHome) env.ANDROID_AVD_HOME = avdHome
  return env
}
