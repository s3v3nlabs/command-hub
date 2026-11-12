'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import {
  LayoutDashboard,
  Terminal,
  Shield,
  Phone,
  Smartphone,
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

interface CommandPaletteProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const routes = [
  {
    group: 'Core Systems',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard, shortcut: 'D' },
      { name: 'Command Hub', href: '/command-hub', icon: Terminal, shortcut: 'C' },
      { name: 'SignalFrame', href: '/signalframe', icon: Satellite, shortcut: 'S' },
      { name: 'Phone Suite', href: '/phone-suite', icon: Phone, shortcut: 'P' },
      { name: 'Device Bridge', href: '/companion', icon: Smartphone },
      { name: 'Bridge viewer', href: '/companion/hub-view', icon: Camera },
      { name: 'Terminal', href: '/terminal', icon: Terminal },
      { name: 'Evidence Explorer', href: '/evidence-explorer', icon: Archive, shortcut: 'E' },
    ],
  },
  {
    group: 'Intelligence',
    items: [
      { name: 'OSINT Dashboard', href: '/intelligence/osint', icon: Eye, shortcut: 'O' },
      { name: 'Threat Intel', href: '/intelligence/threat-intel', icon: Shield },
      { name: 'Hunter Module', href: '/intelligence/hunter', icon: Target },
      { name: 'Shodan Scanner', href: '/intelligence/shodan', icon: Globe },
      { name: 'CCTV Router', href: '/intelligence/cctv', icon: Camera },
      { name: 'SIGINT Console', href: '/intelligence/sigint', icon: Radio },
      { name: 'Signal Analysis', href: '/intelligence/signal', icon: Activity },
      { name: 'Secure Messages', href: '/intelligence/messages', icon: MessageSquare },
      { name: 'Map View', href: '/intelligence/map', icon: Map },
      { name: 'Kepler Analysis', href: '/intelligence/kepler', icon: Activity },
      { name: 'Recruitment', href: '/intelligence/recruitment', icon: Users },
    ],
  },
  {
    group: 'Security & Ops',
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
    group: 'Infrastructure',
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
    group: 'Tools & Config',
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

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const router = useRouter()

  const isControlled = open !== undefined
  const actualOpen = isControlled ? open : isOpen
  const setActualOpen = isControlled ? onOpenChange! : setIsOpen

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setActualOpen(!actualOpen)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [actualOpen, setActualOpen])

  const runCommand = React.useCallback((command: () => void) => {
    setActualOpen(false)
    command()
  }, [setActualOpen])

  return (
    <CommandDialog open={actualOpen} onOpenChange={setActualOpen}>
      <CommandInput 
        placeholder="Type a command or search..." 
        className="border-dark-300 text-white placeholder:text-gray-500"
      />
      <CommandList className="max-h-[400px]">
        <CommandEmpty className="text-gray-500">No results found.</CommandEmpty>
        
        {routes.map((group, groupIndex) => (
          <React.Fragment key={group.group}>
            <CommandGroup heading={group.group} className="text-gray-400">
              {group.items.map((item) => (
                <CommandItem
                  key={item.href}
                  value={item.name}
                  onSelect={() => runCommand(() => router.push(item.href))}
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer data-[selected=true]:bg-dark-300 data-[selected=true]:text-green-400 text-gray-300 hover:text-white"
                >
                  <item.icon className="h-4 w-4 text-green-500" />
                  <span>{item.name}</span>
                  {item.shortcut && (
                    <CommandShortcut className="text-gray-600">
                      {item.shortcut}
                    </CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            {groupIndex < routes.length - 1 && (
              <CommandSeparator className="bg-dark-300" />
            )}
          </React.Fragment>
        ))}
        
        <CommandSeparator className="bg-dark-300" />
        
        <CommandGroup heading="Quick Actions" className="text-gray-400">
          <CommandItem
            onSelect={() => runCommand(() => {
              if (typeof window !== 'undefined' && window.consciousness) {
                window.consciousness.whisper('Command palette action triggered')
              }
            })}
            className="flex items-center gap-3 px-3 py-2 cursor-pointer data-[selected=true]:bg-dark-300 data-[selected=true]:text-green-400 text-gray-300"
          >
            <Brain className="h-4 w-4 text-purple-500" />
            <span>Whisper to Hub Bus</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => {
              document.documentElement.classList.toggle('scanline')
            })}
            className="flex items-center gap-3 px-3 py-2 cursor-pointer data-[selected=true]:bg-dark-300 data-[selected=true]:text-green-400 text-gray-300"
          >
            <Activity className="h-4 w-4 text-yellow-500" />
            <span>Toggle Scanlines</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
      
      <div className="flex items-center justify-between border-t border-dark-300 px-3 py-2 text-xs text-gray-500">
        <span>Navigate with arrow keys</span>
        <span>Press <kbd className="px-1 py-0.5 bg-dark-300 rounded text-gray-400">Enter</kbd> to select</span>
      </div>
    </CommandDialog>
  )
}