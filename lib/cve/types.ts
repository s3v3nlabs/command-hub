/**
 * CVE (Common Vulnerabilities and Exposures) Types
 * Comprehensive type definitions for CVE data structures
 */

// Base CVE interface
export interface CVE {
  id: string // CVE ID (e.g., CVE-2021-44228)
  description: string // Description of the vulnerability
  published: Date // Date when the CVE was published
  modified: Date // Date when the CVE was last modified
  severity: CVESeverity // Severity rating
  cvss: CVSS // CVSS scoring information
  affected: AffectedProduct[] // Products affected by this vulnerability
  references: Reference[] // External references and resources
  exploits: Exploit[] // Known exploit information
  mitigations: Mitigation[] // Mitigation strategies
  attackVectors: AttackVector[] // Methods used to exploit the vulnerability
  status: CVEStatus // Current status of the CVE
  tags: string[] // Tags for categorization
  threatIntel?: ThreatIntel // Optional threat intelligence data
}

// CVE Severity levels
export type CVESeverity = "critical" | "high" | "medium" | "low" | "informational" | "unknown"

// CVE Status
export type CVEStatus = "published" | "modified" | "rejected" | "deprecated" | "disputed"

// CVSS (Common Vulnerability Scoring System)
export interface CVSS {
  version: string // CVSS version (e.g., "3.1")
  baseScore: number // Base score (0.0-10.0)
  temporalScore?: number // Temporal score
  environmentalScore?: number // Environmental score
  vector: string // CVSS vector string
  metrics: {
    attackVector: "network" | "adjacent" | "local" | "physical"
    attackComplexity: "low" | "high"
    privilegesRequired: "none" | "low" | "high"
    userInteraction: "none" | "required"
    scope: "unchanged" | "changed"
    confidentiality: "none" | "low" | "high"
    integrity: "none" | "low" | "high"
    availability: "none" | "low" | "high"
  }
}

// Affected Product
export interface AffectedProduct {
  vendor: string // Vendor name
  product: string // Product name
  versions: VersionRange[] // Affected versions
  platforms?: string[] // Affected platforms
  configurations?: string[] // Specific configurations affected
  cpe?: string[] // CPE (Common Platform Enumeration) identifiers
}

// Version Range
export interface VersionRange {
  introduced?: string // Version where vulnerability was introduced
  fixed?: string // Version where vulnerability was fixed
  lastAffected?: string // Last affected version if no fix exists
  versionType: "semver" | "custom" // Version format type
  affected: "all" | "range" | "exact" // How versions are affected
  exactVersion?: string // Specific version if affected is 'exact'
}

// External Reference
export interface Reference {
  url: string // URL to the reference
  name: string // Name or title of the reference
  source: string // Source of the reference
  tags: string[] // Tags describing the reference type
}

// Exploit Information
export interface Exploit {
  description: string // Description of the exploit
  type: ExploitType // Type of exploit
  source?: string // Source of the exploit
  url?: string // URL to the exploit code or details
  date?: Date // Date when the exploit was published
  complexity: "low" | "medium" | "high" // Complexity of using the exploit
  authentication: "none" | "single" | "multiple" // Authentication required
  availability: "poc" | "private" | "public" | "commercial" // Availability of the exploit
  maturity: "unproven" | "proof-of-concept" | "functional" | "high" | "not-defined" // Maturity of the exploit
}

// Exploit Types
export type ExploitType =
  | "remote-code-execution"
  | "privilege-escalation"
  | "information-disclosure"
  | "denial-of-service"
  | "sql-injection"
  | "cross-site-scripting"
  | "authentication-bypass"
  | "buffer-overflow"
  | "memory-corruption"
  | "other"

// Mitigation Strategy
export interface Mitigation {
  description: string // Description of the mitigation
  type: MitigationType // Type of mitigation
  complexity: "low" | "medium" | "high" // Complexity of implementing the mitigation
  effectiveness: "partial" | "complete" // Effectiveness of the mitigation
  temporaryFix: boolean // Whether this is a temporary fix
}

// Mitigation Types
export type MitigationType = "patch" | "workaround" | "configuration" | "architecture" | "policy" | "other"

// Attack Vector
export interface AttackVector {
  description: string // Description of the attack vector
  prerequisites: string[] // Prerequisites for the attack
  impact: string // Impact of a successful attack
  complexity: "low" | "medium" | "high" // Complexity of the attack
}

