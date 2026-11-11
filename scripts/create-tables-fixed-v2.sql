-- Drop existing tables if they exist (for clean setup)
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

-- Insert sample data for intelligence_modules (using INSERT with conflict handling)
INSERT INTO intelligence_modules (id, name, type, status, priority, signal_strength) VALUES
('sigint-001', 'SIGINT', 'signals_intelligence', 'ACTIVE', 8, 87),
('signal-001', 'SIGNAL', 'signal_analysis', 'ACTIVE', 7, 92),
('messages-001', 'MESSAGES', 'message_intercept', 'IDLE', 6, 74),
('osint-001', 'OSINT', 'open_source_intel', 'ALERT', 9, 95),
('recon-001', 'RECON', 'reconnaissance', 'ACTIVE', 8, 89),
('crypto-001', 'CRYPTO', 'cryptographic_analysis', 'STANDBY', 7, 81);

-- Insert sample system logs
INSERT INTO system_logs (module_id, event_type, message, metadata) VALUES
('sigint-001', 'PRIORITY_CHANGE', 'Priority updated from 7 to 8', '{"old_priority": 7, "new_priority": 8}'),
('signal-001', 'STATUS_CHANGE', 'Module activated', '{"previous_status": "IDLE", "new_status": "ACTIVE"}'),
('osint-001', 'ALERT', 'High-priority intelligence detected', '{"threat_level": "HIGH", "source": "social_media"}'),
('recon-001', 'SCAN_COMPLETE', 'Network reconnaissance completed', '{"targets_found": 12, "vulnerabilities": 3}'),
('crypto-001', 'ANALYSIS_START', 'Cryptographic analysis initiated', '{"algorithm": "AES-256", "key_length": 256}');

-- Insert sample signal data
INSERT INTO signal_data (module_id, frequency, strength, data_payload) VALUES
('sigint-001', 433.92, 85, '{"type": "radio", "modulation": "FM", "bandwidth": 25000, "location": "sector_7"}'),
('signal-001', 2400.0, 92, '{"type": "wifi", "ssid": "TARGET_NETWORK", "encryption": "WPA2", "clients": 15}'),
('messages-001', 915.0, 74, '{"type": "cellular", "protocol": "GSM", "cell_id": "12345", "tower_distance": "2.3km"}'),
('osint-001', 1800.0, 95, '{"type": "satellite", "band": "L1", "signal_quality": "excellent", "doppler_shift": 0.2}'),
('recon-001', 5800.0, 89, '{"type": "radar", "pulse_width": 0.5, "prf": 1000, "range": "50km"}');

-- Insert sample messages
INSERT INTO messages (sender, content, encrypted, metadata) VALUES
('Agent_Alpha', 'Mission status: In progress. Target acquired.', true, '{"priority": "high", "classification": "secret", "location": "grid_7A"}'),
('Agent_Beta', 'Surveillance complete. No hostiles detected.', false, '{"priority": "medium", "classification": "confidential", "duration": "4h"}'),
('Agent_Gamma', 'Requesting immediate backup. Situation critical.', true, '{"priority": "urgent", "classification": "top_secret", "threat_level": "extreme"}'),
('Control_Tower', 'All units report status immediately.', false, '{"priority": "high", "classification": "restricted", "broadcast": true}'),
('Recon_Unit_1', 'Perimeter secured. Awaiting further orders.', true, '{"priority": "medium", "classification": "confidential", "position": "checkpoint_bravo"}');

-- Create indexes for better performance
CREATE INDEX idx_intelligence_modules_priority ON intelligence_modules(priority DESC);
CREATE INDEX idx_intelligence_modules_status ON intelligence_modules(status);
CREATE INDEX idx_intelligence_modules_signal_strength ON intelligence_modules(signal_strength DESC);

CREATE INDEX idx_system_logs_module_id ON system_logs(module_id);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX idx_system_logs_event_type ON system_logs(event_type);

CREATE INDEX idx_signal_data_module_id ON signal_data(module_id);
CREATE INDEX idx_signal_data_intercepted_at ON signal_data(intercepted_at DESC);
CREATE INDEX idx_signal_data_frequency ON signal_data(frequency);
CREATE INDEX idx_signal_data_strength ON signal_data(strength DESC);

CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX idx_messages_sender ON messages(sender);
CREATE INDEX idx_messages_encrypted ON messages(encrypted);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for intelligence_modules
CREATE TRIGGER update_intelligence_modules_updated_at
    BEFORE UPDATE ON intelligence_modules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE intelligence_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (development mode)
CREATE POLICY "Allow public access to intelligence_modules" ON intelligence_modules FOR ALL USING (true);
CREATE POLICY "Allow public access to system_logs" ON system_logs FOR ALL USING (true);
CREATE POLICY "Allow public access to signal_data" ON signal_data FOR ALL USING (true);
CREATE POLICY "Allow public access to messages" ON messages FOR ALL USING (true);

-- Verify table creation
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('intelligence_modules', 'system_logs', 'signal_data', 'messages')
ORDER BY tablename;

-- Show sample data counts
SELECT 
    'intelligence_modules' as table_name, 
    COUNT(*) as record_count 
FROM intelligence_modules
UNION ALL
SELECT 
    'system_logs' as table_name, 
    COUNT(*) as record_count 
FROM system_logs
UNION ALL
SELECT 
    'signal_data' as table_name, 
    COUNT(*) as record_count 
FROM signal_data
UNION ALL
SELECT 
    'messages' as table_name, 
    COUNT(*) as record_count 
FROM messages
ORDER BY table_name;
