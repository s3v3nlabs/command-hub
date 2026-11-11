-- =====================================================
-- SINGULAR/TY Command Hub Database Schema
-- Run this script in your Supabase SQL Editor
-- =====================================================

-- Create intelligence_modules table
CREATE TABLE IF NOT EXISTS intelligence_modules (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'IDLE',
    priority INTEGER NOT NULL DEFAULT 5,
    signal_strength INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create signal_data table
CREATE TABLE IF NOT EXISTS signal_data (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    frequency DECIMAL NOT NULL,
    amplitude DECIMAL NOT NULL,
    protocol TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    content TEXT NOT NULL,
    channel TEXT NOT NULL,
    encrypted BOOLEAN DEFAULT false,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create system_logs table
CREATE TABLE IF NOT EXISTS system_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    module TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_intelligence_modules_priority ON intelligence_modules(priority DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_modules_status ON intelligence_modules(status);
CREATE INDEX IF NOT EXISTS idx_signal_data_timestamp ON signal_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);

-- Insert sample intelligence modules
INSERT INTO intelligence_modules (id, name, type, status, priority, signal_strength) VALUES
('sigint-001', 'SIGINT', 'signals_intelligence', 'ACTIVE', 8, 85),
('signal-001', 'SIGNAL', 'signal_analysis', 'ACTIVE', 7, 92),
('messages-001', 'MESSAGES', 'message_intercept', 'IDLE', 6, 67),
('osint-001', 'OSINT', 'open_source_intel', 'ALERT', 5, 43)
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    priority = EXCLUDED.priority,
    signal_strength = EXCLUDED.signal_strength,
    updated_at = NOW();

-- Insert sample signal data
INSERT INTO signal_data (frequency, amplitude, protocol, metadata) VALUES
(2400.5, 75.2, 'Digital', '{"source": "antenna_1", "location": "sector_a"}'),
(1800.3, 45.8, 'AM', '{"source": "antenna_2", "location": "sector_b"}'),
(900.7, 89.1, 'FM', '{"source": "antenna_3", "location": "sector_c"}'),
(5000.2, 32.4, 'Digital', '{"source": "antenna_1", "location": "sector_a"}'),
(3200.8, 67.9, 'AM', '{"source": "antenna_2", "location": "sector_d"}');

-- Insert sample messages
INSERT INTO messages (content, channel, encrypted, metadata) VALUES
('Alpha team reporting in', 'ALPHA', true, '{"priority": 3, "sender": "agent_001"}'),
('Bravo team in position', 'BRAVO', false, '{"priority": 2, "sender": "agent_002"}'),
('Charlie team requesting backup', 'CHARLIE', true, '{"priority": 5, "sender": "agent_003"}'),
('Delta team mission complete', 'DELTA', false, '{"priority": 1, "sender": "agent_004"}'),
('Echo team standing by', 'ECHO', true, '{"priority": 2, "sender": "agent_005"}');

-- Insert sample system logs
INSERT INTO system_logs (level, message, module, metadata) VALUES
('INFO', 'System startup complete', 'SYSTEM', '{"startup_time": "2.3s"}'),
('INFO', 'SIGINT module activated', 'SIGINT', '{"frequency_range": "100-1000MHz"}'),
('WARN', 'Signal strength below threshold', 'SIGNAL', '{"threshold": 50, "current": 43}'),
('ERROR', 'Message decryption failed', 'MESSAGES', '{"message_id": "msg_001", "error": "invalid_key"}'),
('DEBUG', 'OSINT scan initiated', 'OSINT', '{"scan_type": "social_media", "targets": 15}'),
('INFO', 'Database connection established', 'SYSTEM', '{"connection_pool": 10}'),
('WARN', 'High CPU usage detected', 'SYSTEM', '{"cpu_usage": "85%", "threshold": "80%"}'),
('INFO', 'Command Hub accessed', 'COMMAND_HUB', '{"user": "admin", "timestamp": "' || NOW() || '"}'),
('INFO', 'ResonanceEQ initialized', 'AUDIO', '{"mode": "UserSync", "bands": 8}'),
('WARN', 'Priority change detected', 'COMMAND_HUB', '{"module": "SIGINT", "old_priority": 7, "new_priority": 8}');

-- Enable Row Level Security (RLS)
ALTER TABLE intelligence_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for anon access (for development)
CREATE POLICY "Allow anon access to intelligence_modules" ON intelligence_modules FOR ALL USING (true);
CREATE POLICY "Allow anon access to signal_data" ON signal_data FOR ALL USING (true);
CREATE POLICY "Allow anon access to messages" ON messages FOR ALL USING (true);
CREATE POLICY "Allow anon access to system_logs" ON system_logs FOR ALL USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_intelligence_modules_updated_at 
    BEFORE UPDATE ON intelligence_modules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify tables were created
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN ('intelligence_modules', 'signal_data', 'messages', 'system_logs');

-- Show sample data
SELECT 'intelligence_modules' as table_name, count(*) as row_count FROM intelligence_modules
UNION ALL
SELECT 'signal_data' as table_name, count(*) as row_count FROM signal_data
UNION ALL
SELECT 'messages' as table_name, count(*) as row_count FROM messages
UNION ALL
SELECT 'system_logs' as table_name, count(*) as row_count FROM system_logs;
