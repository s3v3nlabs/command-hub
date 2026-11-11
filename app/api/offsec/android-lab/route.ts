export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { requireHubAuth } from "@/lib/security/api-auth"
import { recordIdsThreat } from "@/lib/security/ids-status"
import {
  LAB_ACTIONS,
  LabInputError,
  acceptLicenses,
  addForward,
  assessDevice,
  createAvd,
  deleteAvd,
  detectSdk,
  getSelectedSerial,
  installApk,
  installSystemImage,
  labWorkspace,
  listAvds,
  listDevices,
  listForwards,
  listPackages,
  listWorkspaceApks,
  logcatDump,
  packageInfo,
  proxyClear,
  proxyReverse,
  pullFile,
  pushFile,
  removeForward,
  screenshot,
  setSelectedSerial,
  shell,
  startAvd,
  startScrcpy,
  staticApkInfo,
  stopAvd,
  uninstallPkg,
  assertSerial,
  type GpuMode,
  type LabAction,
} from "@/lib/offsec/android-lab"

function denied(req: NextRequest) {
  return requireHubAuth(req, { surface: "offsec:android-lab", requireInSecureMode: true })
}

async function statusPayload() {
  const sdk = await detectSdk()
  const workspace = labWorkspace()
  let avds: Awaited<ReturnType<typeof listAvds>> = []
  let devices: Awaited<ReturnType<typeof listDevices>> = []
  let deviceError: string | undefined
  let avdError: string | undefined
  if (sdk.tools.avdmanager || sdk.tools.emulator) {
    try {
      avds = await listAvds(sdk)
    } catch (e) {
      avdError = e instanceof Error ? e.message : String(e)
    }
  }
  if (sdk.tools.adb) {
    try {
      devices = await listDevices(sdk)
    } catch (e) {
      deviceError = e instanceof Error ? e.message : String(e)
    }
  }
  const runningNames = new Set(devices.map((d) => d.avdName).filter(Boolean) as string[])
  for (const a of avds) a.running = runningNames.has(a.name)
  const selected = getSelectedSerial()
  return {
    ok: true,
    sdk,
    avds,
    devices,
    selectedSerial: selected,
    workspace: { root: workspace.root, apks: workspace.apks, push: workspace.push, pull: workspace.pull },
    apks: listWorkspaceApks(),
    avdError,
    deviceError,
    legal:
      "Use only on emulators and apps you own or are authorized to test. See LEGAL.md. Reaching a real external device requires the staged authorization model (USAGE.md).",
    lattice_sync: false,
  }
}

