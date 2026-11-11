import { cn } from "@/lib/utils"

interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  showValue?: boolean
  size?: "sm" | "md" | "lg"
  variant?: "default" | "warning" | "danger" | "success" | "info"
  animated?: boolean
  className?: string
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  size = "md",
  variant = "default",
  animated = false,
  className,
}: ProgressBarProps) {
  const percentage = (value / max) * 100

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="mb-1 flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-wider text-dark-600">{label}</span>
          {showValue && (
            <span className="font-mono text-xs text-dark-600">
              {value}/{max}
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          "overflow-hidden rounded-sm bg-dark-200",
          size === "sm" && "h-1",
          size === "md" && "h-2",
          size === "lg" && "h-3",
        )}
      >
        <div
          className={cn(
            "h-full",
            animated && "animate-pulse",
            variant === "default" && "bg-dark-600",
            variant === "warning" && "bg-dark-500",
            variant === "danger" && "bg-accent-red-500",
            variant === "success" && "bg-dark-700",
            variant === "info" && "bg-dark-400",
          )}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  )
}
