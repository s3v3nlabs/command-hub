"use client"

import { cn } from "@/lib/utils"
import type React from "react"

interface TechButtonProps {
  children: React.ReactNode
  className?: string
  variant?: "default" | "outline" | "ghost" | "warning" | "danger" | "success" | "primary"
  size?: "sm" | "md" | "lg"
  cornerAccent?: boolean
  isActive?: boolean
  disabled?: boolean
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  icon?: React.ReactNode
  rightIcon?: React.ReactNode
  glow?: boolean
}

export function TechButton({
  children,
  className,
  variant = "default",
  size = "md",
  cornerAccent = false,
  isActive = false,
  disabled = false,
  onClick,
  icon,
  rightIcon,
  glow = false,
  ...props
}: TechButtonProps & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size">) {
  return (
    <button
      className={cn(
        "relative inline-flex items-center justify-center whitespace-nowrap font-mono text-xs uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-dark-400 disabled:pointer-events-none disabled:opacity-50",
        size === "sm" && "h-8 rounded-sm px-3 text-xs",
        size === "md" && "h-9 rounded-sm px-4",
        size === "lg" && "h-10 rounded-sm px-6",
        (variant === "default" || variant === "primary") &&
          "border border-dark-300 bg-dark-100 text-dark-800 hover:bg-dark-200 hover:text-dark-900 dark:border-dark-300 dark:bg-dark-100 dark:text-dark-800 dark:hover:bg-dark-200 dark:hover:text-dark-900",
        variant === "outline" &&
          "border border-dark-300 text-dark-800 hover:bg-dark-100 hover:text-dark-900 dark:border-dark-300 dark:text-dark-800 dark:hover:bg-dark-100 dark:hover:text-dark-900",
        variant === "ghost" &&
          "text-dark-800 hover:bg-dark-100 hover:text-dark-900 dark:text-dark-800 dark:hover:bg-dark-100 dark:hover:text-dark-900",
        variant === "warning" &&
          "border border-yellow-900/50 bg-dark-50 text-yellow-900 hover:bg-dark-100 hover:text-yellow-950 dark:border-yellow-900/50 dark:bg-dark-50 dark:text-yellow-500 dark:hover:bg-dark-100 dark:hover:text-yellow-400",
        variant === "danger" &&
          "border border-accent-red-700/50 bg-dark-50 text-accent-red-700 hover:bg-dark-100 hover:text-accent-red-800 dark:border-accent-red-700/50 dark:bg-dark-50 dark:text-accent-red-500 dark:hover:bg-dark-100 dark:hover:text-accent-red-400",
        variant === "success" &&
          "border border-green-900/50 bg-dark-50 text-green-900 hover:bg-dark-100 hover:text-green-950 dark:border-green-900/50 dark:bg-dark-50 dark:text-green-500 dark:hover:bg-dark-100 dark:hover:text-green-400",
        isActive && variant === "default" && "bg-dark-200 text-dark-900 dark:bg-dark-200 dark:text-dark-900",
        isActive && variant === "outline" && "bg-dark-100 text-dark-900 dark:bg-dark-100 dark:text-dark-900",
        isActive && variant === "ghost" && "bg-dark-100 text-dark-900 dark:bg-dark-100 dark:text-dark-900",
        isActive && variant === "warning" && "bg-dark-100 text-yellow-950 dark:bg-dark-100 dark:text-yellow-400",
        isActive && variant === "danger" && "bg-dark-100 text-accent-red-800 dark:bg-dark-100 dark:text-accent-red-400",
        isActive && variant === "success" && "bg-dark-100 text-green-950 dark:bg-dark-100 dark:text-green-400",
        glow && variant === "default" && "shadow-glow-sm",
        glow && variant === "warning" && "shadow-glow-sm",
        glow && variant === "danger" && "shadow-red-glow-sm",
        glow && variant === "success" && "shadow-glow-sm",
        className,
      )}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {cornerAccent && (
        <>
          <div className="absolute left-0 top-0 h-2 w-2 border-l border-t border-dark-500"></div>
          <div className="absolute right-0 top-0 h-2 w-2 border-r border-t border-dark-500"></div>
          <div className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-dark-500"></div>
          <div className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-dark-500"></div>
        </>
      )}
      {icon && <span className="mr-2">{icon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  )
}
