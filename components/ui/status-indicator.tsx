import { cn } from "@/lib/utils"

type StatusType = "operational" | "warning" | "error" | "offline" | "maintenance" | "demo"

interface StatusIndicatorProps {
  status: StatusType
  size?: "sm" | "md" | "lg"
  className?: string
}

export function StatusIndicator({ status, size = "md", className }: StatusIndicatorProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  }

  const statusClasses = {
    operational: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
    offline: "bg-gray-500",
    maintenance: "bg-blue-500",
    demo: "bg-purple-500",
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className={cn("rounded-full animate-pulse", sizeClasses[size], statusClasses[status])} />
      {size !== "sm" && <span className="text-xs font-medium">{status.charAt(0).toUpperCase() + status.slice(1)}</span>}
    </div>
  )
}
