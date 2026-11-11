"use client"
import * as React from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const Command = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground", className)} {...props} />
)
Command.displayName = "Command"
const CommandDialog = ({ children, ...props }: React.ComponentProps<typeof Dialog>) => (
  <Dialog {...props}><DialogContent className="overflow-hidden p-0 shadow-lg"><Command className="[&_[cmdk-group-heading]]:px-2">{children}</Command></DialogContent></Dialog>
)
const CommandInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn("flex h-11 w-full rounded-md bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground", className)} {...props} />
)
CommandInput.displayName = "CommandInput"
const CommandList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)} {...props} />
)
CommandList.displayName = "CommandList"
const CommandEmpty = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("py-6 text-center text-sm", className)} {...props} />
const CommandGroup = ({ className, heading, children, ...props }: React.HTMLAttributes<HTMLDivElement> & { heading?: React.ReactNode }) => (
  <div className={cn("overflow-hidden p-1 text-foreground", className)} {...props}>
    {heading && <div cmdk-group-heading="" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{heading}</div>}
    {children}
  </div>
)
type CommandItemProps = Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> & { value?: string; onSelect?: (value?: string) => void; disabled?: boolean }
const CommandItem = React.forwardRef<HTMLDivElement, CommandItemProps>(({ className, value, onSelect, disabled, onClick, onKeyDown, ...props }, ref) => (
  <div
    ref={ref}
    role="option"
    tabIndex={disabled ? -1 : 0}
    aria-disabled={disabled || undefined}
    data-value={value}
    onClick={(e) => {
      onClick?.(e)
      if (!disabled) onSelect?.(value)
    }}
    onKeyDown={(e) => {
      onKeyDown?.(e)
      if (!disabled && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault()
        onSelect?.(value)
      }
    }}
    className={cn("relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent focus:bg-accent aria-selected:bg-accent", className)}
    {...props}
  />
))
CommandItem.displayName = "CommandItem"
const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)} {...props} />
)
const CommandSeparator = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("-mx-1 h-px bg-border", className)} {...props} />
)
export { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut, CommandSeparator }
