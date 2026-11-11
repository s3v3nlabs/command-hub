"use client"

import { useState, useEffect } from "react"
import {
  TechCard,
  TechCardContent,
  TechCardHeader,
  TechCardTitle,
} from "@/components/ui/tech-card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Terminal,
  Shield,
  Brain,
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  Eye,
  Search,
  Globe,
  Phone,
  Map,
  Zap,
  MessageSquare,
} from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const [systemStats, setSystemStats] = useState({
    cpu: 23,
    memory: 67,
    network: 89,
    uptime: "7d 14h 32m",
  })

  const [activeModules, setActiveModules] = useState([
    { name: "HEIMDALL", status: "ACTIVE", color: "green" },
    { name: "KEPLER", status: "MONITORING", color: "blue" },
    { name: "SHODAN", status: "SCANNING", color: "orange" },
    { name: "OSINT", status: "GATHERING", color: "purple" },
  ])

  const [recentActivity, setRecentActivity] = useState([
    { time: "14:32", event: "Network scan completed", type: "info" },
    { time: "14:28", event: "New threat detected", type: "warning" },
    { time: "14:25", event: "OSINT data updated", type: "success" },
    { time: "14:20", event: "System backup completed", type: "info" },
    { time: "14:15", event: "Security alert resolved", type: "success" },
  ])

  const quickActions = [
    {
      title: "AI Ops Hub",
      description: "Providers, engines, prompt router (Beast)",
      icon: Brain,
      href: "/ai-hub",
      color: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20",
    },
    {
      title: "Operator Twin",
      description: "Local vault retrieval Twin (no cloud train)",
      icon: MessageSquare,
      href: "/operator-twin",
      color: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    },
    {
      title: "Command Hub",
      description: "Access main control interface",
      icon: Terminal,
      href: "/command-hub",
      color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    {
      title: "Intelligence",
      description: "OSINT and reconnaissance tools",
      icon: Brain,
      href: "/intelligence",
      color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
    {
      title: "Network Security",
      description: "Monitor and analyze threats",
      icon: Shield,
      href: "/network-security",
      color: "bg-green-500/10 text-green-400 border-green-500/20",
    },
    {
      title: "Terminal",
      description: "Direct system access",
      icon: Terminal,
      href: "/terminal",
      color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    },
    {
      title: "SignalFrame",
      description: "Wireframe messaging workspace",
      icon: Activity,
      href: "/signalframe",
      color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    },
    {
      title: "Evidence Explorer",
      description: "Reclaim evidence browser",
      icon: HardDrive,
      href: "/evidence-explorer",
      color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    {
      title: "Phone Suite",
      description: "ADB connect, mirror, and GrapheneOS control",
      icon: Phone,
      href: "/phone-suite",
      color: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    },
    {
      title: "v0 Bridge",
      description: "WhisperMesh bridge terminal",
      icon: Zap,
      href: "/v0-bridge-terminal",
      color: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    },
    {
      title: "Kepler Map",
      description: "Geospatial intel layers (Heimdal / MapOS)",
      icon: Map,
      href: "/intelligence/kepler",
      color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
  ]

  const intelligenceModules = [
    { name: "OSINT Dashboard", icon: Search, href: "/intelligence/osint", status: "ACTIVE" },
    { name: "CCTV Viewer", icon: Eye, href: "/intelligence/cctv", status: "MONITORING" },
    { name: "Shodan Interface", icon: Globe, href: "/intelligence/shodan", status: "SCANNING" },
    { name: "Phone Suite", icon: Phone, href: "/phone-suite", status: "READY" },
    { name: "Kepler Map", icon: Map, href: "/intelligence/kepler", status: "TRACKING" },
    { name: "Hunter Tools", icon: Search, href: "/intelligence/hunter", status: "READY" },
    { name: "SignalFrame", icon: Activity, href: "/signalframe", status: "BETA" },
    { name: "Evidence Explorer", icon: HardDrive, href: "/evidence-explorer", status: "RECLAIM" },
  ]

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setSystemStats((prev) => ({
        ...prev,
        cpu: Math.floor(Math.random() * 40) + 10,
        memory: Math.floor(Math.random() * 30) + 50,
        network: Math.floor(Math.random() * 20) + 80,
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-dvh max-w-[100dvw] overflow-x-hidden bg-black grid-bg p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl sm:text-3xl font-bold uppercase tracking-widest text-foreground">
            Singularity Hub
          </h1>
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mt-1">
            Unified Intelligence & Security Operations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="font-mono text-[10px] tracking-wider">
            STATUS: OPERATIONAL
          </Badge>
          <Badge variant="outline" className="font-mono text-[10px] tracking-wider">
            USER: S3V3N
          </Badge>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <TechCard cornerAccent className="border-neutral-800">
          <TechCardHeader className="space-y-0 pb-2">
            <TechCardTitle className="text-xs text-muted-foreground">CPU Usage</TechCardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </TechCardHeader>
          <TechCardContent>
            <div className="font-mono text-2xl font-bold">{systemStats.cpu}%</div>
            <Progress value={systemStats.cpu} className="mt-2" />
          </TechCardContent>
        </TechCard>

        <TechCard cornerAccent className="border-neutral-800">
          <TechCardHeader className="space-y-0 pb-2">
            <TechCardTitle className="text-xs text-muted-foreground">Memory</TechCardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </TechCardHeader>
          <TechCardContent>
            <div className="font-mono text-2xl font-bold">{systemStats.memory}%</div>
            <Progress value={systemStats.memory} className="mt-2" />
          </TechCardContent>
        </TechCard>

        <TechCard cornerAccent className="border-neutral-800">
          <TechCardHeader className="space-y-0 pb-2">
            <TechCardTitle className="text-xs text-muted-foreground">Network</TechCardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </TechCardHeader>
          <TechCardContent>
            <div className="font-mono text-2xl font-bold">{systemStats.network}%</div>
            <Progress value={systemStats.network} className="mt-2" />
          </TechCardContent>
        </TechCard>

        <TechCard cornerAccent className="border-neutral-800">
          <TechCardHeader className="space-y-0 pb-2">
            <TechCardTitle className="text-xs text-muted-foreground">Uptime</TechCardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </TechCardHeader>
          <TechCardContent>
            <div className="text-2xl font-bold font-mono">{systemStats.uptime}</div>
            <p className="text-xs text-muted-foreground mt-2 font-mono uppercase tracking-wider">
              System stable
            </p>
          </TechCardContent>
        </TechCard>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon
          return (
            <Link key={index} href={action.href}>
              <TechCard
                cornerAccent
                className={`cursor-pointer transition-all hover:scale-[1.02] ${action.color} border`}
              >
                <TechCardHeader>
                  <TechCardTitle className="flex items-center space-x-2 text-xs">
                    <Icon className="h-4 w-4" />
                    <span>{action.title}</span>
                  </TechCardTitle>
                </TechCardHeader>
                <TechCardContent>
                  <p className="text-sm opacity-80">{action.description}</p>
                </TechCardContent>
              </TechCard>
            </Link>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Modules */}
        <TechCard cornerAccent className="border-neutral-800">
          <TechCardHeader>
            <TechCardTitle className="flex items-center space-x-2 text-xs">
              <Zap className="h-4 w-4" />
              <span>Active Modules</span>
            </TechCardTitle>
          </TechCardHeader>
          <TechCardContent className="space-y-3">
            {activeModules.map((module, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full bg-${module.color}-500`} />
                  <span className="font-mono text-sm">{module.name}</span>
                </div>
                <Badge variant="outline" className="text-xs font-mono tracking-wider">
                  {module.status}
                </Badge>
              </div>
            ))}
          </TechCardContent>
        </TechCard>

        {/* Intelligence Modules */}
        <TechCard cornerAccent className="border-neutral-800">
          <TechCardHeader>
            <TechCardTitle className="flex items-center space-x-2 text-xs">
              <Brain className="h-4 w-4" />
              <span>Intelligence Modules</span>
            </TechCardTitle>
          </TechCardHeader>
          <TechCardContent className="space-y-2">
            {intelligenceModules.map((module, index) => {
              const Icon = module.icon
              return (
                <Link key={index} href={module.href}>
                  <div className="flex items-center justify-between p-2 rounded-sm hover:bg-muted/50 cursor-pointer border border-transparent hover:border-neutral-800">
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-mono">{module.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs font-mono tracking-wider">
                      {module.status}
                    </Badge>
                  </div>
                </Link>
              )
            })}
          </TechCardContent>
        </TechCard>

        {/* Recent Activity */}
        <TechCard cornerAccent className="border-neutral-800">
          <TechCardHeader>
            <TechCardTitle className="flex items-center space-x-2 text-xs">
              <Activity className="h-4 w-4" />
              <span>Recent Activity</span>
            </TechCardTitle>
          </TechCardHeader>
          <TechCardContent className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="text-xs text-muted-foreground font-mono mt-1">{activity.time}</div>
                <div className="flex-1">
                  <p className="text-sm">{activity.event}</p>
                  <Badge
                    variant="outline"
                    className={`text-xs mt-1 font-mono tracking-wider ${
                      activity.type === "warning"
                        ? "border-orange-500 text-orange-400"
                        : activity.type === "success"
                          ? "border-green-500 text-green-400"
                          : "border-blue-500 text-blue-400"
                    }`}
                  >
                    {activity.type.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </TechCardContent>
        </TechCard>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p className="font-mono text-xs uppercase tracking-wider">
          Singularity Hub v314 - operations workspace
        </p>
        <p className="font-mono text-xs">⟐ All systems operational - systems nominal ⟐</p>
      </div>
    </div>
  )
}
