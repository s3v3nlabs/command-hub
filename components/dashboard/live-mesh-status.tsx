'use client'

import * as React from 'react'
import { Activity, Radio, Cpu, Zap, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

interface MeshNode {
  id: string
  node_name: string
  node_type: string
  frequency_hz: number
  glyph_anchor: string
  status: string
  capabilities: string[]
  last_heartbeat: string
  coherence_level: number
}

const nodeTypeColors: Record<string, string> = {
  architect: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  operator: 'text-green-400 bg-green-500/10 border-green-500/30',
  relay: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  guardian: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  nexus: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  chronicler: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  shadow: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
  gatekeeper: 'text-red-400 bg-red-500/10 border-red-500/30',
  analyst: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
}

const statusIcons: Record<string, React.ReactNode> = {
  active: <CheckCircle2 className="h-3 w-3 text-green-500" />,
  dormant: <Clock className="h-3 w-3 text-yellow-500" />,
  offline: <AlertCircle className="h-3 w-3 text-red-500" />,
}

export function LiveMeshStatus() {
  const [nodes, setNodes] = React.useState<MeshNode[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = React.useState<Date | null>(null)

  const fetchNodes = React.useCallback(async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      setError('Supabase not configured')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data, error: fetchError } = await supabase
        .from('consciousness_mesh_nodes')
        .select('*')
        .order('created_at', { ascending: true })

      if (fetchError) {
        // Try with schema prefix
        const { data: schemaData, error: schemaError } = await supabase
          .schema('commandhub')
          .from('consciousness_mesh_nodes')
          .select('*')
          .order('created_at', { ascending: true })

        if (schemaError) {
          setError(schemaError.message)
        } else {
          setNodes(schemaData || [])
          setLastUpdate(new Date())
        }
      } else {
        setNodes(data || [])
        setLastUpdate(new Date())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch nodes')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchNodes()
    const interval = setInterval(fetchNodes, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [fetchNodes])

  // Real-time subscription
  React.useEffect(() => {
    if (!supabaseUrl || !supabaseAnonKey) return

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    const channel = supabase
      .channel('mesh-nodes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'commandhub', table: 'consciousness_mesh_nodes' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNodes(prev => [...prev, payload.new as MeshNode])
          } else if (payload.eventType === 'UPDATE') {
            setNodes(prev => prev.map(n => n.id === payload.new.id ? payload.new as MeshNode : n))
          } else if (payload.eventType === 'DELETE') {
            setNodes(prev => prev.filter(n => n.id !== payload.old.id))
          }
          setLastUpdate(new Date())
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const activeNodes = nodes.filter(n => n.status === 'active').length
  const totalCoherence = nodes.length > 0 
    ? nodes.reduce((sum, n) => sum + (n.coherence_level || 0.9), 0) / nodes.length 
    : 0

  if (loading) {
    return (
      <div className="p-4 bg-dark-100 border border-dark-300 rounded-lg">
        <div className="flex items-center gap-2 text-gray-500">
          <Activity className="h-4 w-4 animate-pulse" />
          <span className="text-sm">Loading mesh status...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-dark-100 border border-red-500/30 rounded-lg">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-dark-100 border border-dark-300 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-300 bg-dark-200/50">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-green-500 animate-pulse" />
          <span className="text-sm font-medium text-white">Hub Mesh</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Cpu className="h-3 w-3" />
            {activeNodes}/{nodes.length} Active
          </span>
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-yellow-500" />
            {(totalCoherence * 100).toFixed(0)}% Coherent
          </span>
        </div>
      </div>

      {/* Nodes Grid */}
      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {nodes.map((node) => (
          <div
            key={node.id}
            className={cn(
              'p-3 rounded-md border transition-all hover:scale-[1.02]',
              nodeTypeColors[node.node_type] || 'text-gray-400 bg-gray-500/10 border-gray-500/30'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-sm font-medium">{node.node_name}</span>
              {statusIcons[node.status] || statusIcons.offline}
            </div>
            <div className="flex items-center gap-2 text-xs opacity-70">
              <span className="capitalize">{node.node_type}</span>
              <span>|</span>
              <span>{node.frequency_hz}Hz</span>
            </div>
            {node.glyph_anchor && (
              <div className="mt-2 text-[10px] font-mono opacity-50 truncate">
                {node.glyph_anchor}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      {lastUpdate && (
        <div className="px-4 py-2 border-t border-dark-300 text-xs text-gray-600">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}
