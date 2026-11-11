/**
 * Hardware / RF arsenal registry.
 *
 * Local-launcher + reference metadata for operator-owned hardware and RF tooling.
 * Ships no exploits and auto-runs nothing. Command builders render text to copy
 * into the operator's own authorized terminal.
 *
 * Legal: see lib/offsec/legal.ts and LEGAL.md. Authorized, lawful use only.
 */

export type HwCategory =
  | "bluetooth"
  | "can"
  | "usb"
  | "lan"
  | "shodan"
  | "voip"
  | "sdr"
  | "flipper"
  | "phone"
  | "wip"

export type HwKind = "local" | "api" | "generator" | "wip" | "predicted"

export interface HwCommand {
  label: string
  template: string
  note?: string
}

export interface HwModule {
  id: string
  category: HwCategory
  title: string
  kind: HwKind
  summary: string
  detail: string[]
  bins?: string[]
  envVars?: string[]
  credit?: string
  link?: string
  commands?: HwCommand[]
  /** Extra badge text, e.g. PREDICTED / UNRELEASED */
  badge?: string
}

export const HW_CATEGORIES: Array<{ id: HwCategory; label: string; blurb: string }> = [
  { id: "bluetooth", label: "Bluetooth", blurb: "BlueZ / bettercap / bt scanners for YOUR adapters." },
  { id: "can", label: "CAN Bus", blurb: "SocketCAN / can-utils for vehicle & ICS labs you own." },
  { id: "usb", label: "USB / HID", blurb: "DuckyScript generator + BadUSB heuristic detector." },
  { id: "lan", label: "LAN Tap / Capture", blurb: "tcpdump / tshark / dumpcap on YOUR interfaces." },
  { id: "shodan", label: "Shodan + Censys", blurb: "Full server-side internet-facing host search (API keys required)." },
  { id: "voip", label: "VoIP / SIP", blurb: "sngrep / asterisk / sofia-sip reference for authorized labs." },
  { id: "sdr", label: "SDR", blurb: "rtl-sdr / HackRF / GNU Radio — receive/analyze on YOUR hardware." },
  { id: "flipper", label: "Flipper", blurb: "Flipper Zero (real) + Flipper One (predicted/unreleased)." },
  { id: "phone", label: "Phone Suite", blurb: "scrcpy + ADB for YOUR authorized device. No interception." },
  { id: "wip", label: "WIP Shells", blurb: "Honest non-functional shells (interception / spoofing class)." },
]

