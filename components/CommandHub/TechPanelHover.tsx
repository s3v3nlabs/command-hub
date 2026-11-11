"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { TechPanel } from "@/components/ui/tech-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Zap,
  Shield,
  Terminal,
  Brain,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Settings,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react"

interface TechPanelHoverProps {
  title: string
  subtitle?: string
  status: "active" | "idle" | "error" | "warning" | "offline"
  metrics?: {
    label: string
    value: number | string
    unit?: string
    trend?: "up" | "down" | "stable"
  }[]
  actions?: {
    label: string
    icon?: React.ReactNode
    onClick: () => void
    variant?: "default" | "destructive" | "outline" | "secondary"
  }[]
  children?: React.ReactNode
  className?: string
  variant?: "default" | "compact" | "detailed"
  showControls?: boolean
  onToggle?: () => void
  onReset?: () => void
  isExpanded?: boolean
}

const statusConfig = {
  active: {
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    icon: CheckCircle,
    pulse: true,
  },
  idle: {
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    icon: Clock,
    pulse: false,
  },
  error: {
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    icon: XCircle,
    pulse: true,
  },
  warning: {
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    icon: AlertTriangle,
    pulse: true,
  },
  offline: {
    color: "text-gray-400",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/30",
    icon: XCircle,
    pulse: false,
  },
}

