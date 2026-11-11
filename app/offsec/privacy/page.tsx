"use client"

import { useEffect, useState } from "react"
import { Copy, Check, RefreshCw, ShieldCheck, Circle, CheckCircle2, ExternalLink } from "lucide-react"
import { SuiteShell, SuiteNavLink } from "@/components/offsec/suite-shell"

type Status = { bins: Record<string, boolean>; envSet: Record<string, boolean> }

function Cmd({ label, cmd }: { label: string; cmd: string }) {
  const [c, setC] = useState(false)
  return (
    <div className="rounded-[2px] border border-[color:var(--ghost-line)] bg-black/40 p-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="ghost-label">{label}</span>
        <button
          type="button"
          className="ghost-icon-btn"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(cmd)
              setC(true)
              setTimeout(() => setC(false), 1200)
            } catch {
              /* ignore */
            }
          }}
        >
          {c ? <Check size={11} /> : <Copy size={11} />}
        </button>
      </div>
      <pre className="ghost-scroll overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px] text-[color:var(--ghost-ink)]">{cmd}</pre>
    </div>
  )
}

function Panel({
  title,
  credit,
  link,
  bins,
  status,
  envVars,
  children,
}: {
  title: string
  credit: string
  link: string
  bins?: string[]
  status: Status | null
  envVars?: string[]
  children: React.ReactNode
}) {
  const detected = bins?.some((b) => status?.bins[b])
  return (
    <div className="ghost-glass ghost-brackets space-y-2 rounded-[2px] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[13px] uppercase tracking-[0.1em] text-[color:var(--ghost-ink)]">{title}</span>
          {bins &&
            (detected ? (
              <span className="ghost-chip accent inline-flex items-center gap-1">
                <CheckCircle2 size={10} /> installed
              </span>
            ) : (
              <span className="ghost-chip inline-flex items-center gap-1">
                <Circle size={10} /> not detected
              </span>
            ))}
        </div>
        <a href={link} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-[11px] text-[color:var(--ghost-dim)] hover:text-[color:var(--ghost-ink)]">
          <ExternalLink size={11} /> {credit}
        </a>
      </div>
      {envVars && envVars.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {envVars.map((e) => (
            <span key={e} className={`ghost-chip ${status?.envSet[e] ? "accent" : ""}`}>
              {e}: {status?.envSet[e] ? "set" : "unset"}
            </span>
          ))}
        </div>
      )}
      {children}
    </div>
  )
}

