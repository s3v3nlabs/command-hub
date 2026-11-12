'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
} from '@/components/ui/sidebar'
import { CommandPalette } from '@/components/command-palette'
import { Toaster } from '@/components/ui/toaster'
import {
  LayoutDashboard,
  Terminal,
  Shield,
  Phone,
  Database,
  Network,
  Brain,
  Eye,
  FileSearch,
  Map,
  Target,
  Radio,
  Cpu,
  Settings,
  Activity,
  Zap,
  Globe,
  Lock,
  Server,
  Layers,
  Search,
  ChevronRight,
  Archive,
  Satellite,
  AlertTriangle,
  BarChart3,
  FileText,
  FolderOpen,
  HardDrive,
  TestTube,
  Wrench,
  Camera,
  MessageSquare,
  Users,
  Flame,
  Monitor,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

const navGroups = [
  {
    label: 'Core Systems',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Command Hub', href: '/command-hub', icon: Terminal },
      { name: 'SignalFrame', href: '/signalframe', icon: Satellite },
      { name: 'Phone Suite', href: '/phone-suite', icon: Phone },
      { name: 'Terminal', href: '/terminal', icon: Terminal },
      { name: 'Evidence Explorer', href: '/evidence-explorer', icon: Archive },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { name: 'OSINT', href: '/intelligence/osint', icon: Eye },
      { name: 'Threat Intel', href: '/intelligence/threat-intel', icon: Shield },
      { name: 'Hunter', href: '/intelligence/hunter', icon: Target },
      { name: 'Shodan', href: '/intelligence/shodan', icon: Globe },
      { name: 'CCTV', href: '/intelligence/cctv', icon: Camera },
      { name: 'SIGINT', href: '/intelligence/sigint', icon: Radio },
      { name: 'Signal Analysis', href: '/intelligence/signal', icon: Activity },
      { name: 'Messages', href: '/intelligence/messages', icon: MessageSquare },
      { name: 'Map', href: '/intelligence/map', icon: Map },
      { name: 'Kepler', href: '/intelligence/kepler', icon: Activity },
      { name: 'Recruitment', href: '/intelligence/recruitment', icon: Users },
    ],
  },
  {
    label: 'Security & Ops',
    items: [
      { name: 'Network Security', href: '/network-security', icon: Network },
      { name: 'Threat Analysis', href: '/threat-analysis', icon: AlertTriangle },
      { name: 'Vault Streams', href: '/intelligence/vault-streams', icon: Lock },
      { name: 'Secure Comms', href: '/intelligence/secure', icon: Shield },
      { name: 'Heimdal Terminal', href: '/heimdal-terminal', icon: Shield },
      { name: 'Recon', href: '/recon', icon: Eye },
    ],
  },
  {
    label: 'Infrastructure',
    items: [
      { name: 'Database Health', href: '/database-health', icon: Database },
      { name: 'Database Setup', href: '/database-setup', icon: Server },
      { name: 'File Browser', href: '/file-browser', icon: FileSearch },
      { name: 'File Explorer', href: '/file-explorer', icon: FolderOpen },
      { name: 'Terminal Dashboard', href: '/terminal-dashboard', icon: Cpu },
      { name: 'Visualizations', href: '/visualizations', icon: BarChart3 },
      { name: 'Reports', href: '/reports', icon: FileText },
      { name: 'Obsidian Vault', href: '/obsidian-vault', icon: HardDrive },
    ],
  },
  {
    label: 'Tools & Config',
    items: [
      { name: 'AI Hub', href: '/ai-hub', icon: Brain },
      { name: 'Test Harness', href: '/test-harness', icon: TestTube },
      { name: 'Integration Tests', href: '/integration-tests', icon: Layers },
      { name: 'System Config', href: '/system-config', icon: Wrench },
      { name: 'Setup Guide', href: '/setup-guide', icon: FileText },
      { name: 'Settings', href: '/settings', icon: Settings },
      { name: 'Beastwagon', href: '/beastwagon', icon: Flame },
      { name: 'Sacred Hall', href: '/sacred-hall', icon: Flame },
      { name: 'JSON Manager', href: '/json-manager', icon: Database },
      { name: 'Markdown Editor', href: '/markdown-editor', icon: FileText },
    ],
  },
]

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const [commandOpen, setCommandOpen] = React.useState(false)

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar variant="sidebar" collapsible="icon" className="border-r border-dark-300 bg-dark-100">
        <SidebarHeader className="border-b border-dark-300 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <span className="text-foreground dark:text-white font-bold text-sm">GH</span>
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="font-semibold text-foreground dark:text-white text-sm">GHOSTLIGHT</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">.CORE</span>
            </div>
          </div>
        </SidebarHeader>
        
        <SidebarContent className="px-2 py-2">
          {/* Search Button */}
          <div className="px-2 mb-2 group-data-[collapsible=icon]:px-0">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-gray-400 border-dark-300 bg-dark-200/50 hover:bg-dark-300 hover:text-foreground dark:hover:text-white group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
              onClick={() => setCommandOpen(true)}
            >
              <Search className="h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden">Search...</span>
              <kbd className="ml-auto text-[10px] text-gray-600 bg-dark-300 px-1.5 py-0.5 rounded group-data-[collapsible=icon]:hidden">
                Cmd+K
              </kbd>
            </Button>
          </div>

          {navGroups.map((group) => (
            <Collapsible key={group.label} defaultOpen className="group/collapsible">
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex items-center justify-between w-full text-gray-500 hover:text-gray-300 transition-colors">
                    <span>{group.label}</span>
                    <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => {
                        const isActive = pathname === item.href || 
                          (item.href !== '/' && pathname.startsWith(item.href))
                        return (
                          <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                              asChild
                              isActive={isActive}
                              tooltip={item.name}
                              className={cn(
                                'text-gray-400 hover:text-foreground dark:hover:text-white hover:bg-dark-300',
                                isActive && 'bg-dark-300 text-green-400 border-l-2 border-green-500'
                              )}
                            >
                              <Link href={item.href}>
                                <item.icon className={cn(
                                  'h-4 w-4',
                                  isActive ? 'text-green-400' : 'text-gray-500'
                                )} />
                                <span>{item.name}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        )
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          ))}
        </SidebarContent>

        <SidebarFooter className="border-t border-dark-300 p-2">
          <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-500 group-data-[collapsible=icon]:justify-center">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="group-data-[collapsible=icon]:hidden">System Online</span>
          </div>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset className="bg-black">
        <header className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b border-dark-300 bg-dark-100/80 backdrop-blur-sm px-4">
          <SidebarTrigger className="text-gray-400 hover:text-foreground dark:hover:text-white" />
          <div className="flex-1" />
          <ThemeToggle />
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Activity className="h-3 w-3 text-green-500" />
            <span>COHERENCE: 0.95</span>
          </div>
        </header>
        
        <main className="hub-shell-scroll">
          {children}
        </main>
      </SidebarInset>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <Toaster />
    </SidebarProvider>
  )
}
