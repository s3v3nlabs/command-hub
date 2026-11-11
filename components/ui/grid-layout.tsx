import { cn } from "@/lib/utils"
import type React from "react"

interface GridLayoutProps {
  children: React.ReactNode
  className?: string
}

export function GridLayout({ children, className }: GridLayoutProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)}>
      {children}
    </div>
  )
}

interface GridItemProps {
  children: React.ReactNode
  className?: string
  colSpan?: 1 | 2 | 3 | 4
  rowSpan?: 1 | 2 | 3
}

export function GridItem({ children, className, colSpan = 1, rowSpan = 1 }: GridItemProps) {
  return (
    <div
      className={cn(
        colSpan === 1 && "md:col-span-1",
        colSpan === 2 && "md:col-span-2",
        colSpan === 3 && "md:col-span-3",
        colSpan === 4 && "md:col-span-4",
        rowSpan === 1 && "md:row-span-1",
        rowSpan === 2 && "md:row-span-2",
        rowSpan === 3 && "md:row-span-3",
        className,
      )}
    >
      {children}
    </div>
  )
}