export default function PrivacyStackPage() {
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(true)
  const load = async () => {
    setLoading(true)
    try {
      const d = await fetch("/api/offsec/privacy").then((r) => r.json())
      if (d?.ok) setStatus({ bins: d.bins, envSet: d.envSet })
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    void load()
  }, [])

  return (
    <SuiteShell
      title="PRIVACY STACK"
      status="local"
      nav={
        <>
          <SuiteNavLink href="/offsec" label="Arsenal" />
          <SuiteNavLink href="/offsec/osint" label="OSINT Suite" />
        </>
      }
    >
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="ghost-glass rounded-[2px] p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px] text-[color:var(--ghost-dim)]">
              <ShieldCheck size={14} /> Config + status panels for anonymity/egress tooling. Secrets live in
              <code className="mx-1 text-[color:var(--ghost-ink)]">.env.local</code> or your OS keychain — never in this repo.
            </div>
            <button type="button" className="ghost-icon-btn" onClick={() => void load()}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <Panel title="Proton VPN (CLI / WireGuard)" credit="Proton AG" link="https://protonvpn.com/support/linux-vpn-tool/" bins={["protonvpn-cli", "protonvpn", "proton-vpn-cli", "wg", "wireguard"]} status={status} envVars={["PROTONVPN_USERNAME"]}>
          <div className="grid gap-2 sm:grid-cols-2">
            <Cmd label="Install (Debian/Ubuntu)" cmd={"sudo apt install proton-vpn-gnome-desktop  # or official repo .deb"} />
            <Cmd label="Login" cmd={"protonvpn-cli login <proton-username>"} />
            <Cmd label="Fastest / secure-core" cmd={"protonvpn-cli connect --fastest\nprotonvpn-cli connect --sc"} />
            <Cmd label="Status / kill-switch" cmd={"protonvpn-cli status\nprotonvpn-cli kill-switch --on"} />
            <Cmd label="WireGuard config (manual)" cmd={"wg-quick up /etc/wireguard/proton.conf  # download per-device config from Proton account"} />
          </div>
          <p className="text-[10px] text-[color:var(--ghost-faint)]">Never commit WireGuard .conf (private key). It's covered by .gitignore (*.key / secrets).</p>
        </Panel>

        <Panel title="Proton Mail Bridge" credit="Proton AG" link="https://proton.me/mail/bridge" bins={["proton-bridge", "protonmail-bridge"]} status={status} envVars={["PROTON_BRIDGE_HOST", "PROTON_BRIDGE_PORT", "PROTON_SMTP_HOST"]}>
          <div className="grid gap-2 sm:grid-cols-2">
            <Cmd label="Run (CLI)" cmd={"protonmail-bridge --cli"} />
            <Cmd label="Local IMAP/SMTP" cmd={"# Bridge exposes 127.0.0.1:1143 (IMAP) / 127.0.0.1:1025 (SMTP)\n# Use the per-account password Bridge prints — not your Proton password."} />
          </div>
          <p className="text-[10px] text-[color:var(--ghost-faint)]">Bridge requires a paid Proton plan. Credentials stay in Bridge's own keychain, not here.</p>
        </Panel>

        <Panel title="Proton Mail + reverse aliases (SimpleLogin)" credit="Proton AG / SimpleLogin" link="https://simplelogin.io/" status={status}>
          <ul className="space-y-1 text-[11px] text-[color:var(--ghost-dim)]">
            <li className="flex gap-2"><span className="text-[color:var(--ghost-faint)]">›</span> Create per-engagement aliases so a target can't correlate your real address.</li>
            <li className="flex gap-2"><span className="text-[color:var(--ghost-faint)]">›</span> Reverse-alias: replies route through SimpleLogin so your real mailbox is never exposed.</li>
            <li className="flex gap-2"><span className="text-[color:var(--ghost-faint)]">›</span> Manage via the SimpleLogin app / API token (store the token in .env.local as SIMPLELOGIN_API_KEY, not in git).</li>
          </ul>
        </Panel>

        <Panel title="Proxy chaining (proxychains-ng)" credit="rofl0r" link="https://github.com/rofl0r/proxychains-ng" bins={["proxychains4", "proxychains"]} status={status} envVars={["HTTPS_PROXY", "HTTP_PROXY", "SOCKS_PROXY"]}>
          <div className="grid gap-2 sm:grid-cols-2">
            <Cmd label="Chain config (/etc/proxychains4.conf)" cmd={"strict_chain\nproxy_dns\n[ProxyList]\nsocks5 127.0.0.1 1080\nhttp 127.0.0.1 8080"} />
            <Cmd label="Run a tool through the chain" cmd={"proxychains4 -q curl https://ifconfig.me"} />
            <Cmd label="SSH dynamic SOCKS (feed the chain)" cmd={"ssh -D 1080 -N user@pivot-host"} />
            <Cmd label="Env proxy (per shell)" cmd={"export ALL_PROXY=socks5://127.0.0.1:1080"} />
          </div>
        </Panel>

        <Panel title="Reverse proxy (nginx / Caddy)" credit="nginx / Caddy" link="https://caddyserver.com/" bins={["nginx", "caddy"]} status={status} envVars={["REVERSE_PROXY_UPSTREAM"]}>
          <div className="grid gap-2 sm:grid-cols-2">
            <Cmd label="Caddy reverse proxy + TLS" cmd={"example.com {\n  reverse_proxy 127.0.0.1:3000\n}"} />
            <Cmd label="nginx reverse proxy" cmd={"location / {\n  proxy_pass http://127.0.0.1:3000;\n  proxy_set_header Host $host;\n  proxy_set_header X-Forwarded-For $remote_addr;\n}"} />
          </div>
          <p className="text-[10px] text-[color:var(--ghost-faint)]">For redirectors/catch-points, only on infrastructure you control and within engagement scope.</p>
        </Panel>

        <Panel title="Encrypted messaging / files" credit="GnuPG / age / OpenSSH / Signal" link="https://github.com/FiloSottile/age" bins={["gpg", "age", "ssh", "tor"]} status={status}>
          <div className="grid gap-2 sm:grid-cols-2">
            <Cmd label="age encrypt to recipient" cmd={"age -r age1<recipient-pubkey> -o secret.age secret.txt"} />
            <Cmd label="age decrypt" cmd={"age -d -i key.txt secret.age > secret.txt"} />
            <Cmd label="GPG symmetric" cmd={"gpg -c --cipher-algo AES256 file"} />
            <Cmd label="GPG encrypt to key" cmd={"gpg -e -r recipient@example.com file"} />
          </div>
          <p className="text-[10px] text-[color:var(--ghost-faint)]">For real-time team chat use Signal / Matrix (E2EE). Private keys stay on your device and are gitignored.</p>
        </Panel>
      </div>
    </SuiteShell>
  )
}
