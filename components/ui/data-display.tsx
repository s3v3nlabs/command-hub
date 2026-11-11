import { cn } from "@/lib/utils"

interface DataDisplayProps {
  label: string
  value: string | number
  unit?: string
  trend?: "up" | "down" | "stable"
  trendValue?: string | number
  className?: string
  valueClassName?: string
}

export function DataDisplay({ label, value, unit, trend, trendValue, className, valueClassName }: DataDisplayProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="font-mono text-xs uppercase tracking-wider text-dark-600">{label}</div>
      <div className={cn("font-mono text-xl font-bold text-dark-800", valueClassName)}>
        {value}
        {unit && <span className="ml-1 text-xs text-dark-600">{unit}</span>}
      </div>
      {trend && (
        <div
          className={cn(
            "mt-1 flex items-center text-xs",
            trend === "up" && "text-green-500",
            trend === "down" && "text-accent-red-500",
            trend === "stable" && "text-blue-500",
          )}
        >
          {trend === "up" && (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mr-1 h-3 w-3">
              <path
                fillRule="evenodd"
                d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042-.815a.75.75 0 01-.53-.919z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {trend === "down" && (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mr-1 h-3 w-3">
              <path
                fillRule="evenodd"
                d="M1.22 5.222a.75.75 0 011.06 0L7 9.942l3.768-3.769a.75.75 0 011.113.058 20.908 20.908 0 013.813 7.254l1.574-2.727a.75.75 0 011.3.75l-2.475 4.286a.75.75 0 01-1.025.275l-4.287-2.475a.75.75 0 01.75-1.3l2.71 1.565a19.422 19.422 0 00-3.013-6.024L7.53 11.533a.75.75 0 01-1.06 0l-5.25-5.25a.75.75 0 010-1.06z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {trend === "stable" && (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mr-1 h-3 w-3">
              <path
                fillRule="evenodd"
                d="M4.25 2A2.25 2.25 0 002 4.25v11.5A2.25 2.25 0 004.25 18h11.5A2.25 2.25 0 0018 15.75V4.25A2.25 2.25 0 0015.75 2H4.25zM15 5.75a.75.75 0 00-1.5 0v8.5a.75.75 0 001.5 0v-8.5zm-8.5 6a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5zM8.584 9a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5a.75.75 0 01.75-.75zm3.58-1.25a.75.75 0 00-1.5 0v6.5a.75.75 0 001.5 0v-6.5z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {trendValue}
        </div>
      )}
    </div>
  )
}
