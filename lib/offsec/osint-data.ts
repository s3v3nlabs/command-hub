/** OSINT reference data: Google dork operators, dork recipes, and the OSINT Framework category tree. */

export interface DorkOperator {
  op: string
  desc: string
  example: string
}

export const GOOGLE_OPERATORS: DorkOperator[] = [
  { op: "site:", desc: "Limit to a domain.", example: "site:example.com" },
  { op: "inurl:", desc: "Term in the URL.", example: "inurl:admin" },
  { op: "intitle:", desc: "Term in the page title.", example: "intitle:\"index of\"" },
  { op: "intext:", desc: "Term in the body.", example: "intext:password" },
  { op: "filetype:", desc: "Restrict to a file extension.", example: "filetype:pdf" },
  { op: "ext:", desc: "Alias of filetype.", example: "ext:sql" },
  { op: "cache:", desc: "Google's cached copy.", example: "cache:example.com" },
  { op: "related:", desc: "Sites similar to one.", example: "related:example.com" },
  { op: "link:", desc: "Pages linking to a URL (deprecated-ish).", example: "link:example.com" },
  { op: "allintitle:", desc: "All terms in the title.", example: "allintitle: admin login" },
  { op: "allinurl:", desc: "All terms in the URL.", example: "allinurl: auth login" },
  { op: "AROUND(n)", desc: "Terms within n words.", example: "\"first\" AROUND(3) \"last\"" },
  { op: "\"...\"", desc: "Exact phrase.", example: "\"confidential report\"" },
  { op: "-term", desc: "Exclude a term.", example: "login -github" },
  { op: "OR", desc: "Either term.", example: "login OR signin" },
  { op: "*", desc: "Wildcard.", example: "\"username * password\"" },
  { op: "..", desc: "Numeric range.", example: "camera $50..$100" },
]

export interface DorkRecipe {
  label: string
  category: "exposure" | "files" | "login" | "devices" | "errors" | "code"
  query: string
  note?: string
}

export const DORK_RECIPES: DorkRecipe[] = [
  { label: "Open directory listings", category: "exposure", query: "intitle:\"index of\" site:{domain}" },
  { label: "Exposed .env / config", category: "exposure", query: "site:{domain} (ext:env OR ext:ini OR ext:conf) intext:password", note: "Report, do not harvest." },
  { label: "SQL dumps", category: "files", query: "site:{domain} ext:sql intext:INSERT INTO" },
  { label: "Documents (pdf/doc/xls)", category: "files", query: "site:{domain} (filetype:pdf OR filetype:docx OR filetype:xlsx)" },
  { label: "Login / admin portals", category: "login", query: "site:{domain} (inurl:admin OR inurl:login OR intitle:login)" },
  { label: "Backups & archives", category: "files", query: "site:{domain} (ext:bak OR ext:old OR ext:zip OR ext:tar.gz)" },
  { label: "Exposed cameras/devices", category: "devices", query: "intitle:\"webcamXP\" OR inurl:\"ViewerFrame?Mode=\"", note: "Never access devices you aren't authorized to." },
  { label: "Verbose errors / stack traces", category: "errors", query: "site:{domain} (intext:\"stack trace\" OR intext:\"Fatal error\" OR intext:\"Warning: mysql\")" },
  { label: "API keys in code hosts", category: "code", query: "site:github.com {domain} (intext:api_key OR intext:apikey OR intext:secret)", note: "Responsible disclosure only." },
  { label: "Exposed Git folder", category: "exposure", query: "site:{domain} inurl:.git" },
  { label: "Employee emails", category: "exposure", query: "site:{domain} intext:\"@{domain}\"" },
]

export interface OsintNode {
  name: string
  url?: string
  children?: OsintNode[]
  note?: string
}

