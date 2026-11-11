"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

const SidebarProvider = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) => (
  <div className={cn("flex min-h-svh w-full", className)} {...props}>{children}</div>
)
const Sidebar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { collapsible?: string }>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex h-full w-64 flex-col border-r bg-background", className)} {...props} />
)
Sidebar.displayName = "Sidebar"
const SidebarHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("p-4 border-b", className)} {...props} />
const SidebarContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("flex-1 overflow-auto p-2", className)} {...props} />
const SidebarFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("p-4 border-t", className)} {...props} />
const SidebarGroup = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("p-2", className)} {...props} />
const SidebarGroupLabel = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("px-2 py-1 text-xs font-semibold text-muted-foreground", className)} {...props} />
const SidebarGroupContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("space-y-1", className)} {...props} />
const SidebarMenu = ({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) => <ul className={cn("flex flex-col gap-1", className)} {...props} />
const SidebarMenuItem = ({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) => <li className={cn("list-none", className)} {...props} />
const SidebarMenuButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; isActive?: boolean }>(
  ({ className, asChild, isActive, children, ...props }, ref) => (
    <button ref={ref} type="button" className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent", isActive && "bg-accent", className)} {...props}>{children}</button>
  )
)
SidebarMenuButton.displayName = "SidebarMenuButton"
const SidebarRail = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("hidden", className)} {...props} />
const SidebarInset = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <main className={cn("flex-1", className)} {...props} />
const SidebarTrigger = ({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button type="button" className={cn("inline-flex h-9 w-9 items-center justify-center rounded-md border", className)} {...props} />
)
export {
  Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarProvider, SidebarTrigger,
  SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton,
  SidebarRail, SidebarInset,
}
