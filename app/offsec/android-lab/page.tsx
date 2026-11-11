"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Smartphone,
  RefreshCw,
  Play,
  Square,
  Trash2,
  Terminal,
  Package,
  FolderUp,
  FolderDown,
  ScrollText,
  ArrowLeftRight,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Monitor,
  Shield,
  Upload,
} from "lucide-react"
import { SuiteShell, SuiteNavLink } from "@/components/offsec/suite-shell"

type ToolPaths = {
  adb: string | null
  emulator: string | null
  avdmanager: string | null
  sdkmanager: string | null
  scrcpy: string | null
  aapt: string | null
  tcpdump: string | null
  mitmproxy: string | null
  frida: string | null
}

type Sdk = {
  installed: boolean
  sdkRoot: string | null
  avdHome: string | null
  tools: ToolPaths
  kvm: { present: boolean; writable: boolean; path: string }
  systemImages: string[]
  guidance: string[]
  note: string
}

type Avd = { name: string; device?: string; path?: string; target?: string; abi?: string; sdcard?: string; running?: boolean }
type Device = { serial: string; state: string; product?: string; model?: string; isEmulator: boolean; avdName?: string }
type Pkg = { packageName: string; apkPath?: string }
type Assessment = {
  serial: string
  isEmulator: boolean
  props: Record<string, string>
  packages: Pkg[]
  packageCount: number
  forwards: { serial: string; local: string; remote: string }[]
  hooks: { host: Record<string, boolean>; notes: string[] }
}

type Status = {
  ok: boolean
  sdk: Sdk
  avds: Avd[]
  devices: Device[]
  selectedSerial: string | null
  workspace: { root: string; apks: string; push: string; pull: string }
  apks: string[]
  guidance?: string[]
  avdError?: string
  deviceError?: string
  legal?: string
  error?: string
  detail?: string
}

type Tab = "shell" | "apps" | "files" | "logcat" | "forwards" | "assess"

