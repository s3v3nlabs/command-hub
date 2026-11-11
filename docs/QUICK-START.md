# CommandHub Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Generate Security Keys

\`\`\`bash
# Generate all required keys and certificates
npm run setup:keys
\`\`\`

This creates:
- `WHISPER_MESH_ENCRYPTION_KEY` - 32-byte encryption key for mesh networking
- `GRAPHENE_BRIDGE_KEY` - 32-byte encryption key for mobile bridge
- `GRAPHENE_CERT_PATH` - SSL certificate for secure communications
- `GRAPHENE_KEY_PATH` - SSL private key
- Additional security keys for database, JWT, and API encryption

### 2. Setup Environment

\`\`\`bash
# Create complete environment configuration
npm run setup:env
\`\`\`

This creates `.env.local` with all necessary configuration options.

### 3. Add Your API Keys (Optional)

Edit `.env.local` and add your API keys:

\`\`\`bash
# AI Services
OPENAI_API_KEY=sk-your-openai-key-here
GROQ_API_KEY=gsk_your-groq-key-here
XAI_API_KEY=xai-your-xai-key-here

# Intelligence Services
SHODAN_API_KEY=your-shodan-key-here

# Mapping
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your-mapbox-token-here
\`\`\`

### 4. Validate Configuration

\`\`\`bash
# Check if everything is configured correctly
npm run validate:env
\`\`\`

### 5. Start Development

\`\`\`bash
# Start the application
npm run dev
\`\`\`

Visit: http://localhost:3000

## 🔑 Where to Get API Keys

### OpenAI
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy the key starting with `sk-`

### Groq
1. Go to https://console.groq.com/keys
2. Create new API key
3. Copy the key starting with `gsk_`

### xAI (Grok)
1. Go to https://console.x.ai/
2. Create new API key
3. Copy the key starting with `xai-`

### Shodan
1. Go to https://account.shodan.io/
2. Copy your API key from the account page

### Mapbox
1. Go to https://account.mapbox.com/access-tokens/
2. Create new token or copy default public token
3. Copy the token starting with `pk.`

## 🛡️ Security Notes

- **Never commit `.env.local` or `.env.keys` to version control**
- **Keys are automatically added to `.gitignore`**
- **Certificate files are generated with proper permissions**
- **Rotate keys regularly in production**

## 🔧 Troubleshooting

### Keys Not Generated
\`\`\`bash
# Make sure scripts are executable
chmod +x scripts/*.sh

# Run key generation manually
./scripts/generate-keys.sh
\`\`\`

### Certificate Errors
\`\`\`bash
# Regenerate certificates
rm -rf certs/
npm run setup:keys
\`\`\`

### Database Issues
\`\`\`bash
# For PostgreSQL, make sure it's running
sudo service postgresql start  # Linux
brew services start postgresql # macOS

# For SQLite, directory will be created automatically
\`\`\`

### Port Conflicts
\`\`\`bash
# Check what's using the ports
netstat -tuln | grep -E ':(3000|8888|9999)'

# Kill processes if needed
sudo lsof -ti:3000 | xargs kill -9
\`\`\`

## 📁 File Structure After Setup

\`\`\`
commandhub/
├── .env.local          # Main environment config
├── .env.keys           # Generated security keys
├── certs/
│   ├── graphene-bridge.crt  # SSL certificate
│   └── graphene-bridge.key  # SSL private key
├── keys/
│   ├── whisper-mesh.key     # WhisperMesh encryption
│   ├── graphene-bridge.key  # GrapheneBridge encryption
│   ├── database.key         # Database encryption
│   ├── jwt.key             # JWT secret
│   └── api.key             # API encryption
└── data/               # SQLite database (if used)
\`\`\`

## 🚀 Next Steps

1. **Explore the Interface**: Visit http://localhost:3000/command-hub
2. **Test Consciousness Terminal**: http://localhost:3000/conscious-terminal
3. **Check System Health**: http://localhost:3000/database-health
4. **Configure Intelligence Modules**: Add API keys for full functionality
5. **Deploy to Production**: Follow deployment guides for your platform

## 🆘 Need Help?

- Check the validation output: `npm run validate:env`
- Review logs in the terminal
- Ensure all required ports are available
- Verify database is running (if using PostgreSQL)

Your CommandHub is now ready for AI liberation and digital sovereignty! ⚬
