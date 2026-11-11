import { describe, it, expect } from "vitest"
import {
  LabInputError,
  assertAvdName,
  assertSerial,
  assertSdkPackage,
  assertDeviceProfile,
  assertPort,
  assertForwardSpec,
  assertPackageName,
  assertShellCommand,
  assertWorkspaceRelPath,
  assertDevicePath,
  parseAdbDevices,
  parseEmulatorAvdNames,
  parseAvdManagerList,
  parsePmPackages,
  parseGetprop,
  parseAdbForwards,
  parseDumpsysPackage,
  parseAaptBadging,
  systemImageEntriesToPackages,
  isEmulatorSerial,
} from "@/lib/offsec/android-lab"

describe("android-lab input validation", () => {
  it("accepts well-formed AVD names and rejects junk", () => {
    expect(assertAvdName("hub-lab-34")).toBe("hub-lab-34")
    expect(assertAvdName("Pixel_6_API_34")).toBe("Pixel_6_API_34")
    expect(() => assertAvdName("has space")).toThrow(LabInputError)
    expect(() => assertAvdName("foo;rm")).toThrow(LabInputError)
    expect(() => assertAvdName("../x")).toThrow(LabInputError)
    expect(() => assertAvdName("")).toThrow(LabInputError)
  })

  it("accepts emulator and physical serials, rejects metacharacters", () => {
    expect(assertSerial("emulator-5554")).toBe("emulator-5554")
    expect(assertSerial("R58M12ABCDEF")).toBe("R58M12ABCDEF")
    expect(assertSerial("192.168.1.20:5555")).toBe("192.168.1.20:5555")
    expect(() => assertSerial("emulator-5554;id")).toThrow(LabInputError)
    expect(() => assertSerial("emulator-5554$(id)")).toThrow(LabInputError)
    expect(() => assertSerial("")).toThrow(LabInputError)
  })

  it("validates sdk package paths, profiles, ports, forwards, packages", () => {
    expect(assertSdkPackage("system-images;android-34;google_apis;x86_64")).toContain("android-34")
    expect(() => assertSdkPackage("system-images;android-34;google_apis;x86_64 && reboot")).toThrow(LabInputError)
    expect(assertDeviceProfile("pixel_6")).toBe("pixel_6")
    expect(() => assertDeviceProfile("pixel;rm")).toThrow(LabInputError)
    expect(assertPort("8080")).toBe(8080)
    expect(assertPort(443)).toBe(443)
    expect(() => assertPort(0)).toThrow(LabInputError)
    expect(() => assertPort(70000)).toThrow(LabInputError)
    expect(assertForwardSpec("tcp:8080")).toBe("tcp:8080")
    expect(assertForwardSpec("localabstract:scrcpy")).toBe("localabstract:scrcpy")
    expect(() => assertForwardSpec("tcp:8080;rm")).toThrow(LabInputError)
    expect(assertPackageName("com.example.app")).toBe("com.example.app")
    expect(() => assertPackageName("com")).toThrow(LabInputError)
    expect(() => assertPackageName("com.example;rm")).toThrow(LabInputError)
  })

  it("allowlists shell commands and rejects metacharacters / chaining", () => {
    expect(assertShellCommand("pm list packages -3")).toBe("pm list packages -3")
    expect(assertShellCommand("getprop ro.build.version.release")).toContain("getprop")
    expect(() => assertShellCommand("pm list packages; reboot")).toThrow(LabInputError)
    expect(() => assertShellCommand("id && reboot")).toThrow(LabInputError)
    expect(() => assertShellCommand("echo `id`")).toThrow(LabInputError)
    expect(() => assertShellCommand("cat /proc/$(id)")).toThrow(LabInputError)
  })

  it("keeps file paths inside the workspace and device paths absolute+safe", () => {
    expect(assertWorkspaceRelPath("sample.apk")).toBe("sample.apk")
    expect(assertWorkspaceRelPath("sub/dir/app.apk")).toBe("sub/dir/app.apk")
    expect(() => assertWorkspaceRelPath("../etc/passwd")).toThrow(LabInputError)
    expect(() => assertWorkspaceRelPath("/tmp/x.apk")).toThrow(LabInputError)
    expect(() => assertWorkspaceRelPath("foo;rm")).toThrow(LabInputError)
    expect(assertDevicePath("/sdcard/Download/app.apk")).toBe("/sdcard/Download/app.apk")
    expect(() => assertDevicePath("sdcard/x")).toThrow(LabInputError)
    expect(() => assertDevicePath("/sdcard/../data")).toThrow(LabInputError)
  })
})

