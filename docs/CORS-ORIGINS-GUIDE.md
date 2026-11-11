# CORS Origins Configuration Guide

## 🌐 Understanding ALLOWED_ORIGINS

The `ALLOWED_ORIGINS` environment variable controls which domains can make requests to your CommandHub API. This is a critical security feature that prevents unauthorized cross-origin requests.

## 🚀 Quick Setup

### 1. Automatic Configuration (Recommended)

\`\`\`bash
# Auto-detect and configure origins for your deployment
npm run configure:origins
\`\`\`

### 2. Manual Configuration

Edit your `.env.local` file:

\`\`\`bash
# Development (permissive)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://localhost:8443

# Production (restrictive)
ALLOWED_ORIGINS=https://your-domain.com,https://api.your-domain.com

# Multiple domains
ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com,https://mobile.example.com
\`\`\`

## 📋 Configuration Examples

### Local Development
\`\`\`bash
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,https://localhost:8443
\`\`\`

### WSL2 Development
\`\`\`bash
ALLOWED_ORIGINS=http://localhost:3000,http://172.20.10.2:3000,https://localhost:8443
\`\`\`

### Raspberry Pi Zero (Air-gapped)
\`\`\`bash
ALLOWED_ORIGINS=https://localhost:8443,https://raspberrypi.local:8443,https://192.168.1.100:8443
\`\`\`

### VM Production
\`\`\`bash
ALLOWED_ORIGINS=https://commandhub.local:8443,https://192.168.56.100:8443
\`\`\`

### Cloud Production
\`\`\`bash
ALLOWED_ORIGINS=https://your-domain.com,https://app.your-domain.com,https://admin.your-domain.com
\`\`\`

### Development Only (Permissive)
\`\`\`bash
# ⚠️ WARNING: Only use for development!
ALLOWED_ORIGINS=*
\`\`\`

## 🔧 Interactive Configuration

Run the interactive configuration script:

\`\`\`bash
npm run configure:origins
\`\`\`

This will:
1. **Auto-detect** your deployment type
2. **Scan network interfaces** for local IPs
3. **Generate appropriate origins** for your setup
4. **Validate** all origins for security
5. **Update** your `.env.local` file
6. **Create backup** of your configuration

### Configuration Options

1. **Auto-detect (Recommended)**
   - Automatically detects deployment type
   - Scans local network interfaces
   - Generates secure defaults

2. **Manual Configuration**
   - Enter origins manually
   - Full control over allowed domains
   - Validates format and security

3. **Production Hardening**
   - Restrictive configuration for production
   - HTTPS-only origins
   - No localhost or wildcards

4. **Development (Permissive)**
   - Allows all origins (*)
   - Only for development use
   - Not suitable for production

## 🛡️ Security Guidelines

### ✅ Secure Practices

- **Use HTTPS** in production: `https://your-domain.com`
- **Specify exact domains**: Avoid wildcards in production
- **Remove localhost** origins in production
- **Use subdomains** for different services: `https://api.your-domain.com`
- **Regular review** of allowed origins

### ❌ Avoid These

- **Wildcard in production**: `ALLOWED_ORIGINS=*`
- **HTTP in production**: `http://your-domain.com`
- **Localhost in production**: `http://localhost:3000`
- **Overly permissive**: Too many unnecessary origins

## 🔍 Validation and Testing

