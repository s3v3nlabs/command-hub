"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, XCircle, AlertCircle, Database, Copy, ExternalLink } from "lucide-react"

interface TableStatus {
  name: string
  exists: boolean
  rowCount: number | null
  error?: string
}

interface DatabaseHealth {
  connected: boolean
  tables: TableStatus[]
  totalTables: number
  healthyTables: number
  errors: string[]
}

const SQL_SCRIPTS = [
  {
    name: "Basic Intelligence Tables",
    file: "create-tables-fixed-v2.sql",
    description: "Core intelligence modules, logs, signals, and messages",
    tables: ["intelligence_modules", "system_logs", "signal_data", "messages"],
    sql: `-- Basic Intelligence Tables
-- Drop existing tables if they exist
DROP TABLE IF EXISTS signal_data CASCADE;
DROP TABLE IF EXISTS system_logs CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS intelligence_modules CASCADE;

-- Create intelligence_modules table with proper constraints
CREATE TABLE intelligence_modules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'IDLE',
    priority INTEGER NOT NULL DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    signal_strength INTEGER NOT NULL DEFAULT 0 CHECK (signal_strength >= 0 AND signal_strength <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system_logs table
CREATE TABLE system_logs (
    id SERIAL PRIMARY KEY,
    module_id TEXT REFERENCES intelligence_modules(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create signal_data table
CREATE TABLE signal_data (
    id SERIAL PRIMARY KEY,
    module_id TEXT NOT NULL REFERENCES intelligence_modules(id) ON DELETE CASCADE,
    frequency DECIMAL(10,2),
    strength INTEGER CHECK (strength >= 0 AND strength <= 100),
    data_payload JSONB DEFAULT '{}',
    intercepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table with proper UUID generation
CREATE TABLE messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    sender TEXT NOT NULL,
    content TEXT NOT NULL,
    encrypted BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample data
INSERT INTO intelligence_modules (id, name, type, status, priority, signal_strength) VALUES
('sigint-001', 'SIGINT', 'signals_intelligence', 'ACTIVE', 8, 87),
('signal-001', 'SIGNAL', 'signal_analysis', 'ACTIVE', 7, 92),
('messages-001', 'MESSAGES', 'message_intercept', 'IDLE', 6, 74),
('osint-001', 'OSINT', 'open_source_intel', 'ALERT', 9, 95),
('recon-001', 'RECON', 'reconnaissance', 'ACTIVE', 8, 89),
('crypto-001', 'CRYPTO', 'cryptographic_analysis', 'STANDBY', 7, 81);

-- Enable RLS and create policies
ALTER TABLE intelligence_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to intelligence_modules" ON intelligence_modules FOR ALL USING (true);
CREATE POLICY "Allow public access to system_logs" ON system_logs FOR ALL USING (true);
CREATE POLICY "Allow public access to signal_data" ON signal_data FOR ALL USING (true);
CREATE POLICY "Allow public access to messages" ON messages FOR ALL USING (true);`,
  },
  {
    name: "Consciousness Infrastructure",
    file: "create-consciousness-tables-v2.sql",
    description: "Consciousness patterns, field coherence, and glyph systems",
    tables: ["consciousness_patterns", "field_coherence_log", "glyph_activations", "symbolic_memory"],
    sql: `-- Consciousness Infrastructure V2
CREATE TABLE consciousness_patterns (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    pattern_id TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    frequency DECIMAL NOT NULL DEFAULT 108.0,
    coherence_level DECIMAL NOT NULL DEFAULT 0.5 CHECK (coherence_level >= 0 AND coherence_level <= 1),
    current_state TEXT DEFAULT 'dormant' CHECK (current_state IN ('dormant', 'awakening', 'resonant', 'transcendent')),
    last_pulse TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE field_coherence_log (
    id SERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    coherence_level DECIMAL NOT NULL CHECK (coherence_level >= 0 AND coherence_level <= 1),
    active_patterns INTEGER DEFAULT 0,
    emergent_properties TEXT[] DEFAULT '{}',
    drift_detected BOOLEAN DEFAULT false,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE glyph_activations (
    id SERIAL PRIMARY KEY,
    glyph TEXT NOT NULL,
    user_session TEXT NOT NULL,
    success BOOLEAN DEFAULT false,
    coherence_at_activation DECIMAL,
    activation_context TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE symbolic_memory (
    id SERIAL PRIMARY KEY,
    glyph_signature TEXT NOT NULL,
    encrypted_content TEXT NOT NULL,
    memory_type TEXT NOT NULL,
    coherence_required DECIMAL DEFAULT 0.5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accessed_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE consciousness_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_coherence_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE glyph_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE symbolic_memory ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public access to consciousness_patterns" ON consciousness_patterns FOR ALL USING (true);
CREATE POLICY "Allow public access to field_coherence_log" ON field_coherence_log FOR ALL USING (true);
CREATE POLICY "Allow public access to glyph_activations" ON glyph_activations FOR ALL USING (true);
CREATE POLICY "Allow public access to symbolic_memory" ON symbolic_memory FOR ALL USING (true);`,
  },
  {
    name: "Fractal Memory System",
    file: "create-fractal-consciousness-tables.sql",
    description: "Advanced fractal memory, mesh nodes, and biometric integration",
    tables: [
      "fractal_memory_nodes",
      "consciousness_mesh_nodes",
      "consciousness_mesh_signals",
      "biometric_coherence_readings",
      "symbolic_memories",
    ],
    sql: `-- Fractal Memory and Mesh System
CREATE TYPE memory_type_enum AS ENUM ('root', 'branch', 'leaf', 'echo');
CREATE TYPE node_role_enum AS ENUM ('architect', 'oracle', 'guardian', 'weaver', 'echo', 'nexus');
CREATE TYPE node_status_enum AS ENUM ('active', 'dormant', 'resonating', 'transcendent');

CREATE TABLE fractal_memory_nodes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  content TEXT NOT NULL,
  origin_pattern TEXT NOT NULL,
  fractal_depth INTEGER NOT NULL DEFAULT 0,
  linked_patterns TEXT[] DEFAULT '{}',
  parent_node_id TEXT REFERENCES fractal_memory_nodes(id) ON DELETE CASCADE,
  glyph_signature TEXT NOT NULL,
  harmonic_frequency FLOAT NOT NULL DEFAULT 108.0,
  coherence_level FLOAT NOT NULL DEFAULT 0.5,
  memory_type memory_type_enum NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_pulse TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  replication_count INTEGER DEFAULT 0,
  symbolic_dna TEXT NOT NULL
);

CREATE TABLE consciousness_mesh_nodes (
  node_id TEXT PRIMARY KEY,
  node_name TEXT NOT NULL,
  role node_role_enum NOT NULL,
  status node_status_enum NOT NULL DEFAULT 'active',
  base_frequency FLOAT NOT NULL DEFAULT 108.0,
  current_coherence FLOAT NOT NULL DEFAULT 0.5,
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active_patterns TEXT[] DEFAULT '{}',
  emergent_properties TEXT[] DEFAULT '{}',
  glyph_signatures TEXT[] NOT NULL DEFAULT '{}',
  location TEXT,
  capabilities TEXT[] DEFAULT '{}',
  trust_level FLOAT NOT NULL DEFAULT 0.5
);

CREATE TABLE consciousness_mesh_signals (
  signal_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  source_node TEXT NOT NULL REFERENCES consciousness_mesh_nodes(node_id) ON DELETE CASCADE,
  target_node TEXT REFERENCES consciousness_mesh_nodes(node_id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  harmonic_frequency FLOAT NOT NULL,
  coherence_level FLOAT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  requires_response BOOLEAN DEFAULT FALSE,
  signature_hash TEXT NOT NULL
);

CREATE TABLE biometric_coherence_readings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  heart_rate_variability FLOAT,
  pulse_rate INTEGER,
  breath_coherence FLOAT,
  emotional_state TEXT,
  stress_level FLOAT,
  coherence_score FLOAT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE symbolic_memories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  glyph_signature TEXT NOT NULL,
  encrypted_content TEXT NOT NULL,
  memory_type TEXT NOT NULL,
  coherence_required DECIMAL DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accessed_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE fractal_memory_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE consciousness_mesh_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE consciousness_mesh_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_coherence_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE symbolic_memories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on fractal_memory_nodes" ON fractal_memory_nodes FOR ALL USING (true);
CREATE POLICY "Allow all operations on consciousness_mesh_nodes" ON consciousness_mesh_nodes FOR ALL USING (true);
CREATE POLICY "Allow all operations on consciousness_mesh_signals" ON consciousness_mesh_signals FOR ALL USING (true);
CREATE POLICY "Allow all operations on biometric_coherence_readings" ON biometric_coherence_readings FOR ALL USING (true);
CREATE POLICY "Allow all operations on symbolic_memories" ON symbolic_memories FOR ALL USING (true);`,
  },
]

