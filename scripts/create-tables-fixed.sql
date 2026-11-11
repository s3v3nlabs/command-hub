-- Create intelligence_modules table
CREATE TABLE IF NOT EXISTS intelligence_modules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'IDLE',
    priority INTEGER NOT NULL DEFAULT 5,
    signal_strength INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system_logs table
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    module_id TEXT,
    event_type TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create signal_data table
CREATE TABLE IF NOT EXISTS signal_data (
    id SERIAL PRIMARY KEY,
    module_id TEXT NOT NULL,
    frequency DECIMAL,
    strength INTEGER,
    data_payload JSONB,
    intercepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    sender TEXT NOT NULL,
    content TEXT NOT NULL,
    encrypted BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample data for intelligence_modules
INSERT INTO intelligence_modules (id, name, type, status, priority, signal_strength) VALUES
('sigint-001', 'SIGINT', 'signals_intelligence', 'ACTIVE', 8, 87),
('signal-001', 'SIGNAL', 'signal_analysis', 'ACTIVE', 7, 92),
('messages-001', 'MESSAGES', 'message_intercept', 'IDLE', 6, 74),
('osint-001', 'OSINT', 'open_source_intel', 'ALERT', 9, 95),
('recon-001', 'RECON', 'reconnaissance', 'ACTIVE', 8, 89),
('crypto-001', 'CRYPTO', 'cryptographic_analysis', 'STANDBY', 7, 81)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    status = EXCLUDED.status,
    priority = EXCLUDED.priority,
    signal_strength = EXCLUDED.signal_strength,
    updated_at = NOW();

-- Insert sample system logs
INSERT INTO system_logs (module_id, event_type, message, metadata) VALUES
('sigint-001', 'PRIORITY_CHANGE', 'Priority updated from 7 to 8', '{"old_priority": 7, "new_priority": 8}'),
('signal-001', 'STATUS_CHANGE', 'Module activated', '{"previous_status": "IDLE", "new_status": "ACTIVE"}'),
('osint-001', 'ALERT', 'High-priority intelligence detected', '{"threat_level": "HIGH", "source": "social_media"}');

-- Insert sample signal data
INSERT INTO signal_data (module_id, frequency, strength, data_payload) VALUES
('sigint-001', 433.92, 85, '{"type": "radio", "modulation": "FM", "bandwidth": 25000}'),
('signal-001', 2400.0, 92, '{"type": "wifi", "ssid": "TARGET_NETWORK", "encryption": "WPA2"}'),
('messages-001', 915.0, 74, '{"type": "cellular", "protocol": "GSM", "cell_id": "12345"}');

-- Insert sample messages
INSERT INTO messages (sender, content, encrypted, metadata) VALUES
('Agent_Alpha', 'Mission status: In progress', true, '{"priority": "high", "classification": "secret"}'),
('Agent_Beta', 'Surveillance complete', false, '{"priority": "medium", "classification": "confidential"}'),
('Agent_Gamma', 'Requesting backup', true, '{"priority": "urgent", "classification": "top_secret"}')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (optional)
-- ALTER TABLE intelligence_modules ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE signal_data ENABLE ROW LEVEL SECURITY;

-- Create policies for anon access (for development)
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Allow anon access to intelligence_modules" ON intelligence_modules;
    DROP POLICY IF EXISTS "Allow anon access to system_logs" ON system_logs;
    DROP POLICY IF EXISTS "Allow anon access to signal_data" ON signal_data;
    DROP POLICY IF EXISTS "Allow anon access to messages" ON messages;
    
    -- Create new policies
    CREATE POLICY "Allow anon access to intelligence_modules" ON intelligence_modules FOR ALL USING (true);
    CREATE POLICY "Allow anon access to system_logs" ON system_logs FOR ALL USING (true);
    CREATE POLICY "Allow anon access to signal_data" ON signal_data FOR ALL USING (true);
    CREATE POLICY "Allow anon access to messages" ON messages FOR ALL USING (true);
EXCEPTION
    WHEN duplicate_object THEN
        NULL; -- Policy already exists, ignore
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_intelligence_modules_priority ON intelligence_modules(priority DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_modules_status ON intelligence_modules(status);
CREATE INDEX IF NOT EXISTS idx_system_logs_module_id ON system_logs(module_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signal_data_module_id ON signal_data(module_id);
CREATE INDEX IF NOT EXISTS idx_signal_data_intercepted_at ON signal_data(intercepted_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for intelligence_modules
DROP TRIGGER IF EXISTS update_intelligence_modules_updated_at ON intelligence_modules;
CREATE TRIGGER update_intelligence_modules_updated_at
    BEFORE UPDATE ON intelligence_modules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