### Validate Configuration
\`\`\`bash
# Check environment configuration
npm run validate:env

# Check origins specifically
npm run validate:origins
\`\`\`

### Test CORS in Browser
\`\`\`javascript
// Test from browser console
fetch('https://your-commandhub.com/api/status', {
  method: 'GET',
  credentials: 'include'
})
.then(response => console.log('CORS working:', response.status))
.catch(error => console.error('CORS error:', error))
\`\`\`

### Common CORS Errors

1. **"Access to fetch at ... has been blocked by CORS policy"**
   - Add your domain to ALLOWED_ORIGINS
   - Check protocol (HTTP vs HTTPS)
   - Verify exact domain match

2. **"Credentials include but Access-Control-Allow-Credentials is false"**
   - CORS credentials are enabled by default
   - Check if origin is in allowed list

3. **"Method ... is not allowed by Access-Control-Allow-Methods"**
   - All standard methods are allowed
   - Check if using custom HTTP methods

## 🌍 Deployment-Specific Configurations

### Raspberry Pi Zero
\`\`\`bash
# Air-gapped configuration
ALLOWED_ORIGINS=https://localhost:8443,https://raspberrypi.local:8443

# With local network access
ALLOWED_ORIGINS=https://localhost:8443,https://192.168.1.100:8443,https://commandhub.local:8443
\`\`\`

### Docker Deployment
\`\`\`bash
# Container-to-container communication
ALLOWED_ORIGINS=https://commandhub:8443,https://commandhub.docker.internal:8443

# External access
ALLOWED_ORIGINS=https://localhost:8443,https://your-domain.com:8443
\`\`\`

### Cloud Deployment
\`\`\`bash
# Production cloud setup
ALLOWED_ORIGINS=https://your-domain.com,https://app.your-domain.com,https://admin.your-domain.com

# With CDN
ALLOWED_ORIGINS=https://your-domain.com,https://cdn.your-domain.com,https://static.your-domain.com
\`\`\`

## 🔄 Dynamic Origin Management

### Add Origin at Runtime
\`\`\`typescript
import { corsManager } from '@/lib/security/cors-manager'

// Add new origin
corsManager.addOrigin('https://new-domain.com')

// Remove origin
corsManager.removeOrigin('https://old-domain.com')

// Check if origin is allowed
const isAllowed = corsManager.isOriginAllowed('https://test-domain.com')
\`\`\`

### Environment-Based Configuration
\`\`\`typescript
// Different origins for different environments
const origins = {
  development: ['http://localhost:3000', '*'],
  staging: ['https://staging.your-domain.com'],
  production: ['https://your-domain.com', 'https://app.your-domain.com']
}

const allowedOrigins = origins[process.env.NODE_ENV] || origins.development
\`\`\`

## 📊 Monitoring and Logging

### CORS Request Logging
\`\`\`typescript
// Enable CORS logging in development
DEBUG=cors:* npm run dev

// Check CORS configuration
corsManager.logConfiguration()
\`\`\`

### Security Monitoring
\`\`\`bash
# Monitor CORS errors in logs
tail -f logs/security.log | grep CORS

# Check blocked requests
grep "CORS blocked" logs/access.log
\`\`\`

## 🚨 Troubleshooting

### Common Issues

1. **Origins not working after update**
   \`\`\`bash
   # Restart the application
   npm run dev
   
   # Clear browser cache
   # Check browser developer tools
   \`\`\`

2. **Localhost not accessible from network**
   \`\`\`bash
   # Add your local IP to origins
   ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.100:3000
   \`\`\`

3. **Mobile device can't connect**
   \`\`\`bash
   # Add mobile network IP
   ALLOWED_ORIGINS=https://localhost:8443,https://192.168.1.100:8443
   \`\`\`

4. **Docker container issues**
   \`\`\`bash
   # Use container networking
   ALLOWED_ORIGINS=https://commandhub:8443,https://host.docker.internal:8443
   \`\`\`

### Debug Commands

\`\`\`bash
# Check current configuration
node -e "console.log(process.env.ALLOWED_ORIGINS)"

# Validate origins format
npm run validate:origins

# Test network connectivity
curl -H "Origin: https://your-domain.com" https://localhost:8443/api/status
\`\`\`

## 📚 Advanced Configuration

### Subdomain Wildcards
\`\`\`bash
# Allow all subdomains (use carefully)
ALLOWED_ORIGINS=https://*.your-domain.com

# Specific subdomains (recommended)
ALLOWED_ORIGINS=https://app.your-domain.com,https://api.your-domain.com,https://admin.your-domain.com
\`\`\`

### Port-Specific Origins
\`\`\`bash
# Different ports for different services
ALLOWED_ORIGINS=https://your-domain.com:8443,https://your-domain.com:9443,https://your-domain.com:3000
\`\`\`

### Protocol-Specific Configuration
\`\`\`bash
# Development: HTTP allowed
ALLOWED_ORIGINS=http://localhost:3000,https://localhost:8443

# Production: HTTPS only
ALLOWED_ORIGINS=https://your-domain.com,https://api.your-domain.com
\`\`\`

## 🔐 Security Best Practices

1. **Principle of Least Privilege**
   - Only allow necessary origins
   - Remove unused origins regularly
   - Use specific domains, not wildcards

2. **Environment Separation**
   - Different origins for dev/staging/prod
   - Never use development origins in production
   - Validate origins in CI/CD pipeline

3. **Regular Auditing**
   - Review origins monthly
   - Monitor CORS errors
   - Update origins when services change

4. **Documentation**
   - Document why each origin is needed
   - Keep configuration history
   - Share knowledge with team

Your CORS origins are now properly configured for secure cross-origin communication! 🌐⚬