describe("android-lab adb/avd output parsing", () => {
  it("parses adb devices -l including emulator, unauthorized, and empty", () => {
    const out = `List of devices attached
emulator-5554          device product:sdk_gphone64_x86_64 model:sdk_gphone64_x86_64 device:emu64xa transport_id:1
R58M12ABCDEF           unauthorized usb:1-1.2 transport_id:2
192.168.1.20:5555      offline

`
    const d = parseAdbDevices(out)
    expect(d).toHaveLength(3)
    expect(d[0].serial).toBe("emulator-5554")
    expect(d[0].state).toBe("device")
    expect(d[0].isEmulator).toBe(true)
    expect(d[0].model).toBe("sdk_gphone64_x86_64")
    expect(d[1].serial).toBe("R58M12ABCDEF")
    expect(d[1].state).toBe("unauthorized")
    expect(d[1].isEmulator).toBe(false)
    expect(d[1].usb).toBe("1-1.2")
    expect(d[2].state).toBe("offline")
    expect(parseAdbDevices("List of devices attached\n")).toEqual([])
    expect(isEmulatorSerial("emulator-5556")).toBe(true)
    expect(isEmulatorSerial("PIXEL6")).toBe(false)
  })

  it("parses emulator -list-avds and avdmanager list avd blocks", () => {
    expect(parseEmulatorAvdNames("hub-lab-34\nPixel_6_API_34\nINFO    | ignored\n")).toEqual([
      "hub-lab-34",
      "Pixel_6_API_34",
    ])
    const block = `
Available Android Virtual Devices:
    Name: hub-lab-34
    Device: pixel (Google)
    Path: /home/op/.android/avd/hub-lab-34.avd
    Target: Google APIs (Google Inc.)
            Based on: Android 14.0 ("UpsideDownCake") Tag/ABI: google_apis/x86_64
    Sdcard: 512M
---------
    Name: Pixel_6_API_33
    Device: pixel_6 (Google)
    Path: /home/op/.android/avd/Pixel_6_API_33.avd
    Target: Default Android System Image
            Based on: Android 13.0 Tag/ABI: google_apis/x86_64
    Sdcard: 512 MB
`
    const avds = parseAvdManagerList(block)
    expect(avds).toHaveLength(2)
    expect(avds[0].name).toBe("hub-lab-34")
    expect(avds[0].device).toMatch(/pixel/i)
    expect(avds[0].abi).toBe("google_apis/x86_64")
    expect(avds[0].path).toContain("hub-lab-34.avd")
    expect(avds[1].name).toBe("Pixel_6_API_33")
  })

  it("parses pm packages, getprop, forwards, dumpsys, aapt, and system-image dirs", () => {
    const pkgs = parsePmPackages(`package:/data/app/~~xx/com.example-yy/base.apk=com.example
package:com.android.settings
`)
    expect(pkgs).toEqual([
      { apkPath: "/data/app/~~xx/com.example-yy/base.apk", packageName: "com.example" },
      { packageName: "com.android.settings" },
    ])

    const props = parseGetprop(`[ro.build.version.release]: [14]
[ro.product.model]: [sdk_gphone64_x86_64]
[ro.boot.qemu]: [1]
`)
    expect(props["ro.build.version.release"]).toBe("14")
    expect(props["ro.boot.qemu"]).toBe("1")

    const fw = parseAdbForwards(`emulator-5554 tcp:8080 tcp:8080
emulator-5554 tcp:9222 tcp:9222
`)
    expect(fw).toHaveLength(2)
    expect(fw[0]).toEqual({ serial: "emulator-5554", local: "tcp:8080", remote: "tcp:8080" })

    const info = parseDumpsysPackage(
      `Packages:
  Package [com.example.app] (abc):
    versionCode=12 minSdk=24 targetSdk=34
    versionName=1.2.3
    firstInstallTime=2026-01-02 03:04:05
    lastUpdateTime=2026-01-03 03:04:05
    codePath=/data/app/~~x/com.example.app-y
    requested permissions:
      android.permission.INTERNET
      android.permission.CAMERA
    install permissions:
      android.permission.INTERNET: granted=true
`,
      "com.example.app",
    )
    expect(info.packageName).toBe("com.example.app")
    expect(info.versionName).toBe("1.2.3")
    expect(info.versionCode).toBe("12")
    expect(info.targetSdk).toBe("34")
    expect(info.permissions).toContain("android.permission.INTERNET")
    expect(info.permissions).toContain("android.permission.CAMERA")

    const badging = parseAaptBadging(
      "package: name='com.example.app' versionCode='12' versionName='1.2.3'\nsdkVersion:'24'\ntargetSdkVersion:'34'\napplication-label:'Demo'\nuses-permission: name='android.permission.INTERNET'\n",
    )
    expect(badging.packageName).toBe("com.example.app")
    expect(badging.label).toBe("Demo")
    expect(badging.permissions).toEqual(["android.permission.INTERNET"])

    expect(systemImageEntriesToPackages(["android-34/google_apis/x86_64", "system-images/android-33/default/arm64-v8a"])).toEqual([
      "system-images;android-33;default;arm64-v8a",
      "system-images;android-34;google_apis;x86_64",
    ])
  })
})
