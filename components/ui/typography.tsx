import { cn } from "@/lib/utils"
import type React from "react"

interface TypographyProps {
  children: React.ReactNode
  className?: string
}

export function TypographyHeading1({ children, className }: TypographyProps) {
  return (
    <h1 className={cn("font-mono text-3xl font-bold uppercase tracking-tighter text-foreground", className)}>
      {children}
    </h1>
  )
}

export function TypographyHeading2({ children, className }: TypographyProps) {
  return (
    <h2 className={cn("font-mono text-2xl font-bold uppercase tracking-tight text-foreground", className)}>
      {children}
    </h2>
  )
}

export function TypographyHeading3({ children, className }: TypographyProps) {
  return (
    <h3 className={cn("font-mono text-xl font-bold uppercase tracking-tight text-foreground", className)}>
      {children}
    </h3>
  )
}

export function TypographySubtitle({ children, className }: TypographyProps) {
  return (
    <p className={cn("font-mono text-sm font-medium uppercase tracking-wider text-muted-foreground", className)}>
      {children}
    </p>
  )
}

export function TypographyMono({ children, className }: TypographyProps) {
  return <p className={cn("font-mono text-xs tracking-wide text-muted-foreground", className)}>{children}</p>
}

export function TypographyCode({ children, className }: TypographyProps) {
  return (
    <code className={cn("rounded bg-muted px-1 py-0.5 font-mono text-xs text-muted-foreground", className)}>
      {children}
    </code>
  )
}

export function TypographyLarge({ children, className }: TypographyProps) {
  return <p className={cn("text-lg font-medium text-foreground", className)}>{children}</p>
}

export function TypographySmall({ children, className }: TypographyProps) {
  return <small className={cn("text-xs font-medium leading-none text-muted-foreground", className)}>{children}</small>
}

export function TypographyP({ children, className }: TypographyProps) {
  return <p className={cn("leading-7 text-muted-foreground", className)}>{children}</p>
}

export function TypographyLead({ children, className }: TypographyProps) {
  return <p className={cn("text-xl text-muted-foreground", className)}>{children}</p>
}
