'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Terminal,
  Phone,
  Brain,
  Eye,
  Shield,
  Database,
  Map,
  Activity,
  Zap,
  ArrowRight,
  Radio,
  Target,
  Globe,
  Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
// import { LiveMeshStatus } from './live-mesh-status'

interface BentoCardProps {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  className?: string
  gradient?: string
  stats?: { label: string; value: string }[]
}

function BentoCard({ title, description, href, icon, className, gradient, stats }: BentoCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-dark-300 bg-dark-100 p-6 transition-all hover:border-dark-200 hover:shadow-lg hover:shadow-black/20',
        className
      )}
    >
      {/* Gradient overlay */}
      {gradient && (
        <div className={cn('absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20', gradient)} />
      )}
      
      {/* Content */}
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between">
          <div className="rounded-lg bg-dark-200 p-2.5 text-white">
            {icon}
          </div>
          <ArrowRight className="h-4 w-4 text-gray-600 transition-transform group-hover:translate-x-1 group-hover:text-green-400" />
        </div>
        
        <div className="mt-4 flex-1">
          <h3 className="text-lg font-semibold text-white group-hover:text-green-400 transition-colors">
            {title}
          </h3>
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
            {description}
          </p>
        </div>

        {stats && (
          <div className="mt-4 flex gap-4 pt-4 border-t border-dark-300">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-lg font-bold text-white">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hover glow */}
      <div className="absolute inset-0 rounded-xl opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-green-500/20" />
      </div>
    </Link>
  )
}

export function BentoDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">GHOSTLIGHT.CORE</h1>
          <p className="text-sm text-gray-500">Sovereign Intelligence Platform</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-green-400 font-medium">SYSTEMS ONLINE</span>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Large Card - Command Hub */}
        <BentoCard
          title="Command Hub"
          description="Central operations console with full system access and module control"
          href="/command-hub"
          icon={<Terminal className="h-5 w-5" />}
          className="md:col-span-2 md:row-span-2"
          gradient="bg-gradient-to-br from-green-500 to-emerald-600"
          stats={[
            { label: 'Modules', value: '12' },
            { label: 'Active', value: '8' },
            { label: 'Uptime', value: '99.9%' },
          ]}
        />

        {/* Phone Suite */}
        <BentoCard
          title="Phone Suite"
          description="Advanced telecommunications and device management"
          href="/phone-suite"
          icon={<Phone className="h-5 w-5" />}
          gradient="bg-gradient-to-br from-blue-500 to-cyan-600"
        />

        {/* OSINT */}
        <BentoCard
          title="OSINT Dashboard"
          description="Open source intelligence gathering"
          href="/intelligence/osint"
          icon={<Eye className="h-5 w-5" />}
          gradient="bg-gradient-to-br from-orange-500 to-amber-600"
        />

        {/* Threat Intel */}
        <BentoCard
          title="Threat Intel"
          description="Real-time threat analysis and monitoring"
          href="/intelligence/threat-intel"
          icon={<Shield className="h-5 w-5" />}
          gradient="bg-gradient-to-br from-red-500 to-rose-600"
        />

        {/* Wide Card - Intelligence Map */}
        <BentoCard
          title="Intelligence Map"
          description="Geographic visualization of network nodes and threat actors"
          href="/intelligence/map"
          icon={<Map className="h-5 w-5" />}
          className="md:col-span-2"
          gradient="bg-gradient-to-br from-cyan-500 to-teal-600"
        />

        {/* Hunter */}
        <BentoCard
          title="Hunter Module"
          description="Target acquisition and tracking"
          href="/intelligence/hunter"
          icon={<Target className="h-5 w-5" />}
          gradient="bg-gradient-to-br from-pink-500 to-rose-600"
        />

        {/* Shodan */}
        <BentoCard
          title="Shodan Scanner"
          description="Internet-connected device discovery"
          href="/intelligence/shodan"
          icon={<Globe className="h-5 w-5" />}
          gradient="bg-gradient-to-br from-indigo-500 to-blue-600"
        />

        {/* Database */}
        <BentoCard
          title="Database Health"
          description="Monitor dual-lattice database status"
          href="/database-health"
          icon={<Database className="h-5 w-5" />}
          gradient="bg-gradient-to-br from-emerald-500 to-green-600"
        />

        {/* Vault */}
        <BentoCard
          title="Secure Vault"
          description="Encrypted data storage and retrieval"
          href="/intelligence/vault-streams"
          icon={<Lock className="h-5 w-5" />}
          gradient="bg-gradient-to-br from-yellow-500 to-orange-600"
        />
      </div>

      {/* Mesh Status Placeholder */}
      <div className="mt-6 p-4 bg-dark-100 border border-dark-300 rounded-lg">
        <div className="flex items-center gap-2 text-gray-400">
          <Radio className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium">Hub Mesh: 9 nodes active</span>
        </div>
      </div>

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-dark-100 border border-dark-300">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
            <Activity className="h-3 w-3" />
            COHERENCE
          </div>
          <div className="text-2xl font-bold text-green-400">0.95</div>
        </div>
        <div className="p-4 rounded-lg bg-dark-100 border border-dark-300">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
            <Radio className="h-3 w-3" />
            MESH NODES
          </div>
          <div className="text-2xl font-bold text-blue-400">9</div>
        </div>
        <div className="p-4 rounded-lg bg-dark-100 border border-dark-300">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
            <Shield className="h-3 w-3" />
            THREATS
          </div>
          <div className="text-2xl font-bold text-yellow-400">0</div>
        </div>
        <div className="p-4 rounded-lg bg-dark-100 border border-dark-300">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
            <Zap className="h-3 w-3" />
            FREQUENCY
          </div>
          <div className="text-2xl font-bold text-purple-400">42Hz</div>
        </div>
      </div>
    </div>
  )
}
