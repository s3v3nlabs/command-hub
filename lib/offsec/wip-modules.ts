/** WIP / local-tool integration modules for the Lab. "wip" = honest non-functional shell. */

export type LabKind = "wip" | "local"

export interface LabModule {
  id: string
  title: string
  kind: LabKind
  summary: string
  /** For kind="local": what it would drive + how to set up. For "wip": why it's a shell. */
  detail: string[]
  bins?: string[]
  credit?: string
  link?: string
}

export const LAB_MODULES: LabModule[] = [
  {
    id: "spoofer",
    title: "Caller-ID / IMEI / Location Spoofer",
    kind: "wip",
    summary: "WORK IN PROGRESS — non-functional shell. No spoofing is implemented or will be shipped.",
    detail: [
      "Caller-ID, IMEI, and location spoofing are hardware-gated and, in most jurisdictions, illegal to use for fraud.",
      "This suite will not ship working interception/spoofing code. This page is an honest placeholder only.",
    ],
  },
  {
    id: "sip-diptrunk",
    title: "SIP / Dip-Trunk Telephony",
    kind: "wip",
    summary: "WORK IN PROGRESS — non-functional shell.",
    detail: [
      "Carrier 'dip' trunking and SIP origination abuse are telecom-fraud vectors.",
      "No dialing/trunking is implemented. Placeholder for lawful lab-only VoIP research documentation.",
    ],
  },
  {
    id: "phreaking",
    title: "Phone Phreaking Tools",
    kind: "wip",
    summary: "WORK IN PROGRESS — historical/education placeholder.",
    detail: ["Reserved for historical/educational reference material only. Nothing functional is shipped."],
  },
  {
    id: "cell-intercept",
    title: "Active Cellular Interception",
    kind: "wip",
    summary: "WORK IN PROGRESS — will remain a non-functional shell.",
    detail: [
      "Active interception of cellular communications is illegal for unauthorized parties and hardware-gated.",
      "This will never ship as working code.",
      "For YOUR own device ops, use the real Phone Suite at /offsec/phone (scrcpy + ADB).",
    ],
  },
  {
    id: "kali-adb",
    title: "Kali / ADB Integration",
    kind: "local",
    summary: "Launcher/config for your own locally-installed Android Debug Bridge + Kali tooling.",
    detail: [
      "Detect `adb` and drive YOUR connected device: adb devices · adb shell · adb install.",
      "Kali: run inside your own Kali VM/WSL/NetHunter; this panel documents the toolchain and builds safe commands.",
      "No device is accessed without you connecting it and authorizing debugging.",
    ],
    bins: ["adb", "fastboot"],
    credit: "Android Open Source Project / Offensive Security (Kali)",
    link: "https://www.kali.org/",
  },
  {
    id: "virtualization",
    title: "Virtualization",
    kind: "local",
    summary: "Config/launcher references for your own hypervisors.",
    detail: [
      "QEMU/KVM, VirtualBox, libvirt, Docker: documented commands to spin up isolated lab VMs/containers.",
      "Build disposable attack/victim labs; nothing auto-provisions.",
    ],
    bins: ["qemu-system-x86_64", "VBoxManage", "virsh", "docker", "vagrant"],
    credit: "QEMU / Oracle VirtualBox / libvirt / Docker",
    link: "https://www.qemu.org/",
  },
  {
    id: "lora",
    title: "LoRa / SDR Radio",
    kind: "local",
    summary: "Reference/config for your own SDR + LoRa hardware.",
    detail: [
      "GNU Radio, rtl_sdr, gqrx, LoRa gateways: documented, lawful RX workflows for hardware you own.",
      "Transmit only on bands/power you are licensed for. No TX helper is bundled.",
    ],
    bins: ["gnuradio-companion", "rtl_sdr", "gqrx"],
    credit: "GNU Radio / Osmocom",
    link: "https://www.gnuradio.org/",
  },
  {
    id: "forensics",
    title: "Forensics / Anti-Forensics",
    kind: "local",
    summary: "Launcher/reference for your own forensic suite.",
    detail: [
      "Drives Volatility3, Autopsy/Sleuth Kit, binwalk, foremost on images you are authorized to examine.",
      "Anti-forensics coverage is defensive/educational (what to detect), not evidence destruction.",
    ],
    bins: ["vol", "autopsy", "binwalk", "foremost", "mmls"],
    credit: "Volatility Foundation / Brian Carrier / ReFirmLabs",
    link: "https://github.com/volatilityfoundation/volatility3",
  },
  {
    id: "reverse-engineering",
    title: "Reverse Engineering (OSED pairing)",
    kind: "local",
    summary: "Launcher/reference for your own RE suite; pairs with the exploit-dev arsenal.",
    detail: [
      "Ghidra, radare2/Cutter, gdb+pwndbg/GEF, angr, apktool/jadx on binaries you own or are authorized to analyze.",
      "mona.py / WinDbg / Immunity references for Windows exploit development (OSED).",
    ],
    bins: ["ghidra", "r2", "gdb", "cutter", "apktool"],
    credit: "NSA (Ghidra) / pancake (radare2) / GNU",
    link: "https://ghidra-sre.org/",
  },
  {
    id: "os-hook",
    title: "OS Hook Scaffolding",
    kind: "wip",
    summary: "Documented, SAFE placeholder — no real hooking is performed.",
    detail: [
      "A scaffold describing lawful instrumentation (eBPF/auditd for defense, Frida for authorized app testing).",
      "No kernel/userland hooks are installed by this page. Reference only.",
    ],
    credit: "Frida / eBPF / auditd",
    link: "https://frida.re/",
  },
  {
    id: "browser-hook",
    title: "Browser Hook Scaffolding",
    kind: "wip",
    summary: "Documented, SAFE placeholder — no real hooking is performed.",
    detail: [
      "Describes authorized web-testing instrumentation (BeEF for authorized engagements, Playwright/CDP for your own browsers).",
      "No hook is injected by this page. Reference only.",
    ],
    credit: "BeEF Project / Playwright",
    link: "https://beefproject.com/",
  },
]
