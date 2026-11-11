import { cn } from "@/lib/utils"

interface ClassificationHeaderProps {
  level?: "top-secret" | "classified" | "confidential" | "restricted"
  className?: string
}

const levelConfig = {
  "top-secret": "TOP SECRET // NOFORN",
  classified: "CLASSIFIED",
  confidential: "CONFIDENTIAL",
  restricted: "RESTRICTED",
}

export function ClassificationHeader({
  level = "classified",
  className,
}: ClassificationHeaderProps) {
  return (
    <div
      className={cn(
        "w-full py-1 text-center border-y border-white/30",
        "font-mono text-xs tracking-[0.3em] text-white/70",
        className,
      )}
    >
      {levelConfig[level]}
    </div>
  )
}