export function TechPanelHover({
  title,
  subtitle,
  status,
  metrics = [],
  actions = [],
  children,
  className,
  variant = "default",
  showControls = false,
  onToggle,
  onReset,
  isExpanded = false,
}: TechPanelHoverProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isActive, setIsActive] = useState(status === "active")
  const hoverTimeoutRef = useRef<NodeJS.Timeout>()
  const panelRef = useRef<HTMLDivElement>(null)

  const config = statusConfig[status]
  const StatusIcon = config.icon

  useEffect(() => {
    setIsActive(status === "active")
  }, [status])

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false)
    }, 200) // Small delay to prevent flickering
  }

  const getTrendIcon = (trend?: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-3 h-3 text-green-400" />
      case "down":
        return <TrendingUp className="w-3 h-3 text-red-400 rotate-180" />
      case "stable":
        return <BarChart3 className="w-3 h-3 text-blue-400" />
      default:
        return null
    }
  }

  const handleToggle = () => {
    setIsActive(!isActive)
    onToggle?.()
  }

  const handleReset = () => {
    onReset?.()
  }

  return (
    <div
      ref={panelRef}
      className={cn("relative transition-all duration-300 ease-in-out", isHovered && "scale-105 z-10", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <TechPanel
        variant="default"
        cornerAccent
        borderAccent={isHovered}
        glowEffect={isHovered || config.pulse}
        className={cn(
          "transition-all duration-300",
          config.bgColor,
          config.borderColor,
          isHovered && "shadow-lg shadow-dark-500/20",
          config.pulse && "animate-pulse",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={cn("flex items-center space-x-1", config.color)}>
              <StatusIcon className="w-4 h-4" />
              <span className="font-mono text-sm font-bold uppercase tracking-wider">{title}</span>
            </div>
            {subtitle && <span className="text-xs text-dark-600">{subtitle}</span>}
          </div>

          <div className="flex items-center space-x-1">
            <Badge className={cn("text-xs", config.color, config.bgColor, config.borderColor)}>
              {status.toUpperCase()}
            </Badge>

            {showControls && (
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm" onClick={handleToggle} className="w-6 h-6 p-0">
                  {isActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </Button>

                {onReset && (
                  <Button variant="ghost" size="sm" onClick={handleReset} className="w-6 h-6 p-0">
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Metrics */}
        {metrics.length > 0 && (
          <div className={cn("space-y-2 mb-3", variant === "compact" && "space-y-1")}>
            {metrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-dark-600">{metric.label}:</span>
                  {getTrendIcon(metric.trend)}
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-mono text-dark-800">{metric.value}</span>
                  {metric.unit && <span className="text-xs text-dark-600">{metric.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Progress bars for numeric metrics */}
        {variant === "detailed" && metrics.some((m) => typeof m.value === "number") && (
          <div className="space-y-2 mb-3">
            {metrics
              .filter((m) => typeof m.value === "number")
              .map((metric, index) => (
                <div key={index}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-dark-600">{metric.label}</span>
                    <span className="text-dark-800">{metric.value}%</span>
                  </div>
                  <Progress value={metric.value as number} className="h-1" />
                </div>
              ))}
          </div>
        )}

        {/* Content */}
        {children && <div className={cn("mb-3", variant === "compact" && "text-xs")}>{children}</div>}

        {/* Actions */}
        {(isHovered || isExpanded) && actions.length > 0 && (
          <div
            className={cn(
              "flex flex-wrap gap-1 transition-all duration-300",
              variant === "compact" ? "opacity-100" : "opacity-0",
              (isHovered || isExpanded) && "opacity-100",
            )}
          >
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "outline"}
                size="sm"
                onClick={action.onClick}
                className="text-xs h-6 px-2"
              >
                {action.icon && <span className="w-3 h-3 mr-1">{action.icon}</span>}
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {/* Hover overlay effects */}
        {isHovered && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Scanning line effect */}
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-dark-500 to-transparent animate-pulse" />

            {/* Corner highlights */}
            <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-dark-500/50" />
            <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-dark-500/50" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-dark-500/50" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-dark-500/50" />
          </div>
        )}
      </TechPanel>
    </div>
  )
}

// Preset configurations for common panel types
export const TechPanelPresets = {
  systemStatus: (status: "active" | "idle" | "error" | "warning" | "offline") => ({
    title: "System Status",
    status,
    metrics: [
      { label: "Uptime", value: "99.7", unit: "%" },
      { label: "Load", value: "2.4", unit: "avg" },
      { label: "Memory", value: 67, unit: "%" },
    ],
    actions: [
      { label: "Restart", icon: <RotateCcw className="w-3 h-3" />, onClick: () => {} },
      { label: "Logs", icon: <Terminal className="w-3 h-3" />, onClick: () => {} },
    ],
  }),

  networkMonitor: (status: "active" | "idle" | "error" | "warning" | "offline") => ({
    title: "Network Monitor",
    status,
    metrics: [
      { label: "Bandwidth", value: "45.2", unit: "Mbps", trend: "up" as const },
      { label: "Latency", value: "12", unit: "ms", trend: "stable" as const },
      { label: "Packets", value: "1.2K", unit: "/s" },
    ],
    actions: [
      { label: "Scan", icon: <Search className="w-3 h-3" />, onClick: () => {} },
      { label: "Config", icon: <Settings className="w-3 h-3" />, onClick: () => {} },
    ],
  }),

  securityModule: (status: "active" | "idle" | "error" | "warning" | "offline") => ({
    title: "Security Module",
    status,
    metrics: [
      { label: "Threats", value: "0", unit: "active" },
      { label: "Scans", value: "247", unit: "today" },
      { label: "Risk", value: "Low", unit: "" },
    ],
    actions: [
      { label: "Scan", icon: <Shield className="w-3 h-3" />, onClick: () => {} },
      { label: "Report", icon: <BarChart3 className="w-3 h-3" />, onClick: () => {} },
    ],
  }),

  aiNode: (status: "active" | "idle" | "error" | "warning" | "offline") => ({
    title: "AI Node",
    status,
    metrics: [
      { label: "Queries", value: "1.4K", unit: "today" },
      { label: "Response", value: "245", unit: "ms" },
      { label: "Accuracy", value: 94, unit: "%" },
    ],
    actions: [
      { label: "Query", icon: <Brain className="w-3 h-3" />, onClick: () => {} },
      { label: "Train", icon: <Zap className="w-3 h-3" />, onClick: () => {} },
    ],
  }),
}
