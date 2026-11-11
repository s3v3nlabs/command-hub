/**
 * AVD lifecycle: list / create / start / stop / delete.
 * All subprocesses use argument arrays; names are validated first.
 */

import { runFile, spawnDetached } from "./exec"
import { parseAvdManagerList, parseEmulatorAvdNames } from "./parse"
import type { GpuMode, ParsedAvd, SdkStatus } from "./types"
import { assertAvdName, assertDeviceProfile, assertSdkPackage } from "./validate"
import { toolEnv } from "./sdk"

function need(bin: string | null, label: string): string {
  if (!bin) throw new Error(`${label} is not installed on this host`)
  return bin
}

export async function listAvds(sdk: SdkStatus): Promise<ParsedAvd[]> {
  const env = toolEnv(sdk.sdkRoot, sdk.avdHome)
  if (sdk.tools.avdmanager) {
    const r = await runFile(sdk.tools.avdmanager, ["list", "avd"], { timeoutMs: 15_000, env })
    const parsed = parseAvdManagerList(r.stdout + "\n" + r.stderr)
    if (parsed.length > 0 || r.code === 0) return parsed
  }
  if (sdk.tools.emulator) {
    const r = await runFile(sdk.tools.emulator, ["-list-avds"], { timeoutMs: 15_000, env })
    return parseEmulatorAvdNames(r.stdout).map((name) => ({ name }))
  }
  return []
}

export async function createAvd(
  sdk: SdkStatus,
  opts: { name: string; package: string; device?: string },
): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  const bin = need(sdk.tools.avdmanager, "avdmanager")
  const name = assertAvdName(opts.name)
  const pkg = assertSdkPackage(opts.package)
  const args = ["create", "avd", "-n", name, "-k", pkg, "--force"]
  if (opts.device) args.push("--device", assertDeviceProfile(opts.device))
  const env = toolEnv(sdk.sdkRoot, sdk.avdHome)
  // avdmanager prompts "Do you wish to create a custom hardware profile? [no]"
  const r = await runFile(bin, args, { timeoutMs: 30_000, env, input: "no\n" })
  return { ok: r.code === 0, stdout: r.stdout, stderr: r.stderr }
}

export async function deleteAvd(sdk: SdkStatus, nameRaw: string): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  const bin = need(sdk.tools.avdmanager, "avdmanager")
  const name = assertAvdName(nameRaw)
  const env = toolEnv(sdk.sdkRoot, sdk.avdHome)
  const r = await runFile(bin, ["delete", "avd", "-n", name], { timeoutMs: 20_000, env })
  return { ok: r.code === 0, stdout: r.stdout, stderr: r.stderr }
}

export async function startAvd(
  sdk: SdkStatus,
  opts: { name: string; noWindow?: boolean; gpu?: GpuMode; wipeData?: boolean },
): Promise<{ ok: boolean; pid: number | undefined; args: string[] }> {
  const bin = need(sdk.tools.emulator, "emulator")
  const name = assertAvdName(opts.name)
  const gpu: GpuMode = opts.gpu ?? (sdk.kvm.writable ? "auto" : "swiftshader_indirect")
  const args = ["-avd", name, "-netdelay", "none", "-netspeed", "full"]
  if (opts.noWindow !== false) args.push("-no-window")
  args.push("-gpu", gpu)
  if (!sdk.kvm.writable) args.push("-accel", "off")
  else args.push("-accel", "on")
  if (opts.wipeData) args.push("-wipe-data")
  const env = toolEnv(sdk.sdkRoot, sdk.avdHome)
  const child = spawnDetached(bin, args, env)
  return { ok: Boolean(child.pid), pid: child.pid, args }
}

export async function installSystemImage(
  sdk: SdkStatus,
  pkgRaw: string,
): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  const bin = need(sdk.tools.sdkmanager, "sdkmanager")
  const pkg = assertSdkPackage(pkgRaw)
  const args: string[] = []
  if (sdk.sdkRoot) args.push(`--sdk_root=${sdk.sdkRoot}`)
  args.push(pkg)
  const env = toolEnv(sdk.sdkRoot, sdk.avdHome)
  const r = await runFile(bin, args, { timeoutMs: 180_000, env, input: "y\n".repeat(80) })
  return { ok: r.code === 0, stdout: r.stdout.slice(-4000), stderr: r.stderr.slice(-4000) }
}

export async function acceptLicenses(sdk: SdkStatus): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  const bin = need(sdk.tools.sdkmanager, "sdkmanager")
  const args: string[] = ["--licenses"]
  if (sdk.sdkRoot) args.push(`--sdk_root=${sdk.sdkRoot}`)
  const env = toolEnv(sdk.sdkRoot, sdk.avdHome)
  const r = await runFile(bin, args, { timeoutMs: 60_000, env, input: "y\n".repeat(80) })
  return { ok: r.code === 0, stdout: r.stdout.slice(-2000), stderr: r.stderr.slice(-2000) }
}
