/**
 * Bundled static MITRE ATT&CK (Enterprise) technique reference — curated subset.
 *
 * SOURCE / ATTRIBUTION: MITRE ATT&CK®, https://attack.mitre.org
 * © The MITRE Corporation. ATT&CK is used per the MITRE ATT&CK Terms of Use
 * (https://attack.mitre.org/resources/legal-and-branding/terms-of-use/).
 * This is a curated subset for in-hub mapping; it is NOT the complete matrix.
 * To refresh/extend, pull the official STIX bundle from
 * https://github.com/mitre-attack/attack-stix-data . Cited in NOTICE.
 */

export interface AttackTechnique {
  id: string
  name: string
  tactics: string[]
  url: string
  /** lowercase keywords used for best-effort text→technique mapping */
  keywords: string[]
}

export const ATTACK_TACTICS: { id: string; name: string }[] = [
  { id: "reconnaissance", name: "Reconnaissance" },
  { id: "resource-development", name: "Resource Development" },
  { id: "initial-access", name: "Initial Access" },
  { id: "execution", name: "Execution" },
  { id: "persistence", name: "Persistence" },
  { id: "privilege-escalation", name: "Privilege Escalation" },
  { id: "defense-evasion", name: "Defense Evasion" },
  { id: "credential-access", name: "Credential Access" },
  { id: "discovery", name: "Discovery" },
  { id: "lateral-movement", name: "Lateral Movement" },
  { id: "collection", name: "Collection" },
  { id: "command-and-control", name: "Command and Control" },
  { id: "exfiltration", name: "Exfiltration" },
  { id: "impact", name: "Impact" },
]

const T = (id: string, name: string, tactics: string[], keywords: string[]): AttackTechnique => ({
  id,
  name,
  tactics,
  url: `https://attack.mitre.org/techniques/${id.replace(".", "/")}/`,
  keywords: keywords.map((k) => k.toLowerCase()),
})

