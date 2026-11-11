/**
 * Android Virtual Device lab types.
 * Operates on the operator's OWN local emulators / authorized devices only.
 */

export const LAB_ACTIONS = [
  "status",
  "create_avd",
  "start_avd",
  "stop_avd",
  "delete_avd",
  "install_system_image",
  "accept_licenses",
  "shell",
  "install_apk",
  "uninstall",
  "push",
  "pull",
  "logcat",
  "screenshot",
  "forward",
  "unforward",
  "list_forwards",
  "packages",
  "package_info",
  "assessment",
  "start_scrcpy",
  "proxy_reverse",
  "proxy_clear",
  "select_device",
  "list_apks",
] as const

export type LabAction = (typeof LAB_ACTIONS)[number]

export type GpuMode = "auto" | "swiftshader_indirect" | "host" | "off"

export interface SdkToolPaths {
  adb: string | null
  emulator: string | null
  avdmanager: string | null
  sdkmanager: string | null
  scrcpy: string | null
  aapt: string | null
  aapt2: string | null
  tcpdump: string | null
  mitmproxy: string | null
  frida: string | null
}

export interface SdkStatus {
  installed: boolean
  sdkRoot: string | null
  avdHome: string | null
  tools: SdkToolPaths
  kvm: { present: boolean; writable: boolean; path: string }
  systemImages: string[]
  guidance: string[]
  note: string
}

export interface ParsedAdbDevice {
  serial: string
  state: string
  product?: string
  model?: string
  device?: string
  transportId?: string
  usb?: string
  isEmulator: boolean
  avdName?: string
}

export interface ParsedAvd {
  name: string
  device?: string
  path?: string
  target?: string
  abi?: string
  sdcard?: string
  running?: boolean
}

export interface ParsedPackage {
  packageName: string
  apkPath?: string
}

export interface PackageInfo {
  packageName: string
  versionName?: string
  versionCode?: string
  firstInstallTime?: string
  lastUpdateTime?: string
  apkPath?: string
  permissions: string[]
  targetSdk?: string
}

export interface AdbForward {
  serial: string
  local: string
  remote: string
}

export interface TrafficHooks {
  host: {
    tcpdump: boolean
    mitmproxy: boolean
    frida: boolean
    scrcpy: boolean
  }
  notes: string[]
}

export interface DeviceAssessment {
  serial: string
  isEmulator: boolean
  props: Record<string, string>
  packages: ParsedPackage[]
  packageCount: number
  forwards: AdbForward[]
  hooks: TrafficHooks
}

export interface LabWorkspace {
  root: string
  apks: string
  push: string
  pull: string
  pcap: string
}
