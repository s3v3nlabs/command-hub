import { cn } from "@/lib/utils"
import type React from "react"

interface TechCardProps {
  children: React.ReactNode
  className?: string
  variant?: "default" | "outline" | "warning" | "success" | "danger" | "info"
  cornerAccent?: boolean
  borderAccent?: boolean
  glowEffect?: boolean
}

export function TechCard({
  children,
  className,
  variant = "default",
  cornerAccent = true,
  borderAccent = false,
  glowEffect = false,
  ...props
}: TechCardProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="tech-card"
      className={cn(
        "relative overflow-hidden rounded-sm border bg-black/80 p-4 shadow-md",
        variant === "default" && "border-neutral-800",
        variant === "outline" && "border-neutral-700",
        variant === "warning" && "border-yellow-900/80 bg-black/80",
        variant === "success" && "border-green-900/80 bg-black/80",
        variant === "danger" && "border-red-900/80 bg-black/80",
        variant === "info" && "border-blue-900/80 bg-black/80",
        glowEffect && variant === "default" && "shadow-lg shadow-neutral-900/50",
        glowEffect && variant === "outline" && "shadow-lg shadow-neutral-800/50",
        glowEffect && variant === "warning" && "shadow-lg shadow-yellow-900/30",
        glowEffect && variant === "success" && "shadow-lg shadow-green-900/30",
        glowEffect && variant === "danger" && "shadow-lg shadow-red-900/30",
        glowEffect && variant === "info" && "shadow-lg shadow-blue-900/30",
        className,
      )}
      {...props}
    >
      {cornerAccent && (
        <>
          <div className="tech-card-corner absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2" />
          <div className="tech-card-corner absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2" />
          <div className="tech-card-corner absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2" />
          <div className="tech-card-corner absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2" />
        </>
      )}
      {borderAccent && (
        <div
          className={cn(
            "absolute left-0 top-0 h-1 w-full",
            variant === "default" && "bg-neutral-700",
            variant === "outline" && "bg-neutral-600",
            variant === "warning" && "bg-yellow-600",
            variant === "success" && "bg-green-600",
            variant === "danger" && "bg-red-600",
            variant === "info" && "bg-blue-600",
          )}
        />
      )}
      {children}
    </div>
  )
}

interface TechCardHeaderProps {
  children: React.ReactNode
  className?: string
}

export function TechCardHeader({ children, className }: TechCardHeaderProps) {
  return <div className={cn("mb-2 flex items-center justify-between", className)}>{children}</div>
}

interface TechCardTitleProps {
  children: React.ReactNode
  className?: string
}

export function TechCardTitle({ children, className }: TechCardTitleProps) {
  return (
    <h3
      className={cn(
        "hub-wireframe-title font-mono text-sm font-bold uppercase tracking-widest text-foreground",
        className,
      )}
    >
      {children}
    </h3>
  )
}

interface TechCardDescriptionProps {
  children: React.ReactNode
  className?: string
}

export function TechCardDescription({ children, className }: TechCardDescriptionProps) {
  return <p className={cn("text-xs text-muted-foreground", className)}>{children}</p>
}

interface TechCardContentProps {
  children: React.ReactNode
  className?: string
}

export function TechCardContent({ children, className }: TechCardContentProps) {
  return <div className={cn("", className)}>{children}</div>
}

interface TechCardFooterProps {
  children: React.ReactNode
  className?: string
}

export function TechCardFooter({ children, className }: TechCardFooterProps) {
  return <div className={cn("mt-4 flex items-center", className)}>{children}</div>
}
