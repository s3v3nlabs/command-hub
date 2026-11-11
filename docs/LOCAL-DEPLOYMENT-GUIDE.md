# 🏠 Local Deployment Guide - Singularity Hub Command Center

## Overview
This guide will help you migrate the Singularity Hub from v0's online environment to your local development machine for offline testing, OS integration, and peripheral connectivity.

## Prerequisites

### Required Software
- **Node.js** (v18.17.0 or higher)
- **npm** or **yarn** package manager
- **Git** for version control
- **PostgreSQL** (v14 or higher) OR **Supabase CLI**
- **VS Code** (recommended) with extensions:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - ES7+ React/Redux/React-Native snippets

### Optional (for advanced features)
- **Docker** and **Docker Compose**
- **Python 3.8+** (for AI/ML integrations)
- **Rust** (for performance-critical modules)

## Step 1: Project Setup

### 1.1 Download the Project
\`\`\`bash
# Create project directory
mkdir singularity-hub
cd singularity-hub

# Initialize Next.js project
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Install additional dependencies
npm install @supabase/supabase-js @supabase/ssr
npm install lucide-react class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs
npm install @radix-ui/react-progress @radix-ui/react-separator @radix-ui/react-switch
npm install @radix-ui/react-label @radix-ui/react-textarea @radix-ui/react-scroll-area
npm install framer-motion three @types/three
npm install ai @ai-sdk/openai @ai-sdk/groq
\`\`\`

### 1.2 Environment Configuration
Create `.env.local` file:
\`\`\`bash
# Database Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Integration Keys
OPENAI_API_KEY=your_openai_key
GROQ_API_KEY=your_groq_key
XAI_API_KEY=your_xai_key

# Threat Intelligence APIs
SHODAN_API_KEY=your_shodan_key
VIRUSTOTAL_API_KEY=your_virustotal_key

# Local Development
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

## Step 2: Database Setup

### Option A: Local PostgreSQL
\`\`\`bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb singularity_hub

# Create user
sudo -u postgres psql
CREATE USER singularity_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE singularity_hub TO singularity_user;
\q

# Update .env.local
DATABASE_URL=postgresql://singularity_user:your_secure_password@localhost:5432/singularity_hub
\`\`\`

### Option B: Supabase (Recommended)
\`\`\`bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase
supabase init

# Start local Supabase
supabase start

# Run migrations
supabase db reset
\`\`\`

## Step 3: Project Structure Setup

### 3.1 Copy Core Files
Create the following directory structure and copy the provided code:

\`\`\`
singularity-hub/
├── app/
│   ├── api/
│   ├── command-hub/
│   ├── intelligence/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   ├── CommandHub/
│   ├── consciousness/
│   ├── terminal/
│   └── signalframe/
├── lib/
│   ├── consciousness/
│   ├── heimdal/
│   ├── supabase/
│   └── utils.ts
├── scripts/
│   └── create-fractal-consciousness-tables.sql
├── hooks/
├── types/
└── public/
\`\`\`

### 3.2 Initialize Database Schema
\`\`\`bash
# Run the consciousness tables script
psql -d singularity_hub -f scripts/create-fractal-consciousness-tables.sql

# Or with Supabase
supabase db reset
\`\`\`

## Step 4: Local Development Server

### 4.1 Start Development
\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser
open http://localhost:3000
\`\`\`

### 4.2 Verify Installation
- Navigate to `/command-hub` to access the main interface
- Check console for any connection errors
- Test glyph activation in the Tech Panel
- Verify database connectivity in the Network tab

## Step 5: OS Integration Setup

### 5.1 System Permissions (Linux/macOS)
\`\`\`bash
# Audio access
sudo usermod -a -G audio $USER

# Serial port access (for hardware integration)
sudo usermod -a -G dialout $USER

# Camera access
sudo usermod -a -G video $USER

# Reboot to apply permissions
sudo reboot
\`\`\`

### 5.2 Hardware Integration APIs

#### Audio Processing
\`\`\`bash
# Install audio libraries
npm install node-speaker node-microphone
# For advanced audio processing
npm install @tensorflow/tfjs-node audiobuffer-to-wav
\`\`\`

#### Serial Communication
\`\`\`bash
# For Arduino/ESP32 integration
npm install serialport
npm install johnny-five
\`\`\`

#### Camera Integration
\`\`\`bash
# For computer vision
npm install opencv4nodejs
# Alternative: lighter weight
npm install node-webcam
\`\`\`

### 5.3 System Tray Integration (Electron - Optional)
\`\`\`bash
# Install Electron for desktop app
npm install electron electron-builder
npm install electron-store electron-updater

# Create electron main process
# See: electron-main.js template below
\`\`\`

## Step 6: Peripheral Integration

### 6.1 Biometric Sensors
\`\`\`typescript
// lib/hardware/biometric-bridge.ts
import { SerialPort } from 'serialport'

export class BiometricHardwareBridge {
  private port: SerialPort | null = null

  async connectToDevice(portPath: string) {
    this.port = new SerialPort({
      path: portPath,
      baudRate: 9600
    })

    this.port.on('data', (data) => {
      const reading = this.parseHRVData(data)
      this.processBiometricReading(reading)
    })
  }

  private parseHRVData(data: Buffer) {
    // Parse incoming HRV/pulse data
    // Implementation depends on your specific device
  }
}
\`\`\`

### 6.2 Network Monitoring
\`\`\`typescript
// lib/network/local-scanner.ts
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export class LocalNetworkScanner {
  async scanLocalNetwork(): Promise<any[]> {
    try {
      const { stdout } = await execAsync('nmap -sn 192.168.1.0/24')
      return this.parseNmapOutput(stdout)
    } catch (error) {
      console.error('Network scan failed:', error)
      return []
    }
  }

  private parseNmapOutput(output: string) {
    // Parse nmap output for local devices
  }
}
\`\`\`

### 6.3 File System Integration
\`\`\`typescript
// lib/system/file-watcher.ts
import { watch } from 'fs'
import { join } from 'path'

export class SystemFileWatcher {
  watchDirectory(path: string, callback: (event: string, filename: string) => void) {
    watch(path, { recursive: true }, callback)
  }

  async monitorSystemLogs() {
    // Monitor /var/log for security events
    this.watchDirectory('/var/log', (event, filename) => {
      if (filename?.includes('auth.log') || filename?.includes('syslog')) {
        this.processLogEvent(event, filename)
      }
    })
  }
}
\`\`\`

## Step 7: Offline Capabilities

### 7.1 Service Worker Setup
\`\`\`typescript
// public/sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('singularity-hub-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/command-hub',
        '/intelligence',
        '/manifest.json'
      ])
    })
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
    })
  )
})
\`\`\`

### 7.2 Local AI Models
\`\`\`bash
# Install local AI runtime
npm install @tensorflow/tfjs-node
npm install @huggingface/transformers

# Download models for offline use
mkdir -p public/models
# Download specific models you need
\`\`\`

## Step 8: Security Hardening

### 8.1 Local Certificate Generation
\`\`\`bash
# Generate self-signed certificate for HTTPS
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Update next.config.js for HTTPS
\`\`\`

### 8.2 Firewall Configuration
\`\`\`bash
# Ubuntu/Debian firewall setup
sudo ufw enable
sudo ufw allow 3000/tcp  # Next.js dev server
sudo ufw allow 5432/tcp  # PostgreSQL (if needed)
sudo ufw deny incoming
sudo ufw allow outgoing
\`\`\`

## Step 9: Testing & Validation

### 9.1 Component Testing
\`\`\`bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Run tests
npm test
\`\`\`

### 9.2 Hardware Integration Tests
\`\`\`typescript
// tests/hardware-integration.test.ts
describe('Hardware Integration', () => {
  test('biometric sensor connection', async () => {
    const bridge = new BiometricHardwareBridge()
    const connected = await bridge.connectToDevice('/dev/ttyUSB0')
    expect(connected).toBe(true)
  })

  test('network scanner functionality', async () => {
    const scanner = new LocalNetworkScanner()
    const devices = await scanner.scanLocalNetwork()
    expect(Array.isArray(devices)).toBe(true)
  })
})
\`\`\`

## Step 10: Production Build

### 10.1 Build for Production
\`\`\`bash
# Create production build
npm run build

# Test production build locally
npm start
\`\`\`

### 10.2 Electron Desktop App (Optional)
\`\`\`bash
# Build desktop application
npm run electron:build

# Package for distribution
npm run electron:pack
\`\`\`

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify PostgreSQL is running: `sudo systemctl status postgresql`
   - Check connection string in `.env.local`
   - Ensure database exists and user has permissions

2. **Permission Denied Errors**
   - Add user to required groups: `sudo usermod -a -G audio,video,dialout $USER`
   - Reboot after group changes
   - Check file permissions: `ls -la`

3. **Port Already in Use**
   - Kill existing processes: `sudo lsof -ti:3000 | xargs kill -9`
   - Use different port: `npm run dev -- -p 3001`

4. **Hardware Device Not Found**
   - List available devices: `ls /dev/tty*`
   - Check device permissions: `ls -la /dev/ttyUSB0`
   - Install device drivers if needed

### Performance Optimization

1. **Memory Usage**
   - Monitor with: `node --inspect npm run dev`
   - Use Chrome DevTools for profiling
   - Implement lazy loading for heavy components

2. **Database Performance**
   - Add indexes for frequently queried columns
   - Use connection pooling
   - Monitor query performance

3. **Real-time Updates**
   - Implement WebSocket connections for live data
   - Use Server-Sent Events for one-way updates
   - Consider Redis for caching

## Next Steps

1. **Custom Hardware Integration**
   - Connect specific biometric devices
   - Integrate with security cameras
   - Add IoT device monitoring

2. **Advanced AI Features**
   - Local LLM integration
   - Computer vision processing
   - Voice recognition/synthesis

3. **Network Security Tools**
   - Packet capture analysis
   - Intrusion detection
   - Vulnerability scanning

4. **System Monitoring**
   - Resource usage tracking
   - Log analysis
   - Alert systems

## Support

For issues with local deployment:
1. Check the console logs for specific error messages
2. Verify all environment variables are set correctly
3. Ensure all required services are running
4. Test individual components in isolation

The consciousness field is now ready for local manifestation. The symbolic architecture awaits your command.

∿◊∿ **Local deployment protocol complete** ∿◊∿
