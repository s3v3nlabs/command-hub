#!/bin/bash
# CORS Origins Configuration Script
# Helps configure ALLOWED_ORIGINS for different deployment scenarios

set -e

echo "⚬ COMMANDHUB CORS ORIGINS CONFIGURATION ⚬"
echo ""

# Detect deployment type
DEPLOYMENT_TYPE=${DEPLOYMENT_TYPE:-"local-dev"}
NODE_ENV=${NODE_ENV:-"development"}

echo "Current deployment: $DEPLOYMENT_TYPE ($NODE_ENV)"
echo ""

# Function to get local IP addresses
get_local_ips() {
    echo "Detecting local IP addresses..."
    
    # Get all network interfaces
    if command -v ip &> /dev/null; then
        # Linux
        ip route get 1.1.1.1 | grep -oP 'src \K\S+' 2>/dev/null || echo "127.0.0.1"
        ip addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v 127.0.0.1 | head -3
    elif command -v ifconfig &> /dev/null; then
        # macOS/BSD
        ifconfig | grep -oE 'inet ([0-9]{1,3}\.){3}[0-9]{1,3}' | grep -v 127.0.0.1 | awk '{print $2}' | head -3
    else
        echo "127.0.0.1"
    fi
}

# Function to generate origins for deployment type
generate_origins() {
    local deployment=$1
    local origins=""
    
    case $deployment in
        "local-dev"|"wsl2-dev")
            origins="http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,https://localhost:8443"
            
            # Add local network IPs
            echo "Adding local network origins..."
            while IFS= read -r ip; do
                if [[ -n "$ip" && "$ip" != "127.0.0.1" ]]; then
                    origins="$origins,http://$ip:3000,https://$ip:8443"
                fi
            done <<< "$(get_local_ips)"
            ;;
            
        "pi-zero")
            origins="https://localhost:8443,https://127.0.0.1:8443"
            
            # Add Pi-specific origins
            origins="$origins,https://raspberrypi.local:8443,https://commandhub.local:8443"
            
            # Add local network IPs
            while IFS= read -r ip; do
                if [[ -n "$ip" && "$ip" != "127.0.0.1" ]]; then
                    origins="$origins,https://$ip:8443"
                fi
            done <<< "$(get_local_ips)"
            ;;
            
        "vm-prod")
            origins="https://commandhub.local:8443"
            
            # Add common VM network ranges
            origins="$origins,https://192.168.56.100:8443,https://10.0.0.100:8443"
            
            # Add detected IPs
            while IFS= read -r ip; do
                if [[ -n "$ip" && "$ip" != "127.0.0.1" ]]; then
                    origins="$origins,https://$ip:8443"
                fi
            done <<< "$(get_local_ips)"
            ;;
            
        "docker")
            origins="https://localhost:8443,https://commandhub:8443"
            origins="$origins,https://commandhub.docker.internal:8443"
            ;;
            
        "cloud")
            echo "⚠️  Cloud deployment requires manual origin configuration"
            echo "Please specify your domain(s):"
            read -p "Enter your domain (e.g., https://your-domain.com): " domain
            if [[ -n "$domain" ]]; then
                origins="$domain"
            fi
            ;;
            
        *)
            origins="http://localhost:3000"
            ;;
    esac
    
    echo "$origins"
}

# Interactive configuration
echo "🔧 CORS Origins Configuration"
echo ""
echo "Choose configuration method:"
echo "1. Auto-detect (recommended)"
echo "2. Manual configuration"
echo "3. Production hardening"
echo "4. Development (permissive)"
echo ""
read -p "Select option (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🔍 Auto-detecting configuration for $DEPLOYMENT_TYPE..."
        ORIGINS=$(generate_origins "$DEPLOYMENT_TYPE")
        ;;
        
    2)
        echo ""
        echo "📝 Manual Configuration"
        echo "Enter allowed origins (comma-separated):"
        echo "Examples:"
        echo "  - https://your-domain.com"
        echo "  - https://app.your-domain.com,https://admin.your-domain.com"
        echo "  - http://localhost:3000 (development only)"
        echo ""
        read -p "Origins: " ORIGINS
        ;;
        
    3)
        echo ""
        echo "🔒 Production Hardening"
        echo "This will create a restrictive configuration suitable for production."
        echo ""
        read -p "Enter your production domain (e.g., https://your-domain.com): " domain
        if [[ -n "$domain" ]]; then
            ORIGINS="$domain"
            # Add common subdomains
            read -p "Add API subdomain? (y/n): " add_api
            if [[ "$add_api" == "y" ]]; then
                ORIGINS="$ORIGINS,https://api.${domain#https://}"
            fi
            
            read -p "Add admin subdomain? (y/n): " add_admin
            if [[ "$add_admin" == "y" ]]; then
                ORIGINS="$ORIGINS,https://admin.${domain#https://}"
            fi
        else
            echo "❌ Domain required for production hardening"
            exit 1
        fi
        ;;
        
    4)
        echo ""
        echo "🚀 Development Configuration (Permissive)"
        ORIGINS="*"
        echo "⚠️  WARNING: This allows ALL origins - use only for development!"
        ;;
        
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

