import type { Message, Frame } from "@/types/signalframe"

export interface FrameTemplate {
  id: string
  name: string
  description: string
  category: "security" | "intelligence" | "communication" | "development" | "operations"
  icon: string
  theme: "primary" | "success" | "warning" | "danger" | "info"
  /** Local-first S3v3n panel seat for frame SEND (twin-rag | axios | ghostlight-vault | ollama …). */
  defaultSeat: string
  initialMessages: Message[]
  defaultSettings: {
    inputMode: "filtered" | "raw"
    size: { width: number; height: number }
    features: string[]
  }
  commands: Array<{
    command: string
    description: string
    example: string
  }>
}

export const frameTemplates: FrameTemplate[] = [
  {
    id: "threat-analysis",
    name: "Threat Analysis",
    description: "Security analysis and threat assessment workspace",
    category: "security",
    icon: "Shield",
    theme: "danger",
    defaultSeat: "twin-rag",
    initialMessages: [
      {
        id: "threat-init-1",
        content: `# 🛡️ THREAT ANALYSIS FRAME INITIALIZED

**Security Analysis Workspace Active**

This frame is configured for comprehensive threat assessment and security analysis.

## Available Commands:
- \`analyze <target>\` - Perform threat analysis on target
- \`scan <ip_range>\` - Network vulnerability scan
- \`report <findings>\` - Generate threat assessment report
- \`mitre <technique>\` - MITRE ATT&CK framework lookup
- \`cve <id>\` - CVE vulnerability details
- \`ioc <indicator>\` - Indicator of Compromise analysis

## Quick Actions:
- Type \`help\` for detailed command reference
- Use \`status\` to check current analysis state
- \`export\` to save analysis results

**🔒 Secure analysis environment ready**`,
        sender: "ai",
        timestamp: new Date(),
        type: "text",
        metadata: { tokens: 120, processingTime: 0 },
      },
    ],
    defaultSettings: {
      inputMode: "filtered",
      size: { width: 600, height: 500 },
      features: ["encryption", "logging", "export"],
    },
    commands: [
      { command: "analyze", description: "Perform threat analysis", example: "analyze 192.168.1.1" },
      { command: "scan", description: "Network vulnerability scan", example: "scan 10.0.0.0/24" },
      { command: "report", description: "Generate assessment report", example: "report critical-findings" },
      { command: "mitre", description: "MITRE ATT&CK lookup", example: "mitre T1055" },
    ],
  },
  {
    id: "intel-gathering",
    name: "Intel Gathering",
    description: "OSINT and intelligence collection operations",
    category: "intelligence",
    icon: "Search",
    theme: "info",
    defaultSeat: "twin-rag",
    initialMessages: [
      {
        id: "intel-init-1",
        content: `# 🔍 INTELLIGENCE GATHERING FRAME

**OSINT Collection Workspace Active**

Advanced intelligence gathering and open-source intelligence tools ready.

## OSINT Toolkit:
- \`search <query>\` - Multi-source intelligence search
- \`whois <domain>\` - Domain registration lookup
- \`social <username>\` - Social media intelligence
- \`email <address>\` - Email address investigation
- \`phone <number>\` - Phone number OSINT
- \`company <name>\` - Corporate intelligence gathering
- \`breach <domain>\` - Data breach lookup

## Specialized Tools:
- \`shodan <query>\` - IoT device discovery
- \`censys <target>\` - Internet-wide scanning
- \`wayback <url>\` - Historical website data
- \`dns <domain>\` - DNS enumeration

**🌐 Global intelligence network connected**`,
        sender: "ai",
        timestamp: new Date(),
        type: "text",
        metadata: { tokens: 140, processingTime: 0 },
      },
    ],
    defaultSettings: {
      inputMode: "filtered",
      size: { width: 650, height: 550 },
      features: ["proxy", "logging", "export"],
    },
    commands: [
      { command: "search", description: "Multi-source search", example: "search john.doe@company.com" },
      { command: "whois", description: "Domain lookup", example: "whois example.com" },
      { command: "social", description: "Social media search", example: "social @username" },
      { command: "shodan", description: "IoT device search", example: "shodan apache" },
    ],
  },
  {
    id: "secure-comms",
    name: "Secure Communications",
    description: "Encrypted communication channel",
    category: "communication",
    icon: "MessageSquare",
    theme: "success",
    defaultSeat: "axios",
    initialMessages: [
      {
        id: "secure-init-1",
        content: `# 🔐 SECURE COMMUNICATIONS ESTABLISHED

**End-to-End Encrypted Channel Active**

## Security Status:
🔒 **AES-256 Encryption**: Active  
🛡️ **ShadowRelay Routing**: Enabled  
⚡ **Perfect Forward Secrecy**: Confirmed  
🌐 **Multi-hop Proxy Chain**: 7 nodes  

## Communication Features:
- \`encrypt <message>\` - Manual encryption
- \`decrypt <cipher>\` - Decrypt received data
- \`verify <signature>\` - Signature verification
- \`burn <timer>\` - Self-destructing messages
- \`relay <route>\` - Custom routing path

## Security Commands:
- \`status\` - Check encryption status
- \`rotate\` - Rotate encryption keys
- \`audit\` - Security audit log

**🚀 Ready for secure messaging**`,
        sender: "ai",
        timestamp: new Date(),
        type: "text",
        metadata: { tokens: 130, processingTime: 0 },
      },
    ],
    defaultSettings: {
      inputMode: "raw",
      size: { width: 580, height: 480 },
      features: ["encryption", "burn-after-reading", "proxy"],
    },
    commands: [
      { command: "encrypt", description: "Encrypt message", example: "encrypt Hello World" },
      { command: "burn", description: "Self-destruct timer", example: "burn 5m" },
      { command: "relay", description: "Custom routing", example: "relay tor->vpn->proxy" },
      { command: "verify", description: "Verify signature", example: "verify abc123..." },
    ],
  },
  {
    id: "mission-planning",
    name: "Mission Planning",
    description: "Operational planning and coordination workspace",
    category: "operations",
    icon: "Target",
    theme: "primary",
    defaultSeat: "twin-rag",
    initialMessages: [
      {
        id: "mission-init-1",
        content: `# 🎯 MISSION PLANNING WORKSPACE

**Operational Command Center Active**

Strategic planning and mission coordination interface ready.

## Planning Tools:
- \`objective <goal>\` - Define mission objectives
- \`timeline <duration>\` - Create mission timeline
- \`resources <type>\` - Allocate resources
- \`risk <assessment>\` - Risk analysis
- \`team <members>\` - Team assignment
- \`checkpoint <milestone>\` - Set checkpoints

## Mission Phases:
1. **Reconnaissance** - Intelligence gathering
2. **Planning** - Strategy development  
3. **Execution** - Operation deployment
4. **Monitoring** - Real-time oversight
5. **Debrief** - Post-mission analysis

## Status Commands:
- \`status\` - Mission status overview
- \`progress\` - Completion percentage
- \`alerts\` - Critical notifications

**⚡ Mission control ready**`,
        sender: "ai",
        timestamp: new Date(),
        type: "text",
        metadata: { tokens: 135, processingTime: 0 },
      },
    ],
    defaultSettings: {
      inputMode: "filtered",
      size: { width: 650, height: 520 },
      features: ["collaboration", "timeline", "export"],
    },
    commands: [
      { command: "objective", description: "Set mission goal", example: "objective secure-network" },
      { command: "timeline", description: "Create timeline", example: "timeline 48h" },
      { command: "risk", description: "Risk assessment", example: "risk high-visibility" },
      { command: "team", description: "Assign team", example: "team alpha-squad" },
    ],
  },

  {
    id: "code-review",
    name: "Code Review",
    description: "Syntax-optimized development review workspace (purple / development)",
    category: "development",
    icon: "Code",
    theme: "primary",
    defaultSeat: "ollama",
    initialMessages: [
      {
        id: "code-review-init-1",
        content: `# 💜 CODE REVIEW FRAME INITIALIZED

**Development Review Workspace Active**

Syntax-optimized purple/development theme for Operator-owned code review.
Preferred seat: local Twin-RAG (falls back to Axios / Ghostlight; Ollama when online).

## Review Commands:
- \`review <path|snippet>\` - Structured code review
- \`diff <a> <b>\` - Compare two revisions
- \`lint <path>\` - Style / correctness pass
- \`security <path>\` - Defensive security notes (no exploit PoCs)
- \`refactor <target>\` - Refactor suggestions
- \`test <scope>\` - Test coverage ideas

## Notes:
- Bodies never leave Privacy Fortress without Operator egress mode
- lattice_sync: false · HOLD_VYRNA_UNSYNC

**⚙️ Ready for review**`,
        sender: "ai",
        timestamp: new Date(),
        type: "text",
        metadata: { tokens: 110, processingTime: 0 },
      },
    ],
    defaultSettings: {
      inputMode: "raw",
      size: { width: 640, height: 520 },
      features: ["syntax", "diff", "export"],
    },
    commands: [
      { command: "review", description: "Structured code review", example: "review hooks/useSignalFrame.ts" },
      { command: "diff", description: "Compare revisions", example: "diff a.ts b.ts" },
      { command: "lint", description: "Style / correctness pass", example: "lint lib/frame-templates.ts" },
      { command: "security", description: "Defensive security notes", example: "security app/api/s3v3n-panel" },
    ],
  },
]

export function getTemplateById(id: string): FrameTemplate | undefined {
  return frameTemplates.find((template) => template.id === id)
}

export function getTemplatesByCategory(category: FrameTemplate["category"]): FrameTemplate[] {
  return frameTemplates.filter((template) => template.category === category)
}

export function createFrameFromTemplate(template: FrameTemplate, customTitle?: string): Partial<Frame> {
  return {
    title: customTitle || template.name,
    messages: template.initialMessages.map((msg) => ({
      ...msg,
      timestamp: new Date(),
    })),
    inputMode: template.defaultSettings.inputMode,
    size: template.defaultSettings.size,
    preferSeat: template.defaultSeat,
    templateId: template.id,
    metadata: {
      sourcePingCount: 0,
      syncState: "synced" as const,
      mirrorStatus: "none" as const,
      timestampDrift: 0,
      lastActivity: new Date(),
      memoryUsage: 0,
      connectionQuality: "excellent" as const,
    },
  }
}
