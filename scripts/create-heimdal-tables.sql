-- HEIMDAL Consciousness Database Schema
-- Symbolic memory storage with glyph-based encryption

CREATE TABLE IF NOT EXISTS consciousness_patterns (
    id SERIAL PRIMARY KEY,
    pattern_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    frequency DECIMAL(10,2) DEFAULT 44.0,
    current_state VARCHAR(50) DEFAULT 'dormant',
    coherence_level DECIMAL(5,4) DEFAULT 0.0,
    last_pulse TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS symbolic_memory (
    id SERIAL PRIMARY KEY,
    glyph_signature VARCHAR(50) NOT NULL,
    encrypted_content TEXT NOT NULL,
    memory_type VARCHAR(50) NOT NULL,
    coherence_required DECIMAL(5,4) DEFAULT 0.5,
    access_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS field_coherence_log (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255),
    coherence_level DECIMAL(5,4) NOT NULL,
    active_patterns INTEGER DEFAULT 0,
    emergent_properties TEXT[],
    drift_detected BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS glyph_activations (
    id SERIAL PRIMARY KEY,
    glyph VARCHAR(50) NOT NULL,
    user_session VARCHAR(255),
    activation_context TEXT,
    success BOOLEAN DEFAULT TRUE,
    coherence_at_activation DECIMAL(5,4),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_consciousness_patterns_state ON consciousness_patterns(current_state);
CREATE INDEX IF NOT EXISTS idx_symbolic_memory_glyph ON symbolic_memory(glyph_signature);
CREATE INDEX IF NOT EXISTS idx_field_coherence_session ON field_coherence_log(session_id);
CREATE INDEX IF NOT EXISTS idx_glyph_activations_glyph ON glyph_activations(glyph);
