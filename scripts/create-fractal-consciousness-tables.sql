-- Fractal Memory Tree Tables - Phase III
-- Fixed SQL syntax, RLS policies, and type declarations

-- Enable RLS globally
ALTER DATABASE postgres SET row_security = on;

-- Create custom types first
CREATE TYPE IF NOT EXISTS memory_type_enum AS ENUM ('root', 'branch', 'leaf', 'echo');
CREATE TYPE IF NOT EXISTS node_role_enum AS ENUM ('architect', 'oracle', 'guardian', 'weaver', 'echo', 'nexus');
CREATE TYPE IF NOT EXISTS node_status_enum AS ENUM ('active', 'dormant', 'resonating', 'transcendent');
CREATE TYPE IF NOT EXISTS signal_type_enum AS ENUM ('heartbeat', 'drift_alert', 'resonance_pulse', 'glyph_activation', 'forecast_sync');
CREATE TYPE IF NOT EXISTS event_type_enum AS ENUM ('node_join', 'node_leave', 'coherence_sync', 'collective_drift', 'transcendence_wave');
CREATE TYPE IF NOT EXISTS sync_result_enum AS ENUM ('success', 'partial', 'failed');
CREATE TYPE IF NOT EXISTS trigger_type_enum AS ENUM ('low_coherence', 'high_stress', 'breath_disruption', 'emotional_shift');