export default function AndroidLabPage() {
  const [data, setData] = useState<Status | null>(null)
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const [newName, setNewName] = useState("hub-lab-34")
  const [newPkg, setNewPkg] = useState("system-images;android-34;google_apis;x86_64")
  const [newDevice, setNewDevice] = useState("pixel")

  const [selected, setSelected] = useState<string>("")
  const [live, setLive] = useState(false)
  const [frame, setFrame] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>("apps")

  const [shellCmd, setShellCmd] = useState("getprop ro.build.version.release")
  const [shellOut, setShellOut] = useState("")
  const [logcatOut, setLogcatOut] = useState("")
  const [packages, setPackages] = useState<Pkg[]>([])
  const [pkgInfo, setPkgInfo] = useState<string>("")
  const [apkFile, setApkFile] = useState("")
  const [remotePath, setRemotePath] = useState("/sdcard/Download/")
  const [hostFile, setHostFile] = useState("")
  const [fwdLocal, setFwdLocal] = useState("tcp:8080")
  const [fwdRemote, setFwdRemote] = useState("tcp:8080")
  const [proxyPort, setProxyPort] = useState("8080")
  const [assessment, setAssessment] = useState<Assessment | null>(null)

  const liveTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const headers = useCallback(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" }
    if (token) h.Authorization = `Bearer ${token}`
    return h
  }, [token])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = (await fetch("/api/offsec/android-lab", { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then((r) => r.json())) as Status
      setData(d)
      if (d?.ok) {
        setSelected((s) => s || d.selectedSerial || d.devices?.[0]?.serial || "")
      }
      if (!d?.ok) setErr(d?.error || d?.detail || "Failed to load lab status")
      else setErr(null)
    } catch (e) {
      setErr(e instanceof Error ? e.message : "network error")
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  const act = useCallback(
    async (action: string, body: Record<string, unknown> = {}) => {
      setBusy(action)
      setErr(null)
      setMsg(null)
      try {
        const d = await fetch("/api/offsec/android-lab", {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({ action, ...body }),
        }).then((r) => r.json())
        if (!d?.ok) {
          setErr(d?.detail || d?.error || "action failed")
          return d
        }
        if (typeof d.output === "string") setMsg(d.output.slice(0, 4000))
        else if (d.note) setMsg(d.note)
        return d
      } catch (e) {
        setErr(e instanceof Error ? e.message : "network error")
        return null
      } finally {
        setBusy(null)
      }
    },
    [headers],
  )

  const selectDevice = async (serial: string) => {
    setSelected(serial)
    await act("select_device", { serial })
  }

  const grabFrame = useCallback(async () => {
    if (!selected) return
    const d = await act("screenshot", { serial: selected })
    if (d?.ok && d.base64) setFrame(`data:${d.mime || "image/png"};base64,${d.base64}`)
  }, [act, selected])

  useEffect(() => {
    if (liveTimer.current) {
      clearInterval(liveTimer.current)
      liveTimer.current = null
    }
    if (live && selected) {
      void grabFrame()
      liveTimer.current = setInterval(() => void grabFrame(), 2000)
    }
    return () => {
      if (liveTimer.current) clearInterval(liveTimer.current)
    }
  }, [live, selected, grabFrame])

  const images = useMemo(() => {
    const fromSdk = data?.sdk.systemImages || []
    const extra = newPkg && !fromSdk.includes(newPkg) ? [newPkg] : []
    return [...fromSdk, ...extra]
  }, [data, newPkg])

  const selectedDev = data?.devices.find((d) => d.serial === selected)

  return (
    <SuiteShell
      title="OFFSEC // ANDROID LAB"
      status="real"
      nav={
        <>
          <SuiteNavLink href="/offsec" label="Arsenal" />
          <SuiteNavLink href="/offsec/phone" label="Phone Suite" />
          <SuiteNavLink href="/offsec/hardware" label="Hardware & RF" />
          <SuiteNavLink href="/offsec/lab" label="WIP Lab" />
        </>
      }
    >
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="ghost-glass ghost-brackets rounded-[2px] p-4">
          <div className="flex items-center gap-2 font-mono text-sm uppercase tracking-[0.14em] text-[color:var(--ghost-ink)]">
            <Smartphone size={15} /> Mobile App Security Testing Lab
          </div>
          <p className="mt-1 text-[12px] text-[color:var(--ghost-dim)]">
            Disposable Android Virtual Devices on this host, managed from the hub. Boot an emulator, install an APK you
            own, inspect packages, capture logcat, and run a full app assessment against a throwaway virtual phone.
            These tools must only be used on devices and apps you own or are authorized to test — see{" "}
            <a href="/help" className="underline">
              LEGAL.md
            </a>{" "}
            and the staged authorization model in USAGE.md before pointing anything at a real external device.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1">
            <span className="ghost-label">Hub token (SECURE_MODE)</span>
            <input
              className="ghost-input font-mono"
              type="password"
              autoComplete="off"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="HUB_API_TOKEN"
            />
          </label>
          <button type="button" className="ghost-btn" onClick={() => void load()}>
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {err && (
          <div className="ghost-glass rounded-[2px] border border-red-900/60 p-3 font-mono text-[12px] text-red-300">
            <AlertTriangle size={12} className="mr-1 inline" /> {err}
          </div>
        )}
        {msg && (
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-[2px] border border-[color:var(--ghost-line)] bg-black/60 p-2 font-mono text-[11px] text-[color:var(--ghost-dim)]">
            {msg}
          </pre>
        )}

        <SdkBanner sdk={data?.sdk} loading={loading} />

        <div className="grid gap-4 lg:grid-cols-2">
          {/* AVD manager */}
          <section className="space-y-3">
            <h2 className="font-mono text-sm uppercase tracking-[0.12em] text-[color:var(--ghost-ink)]">Virtual devices</h2>

            <div className="ghost-glass ghost-brackets space-y-2 rounded-[2px] p-3">
              <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-[color:var(--ghost-dim)]">Create AVD</div>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="ghost-label">Name</span>
                  <input className="ghost-input font-mono" value={newName} onChange={(e) => setNewName(e.target.value)} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="ghost-label">Device profile</span>
                  <input className="ghost-input font-mono" value={newDevice} onChange={(e) => setNewDevice(e.target.value)} placeholder="pixel" />
                </label>
              </div>
              <label className="flex flex-col gap-1">
                <span className="ghost-label">System image</span>
                <select className="ghost-input font-mono" value={newPkg} onChange={(e) => setNewPkg(e.target.value)}>
                  {images.map((p) => (
                    <option key={p} value={p}>
                      {p}
                      {data?.sdk.systemImages.includes(p) ? "" : " (not installed)"}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="ghost-btn"
                  disabled={Boolean(busy) || !data?.sdk.tools.avdmanager}
                  onClick={async () => {
                    await act("create_avd", { name: newName, package: newPkg, device: newDevice })
                    await load()
                  }}
                >
                  Create AVD
                </button>
                <button
                  type="button"
                  className="ghost-btn"
                  disabled={Boolean(busy) || !data?.sdk.tools.sdkmanager}
                  onClick={async () => {
                    setMsg("Installing system image — this can take a few minutes…")
                    await act("install_system_image", { package: newPkg })
                    await load()
                  }}
                >
                  Install image
                </button>
                <button
                  type="button"
                  className="ghost-btn"
                  disabled={Boolean(busy) || !data?.sdk.tools.sdkmanager}
                  onClick={async () => {
                    await act("accept_licenses")
                    await load()
                  }}
                >
                  Accept licenses
                </button>
              </div>
            </div>

            {(data?.avds || []).length === 0 && (
              <p className="text-[11px] text-[color:var(--ghost-dim)]">
                {data?.sdk.installed ? "No AVDs yet. Create one above." : "SDK not installed — AVD list stays empty (nothing is faked)."}
              </p>
            )}
            <div className="space-y-2">
              {(data?.avds || []).map((a) => (
                <div key={a.name} className="ghost-glass ghost-brackets flex flex-wrap items-center justify-between gap-2 rounded-[2px] p-3">
                  <div>
                    <div className="font-mono text-[12px] text-[color:var(--ghost-ink)]">{a.name}</div>
                    <div className="font-mono text-[10px] text-[color:var(--ghost-faint)]">
                      {a.device || "device ?"} · {a.abi || a.target || "image ?"} {a.running ? "· RUNNING" : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {a.running ? (
                      <button
                        type="button"
                        className="ghost-btn"
                        disabled={Boolean(busy)}
                        onClick={async () => {
                          const dev = data?.devices.find((d) => d.avdName === a.name)
                          if (dev) await act("stop_avd", { serial: dev.serial })
                          await load()
                        }}
                      >
                        <Square size={11} /> Stop
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="ghost-btn"
                        disabled={Boolean(busy) || !data?.sdk.tools.emulator}
                        onClick={async () => {
                          await act("start_avd", { name: a.name, noWindow: true })
                          await load()
                        }}
                      >
                        <Play size={11} /> Start
                      </button>
                    )}
                    <button
                      type="button"
                      className="ghost-btn"
                      disabled={Boolean(busy) || a.running}
                      onClick={async () => {
                        if (!confirm(`Delete AVD ${a.name}?`)) return
                        await act("delete_avd", { name: a.name })
                        await load()
                      }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Live view + device picker */}
          <section className="space-y-3">
            <h2 className="font-mono text-sm uppercase tracking-[0.12em] text-[color:var(--ghost-ink)]">Device view</h2>
            <div className="ghost-glass ghost-brackets space-y-2 rounded-[2px] p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="ghost-label">Selected target</span>
                <select
                  className="ghost-input font-mono"
                  value={selected}
                  onChange={(e) => void selectDevice(e.target.value)}
                >
                  <option value="">— none —</option>
                  {(data?.devices || []).map((d) => (
                    <option key={d.serial} value={d.serial}>
                      {d.serial} · {d.state}
                      {d.avdName ? ` · ${d.avdName}` : ""}
                      {d.isEmulator ? " · emulator" : " · physical"}
                    </option>
                  ))}
                </select>
                <button type="button" className="ghost-btn" disabled={!selected || Boolean(busy)} onClick={() => void grabFrame()}>
                  <Camera size={11} /> Snapshot
                </button>
                <button type="button" className={`ghost-btn ${live ? "is-on" : ""}`} disabled={!selected} onClick={() => setLive((v) => !v)}>
                  <Monitor size={11} /> {live ? "Live on" : "Live off"}
                </button>
                <button
                  type="button"
                  className="ghost-btn"
                  disabled={!selected || Boolean(busy) || !data?.sdk.tools.scrcpy}
                  onClick={() => void act("start_scrcpy", { serial: selected })}
                  title={data?.sdk.tools.scrcpy ? "Open scrcpy on the host desktop" : "scrcpy not installed"}
                >
                  scrcpy (host)
                </button>
              </div>
              {selectedDev && (
                <div className="font-mono text-[10px] text-[color:var(--ghost-faint)]">
                  {selectedDev.model || selectedDev.product || "device"} · {selectedDev.isEmulator ? "emulator" : "physical (authorized devices only)"}
                </div>
              )}
              <div className="flex aspect-[9/16] max-h-[480px] items-center justify-center overflow-hidden rounded-[2px] border border-[color:var(--ghost-line)] bg-black">
                {frame ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={frame} alt="emulator framebuffer" className="h-full w-full object-contain" />
                ) : (
                  <div className="px-4 text-center font-mono text-[11px] text-[color:var(--ghost-faint)]">
                    {selected ? "No frame yet — snapshot or enable live view (adb screencap, ~2s interval)." : "Select a booted emulator to view its screen."}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Assessment + controls */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm uppercase tracking-[0.12em] text-[color:var(--ghost-ink)]">
            App assessment on selected target
          </h2>
          <div className="flex flex-wrap gap-1">
            {(
              [
                ["apps", "Apps", Package],
                ["shell", "Shell", Terminal],
                ["files", "Files", FolderUp],
                ["logcat", "Logcat", ScrollText],
                ["forwards", "Ports / proxy", ArrowLeftRight],
                ["assess", "Assessment", Shield],
              ] as const
            ).map(([id, label, Icon]) => (
              <button key={id} type="button" className={`ghost-chip inline-flex items-center gap-1 ${tab === id ? "accent" : ""}`} onClick={() => setTab(id)}>
                <Icon size={11} /> {label}
              </button>
            ))}
          </div>

          {tab === "apps" && (
            <div className="ghost-glass ghost-brackets space-y-3 rounded-[2px] p-3">
              <p className="text-[11px] text-[color:var(--ghost-dim)]">
                Drop APKs you own into the lab workspace <span className="font-mono">{data?.workspace.apks || "data/offsec/android-lab/apks"}</span> then install onto the selected emulator.
              </p>
              <div className="flex flex-wrap items-end gap-2">
                <label className="flex flex-col gap-1">
                  <span className="ghost-label">APK in workspace</span>
                  <select className="ghost-input font-mono" value={apkFile} onChange={(e) => setApkFile(e.target.value)}>
                    <option value="">— choose —</option>
                    {(data?.apks || []).map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="ghost-btn"
                  disabled={!selected || !apkFile || Boolean(busy)}
                  onClick={async () => {
                    await act("install_apk", { serial: selected, file: apkFile })
                    const d = await act("packages", { serial: selected })
                    if (d?.packages) setPackages(d.packages)
                  }}
                >
                  <Upload size={11} /> Install
                </button>
                <button
                  type="button"
                  className="ghost-btn"
                  disabled={!selected || Boolean(busy)}
                  onClick={async () => {
                    const d = await act("packages", { serial: selected })
                    if (d?.packages) setPackages(d.packages)
                  }}
                >
                  Refresh inventory
                </button>
              </div>
              <div className="max-h-64 overflow-auto">
                <table className="w-full font-mono text-[11px]">
                  <thead className="text-[color:var(--ghost-faint)]">
                    <tr>
                      <th className="text-left">Package</th>
                      <th className="text-left">APK path</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {packages.map((p) => (
                      <tr key={p.packageName} className="border-t border-[color:var(--ghost-line)]">
                        <td className="py-1 text-[color:var(--ghost-ink)]">{p.packageName}</td>
                        <td className="text-[color:var(--ghost-faint)]">{p.apkPath}</td>
                        <td className="text-right">
                          <button
                            type="button"
                            className="ghost-btn"
                            onClick={async () => {
                              const d = await act("package_info", { serial: selected, packageName: p.packageName })
                              if (d?.info) setPkgInfo(JSON.stringify(d.info, null, 2))
                            }}
                          >
                            info
                          </button>
                          <button
                            type="button"
                            className="ghost-btn"
                            onClick={async () => {
                              if (!confirm(`Uninstall ${p.packageName}?`)) return
                              await act("uninstall", { serial: selected, packageName: p.packageName })
                              const d = await act("packages", { serial: selected })
                              if (d?.packages) setPackages(d.packages)
                            }}
                          >
                            remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {packages.length === 0 && <p className="text-[11px] text-[color:var(--ghost-faint)]">No third-party packages loaded yet.</p>}
              </div>
              {pkgInfo && <pre className="max-h-48 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-[color:var(--ghost-dim)]">{pkgInfo}</pre>}
            </div>
          )}

          {tab === "shell" && (
            <div className="ghost-glass ghost-brackets space-y-2 rounded-[2px] p-3">
              <p className="text-[11px] text-[color:var(--ghost-dim)]">
                Interactive shell on the selected emulator. Requires <span className="font-mono">ADB_SHELL_ENABLED=1</span>. Commands are allowlisted (no metacharacters) and executed as an argument array.
              </p>
              <div className="flex flex-wrap gap-2">
                <input
                  className="ghost-input min-w-[20rem] flex-1 font-mono"
                  value={shellCmd}
                  onChange={(e) => setShellCmd(e.target.value)}
                  placeholder="pm list packages -3"
                />
                <button
                  type="button"
                  className="ghost-btn"
                  disabled={!selected || Boolean(busy)}
                  onClick={async () => {
                    const d = await act("shell", { serial: selected, command: shellCmd })
                    if (d?.output != null) setShellOut(d.output)
                  }}
                >
                  <Terminal size={11} /> Run
                </button>
              </div>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-[color:var(--ghost-dim)]">{shellOut || "—"}</pre>
            </div>
          )}

          {tab === "files" && (
            <div className="ghost-glass ghost-brackets space-y-2 rounded-[2px] p-3">
              <p className="text-[11px] text-[color:var(--ghost-dim)]">
                Push from <span className="font-mono">{data?.workspace.push}</span> or <span className="font-mono">apks/</span>. Pull lands in <span className="font-mono">{data?.workspace.pull}</span>.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="ghost-label">Host file (workspace-relative)</span>
                  <input className="ghost-input font-mono" value={hostFile} onChange={(e) => setHostFile(e.target.value)} placeholder="sample.bin" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="ghost-label">Device path</span>
                  <input className="ghost-input font-mono" value={remotePath} onChange={(e) => setRemotePath(e.target.value)} />
                </label>
              </div>
              <div className="flex gap-2">
                <button type="button" className="ghost-btn" disabled={!selected || Boolean(busy)} onClick={() => void act("push", { serial: selected, file: hostFile, remote: remotePath })}>
                  <FolderUp size={11} /> Push
                </button>
                <button type="button" className="ghost-btn" disabled={!selected || Boolean(busy)} onClick={() => void act("pull", { serial: selected, remote: remotePath })}>
                  <FolderDown size={11} /> Pull
                </button>
              </div>
            </div>
          )}

          {tab === "logcat" && (
            <div className="ghost-glass ghost-brackets space-y-2 rounded-[2px] p-3">
              <button
                type="button"
                className="ghost-btn"
                disabled={!selected || Boolean(busy)}
                onClick={async () => {
                  const d = await act("logcat", { serial: selected, lines: 200 })
                  if (d?.output != null) setLogcatOut(d.output)
                }}
              >
                <ScrollText size={11} /> Dump last 200 lines
              </button>
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-[color:var(--ghost-dim)]">{logcatOut || "—"}</pre>
            </div>
          )}

          {tab === "forwards" && (
            <div className="ghost-glass ghost-brackets space-y-2 rounded-[2px] p-3">
              <p className="text-[11px] text-[color:var(--ghost-dim)]">
                adb port-forward and reverse-proxy hooks for traffic capture on this emulator (e.g. point mitmproxy at 8080, then reverse tcp:8080).
              </p>
              <div className="flex flex-wrap items-end gap-2">
                <label className="flex flex-col gap-1">
                  <span className="ghost-label">Local</span>
                  <input className="ghost-input font-mono" value={fwdLocal} onChange={(e) => setFwdLocal(e.target.value)} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="ghost-label">Remote</span>
                  <input className="ghost-input font-mono" value={fwdRemote} onChange={(e) => setFwdRemote(e.target.value)} />
                </label>
                <button type="button" className="ghost-btn" disabled={!selected || Boolean(busy)} onClick={() => void act("forward", { serial: selected, local: fwdLocal, remote: fwdRemote })}>
                  Forward
                </button>
                <button type="button" className="ghost-btn" disabled={!selected || Boolean(busy)} onClick={() => void act("unforward", { serial: selected, local: fwdLocal })}>
                  Remove
                </button>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <label className="flex flex-col gap-1">
                  <span className="ghost-label">Reverse proxy port</span>
                  <input className="ghost-input font-mono" value={proxyPort} onChange={(e) => setProxyPort(e.target.value)} />
                </label>
                <button type="button" className="ghost-btn" disabled={!selected || Boolean(busy)} onClick={() => void act("proxy_reverse", { serial: selected, hostPort: Number(proxyPort), devicePort: Number(proxyPort) })}>
                  adb reverse
                </button>
                <button type="button" className="ghost-btn" disabled={!selected || Boolean(busy)} onClick={() => void act("proxy_clear", { serial: selected })}>
                  Clear reverses
                </button>
              </div>
            </div>
          )}

          {tab === "assess" && (
            <div className="ghost-glass ghost-brackets space-y-2 rounded-[2px] p-3">
              <button
                type="button"
                className="ghost-btn"
                disabled={!selected || Boolean(busy)}
                onClick={async () => {
                  const d = await act("assessment", { serial: selected })
                  if (d?.assessment) {
                    setAssessment(d.assessment)
                    setPackages(d.assessment.packages || [])
                  }
                }}
              >
                <Shield size={11} /> Run assessment
              </button>
              {assessment && (
                <div className="space-y-2">
                  <div className="font-mono text-[11px] text-[color:var(--ghost-ink)]">
                    {assessment.serial} · {assessment.isEmulator ? "emulator" : "physical"} · {assessment.packageCount} third-party packages
                  </div>
                  <dl className="grid grid-cols-1 gap-1 font-mono text-[11px] sm:grid-cols-2">
                    {Object.entries(assessment.props).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <dt className="text-[color:var(--ghost-faint)]">{k}</dt>
                        <dd className="text-[color:var(--ghost-dim)]">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="font-mono text-[11px] text-[color:var(--ghost-dim)]">
                    Host hooks:{" "}
                    {Object.entries(assessment.hooks.host)
                      .map(([k, v]) => `${k}:${v ? "yes" : "no"}`)
                      .join(" · ")}
                  </div>
                  <ul className="space-y-1 text-[11px] text-[color:var(--ghost-dim)]">
                    {assessment.hooks.notes.map((n) => (
                      <li key={n}>› {n}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </SuiteShell>
  )
}

function SdkBanner({ sdk, loading }: { sdk?: Sdk; loading: boolean }) {
  if (!sdk) {
    return (
      <div className="ghost-glass rounded-[2px] p-3 font-mono text-[11px] text-[color:var(--ghost-dim)]">
        {loading ? "Probing Android SDK on the host…" : "No status yet."}
      </div>
    )
  }
  const toolBits = [
    ["adb", sdk.tools.adb],
    ["emulator", sdk.tools.emulator],
    ["avdmanager", sdk.tools.avdmanager],
    ["sdkmanager", sdk.tools.sdkmanager],
    ["scrcpy", sdk.tools.scrcpy],
  ] as const
  return (
    <div className="ghost-glass ghost-brackets space-y-2 rounded-[2px] p-3">
      <div className="flex flex-wrap items-center gap-2 font-mono text-[12px] text-[color:var(--ghost-ink)]">
        {sdk.installed ? (
          <span className="ghost-chip accent inline-flex items-center gap-1">
            <CheckCircle2 size={10} /> SDK detected
          </span>
        ) : (
          <span className="ghost-chip inline-flex items-center gap-1">
            <Circle size={10} /> SDK not installed
          </span>
        )}
        <span className="text-[color:var(--ghost-faint)]">root: {sdk.sdkRoot || "—"}</span>
        <span className="text-[color:var(--ghost-faint)]">AVD home: {sdk.avdHome || "—"}</span>
        <span className="text-[color:var(--ghost-faint)]">
          KVM: {sdk.kvm.present ? (sdk.kvm.writable ? "ready" : "present, not writable") : "missing"}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {toolBits.map(([name, path]) => (
          <span key={name} className={`ghost-chip ${path ? "accent" : ""}`}>
            {name}
            {path ? "" : " ✕"}
          </span>
        ))}
      </div>
      <p className="text-[11px] text-[color:var(--ghost-dim)]">{sdk.note}</p>
      {sdk.guidance.length > 0 && (
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-[color:var(--ghost-dim)]">
          {sdk.guidance.join("\n")}
        </pre>
      )}
    </div>
  )
}