export const ATTACK_TECHNIQUES: AttackTechnique[] = [
  // Reconnaissance
  T("T1595", "Active Scanning", ["reconnaissance"], ["nmap", "port scan", "scanning", "masscan", "vuln scan", "shodan", "censys"]),
  T("T1592", "Gather Victim Host Information", ["reconnaissance"], ["fingerprint", "host info", "banner grab", "os detection"]),
  T("T1589", "Gather Victim Identity Information", ["reconnaissance"], ["email", "credentials osint", "username enum", "employee"]),
  T("T1590", "Gather Victim Network Information", ["reconnaissance"], ["dns", "whois", "subdomain", "netblock", "asn"]),
  T("T1598", "Phishing for Information", ["reconnaissance"], ["phishing recon", "pretext", "spearphishing info"]),
  // Resource Development
  T("T1583", "Acquire Infrastructure", ["resource-development"], ["c2 infrastructure", "domain register", "vps", "redirector"]),
  T("T1587", "Develop Capabilities", ["resource-development"], ["malware dev", "custom payload", "tooling"]),
  // Initial Access
  T("T1566", "Phishing", ["initial-access"], ["phishing", "spearphishing", "malicious attachment", "malicious link"]),
  T("T1190", "Exploit Public-Facing Application", ["initial-access"], ["web exploit", "sqli", "sql injection", "rce", "deserialization", "public-facing", "cve", "unauthenticated"]),
  T("T1133", "External Remote Services", ["initial-access", "persistence"], ["vpn", "rdp exposed", "remote service", "citrix", "ssh exposed"]),
  T("T1078", "Valid Accounts", ["initial-access", "persistence", "privilege-escalation", "defense-evasion"], ["valid account", "stolen credentials", "default password", "weak password", "reused password"]),
  T("T1195", "Supply Chain Compromise", ["initial-access"], ["supply chain", "dependency", "third-party package"]),
  // Execution
  T("T1059", "Command and Scripting Interpreter", ["execution"], ["powershell", "bash", "cmd", "python", "script", "command injection"]),
  T("T1203", "Exploitation for Client Execution", ["execution"], ["client exploit", "browser exploit", "document exploit"]),
  T("T1569", "System Services", ["execution"], ["service exec", "psexec", "service"]),
  // Persistence
  T("T1136", "Create Account", ["persistence"], ["create account", "backdoor account", "rogue user"]),
  T("T1505", "Server Software Component", ["persistence"], ["web shell", "webshell", "iis module", "sql stored proc"]),
  T("T1543", "Create or Modify System Process", ["persistence", "privilege-escalation"], ["systemd", "service persistence", "daemon", "launchd"]),
  T("T1053", "Scheduled Task/Job", ["persistence", "privilege-escalation", "execution"], ["cron", "scheduled task", "at job"]),
  // Privilege Escalation
  T("T1068", "Exploitation for Privilege Escalation", ["privilege-escalation"], ["privilege escalation", "kernel exploit", "local exploit", "priv esc", "setuid"]),
  T("T1548", "Abuse Elevation Control Mechanism", ["privilege-escalation", "defense-evasion"], ["sudo", "uac bypass", "setuid", "elevation"]),
  // Defense Evasion
  T("T1070", "Indicator Removal", ["defense-evasion"], ["log deletion", "clear logs", "anti-forensics", "timestomp"]),
  T("T1562", "Impair Defenses", ["defense-evasion"], ["disable av", "disable edr", "disable firewall", "impair defenses", "tamper"]),
  T("T1027", "Obfuscated Files or Information", ["defense-evasion"], ["obfuscation", "packing", "encoded payload", "base64 payload"]),
  T("T1550", "Use Alternate Authentication Material", ["defense-evasion", "lateral-movement"], ["pass the hash", "pass the ticket", "token theft"]),
  // Credential Access
  T("T1110", "Brute Force", ["credential-access"], ["brute force", "password spray", "credential stuffing", "hydra"]),
  T("T1003", "OS Credential Dumping", ["credential-access"], ["mimikatz", "lsass", "credential dump", "sam dump", "ntds"]),
  T("T1552", "Unsecured Credentials", ["credential-access"], ["hardcoded credentials", "plaintext password", "exposed secret", "credentials in file", "api key leak"]),
  T("T1555", "Credentials from Password Stores", ["credential-access"], ["password manager", "keychain", "browser passwords"]),
  // Discovery
  T("T1046", "Network Service Discovery", ["discovery"], ["service discovery", "open ports", "service enum"]),
  T("T1087", "Account Discovery", ["discovery"], ["account enum", "user enumeration", "ldap enum"]),
  T("T1083", "File and Directory Discovery", ["discovery"], ["file discovery", "directory listing", "sensitive files"]),
  T("T1018", "Remote System Discovery", ["discovery"], ["host discovery", "network mapping", "arp scan"]),
  // Lateral Movement
  T("T1021", "Remote Services", ["lateral-movement"], ["rdp", "smb", "ssh lateral", "winrm", "lateral movement"]),
  T("T1570", "Lateral Tool Transfer", ["lateral-movement"], ["tool transfer", "copy payload", "smb copy"]),
  // Collection
  T("T1005", "Data from Local System", ["collection"], ["local data", "file collection", "sensitive data"]),
  T("T1119", "Automated Collection", ["collection"], ["automated collection", "data harvest"]),
  // Command and Control
  T("T1071", "Application Layer Protocol", ["command-and-control"], ["c2", "https c2", "dns tunneling", "beacon", "command and control"]),
  T("T1572", "Protocol Tunneling", ["command-and-control"], ["tunneling", "ssh tunnel", "port forward"]),
  T("T1105", "Ingress Tool Transfer", ["command-and-control"], ["download payload", "ingress tool", "wget payload", "curl payload"]),
  // Exfiltration
  T("T1041", "Exfiltration Over C2 Channel", ["exfiltration"], ["exfiltration", "data exfil", "exfil over c2"]),
  T("T1048", "Exfiltration Over Alternative Protocol", ["exfiltration"], ["exfil dns", "exfil ftp", "alternative protocol exfil"]),
  // Impact
  T("T1486", "Data Encrypted for Impact", ["impact"], ["ransomware", "encrypt for impact", "crypto locker"]),
  T("T1499", "Endpoint Denial of Service", ["impact"], ["dos", "denial of service", "resource exhaustion"]),
  T("T1498", "Network Denial of Service", ["impact"], ["ddos", "network dos", "flood"]),
  T("T1485", "Data Destruction", ["impact"], ["data destruction", "wiper", "delete data"]),
]

export function getTechnique(id: string): AttackTechnique | undefined {
  return ATTACK_TECHNIQUES.find((t) => t.id.toLowerCase() === id.toLowerCase())
}
