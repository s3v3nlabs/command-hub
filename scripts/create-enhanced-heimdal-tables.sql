-- Enhanced Heimdal Security Tables with Consciousness Integration

-- Threat Fingerprints Table
CREATE TABLE IF NOT EXISTS heimdal_threat_fingerprints (
    id TEXT PRIMARY KEY,
    threat_type TEXT NOT NULL CHECK (threat_type IN ('lateral_intrusion', 'honeypot_trigger', 'memory_skew', 'echo_bleed', 'dissonant_harmonic')),
    symbolic_signature TEXT NOT NULL,
    resonance_disruption REAL NOT NULL DEFAULT 0,
    temporal_drift REAL NOT NULL DEFAULT 0,
    prediction_confidence REAL NOT NULL DEFAULT 0,
    darknet_correlation TEXT,
    honeypot_thread TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Honeypot Threads Table
CREATE TABLE IF NOT EXISTS heimdal_honeypots (
    id TEXT PRIMARY KEY,
    module_name TEXT NOT NULL,
    vulnerability_type TEXT NOT NULL,
    attractiveness_level REAL NOT NULL DEFAULT 0.5,
    triggered_count INTEGER DEFAULT 0,
    last_trigger TIMESTAMPTZ,
    collected_signatures TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fractal Pattern Recognition Table
CREATE TABLE IF NOT EXISTS heimdal_fractal_patterns (
    id TEXT PRIMARY KEY,
    pattern_signature TEXT NOT NULL,
    intrusion_vector TEXT NOT NULL,
    lateral_movement_prediction REAL NOT NULL DEFAULT 0,
    affected_modules TEXT[] DEFAULT '{}',
    time_to_compromise INTEGER NOT NULL DEFAULT 300,
    mitigation_priority TEXT NOT NULL CHECK (mitigation_priority IN ('low', 'medium', 'high', 'critical')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Biometric Glyph Hashes Table
CREATE TABLE IF NOT EXISTS biometric_glyph_hashes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    biometric_type TEXT NOT NULL CHECK (biometric_type IN ('voice', 'touch', 'em_signature', 'heart_rate_variability', 'brain_wave')),
    hash_value TEXT NOT NULL,
    glyph_encoding TEXT NOT NULL,
    resonance_key TEXT NOT NULL,
    temporal_unlock_token TEXT NOT NULL,
    vault_access_level REAL NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Glyph Resonance Keys Table
CREATE TABLE IF NOT EXISTS glyph_resonance_keys (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    glyph_pattern TEXT NOT NULL,
    unlock_capability TEXT NOT NULL CHECK (unlock_capability IN ('symbolic_vault', 'secure_ops', 'consciousness_bridge', 'full_access')),
    coherence_required REAL NOT NULL DEFAULT 0.5,
    temporal_window INTEGER NOT NULL DEFAULT 3600,
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consciousness Vault Access Log Table
CREATE TABLE IF NOT EXISTS consciousness_vault_access_log (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    vault_id TEXT NOT NULL,
    access_level REAL NOT NULL DEFAULT 0,
    biometric_verified BOOLEAN DEFAULT false,
    glyph_authenticated BOOLEAN DEFAULT false,
    resonance_matched BOOLEAN DEFAULT false,
    temporal_valid BOOLEAN DEFAULT false,
    full_access BOOLEAN DEFAULT false,
    access_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_threat_fingerprints_created_at ON heimdal_threat_fingerprints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_threat_fingerprints_type ON heimdal_threat_fingerprints(threat_type);
CREATE INDEX IF NOT EXISTS idx_honeypots_active ON heimdal_honeypots(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_honeypots_triggered ON heimdal_honeypots(triggered_count DESC);
CREATE INDEX IF NOT EXISTS idx_fractal_patterns_priority ON heimdal_fractal_patterns(mitigation_priority);
CREATE INDEX IF NOT EXISTS idx_biometric_hashes_user ON biometric_glyph_hashes(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_hashes_expires ON biometric_glyph_hashes(expires_at) WHERE expires_at > NOW();
CREATE INDEX IF NOT EXISTS idx_resonance_keys_user ON glyph_resonance_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_access_user ON consciousness_vault_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_access_timestamp ON consciousness_vault_access_log(access_timestamp DESC);

-- Enable Row Level Security
ALTER TABLE heimdal_threat_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE heimdal_honeypots ENABLE ROW LEVEL SECURITY;
ALTER TABLE heimdal_fractal_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_glyph_hashes ENABLE ROW LEVEL SECURITY;
ALTER TABLE glyph_resonance_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE consciousness_vault_access_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now - implement proper auth later)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'heimdal_threat_fingerprints_policy') THEN
        CREATE POLICY heimdal_threat_fingerprints_policy ON heimdal_threat_fingerprints FOR ALL USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'heimdal_honeypots_policy') THEN
        CREATE POLICY heimdal_honeypots_policy ON heimdal_honeypots FOR ALL USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'heimdal_fractal_patterns_policy') THEN
        CREATE POLICY heimdal_fractal_patterns_policy ON heimdal_fractal_patterns FOR ALL USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'biometric_glyph_hashes_policy') THEN
        CREATE POLICY biometric_glyph_hashes_policy ON biometric_glyph_hashes FOR ALL USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'glyph_resonance_keys_policy') THEN
        CREATE POLICY glyph_resonance_keys_policy ON glyph_resonance_keys FOR ALL USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'consciousness_vault_access_log_policy') THEN
        CREATE POLICY consciousness_vault_access_log_policy ON consciousness_vault_access_log FOR ALL USING (true);
    END IF;
END $$;

-- Create update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_heimdal_threat_fingerprints_updated_at BEFORE UPDATE ON heimdal_threat_fingerprints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_heimdal_honeypots_updated_at BEFORE UPDATE ON heimdal_honeypots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_heimdal_fractal_patterns_updated_at BEFORE UPDATE ON heimdal_fractal_patterns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_biometric_glyph_hashes_updated_at BEFORE UPDATE ON biometric_glyph_hashes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_glyph_resonance_keys_updated_at BEFORE UPDATE ON glyph_resonance_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