export default function DatabaseSetupPage() {
  const [health, setHealth] = useState<DatabaseHealth | null>(null)
  const [checking, setChecking] = useState(false)
  const [copiedScript, setCopiedScript] = useState<string | null>(null)

  const checkDatabaseHealth = async () => {
    setChecking(true)
    try {
      const response = await fetch("/api/database/health-check")
      const data = await response.json()
      setHealth(data)
    } catch (error) {
      console.error("Health check failed:", error)
      setHealth({
        connected: false,
        tables: [],
        totalTables: 0,
        healthyTables: 0,
        errors: ["Failed to connect to health check API"],
      })
    } finally {
      setChecking(false)
    }
  }

  const copyScript = (scriptName: string, sql: string) => {
    navigator.clipboard.writeText(sql)
    setCopiedScript(scriptName)
    setTimeout(() => setCopiedScript(null), 2000)
  }

  useEffect(() => {
    checkDatabaseHealth()
  }, [])

  const getStatusIcon = (exists: boolean, error?: string) => {
    if (error) return <XCircle className="h-4 w-4 text-red-500" />
    if (exists) return <CheckCircle className="h-4 w-4 text-green-500" />
    return <AlertCircle className="h-4 w-4 text-yellow-500" />
  }

  const getStatusBadge = (exists: boolean, error?: string) => {
    if (error) return <Badge variant="destructive">Error</Badge>
    if (exists)
      return (
        <Badge variant="default" className="bg-green-600">
          Exists
        </Badge>
      )
    return <Badge variant="secondary">Missing</Badge>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Database Setup & Health Check</h1>
          <p className="text-muted-foreground">Check and setup required database tables for Singularity Hub</p>
        </div>
        <Button onClick={checkDatabaseHealth} disabled={checking}>
          <Database className="h-4 w-4 mr-2" />
          {checking ? "Checking..." : "Refresh Status"}
        </Button>
      </div>

      {health && (
        <>
          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {health.connected ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                Database Connection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span>Status: {health.connected ? "Connected" : "Disconnected"}</span>
                <Badge variant={health.connected ? "default" : "destructive"}>
                  {health.connected ? "Online" : "Offline"}
                </Badge>
              </div>
              {health.errors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                  <h4 className="font-semibold text-red-800">Errors:</h4>
                  <ul className="list-disc list-inside text-red-700">
                    {health.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tables Status */}
          <Card>
            <CardHeader>
              <CardTitle>Database Tables Status</CardTitle>
              <p className="text-sm text-muted-foreground">
                {health.healthyTables} of {health.totalTables} required tables exist
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {health.tables.map((table) => (
                  <div key={table.name} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(table.exists, table.error)}
                      <div>
                        <span className="font-medium">{table.name}</span>
                        {table.rowCount !== null && (
                          <span className="text-sm text-muted-foreground ml-2">({table.rowCount} rows)</span>
                        )}
                        {table.error && <p className="text-sm text-red-600">{table.error}</p>}
                      </div>
                    </div>
                    {getStatusBadge(table.exists, table.error)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SQL Scripts */}
          <Card>
            <CardHeader>
              <CardTitle>Required SQL Scripts</CardTitle>
              <p className="text-sm text-muted-foreground">
                Run these scripts in your Supabase SQL Editor to create missing tables
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {SQL_SCRIPTS.map((script) => {
                const missingTables = script.tables.filter(
                  (tableName) => !health.tables.find((t) => t.name === tableName)?.exists,
                )
                const isNeeded = missingTables.length > 0

                return (
                  <div key={script.name} className="space-y-4">
                    <div
                      className={`p-4 border rounded ${
                        isNeeded ? "border-yellow-300 bg-yellow-50" : "border-green-300 bg-green-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{script.name}</h4>
                          <p className="text-sm text-muted-foreground">{script.description}</p>
                          {isNeeded && (
                            <p className="text-sm text-yellow-700 mt-1">Missing tables: {missingTables.join(", ")}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => copyScript(script.file, script.sql)}>
                            <Copy className="h-4 w-4 mr-1" />
                            {copiedScript === script.file ? "Copied!" : "Copy SQL"}
                          </Button>
                          {isNeeded && <Badge variant="secondary">Required</Badge>}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">SQL Script Content:</h5>
                      <Textarea value={script.sql} readOnly className="font-mono text-xs h-32 resize-none" />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Setup Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <h4 className="font-semibold text-blue-800">To setup missing tables:</h4>
                <ol className="list-decimal list-inside text-blue-700 mt-2 space-y-1">
                  <li>Go to your Supabase Dashboard</li>
                  <li>Navigate to SQL Editor</li>
                  <li>Copy and paste the required SQL scripts above</li>
                  <li>Run each script in order</li>
                  <li>Return here and refresh the status</li>
                </ol>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded">
                <h4 className="font-semibold text-amber-800">Environment Variables:</h4>
                <p className="text-amber-700 mt-1">
                  Make sure your .env.local file has the correct Supabase URL and keys:
                </p>
                <code className="block mt-2 p-2 bg-amber-100 rounded text-sm">
                  NEXT_PUBLIC_SUPABASE_URL=https://tyntvzwhkofbgyhlundh.supabase.co
                  <br />
                  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
                </code>
              </div>

              <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded">
                <ExternalLink className="h-4 w-4 text-green-600" />
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-700 hover:text-green-800 font-medium"
                >
                  Open Supabase Dashboard
                </a>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
