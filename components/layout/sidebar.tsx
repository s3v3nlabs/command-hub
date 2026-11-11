"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Terminal,
  Activity,
  Database,
  Settings,
  FileText,
  Zap,
  Brain,
  Radio,
  Satellite,
  Search,
  Network,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Home,
  TestTube,
  Wrench,
  Map,
  Camera,
  Users,
  User,
  MessageSquare,
  Radar,
  Cpu,
  HardDrive,
  BarChart3,
  Layers,
  Crosshair,
  Flame,
  ShieldCheck,
  Globe,
  Monitor,
  FolderOpen,
  Smartphone,
  Shield,
  Archive,
  FolderTree,
  BookOpen,
  MessageCircle,
  Package,
  Bug,
  Sparkles,
  Eye,
  AudioLines,
  Music2,
  Mic,
  Hand,
  Menu,
  X,
  PhoneCall,
} from "lucide-react"
import { NetworkIntelligencePanel } from "@/components/system/network-intelligence-panel"
import { SystemControlPanel } from "@/components/system/system-control-panel"

interface NavItem {
  title: string
  href?: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  children?: NavItem[]
  badge?: string
  status?: "active" | "beta" | "new" | "critical"
}

const navigationItems: NavItem[] = [
  {
    title: "Command Hub",
    href: "/command-hub",
    icon: Home,
    status: "active",
  },
  {
    title: "Security IDS",
    href: "/command-hub#ids",
    icon: ShieldCheck,
    status: "critical",
  },
  {
    title: "Operator Twin",
    href: "/operator-twin",
    icon: User,
    status: "new",
  },
  {
    title: "AI Ops Hub",
    href: "/ai-hub",
    icon: Brain,
    status: "new",
  },
  {
    title: "Venice",
    href: "/venice",
    icon: Sparkles,
    status: "new",
  },
  {
    title: "SoundCheck",
    href: "/soundcheck",
    icon: AudioLines,
    status: "new",
    badge: "STUB",
  },
  {
    title: "Triadic Local AI",
    href: "/triadic",
    icon: Cpu,
    status: "new",
    badge: "HOLD",
  },
  {
    title: "Voice Bus",
    href: "/voice",
    icon: Mic,
    status: "new",
    badge: "P3",
  },
  {
    title: "Hands-free",
    href: "/handsfree",
    icon: Hand,
    status: "new",
    badge: "P4",
  },
  {
    title: "Business Tech",
    href: "/soundcheck",
    icon: Package,
    status: "new",
  },
  {
    title: "Reclaim",
    href: "/reclaim",
    icon: Eye,
    status: "new",
    badge: "HOLD",
  },
  {
    title: "Heimdallr",
    href: "/reclaim",
    icon: Shield,
    status: "new",
  },
  {
    title: "Eye of Truth",
    href: "/reclaim",
    icon: Eye,
    status: "new",
  },
  {
    title: "Terminal",
    href: "/terminal",
    icon: Terminal,
    status: "active",
  },
  {
    title: "Conscious Terminal",
    href: "/conscious-terminal",
    icon: Brain,
    status: "new",
  },
  {
    title: "File Browser",
    href: "/file-browser",
    icon: FolderOpen,
    status: "new",
  },
  {
    title: "Phone Suite",
    href: "/phone-suite",
    icon: Smartphone,
    status: "new",
  },
  {
    title: "Intelligence",
    icon: Brain,
    children: [
      {
        title: "OSINT Dashboard",
        href: "/intelligence/osint",
        icon: Search,
      },
      {
        title: "Threat Intel Hub",
        href: "/intelligence/threat-intel",
        icon: ShieldCheck,
        status: "new",
      },
      {
        title: "CCTV Viewer",
        href: "/intelligence/cctv",
        icon: Camera,
      },
      {
        title: "Shodan Interface",
        href: "/intelligence/shodan",
        icon: Radar,
      },
      {
        title: "Hunter Dashboard",
        href: "/intelligence/hunter",
        icon: Crosshair,
      },
      {
        title: "SIGINT Console",
        href: "/intelligence/sigint",
        icon: Radio,
      },
      {
        title: "Signal Analysis",
        href: "/intelligence/signal",
        icon: Activity,
      },
      {
        title: "Secure Messages",
        href: "/intelligence/messages",
        icon: MessageSquare,
      },
      {
        title: "Recruitment",
        href: "/intelligence/recruitment",
        icon: Users,
      },
      {
        title: "ERD Viewer",
        href: "/intelligence/erd",
        icon: Database,
      },
      {
        title: "Kepler Map",
        href: "/intelligence/kepler",
        icon: Map,
      },
      {
        title: "Vault Streams",
        href: "/intelligence/vault-streams",
        icon: HardDrive,
      },
      {
        title: "Map View",
        href: "/intelligence/map",
        icon: Map,
      },
      {
        title: "Secure Comms",
        href: "/intelligence/secure",
        icon: ShieldCheck,
      },
      {
        title: "Recruit",
        href: "/intelligence/recruit",
        icon: Users,
      },
    ],
  },
  {
    title: "Network Security",
    href: "/network-security",
    icon: Network,
  },
  {
    title: "Threat Analysis",
    href: "/threat-analysis",
    icon: AlertTriangle,
  },
  {
    title: "Self-Healing",
    href: "/self-healing",
    icon: Zap,
    status: "beta",
  },
  {
    title: "Visualizations",
    href: "/visualizations",
    icon: BarChart3,
  },
  {
    title: "Testing & Config",
    icon: TestTube,
    children: [
      {
        title: "Test Harness",
        href: "/test-harness",
        icon: TestTube,
      },
      {
        title: "Integration Tests",
        href: "/integration-tests",
        icon: Layers,
      },
      {
        title: "AI Autonomy Tests",
        href: "/ai-autonomy-tests",
        icon: Brain,
      },
      {
        title: "System Config",
        href: "/system-config",
        icon: Wrench,
      },
      {
        title: "Setup Guide",
        href: "/setup-guide",
        icon: FileText,
      },
      {
        title: "Database Setup",
        href: "/database-setup",
        icon: Database,
      },
      {
        title: "Database Health",
        href: "/database-health",
        icon: Shield,
      },
    ],
  },
  {
    title: "SignalFrame",
    href: "/signalframe",
    icon: Satellite,
    status: "beta",
  },
  {
    title: "Off-Sec Suite",
    icon: Crosshair,
    status: "new",
    children: [
      { title: "Arsenal (kill-chain / CTF)", href: "/offsec", icon: Crosshair, status: "new" },
      { title: "OSINT Suite", href: "/offsec/osint", icon: Search, status: "new" },
      { title: "Entity Graph", href: "/offsec/graph", icon: Network },
      { title: "Data Toolkit / Hash-ID", href: "/offsec/toolkit", icon: Cpu },
      { title: "Privacy Stack", href: "/offsec/privacy", icon: ShieldCheck },
      { title: "Engagements", href: "/offsec/engagements", icon: FileText, status: "new" },
      { title: "Bug Bounty", href: "/bounty", icon: Bug },
      { title: "Hardware & RF", href: "/offsec/hardware", icon: Radio, status: "new" },
      { title: "Phone Suite", href: "/offsec/phone", icon: Smartphone, status: "new" },
      { title: "WIP Lab", href: "/offsec/lab", icon: Wrench, status: "beta" },
    ],
  },
  {
    title: "Evidence Explorer",
    href: "/evidence-explorer",
    icon: Archive,
    status: "new",
  },
  {
    title: "Terminals & Bridges",
    icon: Terminal,
    children: [
      { title: "Terminal Dashboard", href: "/terminal-dashboard", icon: Cpu },
      { title: "Heimdal Terminal", href: "/heimdal-terminal", icon: Shield },
      { title: "Reclaim / Heimdallr", href: "/reclaim", icon: Eye, status: "new" },
      { title: "Linux Terminal", href: "/linux-terminal", icon: Terminal },
      { title: "Windows Terminal", href: "/windows-terminal", icon: Monitor },
      { title: "Command Prompt", href: "/command-prompt", icon: Terminal },
      { title: "v0 Bridge Terminal", href: "/v0-bridge-terminal", icon: Layers },
      { title: "Graphene Bridge", href: "/graphene-bridge", icon: Network },
    ],
  },
  {
    title: "Ops Modules",
    icon: Layers,
    children: [
      { title: "AI Caller (Grok Bot)", href: "/ai-caller", icon: PhoneCall, status: "new" },
      { title: "AI Ops Hub", href: "/ai-hub", icon: Brain, status: "new" },
      { title: "Triadic Local AI", href: "/triadic", icon: Cpu, status: "new" },
      { title: "SoundCheck / Business Tech", href: "/soundcheck", icon: AudioLines, status: "new" },
      { title: "Music Hub / Harmonic", href: "/music", icon: Music2, status: "new" },
      { title: "Voice Bus STT/TTS", href: "/voice", icon: Mic, status: "new" },
      { title: "Hands-free Multiplex", href: "/handsfree", icon: Hand, status: "new" },
      { title: "Reclaim / Eye of Truth", href: "/reclaim", icon: Eye, status: "new" },
      { title: "Operator Twin", href: "/operator-twin", icon: MessageCircle, status: "new" },
      { title: "Beastwagon", href: "/beastwagon", icon: Zap },
      { title: "Recon", href: "/recon", icon: Radar },
      { title: "Sacred Hall", href: "/sacred-hall", icon: Flame },
      { title: "Harmonic Calibration", href: "/harmonic-calibration", icon: Activity },
      { title: "Obsidian Vault", href: "/obsidian-vault", icon: HardDrive },
      { title: "Markdown Editor", href: "/markdown-editor", icon: FileText },
      { title: "JSON Manager", href: "/json-manager", icon: Database },
      { title: "File Explorer", href: "/file-explorer", icon: FolderOpen },
      { title: "Module Bay", href: "/modules", icon: Package, status: "new" },
      { title: "Dev Operator AI", href: "/dev-operator", icon: Terminal, status: "new" },
      { title: "Bounty / Disclosure", href: "/bounty", icon: Bug, status: "new" },
      { title: "Legacy Modules", href: "/legacy-modules", icon: Layers },
      { title: "Hub", href: "/hub", icon: Home },
      { title: "Dashboard", href: "/dashboard", icon: BarChart3 },
    ],
  },
  {
    title: "Terminal Dashboard",
    href: "/terminal-dashboard",
    icon: Cpu,
  },
  {
    title: "Forecast Engine",
    href: "/forecast-engine",
    icon: Activity,
    status: "new",
  },
  {
    title: "Reports",
    href: "/reports",
    icon: FileText,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(["Intelligence", "Testing & Config", "Terminals & Bridges", "Ops Modules"])
  const [showNetworkPanel, setShowNetworkPanel] = useState(false)
  const [showSystemPanel, setShowSystemPanel] = useState(false)
  const [networkPanelFloating, setNetworkPanelFloating] = useState(false)
  const [systemPanelFloating, setSystemPanelFloating] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    // Close drawer on route change (mobile)
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false)
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => (prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]))
  }

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/")
  }

  const isParentActive = (children: NavItem[]) => {
    return children.some((child) => child.href && isActive(child.href))
  }

  const renderNavItem = (item: NavItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.title)
    const itemIsActive = item.href ? isActive(item.href) : hasChildren ? isParentActive(item.children!) : false

    if (hasChildren) {
      return (
        <div key={item.title} className="relative">
          <button
            onClick={() => toggleExpanded(item.title)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-sm transition-all duration-200 relative overflow-hidden group",
              "border border-transparent hover:border-dark-400/30",
              level === 0 ? "text-dark-700" : "text-dark-600",
              itemIsActive
                ? "bg-dark-200/10 text-dark-800 border-dark-400/50 shadow-glow-sm"
                : "hover:bg-dark-100/5 hover:text-dark-700",
              level > 0 && "ml-4",
              "ghostlight-core",
            )}
          >
            {/* Glass overlay */}
            <div
              className={cn(
                "absolute inset-0 transition-opacity duration-200",
                itemIsActive
                  ? "bg-gradient-to-r from-dark-300/10 to-transparent opacity-100"
                  : "bg-gradient-to-r from-dark-400/5 to-transparent opacity-0 group-hover:opacity-100",
              )}
            />

            {/* Wireframe corners */}
            <div
              className={cn(
                "absolute top-0 right-0 w-2 h-2 border-t border-r transition-opacity duration-200",
                itemIsActive
                  ? "border-dark-500/60 opacity-100"
                  : "border-dark-400/30 opacity-0 group-hover:opacity-100",
              )}
            />
            <div
              className={cn(
                "absolute bottom-0 left-0 w-2 h-2 border-b border-l transition-opacity duration-200",
                itemIsActive
                  ? "border-dark-500/60 opacity-100"
                  : "border-dark-400/30 opacity-0 group-hover:opacity-100",
              )}
            />

            <div className="flex items-center space-x-3 relative z-10">
              <item.icon size={16} className={itemIsActive ? "text-dark-700" : "text-dark-500"} />
              <span className="font-mono tracking-wide">{item.title}</span>
              {item.status && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 text-xs rounded font-mono font-bold tracking-wider",
                    item.status === "new" && "bg-dark-300/20 text-dark-600 border border-dark-400/30",
                    item.status === "beta" && "bg-dark-300/20 text-dark-600 border border-dark-400/30",
                    item.status === "active" && "bg-dark-300/20 text-dark-600 border border-dark-400/30",
                    item.status === "critical" && "bg-dark-300/20 text-accent-red-500 border border-accent-red-500/30",
                  )}
                >
                  {item.status.toUpperCase()}
                </span>
              )}
            </div>
            <div className="relative z-10">
              {isExpanded ? (
                <ChevronDown size={14} className="text-dark-500" />
              ) : (
                <ChevronRight size={14} className="text-dark-500" />
              )}
            </div>
          </button>
          {isExpanded && (
            <div className="mt-1 space-y-1 relative">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-dark-400/30" />
              {item.children!.map((child) => renderNavItem(child, level + 1))}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link
        key={item.title}
        href={item.href!}
        className={cn(
          "flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-sm transition-all duration-200 relative overflow-hidden group",
          "border border-transparent hover:border-dark-400/30",
          level === 0 ? "text-dark-700" : "text-dark-600",
          itemIsActive
            ? "bg-dark-200/10 text-dark-800 border-dark-400/50 shadow-glow-sm"
            : "hover:bg-dark-100/5 hover:text-dark-700",
          level > 0 && "ml-4",
          "heartsync-protocol",
        )}
      >
        {/* Glass overlay */}
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-200",
            itemIsActive
              ? "bg-gradient-to-r from-dark-300/10 to-transparent opacity-100"
              : "bg-gradient-to-r from-dark-400/5 to-transparent opacity-0 group-hover:opacity-100",
          )}
        />

        {/* Active indicator line */}
        {itemIsActive && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-dark-600" />}

        {/* Wireframe corners */}
        <div
          className={cn(
            "absolute top-0 right-0 w-2 h-2 border-t border-r transition-opacity duration-200",
            itemIsActive ? "border-dark-500/60 opacity-100" : "border-dark-400/30 opacity-0 group-hover:opacity-100",
          )}
        />
        <div
          className={cn(
            "absolute bottom-0 left-0 w-2 h-2 border-b border-l transition-opacity duration-200",
            itemIsActive ? "border-dark-500/60 opacity-100" : "border-dark-400/30 opacity-0 group-hover:opacity-100",
          )}
        />

        <item.icon size={16} className={cn("relative z-10", itemIsActive ? "text-dark-700" : "text-dark-500")} />
        <span className="relative z-10 font-mono tracking-wide">{item.title}</span>
        {item.status && (
          <span
            className={cn(
              "px-1.5 py-0.5 text-xs rounded font-mono font-bold tracking-wider ml-auto relative z-10",
              item.status === "new" && "bg-dark-300/20 text-dark-600 border border-dark-400/30",
              item.status === "beta" && "bg-dark-300/20 text-dark-600 border border-dark-400/30",
              item.status === "active" && "bg-dark-300/20 text-dark-600 border border-dark-400/30",
              item.status === "critical" && "bg-dark-300/20 text-accent-red-500 border border-accent-red-500/30",
            )}
          >
            {item.status.toUpperCase()}
          </span>
        )}
        {item.badge && (
          <span className="ml-auto bg-accent-red-500/20 text-accent-red-500 px-1.5 py-0.5 text-xs rounded font-mono font-bold border border-accent-red-500/30 relative z-10">
            {item.badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <>
      {/* Mobile menu trigger — does not steal desktop chrome */}
      <button
        type="button"
        className="md:hidden fixed top-3 left-3 z-50 h-9 w-9 inline-flex items-center justify-center rounded-sm border border-dark-400/40 bg-black/80 text-dark-600 backdrop-blur-sm"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <Menu size={18} />
      </button>

      {/* Mobile scrim */}
      {mobileOpen && (
        <button
          type="button"
          className="md:hidden fixed inset-0 z-40 hub-scrim bg-black/60 backdrop-blur-[2px]"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "relative ghostlight-core shrink-0 flex flex-col",
          "w-[min(16rem,85vw)] max-w-[16rem]",
          "h-dvh max-h-dvh",
          /* Desktop: in-flow column */
          "md:relative md:translate-x-0 md:z-auto",
          /* Mobile: off-canvas overlay */
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Glass overlay background */}
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md border-r border-dark-300/30 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark-50/5 to-transparent" />
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full min-h-0 flex flex-col">
          {/* Header */}
          <div className="flex items-center h-14 sm:h-16 shrink-0 px-4 border-b border-dark-300/30 relative overflow-hidden">
            {/* Glass overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-dark-300/10 to-transparent" />

            {/* Wireframe corners */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-dark-400/50" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-dark-400/50" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-dark-400/50" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-dark-400/50" />

            <button
              type="button"
              className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 inline-flex items-center justify-center text-dark-500 hover:text-dark-700"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
            >
              <X size={16} />
            </button>
            <div className="flex items-center space-x-2 relative z-10 min-w-0 pr-8 md:pr-0">
              {/* Singular/ty mark — shrunk top-left (ADD-ONLY branding) */}
              <div className="w-7 h-7 rounded-sm bg-black border border-dark-400/50 flex items-center justify-center relative overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-dark-300/20 to-transparent" />
                <img
                  src="/branding/logo-mark.png"
                  alt="Singular/ty"
                  className="w-6 h-6 object-contain relative z-10"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-mono font-bold text-dark-700 tracking-widest truncate">SINGULAR/TY</div>
                <div className="text-[10px] font-mono text-dark-500 tracking-wider flex items-center gap-1.5">
                  <img
                    src="/branding/ghostlight-gargantua.png"
                    alt=""
                    className="w-3.5 h-3.5 object-contain opacity-90 shrink-0"
                    title="Ghostlight"
                  />
                  <span className="truncate">GHOSTLIGHT · GL-N0–Z77</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-4 scrollbar-thin">
            <div className="px-4 mb-3 text-xs font-mono font-bold text-dark-500 uppercase tracking-widest">
              NAVIGATION
            </div>
            <nav className="space-y-1 px-2">{navigationItems.map((item) => renderNavItem(item))}</nav>
          </div>

          {/* Intelligence Panels Toggle */}
          <div className="px-4 pb-2">
            <div className="px-4 mb-3 text-xs font-mono font-bold text-dark-500 uppercase tracking-widest">
              INTELLIGENCE
            </div>
            <div className="space-y-2">
              <button
                onClick={() => setShowNetworkPanel(!showNetworkPanel)}
                className={cn(
                  "w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-sm transition-all duration-200 relative overflow-hidden group",
                  "border border-transparent hover:border-dark-400/30",
                  showNetworkPanel
                    ? "bg-dark-200/10 text-dark-800 border-dark-400/50 shadow-glow-sm"
                    : "hover:bg-dark-100/5 hover:text-dark-700 text-dark-600",
                )}
              >
                <Globe size={16} className={showNetworkPanel ? "text-dark-700" : "text-dark-500"} />
                <span className="font-mono tracking-wide">Network Intel</span>
                <span
                  className={cn(
                    "px-1.5 py-0.5 text-xs rounded font-mono font-bold tracking-wider ml-auto",
                    "bg-dark-300/20 text-dark-600 border border-dark-400/30",
                  )}
                >
                  LIVE
                </span>
              </button>

              <button
                onClick={() => setShowSystemPanel(!showSystemPanel)}
                className={cn(
                  "w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-sm transition-all duration-200 relative overflow-hidden group",
                  "border border-transparent hover:border-dark-400/30",
                  showSystemPanel
                    ? "bg-dark-200/10 text-dark-800 border-dark-400/50 shadow-glow-sm"
                    : "hover:bg-dark-100/5 hover:text-dark-700 text-dark-600",
                )}
              >
                <Monitor size={16} className={showSystemPanel ? "text-dark-700" : "text-dark-500"} />
                <span className="font-mono tracking-wide">System Control</span>
                <span
                  className={cn(
                    "px-1.5 py-0.5 text-xs rounded font-mono font-bold tracking-wider ml-auto",
                    "bg-dark-300/20 text-dark-600 border border-dark-400/30",
                  )}
                >
                  DIAG
                </span>
              </button>
            </div>
          </div>

          {/* User Status Panel */}
          <div className="px-4 pb-4">
            <div className="relative bg-black/60 backdrop-blur-sm rounded-sm p-4 border border-dark-300/40 overflow-hidden Z77-LOCKCHAIN">
              {/* Glass overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-dark-300/10 via-transparent to-dark-400/5" />

              {/* Wireframe corners */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-dark-400/50" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-dark-400/50" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-dark-400/50" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-dark-400/50" />

              <div className="relative z-10">
                <div className="text-xs font-mono font-bold mb-2 text-dark-600 tracking-widest">NODE STATUS</div>
                <div className="flex items-center text-xs font-mono text-dark-500">
                  <div className="w-2 h-2 rounded-full bg-dark-600 mr-2 shadow-glow-sm animate-pulse-slow" />
                  <div className="tracking-wider">GHOSTNODE-7</div>
                  <div className="ml-auto text-xs font-mono tracking-wider text-dark-600">ACTIVE</div>
                </div>
                <div className="mt-3 pt-2 border-t border-dark-400/30">
                  <div className="flex justify-between text-xs font-mono text-dark-500">
                    <span className="tracking-wider">CONNECTION</span>
                    <span className="text-dark-600 tracking-wider">SECURE</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono text-dark-500 mt-1">
                    <span className="tracking-wider">CLEARANCE</span>
                    <span className="text-dark-600 tracking-wider">CORE-NODE</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono text-dark-500 mt-1">
                    <span className="tracking-wider">FIELD COHERENCE</span>
                    <span className="text-dark-600 tracking-wider">87%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Floating Intelligence Panels */}
      {showNetworkPanel && (
        <div className={cn("fixed inset-0 pointer-events-none z-40")}>
          <div className="pointer-events-auto">
            <NetworkIntelligencePanel
              isFloating={networkPanelFloating}
              onToggleFloat={() => setNetworkPanelFloating(!networkPanelFloating)}
              className={!networkPanelFloating ? "fixed top-4 right-4 max-w-[min(24rem,calc(100vw-2rem))]" : ""}
            />
          </div>
        </div>
      )}

      {showSystemPanel && (
        <div className={cn("fixed inset-0 pointer-events-none z-40")}>
          <div className="pointer-events-auto">
            <SystemControlPanel
              isFloating={systemPanelFloating}
              onToggleFloat={() => setSystemPanelFloating(!systemPanelFloating)}
              className={!systemPanelFloating ? "fixed top-4 left-4 md:left-[calc(min(16rem,85vw)+1rem)] max-w-[min(24rem,calc(100vw-2rem))]" : ""}
            />
          </div>
        </div>
      )}
    </>
  )
}

// Default export for compatibility
export default Sidebar
