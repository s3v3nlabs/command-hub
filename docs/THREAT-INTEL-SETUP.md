# Threat Intelligence API Setup Guide

## 🚀 Quick Start (5 minutes)

### Phase 1: Free APIs (Recommended Start)

#### 1. AlienVault OTX (FREE & UNLIMITED) ⭐
- **URL**: [otx.alienvault.com](https://otx.alienvault.com)
- **Steps**:
  1. Click "Create Account"
  2. Verify email address
  3. Go to Settings → API Integration
  4. Copy your API key
- **Add to `.env.local`**: `OTX_API_KEY=your_key_here`
- **Why**: Best free source, unlimited requests, threat pulses, passive DNS

#### 2. VirusTotal (FREE 500/day) ⭐
- **URL**: [virustotal.com](https://www.virustotal.com)
- **Steps**:
  1. Click "Join our community"
  2. Create account and verify email
  3. Go to Profile → API Key
  4. Copy your API key
- **Add to `.env.local`**: `VIRUSTOTAL_API_KEY=your_key_here`
- **Why**: Industry standard, file/URL analysis, malware detection

#### 3. AbuseIPDB (FREE 1000/day)
- **URL**: [abuseipdb.com](https://www.abuseipdb.com)
- **Steps**:
  1. Create account
  2. Go to Account → API
  3. Generate API key
- **Add to `.env.local`**: `ABUSEIPDB_API_KEY=your_key_here`
- **Why**: IP reputation, abuse reports, geolocation data

### Phase 2: Enhanced Intelligence (Optional)

#### 4. GreyNoise (FREE 50/day)
- **URL**: [greynoise.io](https://www.greynoise.io)
- **Steps**:
  1. Sign up for Community account
  2. Go to Account → API Key
  3. Copy community API key
- **Add to `.env.local`**: `GREYNOISE_API_KEY=your_key_here`
- **Why**: Unique scanner detection, noise classification

#### 5. Censys (FREE 250 searches/month)
- **URL**: [search.censys.io](https://search.censys.io)
- **Steps**:
  1. Create account
  2. Go to Account → API
  3. Copy API ID and Secret
- **Add to `.env.local`**: 
  \`\`\`
  CENSYS_API_ID=your_api_id_here
  CENSYS_API_SECRET=your_api_secret_here
  \`\`\`
- **Why**: Internet-wide scanning, certificate analysis, service detection

#### 6. ThreatCrowd (FREE & NO API KEY)
- **Status**: Works immediately
- **Why**: Crowdsourced threat intelligence, no registration needed

## 🔧 Environment Variables Setup

Create or update your `.env.local` file:

\`\`\`bash
# Phase 1 - Essential (FREE)
OTX_API_KEY=your_otx_key_here
VIRUSTOTAL_API_KEY=your_vt_key_here
ABUSEIPDB_API_KEY=your_abuse_key_here

# Phase 2 - Enhanced (FREE with limits)
GREYNOISE_API_KEY=your_grey_key_here
CENSYS_API_ID=your_censys_id_here
CENSYS_API_SECRET=your_censys_secret_here

# ThreatCrowd - No API key needed
\`\`\`

## 📊 API Capabilities & Limits

| Service | Free Limit | Best For | Key Features |
|---------|------------|----------|--------------|
| **OTX** | Unlimited | Everything | Threat pulses, IOCs, passive DNS, malware analysis |
| **VirusTotal** | 500/day | Malware detection | File/URL scanning, IP/domain reputation |
| **AbuseIPDB** | 1000/day | IP reputation | Abuse reports, blacklists, geolocation |
| **GreyNoise** | 50/day | Scanner detection | Malicious scanners, CVE exploitation |
| **Censys** | 250/month | Reconnaissance | Port scans, certificates, service detection |
| **ThreatCrowd** | Unlimited | Bulk lookups | Crowdsourced intel, domain/IP analysis |

## 🎯 Testing Your Setup

1. **Start with zero API keys** - the system works with mock data
2. **Go to** `/intelligence/threat-intel`
3. **Test with**: `8.8.8.8` (Google DNS) or `google.com`
4. **Add API keys one by one** and see the data improve

## 💡 Pro Tips

### Recommended Priority Order:
1. **OTX + VirusTotal** = 90% of functionality
2. **Add AbuseIPDB** = IP reputation coverage
3. **Add GreyNoise** = Scanner detection
4. **Add Censys** = Network reconnaissance
5. **ThreatCrowd** = Always works (no key needed)

### Cost-Effective Strategy:
- **Free Tier**: OTX + VirusTotal + AbuseIPDB = Excellent coverage
- **Budget Option**: Add GreyNoise for $20/month (10,000 requests)
- **Professional**: Add Censys Pro for advanced reconnaissance

### API Key Security:
- Never commit API keys to version control
- Use `.env.local` for local development
- Use Vercel environment variables for production
- Rotate keys regularly

## 🔍 What Each Service Provides

### VirusTotal
- **File Analysis**: Upload files for malware detection
- **URL Scanning**: Check URLs for malicious content
- **IP/Domain Reputation**: Historical analysis data
- **Community Comments**: User-submitted intelligence

### AbuseIPDB
- **IP Reputation Scoring**: 0-100% abuse confidence
- **Abuse Reports**: Community-submitted reports
- **Geolocation**: Country, ISP, usage type
- **Historical Data**: 90-day lookback period

### GreyNoise
- **Scanner Classification**: Benign vs malicious
- **RIOT Data**: Trusted internet services
- **CVE Exploitation**: Active exploit detection
- **Noise Filtering**: Separate signal from noise

### AlienVault OTX
- **Threat Pulses**: Real-time threat intelligence
- **IOC Data**: Indicators of compromise
- **Passive DNS**: Historical DNS resolutions
- **Malware Analysis**: Detailed malware reports

### Censys
- **Internet Scanning**: Global port and service scans
- **Certificate Analysis**: SSL/TLS certificate data
- **Service Detection**: Identify running services
- **ASN Intelligence**: Network ownership data

### ThreatCrowd
- **Domain Analysis**: DNS resolutions, subdomains
- **IP Analysis**: Associated domains and services
- **Malware Hashes**: File hash associations
- **Reference Links**: External threat reports

## 🚨 Rate Limiting & Best Practices

### Respect Rate Limits:
- **VirusTotal**: 4 requests/minute (free tier)
- **AbuseIPDB**: 1000 requests/day
- **GreyNoise**: 50 requests/day (community)
- **OTX**: No official limit (be reasonable)
- **Censys**: 250 searches/month

### Optimization Tips:
- Cache results to avoid duplicate requests
- Batch requests when possible
- Use mock data for development/testing
- Monitor your usage through API dashboards

## 🔧 Troubleshooting

### Common Issues:

1. **"API key not configured"**
   - Check `.env.local` file exists
   - Verify environment variable names match exactly
   - Restart development server after adding keys

2. **"Rate limit exceeded"**
   - Check API dashboard for usage
   - Wait for rate limit reset
   - Consider upgrading to paid tier

3. **"Invalid API key"**
   - Regenerate API key from provider
   - Check for extra spaces or characters
   - Verify key has proper permissions

4. **"Network error"**
   - Check internet connection
   - Verify API endpoint URLs
   - Check for firewall blocking

### Getting Help:
- Check provider documentation
- Join community forums
- Contact API support teams
- Use mock data for testing

## 🎉 You're Ready!

With just **OTX + VirusTotal** configured, you'll have:
- ✅ Unlimited threat intelligence from OTX
- ✅ Industry-standard malware detection from VirusTotal
- ✅ 500 daily analyses
- ✅ Comprehensive threat scoring
- ✅ Geolocation and network intelligence
- ✅ Real-time threat pulse data

**Start analyzing threats immediately!**
