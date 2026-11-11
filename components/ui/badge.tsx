import { cn } from "@/lib/utils"
import type React from "react"

interface BadgeProps {
  children?: React.ReactNode
  variant?: "default" | "outline" | "warning" | "danger" | "success" | "info" | "secondary" | "destructive"
  className?: string
  glow?: boolean
  size?: "xs" | "sm" | "md" | "lg" | string
  title?: string
  onClick?: React.MouseEventHandler<HTMLSpanElement>
}

export function Badge({ children, variant: rawVariant = "default", className, glow = false, size, title, onClick }: BadgeProps) {
  // shadcn-style aliases used across older modules
  const variant = rawVariant === "secondary" ? "outline" : rawVariant === "destructive" ? "danger" : rawVariant
  return (
    <span
      title={title}
      onClick={onClick}
      className={cn(
        (size === "xs" || size === "sm") && "px-1.5 py-0 text-[10px]",
        size === "lg" && "px-3 py-1 text-sm",
        onClick && "cursor-pointer",
        "inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium text-slate-200",
        variant === "default" && "border-dark-300 bg-dark-100 text-dark-800",
        variant === "outline" && "border-dark-300 text-dark-800",
        variant === "warning" && "border-yellow-900/50 bg-dark-50/50 text-yellow-500",
        variant === "danger" && "border-accent-red-700/50 bg-dark-50/50 text-accent-red-500",
        variant === "success" && "border-green-900/50 bg-dark-50/50 text-green-500",
        variant === "info" && "border-blue-900/50 bg-dark-50/50 text-blue-500",
        glow && variant === "default" && "shadow-glow-sm",
        glow && variant === "warning" && "shadow-glow-sm",
        glow && variant === "danger" && "shadow-red-glow-sm",
        glow && variant === "success" && "shadow-glow-sm",
        glow && variant === "info" && "shadow-glow-sm",
        className,
      )}
    >
      {children}
    </span>
  )
}