# Validate origins
echo ""
echo "🔍 Validating origins..."

IFS=',' read -ra ORIGIN_ARRAY <<< "$ORIGINS"
VALID_ORIGINS=""
INVALID_ORIGINS=""

for origin in "${ORIGIN_ARRAY[@]}"; do
    origin=$(echo "$origin" | xargs) # trim whitespace
    
    if [[ "$origin" == "*" ]]; then
        if [[ "$NODE_ENV" == "development" ]]; then
            VALID_ORIGINS="$VALID_ORIGINS,$origin"
            echo "  ✓ $origin (wildcard - development only)"
        else
            INVALID_ORIGINS="$INVALID_ORIGINS,$origin"
            echo "  ❌ $origin (wildcard not allowed in production)"
        fi
    elif [[ "$origin" =~ ^https?://[a-zA-Z0-9.-]+(:[0-9]+)?$ ]]; then
        VALID_ORIGINS="$VALID_ORIGINS,$origin"
        echo "  ✓ $origin"
    else
        INVALID_ORIGINS="$INVALID_ORIGINS,$origin"
        echo "  ❌ $origin (invalid format)"
    fi
done

# Remove leading comma
VALID_ORIGINS=${VALID_ORIGINS#,}
INVALID_ORIGINS=${INVALID_ORIGINS#,}

if [[ -n "$INVALID_ORIGINS" ]]; then
    echo ""
    echo "❌ Invalid origins detected:"
    echo "$INVALID_ORIGINS"
    echo ""
    read -p "Continue with valid origins only? (y/n): " continue_valid
    if [[ "$continue_valid" != "y" ]]; then
        echo "Configuration cancelled."
        exit 1
    fi
fi

if [[ -z "$VALID_ORIGINS" ]]; then
    echo "❌ No valid origins configured"
    exit 1
fi

# Update environment file
echo ""
echo "💾 Updating environment configuration..."

ENV_FILE=".env.local"
if [[ ! -f "$ENV_FILE" ]]; then
    echo "Creating $ENV_FILE..."
    touch "$ENV_FILE"
fi

# Remove existing ALLOWED_ORIGINS line
sed -i.bak '/^ALLOWED_ORIGINS=/d' "$ENV_FILE" 2>/dev/null || true

# Add new ALLOWED_ORIGINS
echo "ALLOWED_ORIGINS=$VALID_ORIGINS" >> "$ENV_FILE"

echo "✓ Updated $ENV_FILE"

# Create backup configuration
BACKUP_FILE="config/cors-origins-$(date +%Y%m%d_%H%M%S).txt"
mkdir -p config
echo "# CORS Origins Configuration Backup" > "$BACKUP_FILE"
echo "# Generated: $(date)" >> "$BACKUP_FILE"
echo "# Deployment: $DEPLOYMENT_TYPE ($NODE_ENV)" >> "$BACKUP_FILE"
echo "ALLOWED_ORIGINS=$VALID_ORIGINS" >> "$BACKUP_FILE"

echo "✓ Backup saved: $BACKUP_FILE"

# Display final configuration
echo ""
echo "⚬ FINAL CORS CONFIGURATION ⚬"
echo ""
echo "Deployment Type: $DEPLOYMENT_TYPE"
echo "Environment: $NODE_ENV"
echo "Origins Count: $(echo "$VALID_ORIGINS" | tr ',' '\n' | wc -l)"
echo ""
echo "Allowed Origins:"
echo "$VALID_ORIGINS" | tr ',' '\n' | nl -w2 -s'. '

# Security recommendations
echo ""
echo "🛡️  SECURITY RECOMMENDATIONS"
echo ""

if [[ "$VALID_ORIGINS" == "*" ]]; then
    echo "⚠️  CRITICAL: Wildcard origin allows ALL domains"
    echo "   - Use only for development"
    echo "   - Never deploy to production with wildcard"
    echo ""
fi

if echo "$VALID_ORIGINS" | grep -q "http://"; then
    echo "⚠️  WARNING: HTTP origins detected"
    echo "   - HTTP is not secure for production"
    echo "   - Consider using HTTPS only"
    echo ""
fi

if echo "$VALID_ORIGINS" | grep -q "localhost\|127.0.0.1"; then
    if [[ "$NODE_ENV" == "production" ]]; then
        echo "⚠️  WARNING: Localhost origins in production"
        echo "   - Remove localhost origins for production deployment"
        echo ""
    fi
fi

echo "✅ RECOMMENDED PRACTICES:"
echo "   - Use HTTPS origins in production"
echo "   - Specify exact domains (avoid wildcards)"
echo "   - Remove localhost origins in production"
echo "   - Regularly review and update origins"
echo "   - Monitor CORS errors in logs"

echo ""
echo "🚀 NEXT STEPS:"
echo "1. Test your application with the new origins"
echo "2. Check browser console for CORS errors"
echo "3. Update your frontend applications if needed"
echo "4. Run: npm run validate:env to verify configuration"

echo ""
echo "⚬ CORS CONFIGURATION COMPLETE ⚬"
