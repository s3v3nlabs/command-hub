/**
 * Singular/ty OffSec Arsenal registry.
 *
 * A data-driven catalog of industry-standard offensive / defensive / investigative
 * tooling, organized by (a) the engagement kill-chain and (b) CTF / competition
 * categories. Each entry is REFERENCE + LAUNCHER metadata only: documented usage,
 * command templates, install hints, and credit/links to the upstream open-source
 * project. This module ships NO exploits and auto-runs nothing.
 *
 * Standards of record: OffSec OSCP/PEN-200, OSEP/PEN-300, OSWE/WEB-300, OSED/EXP-301,
 * DEF CON SECTF, Trace Labs OSINT Search Party.
 *
 * Legal: see lib/offsec/legal.ts and LEGAL.md. Authorized, lawful use only.
 */

export type KillPhase =
  | "recon"
  | "osint"
  | "web"
  | "cred"
  | "exploit"
  | "privesc-win"
  | "privesc-lin"
  | "ad"
  | "pivot"
  | "exploit-dev"
  | "evasion"
  | "post"

export type CtfCategory =
  | "se"
  | "osint-comp"
  | "web-ctf"
  | "pwn"
  | "reversing"
  | "crypto"
  | "forensics"
  | "stego"
  | "misc"

export type RiskTier = "launch" | "reference" | "wip"

export interface CommandTemplate {
  label: string
  /** {placeholder} tokens are filled by the command builder. */
  template: string
  note?: string
}

export interface ArsenalTool {
  id: string
  name: string
  /** binaries to probe with `which` for local-install detection. */
  bins: string[]
  phases: KillPhase[]
  ctf?: CtfCategory[]
  /** OffSec cert tags this tool maps to. */
  certs?: Array<"OSCP" | "OSEP" | "OSWE" | "OSED" | "OSINT" | "CTF">
  summary: string
  /** upstream project + author for credit. */
  credit: string
  link: string
  install?: string
  risk: RiskTier
  commands?: CommandTemplate[]
  /** cheat-sheet lines / reference notes (no live exploit payloads). */
  notes?: string[]
}

export const KILL_PHASES: Array<{ id: KillPhase; label: string; blurb: string }> = [
  { id: "recon", label: "Recon & Enumeration", blurb: "Discover hosts, ports, services, content." },
  { id: "osint", label: "OSINT", blurb: "Open-source intelligence on people, orgs, infra." },
  { id: "web", label: "Web App", blurb: "Proxy, fuzz, and test web applications." },
  { id: "cred", label: "Credentials", blurb: "Password spraying, cracking, hash handling." },
  { id: "exploit", label: "Exploitation & C2", blurb: "Delivery frameworks and remoting (config/reference)." },
  { id: "privesc-win", label: "Windows Privesc", blurb: "Local privilege escalation on Windows." },
  { id: "privesc-lin", label: "Linux Privesc", blurb: "Local privilege escalation on Linux." },
  { id: "ad", label: "Active Directory & Lateral", blurb: "Enumerate and move through AD." },
  { id: "pivot", label: "Pivoting & Tunneling", blurb: "Relay traffic through footholds." },
  { id: "exploit-dev", label: "Exploit Dev (OSED)", blurb: "Debuggers, ROP, binary analysis." },
  { id: "evasion", label: "Evasion (OSEP)", blurb: "AV/EDR evasion — education / reference only." },
  { id: "post", label: "Post / Reporting", blurb: "Loot handling, notes, reporting." },
]

export const CTF_CATEGORIES: Array<{ id: CtfCategory; label: string; blurb: string }> = [
  { id: "se", label: "Social Engineering (SECTF)", blurb: "DEF CON SECTF / Trace Labs — training & authorized only." },
  { id: "osint-comp", label: "OSINT Competition", blurb: "Search-party / SECTF OSINT toolset." },
  { id: "web-ctf", label: "Web", blurb: "Web challenge tooling." },
  { id: "pwn", label: "Pwn / Binary", blurb: "Memory-corruption exploitation." },
  { id: "reversing", label: "Reverse Engineering", blurb: "Static/dynamic binary & app analysis." },
  { id: "crypto", label: "Crypto", blurb: "Classical & modern cryptography." },
  { id: "forensics", label: "Forensics", blurb: "Disk, memory, network, file carving." },
  { id: "stego", label: "Stego", blurb: "Hidden data in media." },
  { id: "misc", label: "Misc / Recon", blurb: "Swiss-army + catch-all." },
]

