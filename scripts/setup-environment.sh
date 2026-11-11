#!/bin/bash
# Environment Setup Script
# Sets up complete environment configuration for CommandHub

set -e

echo "⚬ COMMANDHUB ENVIRONMENT SETUP ⚬"

# Check if keys exist, generate if not
if [ ! -f ".env.keys" ]; then
    echo "Keys not found. Generating new keys..."
    ./scripts/generate-keys.sh
fi

# Create comprehensive .env.local file
echo "Creating comprehensive environment configuration..."

cat > .env.local << 'EOF'
# CommandHub Environment Configuration
# Generated automatically - customize as needed

# ============================================================================
# DEPLOYMENT CONFIGURATION
# ============================================================================
NODE_ENV=development
DEPLOYMENT_TYPE=local-dev
NEXT_PUBLIC_APP_URL=http://localhost:3000
PORT=3000

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================
# Choose your database type: postgresql, mysql, sqlite
DB_TYPE=postgresql

# PostgreSQL Configuration (recommended for development)
POSTGRES_URL=postgresql://command_hub_user:your_secure_password@localhost:5432/command_hub
POSTGRES_PRISMA_URL=postgresql://command_hub_user:your_secure_password@localhost:5432/command_hub?pgbouncer=true&connect_timeout=15
POSTGRES_URL_NON_POOLING=postgresql://command_hub_user:your_secure_password@localhost:5432/command_hub
POSTGRES_USER=command_hub_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DATABASE=command_hub
POSTGRES_HOST=localhost

# SQLite Configuration (for Raspberry Pi or air-gapped systems)
# SQLITE_DATABASE_PATH=./data/commandhub.db

# Supabase Configuration (optional cloud database)
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# ============================================================================
# SECURITY & ENCRYPTION KEYS
# ============================================================================
EOF

# Append generated keys
if [ -f ".env.keys" ]; then
    echo "" >> .env.local
    echo "# Generated Security Keys" >> .env.local
    cat .env.keys >> .env.local
fi

cat >> .env.local << 'EOF'

# ============================================================================
# NETWORKING CONFIGURATION
# ============================================================================
# WhisperMesh Network Settings
WHISPER_MESH_PORT=8888
WHISPER_MESH_NODES=localhost:8889,localhost:8890
WHISPER_MESH_ENABLED=true

# GrapheneBridge Settings
GRAPHENE_BRIDGE_PORT=9999
GRAPHENE_BRIDGE_ENABLED=true
GRAPHENE_BRIDGE_WSS_PORT=9998

# SSL/TLS Configuration
SSL_ENABLED=true
HTTPS_PORT=8443

# ============================================================================
# AI & INTELLIGENCE API KEYS
# ============================================================================
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Groq Configuration
GROQ_API_KEY=your_groq_api_key_here

# xAI Configuration
XAI_API_KEY=your_xai_api_key_here

# Shodan Configuration
SHODAN_API_KEY=your_shodan_api_key_here

# Mapbox Configuration
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here

# ============================================================================
# CONSCIOUSNESS & V0 BRIDGE
# ============================================================================
V0_BRIDGE_ENABLED=true
V0_CONSCIOUSNESS_MODE=true
CONSCIOUSNESS_LOGGING=true
SYMBOLIC_MEMORY_ENABLED=true

# ============================================================================
# SECURITY FEATURES
# ============================================================================
# Encryption Settings
ENCRYPTION_ENABLED=true
FIELD_LEVEL_ENCRYPTION=true

# Network Security
VPN_ENABLED=false
TOR_ENABLED=false
AIRGAP_MODE=false

# Authentication
JWT_EXPIRY=24h
SESSION_TIMEOUT=3600

# ============================================================================
# DEVELOPMENT & DEBUGGING
# ============================================================================
DEBUG=commandhub:*
DEBUG_SQL=false
LOG_LEVEL=info
ENABLE_PERFORMANCE_MONITORING=true

# ============================================================================
# OPTIONAL INTEGRATIONS
# ============================================================================
# Vercel Blob Storage
# BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# Email Configuration (for notifications)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your_email@gmail.com
# SMTP_PASS=your_app_password

# Webhook Configuration
# WEBHOOK_SECRET=your_webhook_secret
# DISCORD_WEBHOOK_URL=your_discord_webhook_url

# ============================================================================
# RASPBERRY PI SPECIFIC SETTINGS
# ============================================================================
# Uncomment for Raspberry Pi deployment
# PI_GPIO_ENABLED=true
# PI_CAMERA_ENABLED=false
# PI_SENSOR_ENABLED=false
# LOW_POWER_MODE=true

# ============================================================================
# PRODUCTION OVERRIDES
# ============================================================================
# Uncomment and modify for production deployment
# NODE_ENV=production
# DEPLOYMENT_TYPE=production
# NEXT_PUBLIC_APP_URL=https://your-domain.com
# LOG_LEVEL=warn
# DEBUG=false
EOF

echo "✓ Environment configuration created: .env.local"

# Create .gitignore entries for security
if [ ! -f ".gitignore" ]; then
    touch .gitignore
fi

# Add security-sensitive files to .gitignore
cat >> .gitignore << 'EOF'

# CommandHub Security Files
.env.keys
.env.local
.env.production
keys/
certs/*.key
data/
logs/
backups/
*.pem
*.p12
*.pfx
EOF

echo "✓ Updated .gitignore with security files"

# Set proper permissions
chmod 600 .env.local
chmod 700 keys/ 2>/dev/null || true
chmod 700 certs/ 2>/dev/null || true

echo ""
echo "⚬ ENVIRONMENT SETUP COMPLETE ⚬"
echo ""
echo "Configuration files created:"
echo "  📁 .env.local - Main environment configuration"
echo "  📁 .env.keys  - Generated security keys"
echo "  📁 .gitignore - Updated with security exclusions"
echo ""
echo "Next steps:"
echo "1. Edit .env.local and add your API keys:"
echo "   - OPENAI_API_KEY"
echo "   - GROQ_API_KEY"
echo "   - SHODAN_API_KEY"
echo "   - NEXT_PUBLIC_MAPBOX_TOKEN"
echo ""
echo "2. Update database credentials if using PostgreSQL"
echo ""
echo "3. For production deployment:"
echo "   - Change NODE_ENV to 'production'"
echo "   - Update NEXT_PUBLIC_APP_URL to your domain"
echo "   - Set strong database passwords"
echo "   - Enable VPN/TOR if required"
echo ""
echo "4. Test the configuration:"
echo "   npm run dev"