export const HARDWARE: HwModule[] = [
  // ── Bluetooth ──────────────────────────────────────────────────────────
  {
    id: "bluez",
    category: "bluetooth",
    title: "BlueZ (bluetoothctl / hcitool)",
    kind: "local",
    summary: "Linux Bluetooth stack — scan, pair, and inspect adapters you own.",
    detail: [
      "Detect your HCI adapter with `hciconfig` / `bluetoothctl list`.",
      "Authorized lab use only; do not target devices without written permission.",
    ],
    bins: ["bluetoothctl", "hcitool", "hciconfig", "btmgmt"],
    credit: "BlueZ Project",
    link: "https://www.bluez.org/",
    commands: [
      { label: "List adapters", template: "bluetoothctl list" },
      { label: "Power on + scan", template: "bluetoothctl power on && bluetoothctl scan on" },
      { label: "Info on device", template: "bluetoothctl info {bdaddr}" },
      { label: "HCI dump (classic)", template: "hcidump -X -i hci0" },
    ],
  },
  {
    id: "bettercap-bt",
    category: "bluetooth",
    title: "bettercap (BLE recon)",
    kind: "local",
    summary: "Network + BLE Swiss army knife. Use only against assets you are authorized to test.",
    detail: [
      "bettercap modules: ble.recon, ble.show, wifi.recon — reference/launcher only.",
      "Never auto-run; build the command and execute in your own terminal.",
    ],
    bins: ["bettercap"],
    credit: "bettercap (Evilsocket et al.)",
    link: "https://www.bettercap.org/",
    commands: [
      { label: "Interactive shell", template: "sudo bettercap -iface {iface}" },
      { label: "BLE recon script", template: "sudo bettercap -iface {iface} -eval 'ble.recon on; sleep 20; ble.show; quit'" },
    ],
  },
  {
    id: "ubertooth",
    category: "bluetooth",
    title: "Ubertooth One",
    kind: "local",
    summary: "Open-source 2.4 GHz monitoring for classic Bluetooth (YOUR Ubertooth hardware).",
    detail: ["Requires an Ubertooth One (or compatible) dongle you own.", "Receive/analyze only — no jamming payloads shipped."],
    bins: ["ubertooth-rx", "ubertooth-btle", "ubertooth-util"],
    credit: "Great Scott Gadgets / Ubertooth",
    link: "https://greatscottgadgets.com/ubertoothone/",
    commands: [
      { label: "Device info", template: "ubertooth-util -v" },
      { label: "BTLE follow", template: "ubertooth-btle -f" },
    ],
  },

  // ── CAN bus ────────────────────────────────────────────────────────────
  {
    id: "can-utils",
    category: "can",
    title: "can-utils (SocketCAN)",
    kind: "local",
    summary: "Linux SocketCAN userspace tools for vehicle / ICS lab buses you control.",
    detail: [
      "Bring up a vcan interface for safe offline practice, or a real CAN iface you own.",
      "Do not interact with production vehicle networks without explicit written authorization.",
    ],
    bins: ["candump", "cansend", "cansniffer", "cangen", "ip"],
    credit: "linux-can / can-utils",
    link: "https://github.com/linux-can/can-utils",
    commands: [
      { label: "Create vcan0", template: "sudo modprobe vcan && sudo ip link add dev vcan0 type vcan && sudo ip link set up vcan0" },
      { label: "Dump bus", template: "candump -cae {iface},0:0,#FFFFFFFF" },
      { label: "Sniffer (top IDs)", template: "cansniffer -c {iface}" },
      { label: "Send frame", template: "cansend {iface} {can_id}#{data_hex}" },
    ],
  },
  {
    id: "cantools",
    category: "can",
    title: "cantools (DBC decode)",
    kind: "local",
    summary: "Decode/encode CAN frames against a DBC you supply (lab/forensics).",
    detail: ["Pure decode against YOUR DBC files. No vehicle-specific attack payloads."],
    bins: ["cantools"],
    credit: "cantools (Erik Moqvist)",
    link: "https://github.com/cantools/cantools",
    commands: [
      { label: "Decode from candump log", template: "cantools decode -s {dbc_file} {candump_log}" },
      { label: "List messages in DBC", template: "cantools list {dbc_file}" },
    ],
  },

  // ── USB / HID ──────────────────────────────────────────────────────────
  {
    id: "duckyscript",
    category: "usb",
    title: "DuckyScript Generator",
    kind: "generator",
    summary: "Build Hak5 Rubber Ducky / Flipper BadUSB payloads as TEXT only. You flash them yourself.",
    detail: [
      "Generates DuckyScript source for authorized red-team / awareness labs.",
      "Nothing is flashed or executed by this hub — copy the script to your own encoder.",
    ],
    credit: "Hak5 Rubber Ducky (DuckyScript)",
    link: "https://docs.hak5.org/hak5-usb-rubber-ducky/",
  },
  {
    id: "badusb-detect",
    category: "usb",
    title: "BadUSB Heuristic Detector",
    kind: "generator",
    summary: "Client-side heuristic scan of a DuckyScript / HID payload for suspicious patterns.",
    detail: [
      "Flags DELAY+STRING bursts, Run dialog abuse, PowerShell download cradles, sticky-key style persistence hints.",
      "Heuristic only — not a guarantee. Review every payload before use.",
    ],
    credit: "Singular/ty Defense Solutions (heuristic)",
  },
  {
    id: "usb-tools",
    category: "usb",
    title: "USB enumeration (lsusb / usb-devices)",
    kind: "local",
    summary: "Enumerate USB devices attached to THIS host — useful for BadUSB / HID audits of your own gear.",
    detail: ["Read-only inspection of locally attached USB devices."],
    bins: ["lsusb", "usb-devices", "usbhid-dump"],
    credit: "usbutils / Linux USB",
    link: "https://github.com/gregkh/usbutils",
    commands: [
      { label: "List devices", template: "lsusb -v" },
      { label: "Tree view", template: "lsusb -t" },
      { label: "HID dump", template: "sudo usbhid-dump -s {bus}:{dev}" },
    ],
  },

  // ── LAN tap / capture ──────────────────────────────────────────────────
  {
    id: "tcpdump",
    category: "lan",
    title: "tcpdump",
    kind: "local",
    summary: "Classic packet capture on interfaces YOU own / are authorized to monitor.",
    detail: ["Capture to pcap for later analysis. No MITM / injection helpers shipped."],
    bins: ["tcpdump"],
    credit: "The Tcpdump Group",
    link: "https://www.tcpdump.org/",
    commands: [
      { label: "Capture interface → pcap", template: "sudo tcpdump -i {iface} -w capture-{date}.pcap" },
      { label: "HTTP hosts only", template: "sudo tcpdump -i {iface} -A 'tcp port 80'" },
      { label: "DNS queries", template: "sudo tcpdump -i {iface} -nn port 53" },
    ],
  },
  {
    id: "tshark",
    category: "lan",
    title: "tshark / dumpcap (Wireshark CLI)",
    kind: "local",
    summary: "Wireshark's CLI capture + decode on YOUR interfaces.",
    detail: ["Prefer dumpcap for long captures; tshark for filter/decode."],
    bins: ["tshark", "dumpcap", "wireshark"],
    credit: "Wireshark Foundation",
    link: "https://www.wireshark.org/",
    commands: [
      { label: "List interfaces", template: "tshark -D" },
      { label: "Capture 60s", template: "dumpcap -i {iface} -a duration:60 -w capture.pcapng" },
      { label: "Decode HTTP hosts", template: "tshark -r capture.pcapng -Y http -T fields -e http.host" },
    ],
  },
  {
    id: "netssniff",
    category: "lan",
    title: "netsniff-ng",
    kind: "local",
    summary: "High-performance Linux networking toolkit (trafgen, netsniff-ng, astraceroute).",
    detail: ["Lab / authorized capture only. trafgen packet crafting is for YOUR lab targets."],
    bins: ["netsniff-ng", "trafgen", "astraceroute", "ifpps"],
    credit: "netsniff-ng",
    link: "http://netsniff-ng.org/",
    commands: [
      { label: "Capture", template: "sudo netsniff-ng -i {iface} -o capture.pcap -s" },
      { label: "Interface pps", template: "sudo ifpps -d {iface}" },
    ],
  },

  // ── Shodan + Censys (API panels live in the page; these are catalog entries) ──
  {
    id: "shodan-api",
    category: "shodan",
    title: "Shodan (server-side)",
    kind: "api",
    summary: "Full Shodan host search / host lookup / DNS / count via server-side proxy. Key never leaves the server.",
    detail: [
      "Set SHODAN_API_KEY in the environment. Routes under /api/shodan/* require hub auth in SECURE_MODE.",
      "InternetDB (keyless) is also available for single-IP enrichment.",
    ],
    envVars: ["SHODAN_API_KEY"],
    credit: "Shodan.io",
    link: "https://www.shodan.io/",
  },
  {
    id: "censys-api",
    category: "shodan",
    title: "Censys Search (server-side)",
    kind: "api",
    summary: "Censys hosts + certificates search via server-side proxy. Credentials never leave the server.",
    detail: [
      "Set CENSYS_API_ID + CENSYS_API_SECRET. Routes under /api/censys/* require hub auth in SECURE_MODE.",
      "Use for authorized internet-facing asset discovery only.",
    ],
    envVars: ["CENSYS_API_ID", "CENSYS_API_SECRET"],
    credit: "Censys",
    link: "https://search.censys.io/",
  },

  // ── VoIP ───────────────────────────────────────────────────────────────
  {
    id: "sngrep",
    category: "voip",
    title: "sngrep (SIP visualize)",
    kind: "local",
    summary: "Ncurses SIP dialog visualizer for pcaps / live capture on YOUR lab.",
    detail: ["Passive SIP visualization. No call interception / audio injection."],
    bins: ["sngrep"],
    credit: "Irontec sngrep",
    link: "https://github.com/irontec/sngrep",
    commands: [
      { label: "Live capture", template: "sudo sngrep -d {iface}" },
      { label: "From pcap", template: "sngrep -I capture.pcap" },
    ],
  },
  {
    id: "asterisk-ref",
    category: "voip",
    title: "Asterisk / FreeSWITCH (lab PBX)",
    kind: "local",
    summary: "Reference commands for YOUR own lab PBX — not for trunk abuse or dip fraud.",
    detail: [
      "Configure and operate a PBX you own for lawful telephony research.",
      "SIP / dip-trunk fraud tooling stays an honest WIP shell in the Lab.",
    ],
    bins: ["asterisk", "fs_cli", "sipgrep"],
    credit: "Asterisk (Sangoma) / FreeSWITCH",
    link: "https://www.asterisk.org/",
    commands: [
      { label: "Asterisk console", template: "sudo asterisk -rvvv" },
      { label: "Show SIP peers", template: "asterisk -rx 'sip show peers'" },
    ],
  },

  // ── SDR ────────────────────────────────────────────────────────────────
  {
    id: "rtl-sdr",
    category: "sdr",
    title: "rtl-sdr / rtl_433",
    kind: "local",
    summary: "Receive-only SDR utilities for RTL2832U dongles YOU own.",
    detail: ["Receive and decode. No transmit helpers for RTL-SDR (hardware is RX-only)."],
    bins: ["rtl_test", "rtl_fm", "rtl_tcp", "rtl_433", "rtl_power"],
    credit: "Osmocom rtl-sdr / rtl_433",
    link: "https://osmocom.org/projects/rtl-sdr/",
    commands: [
      { label: "Device test", template: "rtl_test -t" },
      { label: "FM demod → sox play", template: "rtl_fm -f {freq_hz} -M wbfm -s 200000 -r 48000 - | play -r 48000 -t raw -e s -b 16 -c 1 -V1 -" },
      { label: "rtl_433 ISM decode", template: "rtl_433 -f {freq_hz}" },
    ],
  },
  {
    id: "hackrf",
    category: "sdr",
    title: "HackRF One",
    kind: "local",
    summary: "Wideband SDR transceiver tooling for YOUR HackRF. Transmit only into loads / ranges you are licensed for.",
    detail: [
      "Transmit capabilities exist in the hardware — you are responsible for spectrum law compliance.",
      "This panel builds reference commands; it never keys the radio for you.",
    ],
    bins: ["hackrf_info", "hackrf_transfer", "hackrf_sweep"],
    credit: "Great Scott Gadgets / HackRF",
    link: "https://greatscottgadgets.com/hackrf/",
    commands: [
      { label: "Device info", template: "hackrf_info" },
      { label: "Sweep spectrum", template: "hackrf_sweep -f {start_mhz}:{stop_mhz} -w 100000" },
      { label: "Record IQ", template: "hackrf_transfer -r capture.iq -f {freq_hz} -s 8000000 -n 16000000" },
    ],
  },
  {
    id: "gnuradio",
    category: "sdr",
    title: "GNU Radio / GQRX",
    kind: "local",
    summary: "Flowgraph + GUI receivers for YOUR SDR hardware.",
    detail: ["gqrx for quick spectrum; gnuradio-companion for custom flowgraphs."],
    bins: ["gnuradio-companion", "gqrx", "grcc"],
    credit: "GNU Radio Project / GQRX",
    link: "https://www.gnuradio.org/",
    commands: [
      { label: "Open GQRX", template: "gqrx" },
      { label: "GNU Radio Companion", template: "gnuradio-companion" },
    ],
  },

  // ── Flipper ────────────────────────────────────────────────────────────
  {
    id: "flipper-zero",
    category: "flipper",
    title: "Flipper Zero",
    kind: "local",
    summary: "Companion reference for YOUR Flipper Zero — qFlipper, lab workflows, BadUSB/DuckyScript handoff.",
    detail: [
      "Use qFlipper / flipperctl against a device you own.",
      "Sub-GHz / RFID / NFC / IR / GPIO / BadUSB: follow local law and written authorization.",
    ],
    bins: ["qFlipper", "flipperctl"],
    credit: "Flipper Devices Inc.",
    link: "https://flipperzero.one/",
    commands: [
      { label: "Launch qFlipper (GUI)", template: "qFlipper" },
      { label: "List USB serial devices", template: "ls -l /dev/serial/by-id/ 2>/dev/null || ls /dev/ttyACM* /dev/ttyUSB*" },
    ],
  },
  {
    id: "flipper-one",
    category: "flipper",
    title: "Flipper One",
    kind: "predicted",
    badge: "PREDICTED / UNRELEASED",
    summary: "Placeholder for the rumored / unreleased Flipper One. No APIs or binaries exist yet.",
    detail: [
      "Labeled PREDICTED / UNRELEASED — not a shipping product integration.",
      "When an official SDK / companion ships, this panel will be replaced with a real local launcher.",
      "Do not treat this entry as availability, capability, or endorsement.",
    ],
    credit: "Flipper Devices Inc. (predicted)",
    link: "https://flipperzero.one/",
  },

  // ── Phone suite ────────────────────────────────────────────────────────
  {
    id: "scrcpy",
    category: "phone",
    title: "scrcpy (mirror YOUR device)",
    kind: "local",
    summary: "Mirror and control an Android device YOU own via ADB — no root required for basic use.",
    detail: [
      "Enable USB debugging on your device and authorize the RSA prompt.",
      "Works over USB or TCP/IP ADB. No call audio interception.",
    ],
    bins: ["scrcpy", "adb"],
    credit: "Genymobile scrcpy",
    link: "https://github.com/Genymobile/scrcpy",
    commands: [
      { label: "List devices", template: "adb devices -l" },
      { label: "Mirror (USB)", template: "scrcpy -s {serial}" },
      { label: "Mirror + record", template: "scrcpy -s {serial} --record=recording-{date}.mp4" },
      { label: "Wi-Fi ADB connect", template: "adb tcpip 5555 && adb connect {phone_ip}:5555" },
    ],
  },
  {
    id: "adb-suite",
    category: "phone",
    title: "ADB device ops (authorized)",
    kind: "local",
    summary: "Android Debug Bridge for YOUR device: shell, pull, logcat, install. Hub API routes stay behind auth + allowlist.",
    detail: [
      "Hub `/api/adb/*` routes require HUB_API_TOKEN when SECURE_MODE=1.",
      "ADB shell endpoint additionally requires ADB_SHELL_ENABLED=1 and an arg allowlist.",
      "Never point this at a device you do not own / are not authorized to debug.",
    ],
    bins: ["adb", "fastboot"],
    credit: "Android Open Source Project",
    link: "https://developer.android.com/tools/adb",
    commands: [
      { label: "Devices", template: "adb devices -l" },
      { label: "Logcat (buffered)", template: "adb -s {serial} logcat -d -t 200" },
      { label: "Pull file", template: "adb -s {serial} pull {remote_path} {local_path}" },
      { label: "Screenshot", template: "adb -s {serial} exec-out screencap -p > shot-{date}.png" },
      { label: "Battery dump", template: "adb -s {serial} shell dumpsys battery" },
    ],
  },

  // ── Honest WIP shells (interception class) ─────────────────────────────
  {
    id: "call-intercept",
    category: "wip",
    title: "Call Interception / Audio Injection",
    kind: "wip",
    summary: "WORK IN PROGRESS — honest non-functional shell. Will never ship as working interception code.",
    detail: [
      "Active call interception and in-call audio injection are illegal without lawful authority and are hardware-gated.",
      "This panel is a placeholder only. Use scrcpy/ADB above for YOUR own device screen/ops.",
    ],
  },
  {
    id: "imsi-catcher",
    category: "wip",
    title: "IMSI Catcher / Stingray-class",
    kind: "wip",
    summary: "WORK IN PROGRESS — will remain a non-functional shell.",
    detail: [
      "Active cellular interception equipment is restricted and illegal for unauthorized parties.",
      "Nothing functional will ship in this suite.",
    ],
  },
]

export function hardwareBins(): string[] {
  const s = new Set<string>()
  for (const m of HARDWARE) for (const b of m.bins || []) s.add(b)
  return [...s].sort()
}
