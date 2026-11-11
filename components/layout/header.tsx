"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { Bell, Settings, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher"
import Link from "next/link"

interface HeaderProps {
  title: string
  subtitle?: string
  className?: string
  actions?: React.ReactNode
}

export function Header({ title, subtitle, className, actions }: HeaderProps) {
  return (
    <div
      className={cn(
        "h-14 min-h-14 shrink-0 flex items-center justify-between gap-3 pl-12 pr-3 sm:px-6 border-b border-dark-300/30 bg-black/60 backdrop-blur-sm relative",
        className,
      )}
    >
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-dark-300/10 to-transparent pointer-events-none" />

      {/* Title */}
      <div className="relative z-10 min-w-0 flex-1">
        <h1 className="text-sm sm:text-lg font-mono font-bold text-dark-700 tracking-widest uppercase truncate">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-[10px] font-mono text-dark-500 truncate mt-0.5">{subtitle}</p>
        ) : null}
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-1 sm:space-x-2 relative z-10 shrink-0">
        {actions}
        <WorkspaceSwitcher />
        <ThemeToggle />
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-dark-500 hover:text-dark-600 hover:bg-dark-100/10 hidden sm:inline-flex"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-dark-500 hover:text-dark-600 hover:bg-dark-100/10"
          asChild
        >
          <Link href="/settings" aria-label="Settings">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-dark-500 hover:text-dark-600 hover:bg-dark-100/10 hidden sm:inline-flex"
          aria-label="Operator"
        >
          <User className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