export async function GET(request: NextRequest) {
  const auth = denied(request)
  if (auth) return auth
  try {
    const data = await statusPayload()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "status_failed" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = denied(request)
  if (auth) return auth

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const action = body.action
  if (typeof action !== "string" || !(LAB_ACTIONS as readonly string[]).includes(action)) {
    return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 })
  }
  const act = action as LabAction

  try {
    const sdk = await detectSdk()

    if (act === "status") {
      return NextResponse.json(await statusPayload())
    }

    if (act === "select_device") {
      if (body.serial == null || body.serial === "") {
        setSelectedSerial(null)
        return NextResponse.json({ ok: true, selectedSerial: null })
      }
      const serial = assertSerial(body.serial)
      setSelectedSerial(serial)
      return NextResponse.json({ ok: true, selectedSerial: serial })
    }

    if (act === "list_apks") {
      const fileName = typeof body.file === "string" ? body.file : undefined
      const info = fileName ? await staticApkInfo(sdk, fileName) : undefined
      return NextResponse.json({ ok: true, apks: listWorkspaceApks(), info })
    }

    // Everything below needs at least a partial SDK. Never fabricate results.
    const needsEmulator = act === "create_avd" || act === "start_avd" || act === "delete_avd" || act === "install_system_image" || act === "accept_licenses"
    const needsAdb = !needsEmulator

    if (needsEmulator && !sdk.installed && !sdk.tools.avdmanager && !sdk.tools.emulator && !sdk.tools.sdkmanager) {
      return NextResponse.json(
        { ok: false, error: "sdk_not_installed", guidance: sdk.guidance, note: sdk.note },
        { status: 503 },
      )
    }
    if (needsAdb && !sdk.tools.adb) {
      return NextResponse.json(
        { ok: false, error: "adb_not_installed", guidance: sdk.guidance, note: sdk.note },
        { status: 503 },
      )
    }

    if (act === "create_avd") {
      const result = await createAvd(sdk, {
        name: String(body.name || ""),
        package: String(body.package || ""),
        device: body.device ? String(body.device) : "pixel",
      })
      return NextResponse.json({ ...result, status: await statusPayload() })
    }

    if (act === "start_avd") {
      const gpu = body.gpu
      const allowedGpu: GpuMode[] = ["auto", "swiftshader_indirect", "host", "off"]
      const gpuMode = typeof gpu === "string" && (allowedGpu as string[]).includes(gpu) ? (gpu as GpuMode) : undefined
      const result = await startAvd(sdk, {
        name: String(body.name || ""),
        noWindow: body.noWindow !== false,
        gpu: gpuMode,
        wipeData: body.wipeData === true,
      })
      return NextResponse.json({ ok: result.ok, pid: result.pid, args: result.args, note: "Emulator started detached. Refresh devices in a few seconds while it boots." })
    }

    if (act === "stop_avd") {
      const result = await stopAvd(sdk, String(body.serial || body.name || ""))
      return NextResponse.json({ ...result })
    }

    if (act === "delete_avd") {
      const result = await deleteAvd(sdk, String(body.name || ""))
      return NextResponse.json({ ...result })
    }

    if (act === "install_system_image") {
      const result = await installSystemImage(sdk, String(body.package || ""))
      return NextResponse.json({ ...result })
    }

    if (act === "accept_licenses") {
      const result = await acceptLicenses(sdk)
      return NextResponse.json({ ...result })
    }

    if (act === "shell") {
      if (process.env.ADB_SHELL_ENABLED !== "1") {
        recordIdsThreat({
          severity: "high",
          source: "android-lab-shell",
          message: "Android Lab shell invoked while ADB_SHELL_ENABLED!=1",
          blocked: true,
        })
        return NextResponse.json(
          { ok: false, error: "adb_shell_disabled", detail: "Set ADB_SHELL_ENABLED=1 on an isolated lab host to enable the interactive shell." },
          { status: 403 },
        )
      }
      const result = await shell(sdk, String(body.serial || ""), String(body.command || ""))
      return NextResponse.json({ ok: result.ok, output: result.output })
    }

    if (act === "install_apk") {
      const result = await installApk(sdk, String(body.serial || ""), String(body.file || ""))
      return NextResponse.json({ ok: result.ok, output: result.output })
    }

    if (act === "uninstall") {
      const result = await uninstallPkg(sdk, String(body.serial || ""), String(body.packageName || body.package || ""))
      return NextResponse.json({ ok: result.ok, output: result.output })
    }

    if (act === "push") {
      const result = await pushFile(sdk, String(body.serial || ""), String(body.file || ""), String(body.remote || ""))
      return NextResponse.json({ ok: result.ok, output: result.output })
    }

    if (act === "pull") {
      const result = await pullFile(sdk, String(body.serial || ""), String(body.remote || ""), body.dest ? String(body.dest) : undefined)
      return NextResponse.json({ ok: result.ok, output: result.output, savedAs: result.savedAs })
    }

    if (act === "logcat") {
      const result = await logcatDump(sdk, String(body.serial || ""), {
        lines: typeof body.lines === "number" ? body.lines : undefined,
        filter: typeof body.filter === "string" ? body.filter : undefined,
      })
      return NextResponse.json({ ok: result.ok, output: result.output })
    }

    if (act === "screenshot") {
      const result = await screenshot(sdk, String(body.serial || ""))
      return NextResponse.json({ ok: result.ok, mime: result.mime, base64: result.base64, bytes: result.bytes })
    }

    if (act === "forward") {
      const result = await addForward(sdk, String(body.serial || ""), String(body.local || ""), String(body.remote || ""))
      return NextResponse.json({ ok: result.ok, output: result.output, forwards: await listForwards(sdk, String(body.serial || "")) })
    }

    if (act === "unforward") {
      const result = await removeForward(sdk, String(body.serial || ""), String(body.local || ""))
      return NextResponse.json({ ok: result.ok, output: result.output })
    }

    if (act === "list_forwards") {
      const forwards = await listForwards(sdk, body.serial ? String(body.serial) : undefined)
      return NextResponse.json({ ok: true, forwards })
    }

    if (act === "packages") {
      const packages = await listPackages(sdk, String(body.serial || ""), body.all !== true)
      return NextResponse.json({ ok: true, packages })
    }

    if (act === "package_info") {
      const info = await packageInfo(sdk, String(body.serial || ""), String(body.packageName || body.package || ""))
      return NextResponse.json({ ok: true, info })
    }

    if (act === "assessment") {
      const assessment = await assessDevice(sdk, String(body.serial || ""))
      return NextResponse.json({ ok: true, assessment })
    }

    if (act === "start_scrcpy") {
      const result = await startScrcpy(sdk, String(body.serial || ""))
      return NextResponse.json(result)
    }

    if (act === "proxy_reverse") {
      const result = await proxyReverse(sdk, String(body.serial || ""), body.hostPort, body.devicePort)
      return NextResponse.json({ ok: result.ok, output: result.output })
    }

    if (act === "proxy_clear") {
      const result = await proxyClear(sdk, String(body.serial || ""))
      return NextResponse.json({ ok: result.ok, output: result.output })
    }

    return NextResponse.json({ ok: false, error: "unhandled_action" }, { status: 400 })
  } catch (e) {
    if (e instanceof LabInputError) {
      return NextResponse.json({ ok: false, error: "invalid_input", detail: e.message }, { status: 400 })
    }
    const message = e instanceof Error ? e.message : "action_failed"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