// Threat Intelligence
export interface ThreatIntel {
  inTheWild: boolean // Whether the vulnerability is exploited in the wild
  exploitationLikelihood: "low" | "medium" | "high" | "confirmed" // Likelihood of exploitation
  threatActors: ThreatActor[] // Threat actors known to exploit this vulnerability
  campaigns: Campaign[] // Campaigns involving this vulnerability
  ioc: IndicatorOfCompromise[] // Indicators of compromise
  timeline: TimelineEvent[] // Timeline of significant events
}

// Threat Actor
export interface ThreatActor {
  name: string // Name or identifier of the threat actor
  type: "nation-state" | "criminal" | "hacktivist" | "insider" | "unknown" // Type of threat actor
  motivation: string[] // Motivations (e.g., financial, espionage)
  sophistication: "low" | "medium" | "high" // Technical sophistication
  firstSeen?: Date // When this actor was first observed
  lastSeen?: Date // When this actor was last observed
  associatedGroups?: string[] // Other groups associated with this actor
  ttps?: string[] // Tactics, techniques, and procedures
}

// Campaign
export interface Campaign {
  name: string // Name of the campaign
  description: string // Description of the campaign
  startDate?: Date // Start date of the campaign
  endDate?: Date // End date of the campaign
  targets: string[] // Targeted sectors, regions, or organizations
  attribution?: string[] // Attribution to threat actors
}

// Indicator of Compromise
export interface IndicatorOfCompromise {
  type: "file-hash" | "ip-address" | "domain" | "url" | "email" | "registry" | "other" // Type of IoC
  value: string // Value of the IoC
  description?: string // Description of the IoC
  confidence: "low" | "medium" | "high" // Confidence in the IoC
  source?: string // Source of the IoC
}

// Timeline Event
export interface TimelineEvent {
  date: Date // Date of the event
  description: string // Description of the event
  type: "discovery" | "disclosure" | "exploit" | "patch" | "other" // Type of event
  source?: string // Source of the information
}

// CVE Database Query Parameters
export interface CVEQueryParams {
  id?: string // Search by CVE ID
  keyword?: string // Search in descriptions
  vendor?: string // Filter by vendor
  product?: string // Filter by product
  severity?: CVESeverity[] // Filter by severity
  cvssScore?: {
    // Filter by CVSS score range
    min?: number
    max?: number
  }
  dateRange?: {
    // Filter by date range
    start?: Date
    end?: Date
  }
  exploitAvailable?: boolean // Filter by exploit availability
  patchAvailable?: boolean // Filter by patch availability
  inTheWild?: boolean // Filter by in-the-wild exploitation
  limit?: number // Limit results
  offset?: number // Offset for pagination
  sortBy?: "published" | "modified" | "severity" | "cvss" // Sort field
  sortOrder?: "asc" | "desc" // Sort order
}

// CVE Database Response
export interface CVEQueryResponse {
  total: number // Total number of matching CVEs
  offset: number // Current offset
  limit: number // Current limit
  results: CVE[] // CVE results
}

// CVE Database Statistics
export interface CVEStatistics {
  total: number // Total number of CVEs in the database
  bySeverity: Record<CVESeverity, number> // Count by severity
  byYear: Record<number, number> // Count by year
  byVendor: Record<string, number> // Count by top vendors
  byProduct: Record<string, number> // Count by top products
  byExploitAvailability: {
    // Count by exploit availability
    available: number
    notAvailable: number
  }
  byPatchAvailability: {
    // Count by patch availability
    available: number
    notAvailable: number
  }
  lastUpdated: Date // Last database update time
}

// CVE Feed Source
export interface CVEFeedSource {
  name: string // Name of the feed source
  url: string // URL of the feed
  type: "nvd" | "mitre" | "vendor" | "researcher" | "other" // Type of feed
  format: "json" | "xml" | "csv" | "other" // Format of the feed
  updateFrequency: string // How often the feed is updated
  lastFetched?: Date // When the feed was last fetched
  credentials?: {
    // Optional credentials for authenticated feeds
    apiKey?: string
    username?: string
    password?: string
  }
}

// CVE Enrichment Source
export interface CVEEnrichmentSource {
  name: string // Name of the enrichment source
  type: "exploit-db" | "metasploit" | "threat-intel" | "vendor-advisory" | "other" // Type of source
  url: string // URL of the source
  apiEndpoint?: string // API endpoint if applicable
  apiKey?: string // API key if required
  enabled: boolean // Whether this source is enabled
}

