import { cn } from "@/lib/utils"
import type React from "react"

interface TechPanelProps {
  children: React.ReactNode
  className?: string
  variant?: "default" | "outline" | "warning" | "danger" | "success" | "info"
  cornerAccent?: boolean
  borderAccent?: boolean
  glowEffect?: boolean
  title?: string
  subtitle?: string
  actions?: React.ReactNode
}

export function TechPanel({
  children,
  className,
  variant = "default",
  cornerAccent = false,
  borderAccent = false,
  glowEffect = false,
  title,
  subtitle,
  actions,
  ...props
}: TechPanelProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "cyber-panel relative overflow-hidden rounded-sm backdrop-blur-sm",
        variant === "default" && "border-dark-300/50 bg-transparent",
        variant === "outline" && "border-dark-300/50 bg-transparent",
        variant === "warning" && "border-dark-300/50 bg-transparent",
        variant === "danger" && "border-accent-red-700/30 bg-transparent",
        variant === "success" && "border-dark-300/50 bg-transparent",
        variant === "info" && "border-dark-300/50 bg-transparent",
        glowEffect && variant === "default" && "shadow-glow-md",
        glowEffect && variant === "warning" && "shadow-glow-md",
        glowEffect && variant === "danger" && "shadow-red-glow-md",
        glowEffect && variant === "success" && "shadow-glow-md",
        glowEffect && variant === "info" && "shadow-glow-md",
        "scanline noise-bg",
        className,
      )}
      {...props}
    >
      {cornerAccent && (
        <>
          <div className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-dark-500/50"></div>
          <div className="absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 border-dark-500/50"></div>
          <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-dark-500/50"></div>
          <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-dark-500/50"></div>
        </>
      )}
      {borderAccent && (
        <div
          className={cn(
            "absolute left-0 top-0 h-1 w-full",
            variant === "default" && "bg-dark-400/50",
            variant === "outline" && "bg-dark-500/50",
            variant === "warning" && "bg-dark-500/50",
            variant === "danger" && "bg-accent-red-600/50",
            variant === "success" && "bg-dark-700/50",
            variant === "info" && "bg-dark-400/50",
          )}
        ></div>
      )}
      {(title || actions) && (
        <div className="cyber-panel-header flex items-center justify-between border-b border-dark-300/30 p-3">
          <div>
            {title && (
              <div className="font-mono text-sm font-bold uppercase tracking-wider text-dark-800 dark:text-dark-800">
                {title}
              </div>
            )}
            {subtitle && <div className="text-xs text-dark-600">{subtitle}</div>}
          </div>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      )}
      <div className="cyber-panel-content p-3">{children}</div>
    </div>
  )
}

export function TechPanelDivider({ className }: { className?: string }) {
  return <div className={cn("my-2 h-px w-full bg-dark-300/30", className)} />
}

export function TechPanelSection({
  children,
  className,
  title,
}: {
  children: React.ReactNode
  className?: string
  title?: string
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {title && <div className="font-mono text-xs uppercase tracking-wider text-dark-600">{title}</div>}
      <div>{children}</div>
    </div>
  )
}
