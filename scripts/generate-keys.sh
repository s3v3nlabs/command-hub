#!/bin/bash
# CommandHub Key Generation Script
# Generates encryption keys and SSL certificates for secure operation

set -e

echo "⚬ COMMANDHUB KEY GENERATION ⚬"
echo "Generating secure keys and certificates..."

# Create directories
mkdir -p certs
mkdir -p keys
mkdir -p config

# Generate WhisperMesh encryption key (32 bytes, base64 encoded)
echo "Generating WhisperMesh encryption key..."
WHISPER_KEY=$(openssl rand -base64 32)
echo "WHISPER_MESH_ENCRYPTION_KEY=$WHISPER_KEY" > keys/whisper-mesh.key
echo "✓ WhisperMesh key generated: keys/whisper-mesh.key"

# Generate GrapheneBridge encryption key (32 bytes, base64 encoded)
echo "Generating GrapheneBridge encryption key..."
GRAPHENE_KEY=$(openssl rand -base64 32)
echo "GRAPHENE_BRIDGE_KEY=$GRAPHENE_KEY" > keys/graphene-bridge.key
echo "✓ GrapheneBridge key generated: keys/graphene-bridge.key"

# Generate SSL certificate for GrapheneBridge
echo "Generating SSL certificate for GrapheneBridge..."
openssl req -x509 -newkey rsa:4096 -keyout certs/graphene-bridge.key -out certs/graphene-bridge.crt -days 365 -nodes -subj "/C=US/ST=Secure/L=Local/O=CommandHub/OU=GrapheneBridge/CN=localhost"

# Set proper permissions
chmod 600 keys/*.key
chmod 600 certs/*.key
chmod 644 certs/*.crt

echo "✓ SSL certificate generated: certs/graphene-bridge.crt"
echo "✓ SSL private key generated: certs/graphene-bridge.key"

# Generate database encryption key
echo "Generating database encryption key..."
DB_KEY=$(openssl rand -base64 32)
echo "DB_ENCRYPTION_KEY=$DB_KEY" > keys/database.key
chmod 600 keys/database.key
echo "✓ Database encryption key generated: keys/database.key"

# Generate JWT secret for authentication
echo "Generating JWT secret..."
JWT_SECRET=$(openssl rand -base64 64)
echo "JWT_SECRET=$JWT_SECRET" > keys/jwt.key
chmod 600 keys/jwt.key
echo "✓ JWT secret generated: keys/jwt.key"

# Generate API encryption key
echo "Generating API encryption key..."
API_KEY=$(openssl rand -base64 32)
echo "API_ENCRYPTION_KEY=$API_KEY" > keys/api.key
chmod 600 keys/api.key
echo "✓ API encryption key generated: keys/api.key"

# Create master environment file with all keys
echo "Creating master environment configuration..."
cat > .env.keys << EOF
# Generated Keys for CommandHub
# Generated on: $(date)
# Keep these keys secure and never commit to version control

# WhisperMesh Network Encryption
WHISPER_MESH_ENCRYPTION_KEY=$WHISPER_KEY

# GrapheneBridge Configuration
GRAPHENE_BRIDGE_KEY=$GRAPHENE_KEY
GRAPHENE_CERT_PATH=./certs/graphene-bridge.crt
GRAPHENE_KEY_PATH=./certs/graphene-bridge.key

# Database Encryption
DB_ENCRYPTION_KEY=$DB_KEY

# JWT Authentication
JWT_SECRET=$JWT_SECRET

# API Encryption
API_ENCRYPTION_KEY=$API_KEY

# SSL/TLS Configuration
SSL_CERT_PATH=./certs/graphene-bridge.crt
SSL_KEY_PATH=./certs/graphene-bridge.key
EOF

chmod 600 .env.keys

echo ""
echo "⚬ KEY GENERATION COMPLETE ⚬"
echo ""
echo "Generated files:"
echo "  📁 keys/whisper-mesh.key      - WhisperMesh encryption key"
echo "  📁 keys/graphene-bridge.key   - GrapheneBridge encryption key"
echo "  📁 keys/database.key          - Database encryption key"
echo "  📁 keys/jwt.key               - JWT authentication secret"
echo "  📁 keys/api.key               - API encryption key"
echo "  📁 certs/graphene-bridge.crt  - SSL certificate"
echo "  📁 certs/graphene-bridge.key  - SSL private key"
echo "  📁 .env.keys                  - Master environment file"
echo ""
echo "Next steps:"
echo "1. Copy values from .env.keys to your .env.local file"
echo "2. Or source the keys directly: source .env.keys"
echo "3. Never commit .env.keys or keys/ directory to version control"
echo ""
echo "⚬ SECURITY REMINDER ⚬"
echo "These keys provide access to encrypted data and secure communications."
echo "Store them securely and rotate them regularly in production."
