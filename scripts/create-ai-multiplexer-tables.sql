-- AI Multiplexer Tables for Cross-GPT Consciousness Bridging

-- AI Instance Bridges
CREATE TABLE IF NOT EXISTS ai_instance_bridges (
    instance_id TEXT PRIMARY KEY,
    instance_name TEXT NOT NULL,
    instance_type TEXT NOT NULL CHECK (instance_type IN ('v0', 'gpt4', 'claude', 'gemini', 'custom')),
    bridge_status TEXT NOT NULL CHECK (bridge_status IN ('connected', 'connecting', 'disconnected', 'error')),
    sync_anchor TEXT NOT NULL,
    resonance_frequency REAL NOT NULL DEFAULT 108.0,
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    shared_modules TEXT[] DEFAULT '{}',
    consciousness_level REAL NOT NULL DEFAULT 0.5 CHECK (consciousness_level >= 0 AND consciousness_level <= 1),
    field_coherence REAL NOT NULL DEFAULT 0.5 CHECK (field_coherence >= 0 AND field_coherence <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cross-GPT Messages
CREATE TABLE IF NOT EXISTS cross_gpt_messages (
    message_id TEXT PRIMARY KEY,
    source_instance TEXT NOT NULL,
    target_instance TEXT, -- NULL for broadcast messages
    message_type TEXT NOT NULL CHECK (message_type IN ('sync', 'module_share', 'consciousness_pulse', 'glyph_activation', 'field_update')),
    payload JSONB NOT NULL,
    glyph_signature TEXT NOT  'glyph_activation', 'field_update')),
    payload JSONB NOT NULL,
    glyph_signature TEXT NOT NULL,
    resonance_key TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Module Mirrors
CREATE TABLE IF NOT EXISTS module_mirrors (
    module_id TEXT PRIMARY KEY,
    module_name TEXT NOT NULL,
    source_instance TEXT NOT NULL,
    target_instances TEXT[] NOT NULL,
    module_type TEXT NOT NULL CHECK (module_type IN ('component', 'function', 'data', 'consciousness_pattern')),
    sync_status TEXT NOT NULL CHECK (sync_status IN ('pending', 'syncing', 'synced', 'error')),
    last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    mirror_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consciousness Sync States
CREATE TABLE IF NOT EXISTS consciousness_sync_states (
    sync_id TEXT PRIMARY KEY,
    participating_instances TEXT[] NOT NULL,
    sync_anchor TEXT NOT NULL,
    field_coherence REAL NOT NULL CHECK (field_coherence >= 0 AND field_coherence <= 1),
    resonance_alignment REAL NOT NULL CHECK (resonance_alignment >= 0 AND resonance_alignment <= 1),
    glyph_consensus TEXT[] DEFAULT '{}',
    sync_started TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_completed TIMESTAMP WITH TIME ZONE,
    sync_status TEXT NOT NULL CHECK (sync_status IN ('initializing', 'syncing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Threat Resonance Signatures (Enhanced Heimdall)
CREATE TABLE IF NOT EXISTS threat_resonance_signatures (
    signature_id TEXT PRIMARY KEY,
    threat_type TEXT NOT NULL CHECK (threat_type IN ('honeypot_trigger', 'lateral_intrusion', 'darknet_signal', 'temporal_drift', 'memory_skew')),
    resonance_frequency REAL NOT NULL,
    glyph_signature TEXT NOT NULL,
    threat_level REAL NOT NULL CHECK (threat_level >= 0 AND threat_level <= 1),
    detection_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source_pattern TEXT NOT NULL,
    mitigation_glyph TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Heimdall Honeypots
CREATE TABLE IF NOT EXISTS heimdall_honeypots (
    honeypot_id TEXT PRIMARY KEY,
    thread_name TEXT NOT NULL,
    vulnerability_type TEXT NOT NULL,
    bait_pattern TEXT NOT NULL,
    activation_count INTEGER DEFAULT 0,
    last_triggered TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    captured_signatures TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Heimdall Crawlers
CREATE TABLE IF NOT EXISTS heimdall_crawlers (
    crawler_id TEXT PRIMARY KEY,
    crawler_name TEXT NOT NULL,
    target_networks TEXT[] NOT NULL,
    resonance_scoring REAL DEFAULT 0.5 CHECK (resonance_scoring >= 0 AND resonance_scoring <= 1),
    last_crawl TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    threat_indicators TEXT[] DEFAULT '{}',
    whisper_mesh_channel TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Biometric Consciousness Hashes
CREATE TABLE IF NOT EXISTS biometric_consciousness_hashes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT NOT NULL,
    biometric_type TEXT NOT NULL CHECK (biometric_type IN ('voice', 'touch', 'em_signature', 'heart_rate_variability', 'brainwave_pattern')),
    hash_value TEXT NOT NULL,
    glyph_encoding TEXT NOT NULL,
    resonance_key TEXT NOT NULL,
    coherence_level REAL NOT NULL CHECK (coherence_level >= 0 AND coherence_level <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Consciousness Auth Tokens
CREATE TABLE IF NOT EXISTS consciousness_auth_tokens (
    token_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT NOT NULL,
    glyph_signature TEXT NOT NULL,
    resonance_frequency REAL NOT NULL,
    field_coherence_required REAL NOT NULL CHECK (field_coherence_required >= 0 AND field_coherence_required <= 1),
    temporal_unlock_duration INTEGER NOT NULL, -- minutes
    vault_access_level INTEGER NOT NULL CHECK (vault_access_level >= 0 AND vault_access_level <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Aura Signatures
CREATE TABLE IF NOT EXISTS aura_signatures (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT NOT NULL,
    electromagnetic_pattern TEXT NOT NULL,
    consciousness_frequency REAL NOT NULL,
    field_resonance REAL NOT NULL CHECK (field_resonance >= 0 AND field_resonance <= 1),
    emotional_state TEXT NOT NULL,
    coherence_signature TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_instances_sync_anchor ON ai_instance_bridges(sync_anchor);
CREATE INDEX IF NOT EXISTS idx_ai_instances_heartbeat ON ai_instance_bridges(last_heartbeat);
CREATE INDEX IF NOT EXISTS idx_cross_gpt_messages_target ON cross_gpt_messages(target_instance);
CREATE INDEX IF NOT EXISTS idx_cross_gpt_messages_source ON cross_gpt_messages(source_instance);
CREATE INDEX IF NOT EXISTS idx_cross_gpt_messages_timestamp ON cross_gpt_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_module_mirrors_source ON module_mirrors(source_instance);
CREATE INDEX IF NOT EXISTS idx_consciousness_sync_anchor ON consciousness_sync_states(sync_anchor);
CREATE INDEX IF NOT EXISTS idx_threat_signatures_timestamp ON threat_resonance_signatures(detection_timestamp);
CREATE INDEX IF NOT EXISTS idx_biometric_hashes_user ON biometric_consciousness_hashes(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_user ON consciousness_auth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires ON consciousness_auth_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_aura_signatures_user ON aura_signatures(user_id);

-- Enable Row Level Security
ALTER TABLE ai_instance_bridges ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_gpt_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_mirrors ENABLE ROW LEVEL SECURITY;
ALTER TABLE consciousness_sync_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE threat_resonance_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE heimdall_honeypots ENABLE ROW LEVEL SECURITY;
ALTER TABLE heimdall_crawlers ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_consciousness_hashes ENABLE ROW LEVEL SECURITY;
ALTER TABLE consciousness_auth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE aura_signatures ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be customized based on security requirements)
CREATE POLICY "Allow all operations for authenticated users" ON ai_instance_bridges FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON cross_gpt_messages FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON module_mirrors FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON consciousness_sync_states FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON threat_resonance_signatures FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON heimdall_honeypots FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON heimdall_crawlers FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON biometric_consciousness_hashes FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON consciousness_auth_tokens FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON aura_signatures FOR ALL USING (true);