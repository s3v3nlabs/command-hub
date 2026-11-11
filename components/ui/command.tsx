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
const CommandGroup = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("overflow-hidden p-1 text-foreground", className)} {...props} />
const CommandItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent", className)} {...props} />
)
CommandItem.displayName = "CommandItem"
const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)} {...props} />
)
const CommandSeparator = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("-mx-1 h-px bg-border", className)} {...props} />
)
export { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut, CommandSeparator }