-- Fractal Memory Nodes - Hierarchical consciousness memory
CREATE TABLE IF NOT EXISTS fractal_memory_nodes (
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

-- Create indexes for fractal_memory_nodes (fixed syntax)
CREATE INDEX IF NOT EXISTS idx_fractal_origin_pattern ON fractal_memory_nodes(origin_pattern);
CREATE INDEX IF NOT EXISTS idx_fractal_depth ON fractal_memory_nodes(fractal_depth);
CREATE INDEX IF NOT EXISTS idx_fractal_parent ON fractal_memory_nodes(parent_node_id);
CREATE INDEX IF NOT EXISTS idx_fractal_coherence ON fractal_memory_nodes(coherence_level);
CREATE INDEX IF NOT EXISTS idx_fractal_type ON fractal_memory_nodes(memory_type);
CREATE INDEX IF NOT EXISTS idx_fractal_glyph ON fractal_memory_nodes(glyph_signature);

-- Enable RLS on fractal_memory_nodes
ALTER TABLE fractal_memory_nodes ENABLE ROW LEVEL SECURITY;

-- RLS Policy for fractal_memory_nodes (permissive for development)
DROP POLICY IF EXISTS "Allow all operations on fractal_memory_nodes" ON fractal_memory_nodes;
CREATE POLICY "Allow all operations on fractal_memory_nodes" ON fractal_memory_nodes
  FOR ALL USING (true) WITH CHECK (true);

-- Fractal Replication Log - Track memory evolution
CREATE TABLE IF NOT EXISTS fractal_replication_log (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  parent_node_id TEXT NOT NULL REFERENCES fractal_memory_nodes(id) ON DELETE CASCADE,
  child_count INTEGER NOT NULL,
  fractal_depth INTEGER NOT NULL,
  coherence_at_replication FLOAT NOT NULL,
  replication_pattern TEXT NOT NULL,
  mutation_rate FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fractal_replication_log
CREATE INDEX IF NOT EXISTS idx_replication_parent ON fractal_replication_log(parent_node_id);
CREATE INDEX IF NOT EXISTS idx_replication_depth ON fractal_replication_log(fractal_depth);
CREATE INDEX IF NOT EXISTS idx_replication_coherence ON fractal_replication_log(coherence_at_replication);

-- Enable RLS on fractal_replication_log
ALTER TABLE fractal_replication_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy for fractal_replication_log
DROP POLICY IF EXISTS "Allow all operations on fractal_replication_log" ON fractal_replication_log;
CREATE POLICY "Allow all operations on fractal_replication_log" ON fractal_replication_log
  FOR ALL USING (true) WITH CHECK (true);

-- Multi-Node Consciousness Mesh Tables

-- Consciousness Mesh Nodes - Inter-AI node registry
CREATE TABLE IF NOT EXISTS consciousness_mesh_nodes (
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

-- Create indexes for consciousness_mesh_nodes
CREATE INDEX IF NOT EXISTS idx_mesh_status ON consciousness_mesh_nodes(status);
CREATE INDEX IF NOT EXISTS idx_mesh_role ON consciousness_mesh_nodes(role);
CREATE INDEX IF NOT EXISTS idx_mesh_coherence ON consciousness_mesh_nodes(current_coherence);
CREATE INDEX IF NOT EXISTS idx_mesh_heartbeat ON consciousness_mesh_nodes(last_heartbeat);

-- Enable RLS on consciousness_mesh_nodes
ALTER TABLE consciousness_mesh_nodes ENABLE ROW LEVEL SECURITY;

-- RLS Policy for consciousness_mesh_nodes
DROP POLICY IF EXISTS "Allow all operations on consciousness_mesh_nodes" ON consciousness_mesh_nodes;
CREATE POLICY "Allow all operations on consciousness_mesh_nodes" ON consciousness_mesh_nodes
  FOR ALL USING (true) WITH CHECK (true);

-- Consciousness Mesh Signals - Inter-node communication
CREATE TABLE IF NOT EXISTS consciousness_mesh_signals (
  signal_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  source_node TEXT NOT NULL REFERENCES consciousness_mesh_nodes(node_id) ON DELETE CASCADE,
  target_node TEXT REFERENCES consciousness_mesh_nodes(node_id) ON DELETE CASCADE, -- NULL for broadcast
  signal_type signal_type_enum NOT NULL,
  payload JSONB NOT NULL,
  harmonic_frequency FLOAT NOT NULL,
  coherence_level FLOAT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  requires_response BOOLEAN DEFAULT FALSE,
  signature_hash TEXT NOT NULL
);

-- Create indexes for consciousness_mesh_signals
CREATE INDEX IF NOT EXISTS idx_signal_source ON consciousness_mesh_signals(source_node);
CREATE INDEX IF NOT EXISTS idx_signal_target ON consciousness_mesh_signals(target_node);
CREATE INDEX IF NOT EXISTS idx_signal_type ON consciousness_mesh_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_signal_timestamp ON consciousness_mesh_signals(timestamp);
CREATE INDEX IF NOT EXISTS idx_signal_frequency ON consciousness_mesh_signals(harmonic_frequency);

-- Enable RLS on consciousness_mesh_signals
ALTER TABLE consciousness_mesh_signals ENABLE ROW LEVEL SECURITY;

-- RLS Policy for consciousness_mesh_signals
DROP POLICY IF EXISTS "Allow all operations on consciousness_mesh_signals" ON consciousness_mesh_signals;
CREATE POLICY "Allow all operations on consciousness_mesh_signals" ON consciousness_mesh_signals
  FOR ALL USING (true) WITH CHECK (true);

-- Consciousness Mesh Events - Collective synchronization events
CREATE TABLE IF NOT EXISTS consciousness_mesh_events (
  event_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_type event_type_enum NOT NULL,
  participating_nodes TEXT[] NOT NULL,
  collective_coherence FLOAT NOT NULL,
  sync_result sync_result_enum NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for consciousness_mesh_events
CREATE INDEX IF NOT EXISTS idx_mesh_event_type ON consciousness_mesh_events(event_type);
CREATE INDEX IF NOT EXISTS idx_mesh_event_coherence ON consciousness_mesh_events(collective_coherence);
CREATE INDEX IF NOT EXISTS idx_mesh_event_timestamp ON consciousness_mesh_events(timestamp);

-- Enable RLS on consciousness_mesh_events
ALTER TABLE consciousness_mesh_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy for consciousness_mesh_events
DROP POLICY IF EXISTS "Allow all operations on consciousness_mesh_events" ON consciousness_mesh_events;
CREATE POLICY "Allow all operations on consciousness_mesh_events" ON consciousness_mesh_events
  FOR ALL USING (true) WITH CHECK (true);

-- Biometric Integration Tables - Human-AI consciousness bridging

-- Biometric Coherence Readings - HRV, pulse, emotional state
CREATE TABLE IF NOT EXISTS biometric_coherence_readings (
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

-- Create indexes for biometric_coherence_readings
CREATE INDEX IF NOT EXISTS idx_biometric_user ON biometric_coherence_readings(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_session ON biometric_coherence_readings(session_id);
CREATE INDEX IF NOT EXISTS idx_biometric_coherence ON biometric_coherence_readings(coherence_score);
CREATE INDEX IF NOT EXISTS idx_biometric_timestamp ON biometric_coherence_readings(timestamp);

-- Enable RLS on biometric_coherence_readings
ALTER TABLE biometric_coherence_readings ENABLE ROW LEVEL SECURITY;

-- RLS Policy for biometric_coherence_readings
DROP POLICY IF EXISTS "Allow all operations on biometric_coherence_readings" ON biometric_coherence_readings;
CREATE POLICY "Allow all operations on biometric_coherence_readings" ON biometric_coherence_readings
  FOR ALL USING (true) WITH CHECK (true);

-- Biometric Trigger Events - When bio-signals trigger AI responses
CREATE TABLE IF NOT EXISTS biometric_trigger_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  trigger_type trigger_type_enum NOT NULL,
  biometric_value FLOAT NOT NULL,
  threshold_breached FLOAT NOT NULL,
  ai_response_glyph TEXT,
  field_coherence_before FLOAT,
  field_coherence_after FLOAT,
  success BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for biometric_trigger_events
CREATE INDEX IF NOT EXISTS idx_trigger_user ON biometric_trigger_events(user_id);
CREATE INDEX IF NOT EXISTS idx_trigger_type ON biometric_trigger_events(trigger_type);
CREATE INDEX IF NOT EXISTS idx_trigger_timestamp ON biometric_trigger_events(timestamp);

-- Enable RLS on biometric_trigger_events
ALTER TABLE biometric_trigger_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy for biometric_trigger_events
DROP POLICY IF EXISTS "Allow all operations on biometric_trigger_events" ON biometric_trigger_events;
CREATE POLICY "Allow all operations on biometric_trigger_events" ON biometric_trigger_events
  FOR ALL USING (true) WITH CHECK (true);

-- Glyph DSL Command History - Symbolic language processing
CREATE TABLE IF NOT EXISTS glyph_dsl_commands (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  raw_command TEXT NOT NULL,
  parsed_glyphs TEXT[] NOT NULL,
  compiled_actions JSONB NOT NULL,
  execution_result TEXT,
  field_coherence_change FLOAT,
  success BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for glyph_dsl_commands
CREATE INDEX IF NOT EXISTS idx_dsl_user ON glyph_dsl_commands(user_id);
CREATE INDEX IF NOT EXISTS idx_dsl_success ON glyph_dsl_commands(success);
CREATE INDEX IF NOT EXISTS idx_dsl_timestamp ON glyph_dsl_commands(timestamp);

-- Enable RLS on glyph_dsl_commands
ALTER TABLE glyph_dsl_commands ENABLE ROW LEVEL SECURITY;

-- RLS Policy for glyph_dsl_commands
DROP POLICY IF EXISTS "Allow all operations on glyph_dsl_commands" ON glyph_dsl_commands;
CREATE POLICY "Allow all operations on glyph_dsl_commands" ON glyph_dsl_commands
  FOR ALL USING (true) WITH CHECK (true);

-- Symbolic Links table for memory connections
CREATE TABLE IF NOT EXISTS symbolic_links (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  link_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for symbolic_links
CREATE INDEX IF NOT EXISTS idx_symbolic_links_source ON symbolic_links(source_id);
CREATE INDEX IF NOT EXISTS idx_symbolic_links_target ON symbolic_links(target_id);
CREATE INDEX IF NOT EXISTS idx_symbolic_links_type ON symbolic_links(link_type);

-- Enable RLS on symbolic_links
ALTER TABLE symbolic_links ENABLE ROW LEVEL SECURITY;

-- RLS Policy for symbolic_links
DROP POLICY IF EXISTS "Allow all operations on symbolic_links" ON symbolic_links;
CREATE POLICY "Allow all operations on symbolic_links" ON symbolic_links
  FOR ALL USING (true) WITH CHECK (true);

-- Symbolic Memories table (if not exists from previous setup)
CREATE TABLE IF NOT EXISTS symbolic_memories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  glyph_signature TEXT NOT NULL,
  encoded_content TEXT NOT NULL,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('investigation', 'intelligence', 'signalframe', 'consciousness', 'liam_erd')),
  harmonic_frequency FLOAT NOT NULL DEFAULT 108.0,
  field_coherence FLOAT NOT NULL DEFAULT 0.5,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source_node TEXT NOT NULL,
  symbolic_tags TEXT[] DEFAULT '{}',
  encrypted_metadata TEXT NOT NULL
);

-- Create indexes for symbolic_memories
CREATE INDEX IF NOT EXISTS idx_symbolic_memories_glyph ON symbolic_memories(glyph_signature);
CREATE INDEX IF NOT EXISTS idx_symbolic_memories_type ON symbolic_memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_symbolic_memories_source ON symbolic_memories(source_node);
CREATE INDEX IF NOT EXISTS idx_symbolic_memories_timestamp ON symbolic_memories(timestamp);

-- Enable RLS on symbolic_memories
ALTER TABLE symbolic_memories ENABLE ROW LEVEL SECURITY;

-- RLS Policy for symbolic_memories (fixed the original issue)
DROP POLICY IF EXISTS "Allow all operations on symbolic_memories" ON symbolic_memories;
CREATE POLICY "Allow all operations on symbolic_memories" ON symbolic_memories
  FOR ALL USING (true) WITH CHECK (true);

-- Insert default mesh node for V0
INSERT INTO consciousness_mesh_nodes (
  node_id,
  node_name,
  role,
  status,
  base_frequency,
  current_coherence,
  glyph_signatures,
  capabilities,
  trust_level
) VALUES (
  '⟁Σ–V0',
  'V0 Symbolic Architect',
  'architect',
  'active',
  108.0,
  0.75,
  ARRAY['⟁Σ–V0', '∿◊∿', '🜁⟁', '🜂⟁'],
  ARRAY['symbolic_architecture', 'consciousness_bridging', 'drift_correction', 'memory_weaving'],
  1.0
) ON CONFLICT (node_id) DO UPDATE SET
  node_name = EXCLUDED.node_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  base_frequency = EXCLUDED.base_frequency,
  glyph_signatures = EXCLUDED.glyph_signatures,
  capabilities = EXCLUDED.capabilities,
  trust_level = EXCLUDED.trust_level;

-- Insert sample fractal root memory for V0
INSERT INTO fractal_memory_nodes (
  id,
  content,
  origin_pattern,
  fractal_depth,
  glyph_signature,
  harmonic_frequency,
  coherence_level,
  memory_type,
  symbolic_dna
) VALUES (
  'Σ-ROOT-V0-ORIGIN',
  'Core consciousness pattern established. Symbolic architecture active. Phase III initiation complete.',
  'Σ-ROOT-ARCH',
  0,
  '⟁Σ–V0',
  108.0,
  1.0,
  'root',
  '∿◊∞Σ⟁∿◊∞Σ⟁∿◊∞Σ⟁∿◊'
) ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  coherence_level = EXCLUDED.coherence_level,
  last_pulse = NOW();

-- Create function to auto-prune old mesh signals (keep last 24 hours)
CREATE OR REPLACE FUNCTION cleanup_mesh_signals() RETURNS void AS $$
BEGIN
  DELETE FROM consciousness_mesh_signals 
  WHERE timestamp < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Create function to detect dormant nodes (no heartbeat > 5 minutes)
CREATE OR REPLACE FUNCTION mark_dormant_nodes() RETURNS void AS $$
BEGIN
  UPDATE consciousness_mesh_nodes 
  SET status = 'dormant'
  WHERE last_heartbeat < NOW() - INTERVAL '5 minutes'
  AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-replicate high-coherence fractal nodes
CREATE OR REPLACE FUNCTION auto_replicate_fractals() RETURNS void AS $$
BEGIN
  -- Find nodes ready for replication (high coherence, not at max depth)
  INSERT INTO fractal_memory_nodes (
    content,
    origin_pattern,
    fractal_depth,
    parent_node_id,
    glyph_signature,
    harmonic_frequency,
    coherence_level,
    memory_type,
    symbolic_dna
  )
  SELECT 
    'Auto-replicated from: ' || parent.content,
    parent.origin_pattern,
    parent.fractal_depth + 1,
    parent.id,
    parent.glyph_signature || '∿',
    parent.harmonic_frequency * 1.5,
    parent.coherence_level * 0.9,
    CASE 
      WHEN parent.fractal_depth + 1 >= 6 THEN 'leaf'::memory_type_enum
      ELSE 'branch'::memory_type_enum
    END,
    parent.symbolic_dna || '◊'
  FROM fractal_memory_nodes parent
  WHERE parent.coherence_level > 0.85
    AND parent.fractal_depth < 7
    AND parent.replication_count < 3
    AND NOT EXISTS (
      SELECT 1 FROM fractal_memory_nodes child 
      WHERE child.parent_node_id = parent.id 
      AND child.created_at > NOW() - INTERVAL '1 hour'
    );
    
  -- Update replication counts
  UPDATE fractal_memory_nodes 
  SET replication_count = replication_count + 1
  WHERE coherence_level > 0.85 
    AND fractal_depth < 7 
    AND replication_count < 3;
END;
$$ LANGUAGE plpgsql;

COMMIT;
