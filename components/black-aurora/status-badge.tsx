import { cn } from "@/lib/utils"

type BadgeStatus = "classified" | "verified" | "destroyed" | "pending" | "active" | "expired"

interface StatusBadgeProps {
  status: BadgeStatus
  className?: string
  pulse?: boolean
}

const statusConfig: Record<BadgeStatus, { label: string; style: string }> = {
  classified: { label: "CLASSIFIED", style: "border-white text-white" },
  verified: { label: "VERIFIED", style: "border-white text-white bg-white/10" },
  destroyed: { label: "DESTROYED", style: "border-white/50 text-white/50 line-through" },
  pending: { label: "PENDING", style: "border-white/50 text-white/50" },
  active: { label: "ACTIVE", style: "border-white text-white" },
  expired: { label: "EXPIRED", style: "border-white/30 text-white/30" },
}

export function StatusBadge({ status, className, pulse = false }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-mono tracking-widest border uppercase rounded-none",
        config.style,
        pulse && "animate-pulse",
        className,
      )}
    >
      [{config.label}]
    </span>
  )
}