// CVE Notification Rule
export interface CVENotificationRule {
  id: string // Rule identifier
  name: string // Rule name
  description?: string // Rule description
  criteria: {
    // Criteria for triggering the notification
    severity?: CVESeverity[] // Match severity
    vendors?: string[] // Match vendors
    products?: string[] // Match products
    cvssMinimum?: number // Minimum CVSS score
    exploitAvailable?: boolean // Exploit availability
    keywords?: string[] // Keywords in description
  }
  actions: {
    // Actions to take when criteria match
    email?: string[] // Email addresses to notify
    webhook?: string[] // Webhook URLs to call
    slack?: string[] // Slack channels to notify
    jira?: {
      // JIRA ticket creation
      project: string
      issueType: string
      priority?: string
    }
    sms?: string[] // Phone numbers for SMS
  }
  enabled: boolean // Whether this rule is enabled
  cooldown?: number // Cooldown period in hours
  lastTriggered?: Date // When this rule was last triggered
}

// MITRE ATT&CK Framework mapping
export interface MitreAttackMapping {
  cveId: string // CVE ID
  techniques: {
    // MITRE ATT&CK techniques
    id: string // Technique ID (e.g., T1190)
    name: string // Technique name
    url: string // URL to the technique
    description: string // Description of how the CVE relates to this technique
  }[]
  tactics: {
    // MITRE ATT&CK tactics
    id: string // Tactic ID (e.g., TA0001)
    name: string // Tactic name
    url: string // URL to the tactic
  }[]
}

// Vulnerability Assessment
export interface VulnerabilityAssessment {
  cveId: string // CVE ID
  assetId: string // Asset identifier
  scanId: string // Scan identifier
  scanDate: Date // Date of the scan
  status: "vulnerable" | "not-vulnerable" | "potentially-vulnerable" | "not-applicable" // Vulnerability status
  details: string // Assessment details
  evidence?: string // Evidence of vulnerability
  remediation?: string // Remediation steps
  assignedTo?: string // Person assigned to remediate
  dueDate?: Date // Due date for remediation
  priority: "critical" | "high" | "medium" | "low" // Remediation priority
}

// Vulnerability Scan
export interface VulnerabilityScan {
  id: string // Scan identifier
  name: string // Scan name
  startTime: Date // Start time
  endTime?: Date // End time
  status: "scheduled" | "running" | "completed" | "failed" | "cancelled" // Scan status
  scanType: "network" | "web" | "container" | "code" | "cloud" | "other" // Type of scan
  targets: string[] // Scan targets
  findings: {
    // Summary of findings
    critical: number
    high: number
    medium: number
    low: number
    info: number
  }
  scanner: string // Scanner used
  scannerVersion: string // Scanner version
  initiatedBy: string // Who initiated the scan
  report?: string // URL to the report
}

// Patch Management
export interface PatchInfo {
  cveId: string // CVE ID
  patchId: string // Patch identifier
  vendor: string // Vendor name
  product: string // Product name
  version: string // Patch version
  releaseDate: Date // Release date
  url: string // URL to the patch
  description: string // Patch description
  installationInstructions: string // Installation instructions
  dependencies?: string[] // Dependencies
  knownIssues?: string[] // Known issues
  verificationSteps?: string[] // Steps to verify installation
}

// Vulnerability Metrics
export interface VulnerabilityMetrics {
  timeToRemediate: {
    // Time to remediate by severity
    critical: number // Average days to remediate critical vulnerabilities
    high: number // Average days to remediate high vulnerabilities
    medium: number // Average days to remediate medium vulnerabilities
    low: number // Average days to remediate low vulnerabilities
  }
  patchCompliance: number // Percentage of systems patched
  vulnerabilityDensity: number // Vulnerabilities per asset
  riskScore: number // Overall risk score
  trendData: {
    // Trend data over time
    date: Date // Date point
    openVulnerabilities: number // Open vulnerabilities
    remediatedVulnerabilities: number // Remediated vulnerabilities
    newVulnerabilities: number // New vulnerabilities
  }[]
}

// Export all types
export default {
  CVE,
  CVESeverity,
  CVEStatus,
  CVSS,
  AffectedProduct,
  VersionRange,
  Reference,
  Exploit,
  ExploitType,
  Mitigation,
  MitigationType,
  AttackVector,
  ThreatIntel,
  ThreatActor,
  Campaign,
  IndicatorOfCompromise,
  TimelineEvent,
  CVEQueryParams,
  CVEQueryResponse,
  CVEStatistics,
  CVEFeedSource,
  CVEEnrichmentSource,
  CVENotificationRule,
  MitreAttackMapping,
  VulnerabilityAssessment,
  VulnerabilityScan,
  PatchInfo,
  VulnerabilityMetrics,
}