/** Condensed OSINT Framework-style category tree (osintframework.com). */
export const OSINT_TREE: OsintNode[] = [
  {
    name: "Username",
    children: [
      { name: "Sherlock", url: "https://github.com/sherlock-project/sherlock" },
      { name: "Maigret", url: "https://github.com/soxoj/maigret" },
      { name: "WhatsMyName", url: "https://whatsmyname.app/" },
      { name: "Blackbird", url: "https://github.com/p1ngul1n0/blackbird" },
      { name: "NameChk", url: "https://namechk.com/" },
    ],
  },
  {
    name: "Email Address",
    children: [
      { name: "holehe", url: "https://github.com/megadose/holehe" },
      { name: "Have I Been Pwned", url: "https://haveibeenpwned.com/" },
      { name: "Hunter.io", url: "https://hunter.io/" },
      { name: "EmailRep", url: "https://emailrep.io/" },
      { name: "GHunt (Google)", url: "https://github.com/mxrch/GHunt" },
    ],
  },
  {
    name: "Phone Numbers",
    children: [
      { name: "PhoneInfoga", url: "https://github.com/sundowndev/phoneinfoga" },
      { name: "NumLookup", url: "https://www.numlookup.com/" },
      { name: "Truecaller (manual)", url: "https://www.truecaller.com/" },
    ],
  },
  {
    name: "Domain / IP / Infra",
    children: [
      { name: "crt.sh (certs)", url: "https://crt.sh/" },
      { name: "SecurityTrails", url: "https://securitytrails.com/" },
      { name: "Shodan", url: "https://www.shodan.io/" },
      { name: "Censys", url: "https://search.censys.io/" },
      { name: "ViewDNS", url: "https://viewdns.info/" },
      { name: "DNSdumpster", url: "https://dnsdumpster.com/" },
      { name: "Amass", url: "https://github.com/owasp-amass/amass" },
    ],
  },
  {
    name: "People Search",
    children: [
      { name: "Pipl (paid)", url: "https://pipl.com/" },
      { name: "That'sThem", url: "https://thatsthem.com/" },
      { name: "WebMii", url: "https://webmii.com/" },
      { name: "IntelTechniques Tools", url: "https://inteltechniques.com/tools/" },
    ],
  },
  {
    name: "Social Networks",
    children: [
      { name: "Social Searcher", url: "https://www.social-searcher.com/" },
      { name: "X / Twitter advanced search", url: "https://twitter.com/search-advanced" },
      { name: "Instagram (OSINT notes)", url: "https://github.com/sc1341/InstagramOSINT", note: "Osintgram is deprecated." },
    ],
  },
  {
    name: "Images / Video / Geo",
    children: [
      { name: "Google Lens / Images", url: "https://images.google.com/" },
      { name: "Yandex Images", url: "https://yandex.com/images/" },
      { name: "TinEye", url: "https://tineye.com/" },
      { name: "Overpass Turbo (OSM)", url: "https://overpass-turbo.eu/" },
      { name: "Creepy (geo)", url: "https://github.com/ilektrojohn/creepy" },
    ],
  },
  {
    name: "Breaches / Leaks",
    children: [
      { name: "Have I Been Pwned", url: "https://haveibeenpwned.com/" },
      { name: "Dehashed (paid)", url: "https://www.dehashed.com/" },
      { name: "IntelX", url: "https://intelx.io/" },
    ],
  },
  {
    name: "Frameworks & Portals",
    children: [
      { name: "OSINT Framework", url: "https://osintframework.com/" },
      { name: "IntelTechniques", url: "https://inteltechniques.com/" },
      { name: "SpiderFoot", url: "https://github.com/smicallef/spiderfoot" },
      { name: "Recon-ng", url: "https://github.com/lanmaster53/recon-ng" },
      { name: "Maltego CE", url: "https://www.maltego.com/" },
      { name: "Trace Labs OSINT VM", url: "https://www.tracelabs.org/initiatives/osint-vm" },
    ],
  },
]

export interface SearchEngine {
  name: string
  /** {q} replaced with the URL-encoded query. */
  url: string
}
export const SEARCH_ENGINES: SearchEngine[] = [
  { name: "Google", url: "https://www.google.com/search?q={q}" },
  { name: "Bing", url: "https://www.bing.com/search?q={q}" },
  { name: "DuckDuckGo", url: "https://duckduckgo.com/?q={q}" },
  { name: "Yandex", url: "https://yandex.com/search/?text={q}" },
  { name: "Brave", url: "https://search.brave.com/search?q={q}" },
]

/** SECTF / Trace Labs OSINT report scaffold (training & authorized engagements only). */
export const SECTF_REPORT_TEMPLATE = `# OSINT / SE Engagement Report

## Authorization & Rules of Engagement
- Engagement: 
- Authorized by (name / ticket / signed scope): 
- Scope (in-scope targets): 
- Out of scope / prohibited: 
- Window (start – end): 

## Pretext (training / authorized only)
- Persona / sock-puppet (clearly fictional, no real-victim impersonation): 
- Objective (what information, no actual fraud/harm): 

## Collection Log (source → finding → timestamp → confidence)
| Time | Source | Finding | Confidence | Link |
|------|--------|---------|-----------|------|

## Flags / Findings
- 

## Risk & Recommendations
- 

> Social engineering is practiced only in training and authorized engagements. Never target or harm a real person.`