export const ARSENAL: ArsenalTool[] = [
  // ───────────────────────── recon / enumeration ─────────────────────────
  {
    id: "nmap",
    name: "Nmap (+ NSE)",
    bins: ["nmap"],
    phases: ["recon"],
    ctf: ["misc"],
    certs: ["OSCP", "CTF"],
    summary: "Port/service/version discovery with the NSE scripting engine.",
    credit: "Nmap Project (Gordon Lyon)",
    link: "https://nmap.org/",
    install: "apt install nmap · brew install nmap",
    risk: "launch",
    commands: [
      { label: "Top-ports + version/default scripts", template: "nmap -sC -sV -oN nmap/{host}.txt {host}" },
      { label: "All TCP ports", template: "nmap -p- --min-rate 2000 -oN nmap/{host}-allports.txt {host}" },
      { label: "UDP top 100", template: "nmap -sU --top-ports 100 -oN nmap/{host}-udp.txt {host}" },
      { label: "Targeted NSE (vuln)", template: "nmap -p {ports} --script vuln -oN nmap/{host}-vuln.txt {host}" },
    ],
    notes: ["-Pn skips host discovery when ICMP is filtered.", "Save all output (-oA) for the report."],
  },
  {
    id: "masscan",
    name: "masscan",
    bins: ["masscan"],
    phases: ["recon"],
    summary: "Internet-scale asynchronous TCP port scanner.",
    credit: "Robert Graham",
    link: "https://github.com/robertdavidgraham/masscan",
    install: "apt install masscan",
    risk: "launch",
    commands: [{ label: "Fast full-range sweep", template: "masscan {host} -p1-65535 --rate 10000 -oL masscan-{host}.txt" }],
    notes: ["Rate-limit on engagements. Confirm findings with nmap."],
  },
  {
    id: "ffuf",
    name: "ffuf",
    bins: ["ffuf"],
    phases: ["recon", "web"],
    ctf: ["web-ctf"],
    certs: ["OSCP", "OSWE"],
    summary: "Fast web fuzzer: directories, vhosts, parameters.",
    credit: "Joona Hoikkala (@joohoi)",
    link: "https://github.com/ffuf/ffuf",
    install: "go install github.com/ffuf/ffuf/v2@latest",
    risk: "launch",
    commands: [
      { label: "Directory brute", template: "ffuf -u http://{host}/FUZZ -w {wordlist} -mc 200,204,301,302,307,401,403" },
      { label: "VHost fuzz", template: "ffuf -u http://{host}/ -H 'Host: FUZZ.{domain}' -w {wordlist} -fs {filtersize}" },
      { label: "Parameter fuzz", template: "ffuf -u 'http://{host}/page?FUZZ=1' -w {wordlist} -fs {filtersize}" },
    ],
  },
  {
    id: "gobuster",
    name: "gobuster / feroxbuster / dirsearch",
    bins: ["gobuster", "feroxbuster", "dirsearch"],
    phases: ["recon", "web"],
    ctf: ["web-ctf"],
    certs: ["OSCP"],
    summary: "Content & DNS brute-forcing (dir, dns, vhost modes).",
    credit: "OJ Reeves (gobuster), epi052 (feroxbuster), Mauro Soria (dirsearch)",
    link: "https://github.com/OJ/gobuster",
    install: "apt install gobuster feroxbuster · pipx install dirsearch",
    risk: "launch",
    commands: [
      { label: "gobuster dir", template: "gobuster dir -u http://{host} -w {wordlist} -x php,txt,html -o gobuster-{host}.txt" },
      { label: "feroxbuster recursive", template: "feroxbuster -u http://{host} -w {wordlist} -x php,txt" },
    ],
  },
  {
    id: "whatweb",
    name: "WhatWeb / nikto",
    bins: ["whatweb", "nikto"],
    phases: ["recon", "web"],
    summary: "Web fingerprinting and classic web server vuln scanning.",
    credit: "Andrew Horton/Brendan Coles (WhatWeb), Chris Sullo (Nikto)",
    link: "https://github.com/urbanadventurer/WhatWeb",
    install: "apt install whatweb nikto",
    risk: "launch",
    commands: [
      { label: "Fingerprint", template: "whatweb -a 3 http://{host}" },
      { label: "Nikto scan", template: "nikto -h http://{host} -o nikto-{host}.txt" },
    ],
  },
  {
    id: "nuclei",
    name: "nuclei",
    bins: ["nuclei"],
    phases: ["recon", "web"],
    certs: ["OSCP"],
    summary: "Template-based vulnerability & misconfiguration scanner.",
    credit: "ProjectDiscovery",
    link: "https://github.com/projectdiscovery/nuclei",
    install: "go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest",
    risk: "launch",
    commands: [{ label: "Scan host", template: "nuclei -u http://{host} -o nuclei-{host}.txt" }],
  },
  {
    id: "wpscan",
    name: "WPScan",
    bins: ["wpscan"],
    phases: ["recon", "web"],
    summary: "WordPress enumeration (users, plugins, themes, vulns).",
    credit: "WPScan Team / Automattic",
    link: "https://github.com/wpscanteam/wpscan",
    install: "gem install wpscan",
    risk: "launch",
    commands: [{ label: "Enumerate", template: "wpscan --url http://{host} -e vp,vt,u --api-token {token}" }],
  },
  {
    id: "smb-enum",
    name: "smbmap / smbclient / enum4linux-ng",
    bins: ["smbmap", "smbclient", "enum4linux-ng", "enum4linux"],
    phases: ["recon"],
    certs: ["OSCP"],
    summary: "SMB share enumeration and null-session checks.",
    credit: "ShawnDEvans (smbmap), Samba team, cddmp (enum4linux-ng)",
    link: "https://github.com/cddmp/enum4linux-ng",
    install: "apt install smbmap smbclient · pipx install enum4linux-ng",
    risk: "launch",
    commands: [
      { label: "smbmap shares", template: "smbmap -H {host} -u '{user}' -p '{pass}'" },
      { label: "List shares (null)", template: "smbclient -L //{host}/ -N" },
      { label: "enum4linux-ng", template: "enum4linux-ng -A {host}" },
    ],
  },
  {
    id: "netmisc-enum",
    name: "snmpwalk / ldapsearch / rpcclient",
    bins: ["snmpwalk", "ldapsearch", "rpcclient"],
    phases: ["recon", "ad"],
    certs: ["OSCP"],
    summary: "SNMP, LDAP and MS-RPC enumeration.",
    credit: "net-snmp, OpenLDAP, Samba",
    link: "https://www.kali.org/tools/",
    install: "apt install snmp ldap-utils samba-common-bin",
    risk: "launch",
    commands: [
      { label: "snmpwalk v2c", template: "snmpwalk -v2c -c public {host}" },
      { label: "ldapsearch base", template: "ldapsearch -x -H ldap://{host} -b '{basedn}'" },
      { label: "rpcclient null", template: "rpcclient -U '' -N {host}" },
    ],
  },
  {
    id: "dns-enum",
    name: "dnsenum / Sublist3r / Amass",
    bins: ["dnsenum", "sublist3r", "amass"],
    phases: ["recon", "osint"],
    certs: ["OSCP", "OSINT"],
    summary: "DNS and subdomain enumeration (passive + active).",
    credit: "OWASP Amass, aboul3la (Sublist3r), fwaeytens (dnsenum)",
    link: "https://github.com/owasp-amass/amass",
    install: "apt install dnsenum · pipx install sublist3r · snap install amass",
    risk: "launch",
    commands: [
      { label: "Amass passive", template: "amass enum -passive -d {domain} -o amass-{domain}.txt" },
      { label: "Sublist3r", template: "sublist3r -d {domain} -o sub-{domain}.txt" },
    ],
  },
  {
    id: "searchsploit",
    name: "searchsploit / Exploit-DB",
    bins: ["searchsploit"],
    phases: ["recon", "exploit"],
    certs: ["OSCP"],
    summary: "Offline Exploit-DB search. Review exploits before use — never auto-run.",
    credit: "OffSec / Exploit-DB",
    link: "https://gitlab.com/exploit-database/exploitdb",
    install: "apt install exploitdb",
    risk: "reference",
    commands: [
      { label: "Search", template: "searchsploit {query}" },
      { label: "Copy to cwd", template: "searchsploit -m {edb-id}" },
    ],
    notes: ["Read and understand any exploit before running it in an authorized lab."],
  },
  // ───────────────────────── osint ─────────────────────────
  {
    id: "theharvester",
    name: "theHarvester",
    bins: ["theHarvester", "theharvester"],
    phases: ["osint", "recon"],
    ctf: ["osint-comp"],
    certs: ["OSINT"],
    summary: "Emails, subdomains, hosts and names from public sources.",
    credit: "Christian Martorella (@laramies)",
    link: "https://github.com/laramies/theHarvester",
    install: "pipx install theHarvester",
    risk: "launch",
    commands: [{ label: "Multi-source", template: "theHarvester -d {domain} -b bing,duckduckgo,crtsh -f harvest-{domain}" }],
  },
  {
    id: "spiderfoot",
    name: "SpiderFoot",
    bins: ["spiderfoot", "sf.py"],
    phases: ["osint"],
    ctf: ["osint-comp"],
    certs: ["OSINT"],
    summary: "Automated OSINT with 200+ modules and a web UI.",
    credit: "Steve Micallef",
    link: "https://github.com/smicallef/spiderfoot",
    install: "pipx install spiderfoot",
    risk: "launch",
    commands: [{ label: "Start web UI", template: "spiderfoot -l 127.0.0.1:5001" }],
    notes: ["Browse to http://127.0.0.1:5001 after launch."],
  },
  {
    id: "recon-ng",
    name: "Recon-ng",
    bins: ["recon-ng"],
    phases: ["osint"],
    ctf: ["osint-comp"],
    certs: ["OSINT"],
    summary: "Modular recon framework with a Metasploit-style console.",
    credit: "Tim Tomes (@LaNMaSteR53)",
    link: "https://github.com/lanmaster53/recon-ng",
    install: "pipx install recon-ng",
    risk: "launch",
    commands: [{ label: "Console", template: "recon-ng -w {workspace}" }],
  },
  {
    id: "sherlock",
    name: "Sherlock / Maigret / Blackbird",
    bins: ["sherlock", "maigret", "blackbird"],
    phases: ["osint"],
    ctf: ["osint-comp"],
    certs: ["OSINT"],
    summary: "Hunt a username across hundreds of sites.",
    credit: "Sherlock Project; soxoj (Maigret); p1ngul1n0 (Blackbird)",
    link: "https://github.com/sherlock-project/sherlock",
    install: "pipx install sherlock-project · pipx install maigret",
    risk: "launch",
    commands: [
      { label: "Sherlock", template: "sherlock {username} --output sherlock-{username}.txt" },
      { label: "Maigret (report)", template: "maigret {username} --html" },
    ],
    notes: ["Do not mass-scrape; respect site ToS and rate limits."],
  },
  {
    id: "holehe",
    name: "holehe / WhatsMyName",
    bins: ["holehe"],
    phases: ["osint"],
    ctf: ["osint-comp"],
    certs: ["OSINT"],
    summary: "Check which sites an email is registered on (no password reset sent).",
    credit: "megadose (holehe), WebBreacher (WhatsMyName)",
    link: "https://github.com/megadose/holehe",
    install: "pipx install holehe",
    risk: "launch",
    commands: [{ label: "Email check", template: "holehe {email}" }],
  },
  {
    id: "phoneinfoga",
    name: "PhoneInfoga",
    bins: ["phoneinfoga"],
    phases: ["osint"],
    ctf: ["osint-comp"],
    certs: ["OSINT"],
    summary: "Phone-number OSINT: carrier, format, footprint via public sources.",
    credit: "Sundowndev",
    link: "https://github.com/sundowndev/phoneinfoga",
    install: "see releases / docker",
    risk: "launch",
    commands: [{ label: "Scan number", template: "phoneinfoga scan -n '{number}'" }],
    notes: ["Passive lookup only; never used to harass or defraud."],
  },
  {
    id: "ghunt",
    name: "GHunt / Mr.Holmes",
    bins: ["ghunt"],
    phases: ["osint"],
    ctf: ["osint-comp"],
    certs: ["OSINT"],
    summary: "Investigate Google accounts and other identifiers from public data.",
    credit: "mxrch (GHunt), Lucksi (Mr.Holmes)",
    link: "https://github.com/mxrch/GHunt",
    install: "pipx install ghunt",
    risk: "launch",
    commands: [{ label: "Email lookup", template: "ghunt email {email}" }],
  },
  {
    id: "exiftool",
    name: "ExifTool / metagoofil",
    bins: ["exiftool", "metagoofil"],
    phases: ["osint"],
    ctf: ["osint-comp", "forensics"],
    certs: ["OSINT", "CTF"],
    summary: "Read/strip metadata from media and documents; harvest doc metadata.",
    credit: "Phil Harvey (ExifTool), Christian Martorella (metagoofil)",
    link: "https://exiftool.org/",
    install: "apt install libimage-exiftool-perl",
    risk: "launch",
    commands: [
      { label: "All metadata", template: "exiftool {file}" },
      { label: "Strip metadata", template: "exiftool -all= {file}" },
    ],
  },
  {
    id: "geo-osint",
    name: "Geolocation / imagery (Creepy, Overpass, reverse image)",
    bins: ["cree.py", "creepy"],
    phases: ["osint"],
    ctf: ["osint-comp"],
    certs: ["OSINT"],
    summary: "Reverse image search, OSM/Overpass queries and GeoGuessr-style geolocation workflow.",
    credit: "ilektrojohn (Creepy), OpenStreetMap/Overpass, Google/Yandex/Bing images",
    link: "https://overpass-turbo.eu/",
    risk: "reference",
    notes: [
      "Reverse image: Google Lens, Yandex, Bing Visual, TinEye.",
      "Overpass Turbo for OSM feature queries; cross-reference shadows, signage, plates.",
    ],
  },
  // ───────────────────────── web ─────────────────────────
  {
    id: "burp-zap",
    name: "Burp Suite / OWASP ZAP",
    bins: ["burpsuite", "BurpSuiteCommunity", "zaproxy", "zap.sh"],
    phases: ["web"],
    ctf: ["web-ctf"],
    certs: ["OSWE", "OSCP"],
    summary: "Intercepting proxies for web testing. Configure your browser/system proxy to 127.0.0.1:8080.",
    credit: "PortSwigger (Burp), OWASP (ZAP)",
    link: "https://portswigger.net/burp",
    install: "Burp from PortSwigger · apt install zaproxy",
    risk: "launch",
    commands: [
      { label: "Launch ZAP headless", template: "zaproxy -daemon -host 127.0.0.1 -port 8080" },
      { label: "proxychains via Burp", template: "export http_proxy=http://127.0.0.1:8080 https_proxy=http://127.0.0.1:8080" },
    ],
    notes: ["Install the CA cert in your browser to intercept TLS."],
  },
  {
    id: "sqlmap",
    name: "sqlmap",
    bins: ["sqlmap"],
    phases: ["web"],
    ctf: ["web-ctf"],
    certs: ["OSWE"],
    summary: "Automated SQL-injection detection and exploitation (authorized targets only).",
    credit: "Bernardo Damele & Miroslav Stampar",
    link: "https://github.com/sqlmapproject/sqlmap",
    install: "apt install sqlmap",
    risk: "launch",
    commands: [
      { label: "Test request file", template: "sqlmap -r {reqfile} --batch --risk 2 --level 3" },
      { label: "Dump DB", template: "sqlmap -u '{url}' --batch --dbs" },
    ],
  },
  {
    id: "wfuzz-jwt",
    name: "wfuzz / JWT_Tool",
    bins: ["wfuzz", "jwt_tool", "jwt_tool.py"],
    phases: ["web"],
    ctf: ["web-ctf"],
    certs: ["OSWE"],
    summary: "HTTP fuzzing and JWT analysis/tampering.",
    credit: "Xavi Mendez (wfuzz), ticarpi (JWT_Tool)",
    link: "https://github.com/ticarpi/jwt_tool",
    install: "pipx install wfuzz · git clone ticarpi/jwt_tool",
    risk: "launch",
    commands: [{ label: "JWT analyze", template: "jwt_tool {token}" }],
  },
  {
    id: "web-vuln-ref",
    name: "Web vuln reference (XSS/LFI/RFI/SSRF/CMDi/upload)",
    bins: [],
    phases: ["web"],
    ctf: ["web-ctf"],
    certs: ["OSWE"],
    summary: "Payload/methodology reference for common web classes. Education/reference.",
    credit: "PayloadsAllTheThings (swisskyrepo), OWASP",
    link: "https://github.com/swisskyrepo/PayloadsAllTheThings",
    risk: "reference",
    notes: [
      "LFI → log poisoning, php filters, wrappers.",
      "SSRF → cloud metadata (169.254.169.254), gopher.",
      "Upload → extension/MIME/magic-byte bypass; test in authorized scope only.",
    ],
  },
  // ───────────────────────── credentials ─────────────────────────
  {
    id: "hydra",
    name: "hydra / kerbrute",
    bins: ["hydra", "kerbrute"],
    phases: ["cred"],
    certs: ["OSCP"],
    summary: "Online password/credential spraying across many protocols.",
    credit: "van Hauser/THC (hydra), ropnop (kerbrute)",
    link: "https://github.com/vanhauser-thc/thc-hydra",
    install: "apt install hydra",
    risk: "launch",
    commands: [
      { label: "SSH spray", template: "hydra -L {users} -P {passwords} ssh://{host}" },
      { label: "HTTP POST form", template: "hydra -l {user} -P {passwords} {host} http-post-form '{path}:{body}:{failstr}'" },
      { label: "kerbrute userenum", template: "kerbrute userenum -d {domain} --dc {host} {users}" },
    ],
    notes: ["Mind lockout policy. One client, one budget."],
  },
  {
    id: "hashcat-john",
    name: "hashcat / John the Ripper",
    bins: ["hashcat", "john"],
    phases: ["cred"],
    ctf: ["crypto"],
    certs: ["OSCP", "CTF"],
    summary: "Offline password cracking (GPU/CPU).",
    credit: "Jens Steube/hashcat team, Openwall (John)",
    link: "https://hashcat.net/hashcat/",
    install: "apt install hashcat john",
    risk: "launch",
    commands: [
      { label: "hashcat wordlist", template: "hashcat -m {mode} {hashfile} {wordlist}" },
      { label: "hashcat rules", template: "hashcat -m {mode} {hashfile} {wordlist} -r /usr/share/hashcat/rules/best64.rule" },
      { label: "john auto", template: "john --wordlist={wordlist} {hashfile}" },
    ],
    notes: ["Identify the hash mode first (see Hash-ID tool)."],
  },
  {
    id: "to-john",
    name: "keepass2john / zip2john",
    bins: ["keepass2john", "zip2john", "ssh2john"],
    phases: ["cred"],
    ctf: ["crypto", "forensics"],
    summary: "Extract crackable hashes from protected files.",
    credit: "John the Ripper (Openwall)",
    link: "https://www.openwall.com/john/",
    install: "apt install john",
    risk: "launch",
    commands: [{ label: "zip2john", template: "zip2john {file}.zip > {file}.hash" }],
  },
  {
    id: "netexec",
    name: "NetExec (nxc) / CrackMapExec / Responder",
    bins: ["netexec", "nxc", "crackmapexec", "cme", "responder", "Responder.py"],
    phases: ["cred", "ad"],
    certs: ["OSCP", "OSEP"],
    summary: "Swiss-army for AD/SMB auth, spraying, and LLMNR/NBT-NS poisoning capture.",
    credit: "NetExec team (fork of CME by byt3bl33d3r), lgandx (Responder)",
    link: "https://github.com/Pennyw0rth/NetExec",
    install: "pipx install netexec",
    risk: "launch",
    commands: [
      { label: "SMB spray", template: "nxc smb {host} -u {users} -p {passwords} --continue-on-success" },
      { label: "Responder", template: "responder -I {iface} -wv" },
    ],
    notes: ["Responder is poisoning — only on engagements with written authorization."],
  },
  // ───────────────────────── exploitation / C2 (reference) ─────────────────────────
  {
    id: "metasploit",
    name: "Metasploit / msfvenom",
    bins: ["msfconsole", "msfvenom"],
    phases: ["exploit"],
    certs: ["OSCP"],
    summary: "Exploitation framework + payload generator. Config/reference — review modules before use.",
    credit: "Rapid7 / Metasploit community",
    link: "https://github.com/rapid7/metasploit-framework",
    install: "curl .../msfinstall | sh",
    risk: "reference",
    commands: [
      { label: "Console", template: "msfconsole -q" },
      { label: "msfvenom (lab payload)", template: "msfvenom -p {payload} LHOST={lhost} LPORT={lport} -f {format} -o {out}" },
    ],
    notes: ["Only generate/deploy payloads inside your authorized lab/engagement."],
  },
  {
    id: "impacket",
    name: "Impacket suite",
    bins: ["impacket-psexec", "psexec.py", "secretsdump.py", "wmiexec.py", "ntlmrelayx.py", "mssqlclient.py", "smbserver.py"],
    phases: ["exploit", "ad", "cred"],
    certs: ["OSCP", "OSEP"],
    summary: "Python classes/tools for network protocols (psexec, wmiexec, secretsdump, ntlmrelayx, …).",
    credit: "Fortra / SecureAuth (Impacket)",
    link: "https://github.com/fortra/impacket",
    install: "pipx install impacket",
    risk: "launch",
    commands: [
      { label: "secretsdump", template: "impacket-secretsdump '{domain}/{user}:{pass}@{host}'" },
      { label: "wmiexec", template: "impacket-wmiexec '{domain}/{user}:{pass}@{host}'" },
      { label: "smbserver (relay drop)", template: "impacket-smbserver share . -smb2support" },
    ],
  },
  {
    id: "evil-winrm",
    name: "evil-winrm",
    bins: ["evil-winrm"],
    phases: ["exploit", "ad", "pivot"],
    certs: ["OSCP"],
    summary: "WinRM shell for authenticated remoting.",
    credit: "Hackplayers (@CyberVaca)",
    link: "https://github.com/Hackplayers/evil-winrm",
    install: "gem install evil-winrm",
    risk: "launch",
    commands: [{ label: "Connect", template: "evil-winrm -i {host} -u {user} -p '{pass}'" }],
  },
  {
    id: "c2-ref",
    name: "C2 frameworks (Sliver / Covenant / Empire)",
    bins: ["sliver-server", "sliver"],
    phases: ["exploit"],
    certs: ["OSEP"],
    summary: "Command-and-control references. Setup/config guidance only; no implants bundled.",
    credit: "BishopFox (Sliver), cobbr (Covenant), BC-SECURITY (Empire)",
    link: "https://github.com/BishopFox/sliver",
    risk: "reference",
    notes: ["Use only within authorized red-team engagements and documented rules of engagement."],
  },
  // ───────────────────────── windows privesc ─────────────────────────
  {
    id: "winpeas",
    name: "WinPEAS / Seatbelt / SharpUp / PowerUp",
    bins: [],
    phases: ["privesc-win"],
    certs: ["OSCP"],
    summary: "Windows local privesc enumeration suites.",
    credit: "PEASS-ng (carlospolop), GhostPack (SpecterOps)",
    link: "https://github.com/peass-ng/PEASS-ng",
    risk: "reference",
    notes: [
      "WinPEASx64.exe / winpeas.bat for enumeration.",
      "PowerUp: Invoke-AllChecks. Seatbelt/SharpUp are C#; compile or use published builds.",
      "Check: unquoted service paths, weak service perms, AlwaysInstallElevated, token privs.",
    ],
  },
  {
    id: "potato-ref",
    name: "Potato / PrintSpoofer references",
    bins: [],
    phases: ["privesc-win"],
    certs: ["OSCP"],
    summary: "SeImpersonate abuse references (PrintSpoofer/GodPotato/JuicyPotato).",
    credit: "itm4n (PrintSpoofer), BeichenDream (GodPotato), ohpe (JuicyPotato)",
    link: "https://github.com/itm4n/PrintSpoofer",
    risk: "reference",
    notes: ["Applicable when SeImpersonatePrivilege/SeAssignPrimaryToken is held.", "cmdkey /list · icacls for ACL review."],
  },
  // ───────────────────────── linux privesc ─────────────────────────
  {
    id: "linpeas",
    name: "LinPEAS / LinEnum / linux-exploit-suggester",
    bins: ["pspy", "pspy64"],
    phases: ["privesc-lin"],
    certs: ["OSCP"],
    summary: "Linux local privesc enumeration + process monitoring (pspy).",
    credit: "PEASS-ng (carlospolop), rebootuser (LinEnum), mzet- (LES), DominicBreuker (pspy)",
    link: "https://github.com/peass-ng/PEASS-ng",
    risk: "reference",
    notes: [
      "linpeas.sh for enumeration; pspy for cron/process spying without root.",
      "Checklists: SUID/SGID, sudo -l, writable cron, capabilities (getcap -r /).",
    ],
  },
  {
    id: "gtfobins",
    name: "GTFOBins / LOLBAS",
    bins: [],
    phases: ["privesc-lin", "privesc-win"],
    certs: ["OSCP"],
    summary: "Curated living-off-the-land binary techniques for Unix and Windows.",
    credit: "GTFOBins (Emilio Pinna/Andrea Cardaci), LOLBAS Project",
    link: "https://gtfobins.github.io/",
    risk: "reference",
    notes: ["Look up a binary you can run as root/SUID or via sudo to find an escalation primitive."],
  },
  // ───────────────────────── AD / lateral ─────────────────────────
  {
    id: "bloodhound",
    name: "BloodHound / SharpHound",
    bins: ["bloodhound", "bloodhound-python"],
    phases: ["ad"],
    certs: ["OSCP", "OSEP"],
    summary: "Graph AD attack paths from collected data.",
    credit: "SpecterOps (BloodHound)",
    link: "https://github.com/SpecterOps/BloodHound",
    install: "pipx install bloodhound · docker compose (BHCE)",
    risk: "launch",
    commands: [{ label: "Python collector", template: "bloodhound-python -d {domain} -u {user} -p '{pass}' -c All -ns {host}" }],
  },
  {
    id: "rubeus-mimikatz",
    name: "Rubeus / Mimikatz / PowerView",
    bins: [],
    phases: ["ad", "cred"],
    certs: ["OSCP", "OSEP"],
    summary: "Kerberos abuse, credential extraction and AD recon references.",
    credit: "GhostPack (SpecterOps), gentilkiwi (Mimikatz), PowerSploit/PowerView",
    link: "https://github.com/GhostPack/Rubeus",
    risk: "reference",
    notes: [
      "Kerberoast: request SPN tickets, crack offline.",
      "AS-REP roast: accounts with 'Do not require preauth'.",
      "DCSync needs replication rights; Mimikatz lsadump::dcsync. Reference only.",
    ],
  },
  // ───────────────────────── pivoting / tunneling ─────────────────────────
  {
    id: "chisel-ligolo",
    name: "chisel / ligolo-ng / sshuttle",
    bins: ["chisel", "ligolo-ng", "ligolo", "sshuttle"],
    phases: ["pivot"],
    certs: ["OSCP", "OSEP"],
    summary: "TCP/UDP tunneling and transparent VPN-style pivoting.",
    credit: "jpillora (chisel), nicocha30 (ligolo-ng), Brian May (sshuttle)",
    link: "https://github.com/nicocha30/ligolo-ng",
    install: "download releases · pipx install sshuttle",
    risk: "launch",
    commands: [
      { label: "chisel server", template: "chisel server -p {port} --reverse" },
      { label: "chisel client reverse SOCKS", template: "chisel client {lhost}:{port} R:socks" },
      { label: "sshuttle", template: "sshuttle -r {user}@{host} {subnet}" },
    ],
  },
  {
    id: "proxychains",
    name: "proxychains4 / SSH port-forward / dnscat2",
    bins: ["proxychains4", "proxychains", "dnscat2"],
    phases: ["pivot"],
    certs: ["OSCP"],
    summary: "Route tools through a SOCKS proxy; SSH tunnels; DNS tunneling (dnscat2).",
    credit: "rofl0r (proxychains-ng), OpenSSH, iagox86 (dnscat2)",
    link: "https://github.com/rofl0r/proxychains-ng",
    install: "apt install proxychains4",
    risk: "launch",
    commands: [
      { label: "Run via SOCKS", template: "proxychains4 -q nmap -sT -Pn {host}" },
      { label: "SSH dynamic (SOCKS)", template: "ssh -D 1080 {user}@{host}" },
      { label: "SSH local forward", template: "ssh -L {lport}:{target}:{rport} {user}@{host}" },
    ],
  },
  // ───────────────────────── exploit dev (OSED) + reversing ─────────────────────────
  {
    id: "pwntools",
    name: "pwntools / gdb (pwndbg/GEF) / ROPgadget / one_gadget",
    bins: ["gdb", "ROPgadget", "one_gadget", "patchelf"],
    phases: ["exploit-dev"],
    ctf: ["pwn"],
    certs: ["OSED", "CTF"],
    summary: "Binary-exploitation toolkit for CTF pwn and exploit development.",
    credit: "Gallopsled (pwntools), pwndbg/GEF, JonathanSalwan (ROPgadget), david942j (one_gadget)",
    link: "https://github.com/Gallopsled/pwntools",
    install: "pipx install pwntools · apt install gdb",
    risk: "launch",
    commands: [
      { label: "ROP gadgets", template: "ROPgadget --binary {file} | grep '{pattern}'" },
      { label: "one_gadget", template: "one_gadget {libc}" },
      { label: "Checksec", template: "pwn checksec {file}" },
    ],
    notes: ["OSED cheats: ASLR/DEP/SEH/ROP. mona.py in Immunity/WinDbg for Windows."],
  },
  {
    id: "ghidra-r2",
    name: "Ghidra / radare2 / Cutter / IDA / angr",
    bins: ["ghidra", "ghidraRun", "r2", "radare2", "cutter", "angr"],
    phases: ["exploit-dev"],
    ctf: ["reversing"],
    certs: ["OSED", "CTF"],
    summary: "Static & symbolic reverse engineering suites.",
    credit: "NSA (Ghidra), pancake (radare2/Cutter), Hex-Rays (IDA), angr team",
    link: "https://ghidra-sre.org/",
    install: "download Ghidra · apt install radare2 · pipx install angr",
    risk: "launch",
    commands: [
      { label: "r2 analyze", template: "r2 -AA {file}" },
      { label: "Ghidra headless", template: "ghidra analyzeHeadless {proj} tmp -import {file}" },
    ],
  },
  {
    id: "android-re",
    name: "apktool / jadx / dnSpy / WinDbg references",
    bins: ["apktool", "jadx", "jadx-gui"],
    phases: ["exploit-dev"],
    ctf: ["reversing"],
    certs: ["OSED", "CTF"],
    summary: "Mobile/.NET/Windows reversing references.",
    credit: "iBotPeaches (apktool), skylot (jadx), dnSpyEx, Microsoft (WinDbg)",
    link: "https://github.com/skylot/jadx",
    install: "apt install apktool · download jadx",
    risk: "launch",
    commands: [
      { label: "apk decode", template: "apktool d {file}.apk" },
      { label: "jadx decompile", template: "jadx -d out {file}.apk" },
    ],
  },
  // ───────────────────────── evasion (OSEP) reference ─────────────────────────
  {
    id: "evasion-ref",
    name: "AV/EDR evasion references (OSEP)",
    bins: [],
    phases: ["evasion"],
    certs: ["OSEP"],
    summary: "Education/reference on evasion concepts — no working malware is shipped.",
    credit: "OSEP/PEN-300 curriculum; community research",
    link: "https://www.offsec.com/courses/pen-300/",
    risk: "reference",
    notes: [
      "Concepts: process injection/hollowing, unhooking, AMSI/ETW patching, AppLocker bypass, domain fronting.",
      "Study and build only in your own authorized lab. This panel is reference-only.",
    ],
  },
  // ───────────────────────── crypto / CTF ─────────────────────────
  {
    id: "cyberchef",
    name: "CyberChef / RsaCtfTool / featherduster",
    bins: ["rsactftool", "RsaCtfTool.py"],
    phases: ["post"],
    ctf: ["crypto", "misc"],
    certs: ["CTF"],
    summary: "Data transforms (built-in toolkit panel) + RSA CTF solver + crypto analysis.",
    credit: "GCHQ (CyberChef), Ganapati (RsaCtfTool), nccgroup (featherduster)",
    link: "https://github.com/gchq/CyberChef",
    risk: "launch",
    commands: [{ label: "RsaCtfTool", template: "RsaCtfTool --publickey {key} --uncipherfile {file}" }],
    notes: ["See the built-in CyberChef-style Data Toolkit and Hash-ID panels."],
  },
  // ───────────────────────── forensics / stego ─────────────────────────
  {
    id: "volatility",
    name: "Volatility 3 / Autopsy / Sleuth Kit",
    bins: ["vol", "volatility3", "vol.py", "autopsy", "mmls", "fls"],
    phases: ["post"],
    ctf: ["forensics"],
    certs: ["CTF"],
    summary: "Memory and disk forensics.",
    credit: "Volatility Foundation, Brian Carrier (Sleuth Kit/Autopsy)",
    link: "https://github.com/volatilityfoundation/volatility3",
    install: "pipx install volatility3 · apt install sleuthkit autopsy",
    risk: "launch",
    commands: [
      { label: "Vol3 pslist", template: "vol -f {image} windows.pslist" },
      { label: "Vol3 info", template: "vol -f {image} windows.info" },
    ],
  },
  {
    id: "binwalk-foremost",
    name: "binwalk / foremost / scalpel",
    bins: ["binwalk", "foremost", "scalpel"],
    phases: ["post"],
    ctf: ["forensics", "stego"],
    certs: ["CTF"],
    summary: "Firmware/file carving and embedded-file extraction.",
    credit: "ReFirmLabs (binwalk), foremost (Jesse Kornblum et al.)",
    link: "https://github.com/ReFirmLabs/binwalk",
    install: "apt install binwalk foremost",
    risk: "launch",
    commands: [
      { label: "binwalk extract", template: "binwalk -e {file}" },
      { label: "foremost carve", template: "foremost -i {file} -o carve-out" },
    ],
  },
  {
    id: "wireshark",
    name: "Wireshark / tshark",
    bins: ["wireshark", "tshark"],
    phases: ["post", "recon"],
    ctf: ["forensics"],
    certs: ["CTF"],
    summary: "Packet capture & analysis.",
    credit: "Wireshark Foundation",
    link: "https://www.wireshark.org/",
    install: "apt install wireshark tshark",
    risk: "launch",
    commands: [{ label: "tshark read", template: "tshark -r {pcap} -Y '{filter}'" }],
  },
  {
    id: "stego",
    name: "steghide / zsteg / stegsolve",
    bins: ["steghide", "zsteg", "stegsolve"],
    phases: ["post"],
    ctf: ["stego"],
    certs: ["CTF"],
    summary: "Steganography extraction/analysis for CTF media challenges.",
    credit: "Stefan Hetzl (steghide), zed-0xff (zsteg), Caesum (Stegsolve)",
    link: "https://github.com/zed-0xff/zsteg",
    install: "apt install steghide · gem install zsteg",
    risk: "launch",
    commands: [
      { label: "steghide extract", template: "steghide extract -sf {file}" },
      { label: "zsteg", template: "zsteg -a {file}.png" },
    ],
  },
]

export function toolsForPhase(phase: KillPhase): ArsenalTool[] {
  return ARSENAL.filter((t) => t.phases.includes(phase))
}
export function toolsForCtf(cat: CtfCategory): ArsenalTool[] {
  return ARSENAL.filter((t) => t.ctf?.includes(cat))
}
export function allBins(): string[] {
  return Array.from(new Set(ARSENAL.flatMap((t) => t.bins))).filter(Boolean).sort()
}
export function getTool(id: string): ArsenalTool | undefined {
  return ARSENAL.find((t) => t.id === id)
}
