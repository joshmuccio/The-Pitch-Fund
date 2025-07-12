# 🔐 Environment Variables

Complete reference for configuring The Pitch Fund application.

## Required Variables

### Supabase Configuration

```env
# Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Supabase Anonymous Key (safe for client-side)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase Service Role Key (server-side only)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Where to find these:**
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to Settings → API
4. Copy the values from the "Project API keys" section

**Security Notes:**
- `NEXT_PUBLIC_*` variables are exposed to the browser
- `SUPABASE_SERVICE_ROLE_KEY` is server-side only and has admin privileges
- Never commit actual keys to version control

### AI Integration

```env
# OpenAI API Key for transcript analysis
OPENAI_API_KEY=sk-your-openai-api-key
```

**Required for:**
- AI-powered transcript analysis (taglines, industry tags, business model tags)
- GPT-4o-mini model integration
- Investment wizard Step 3 AI generation features

**How to get this:**
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Navigate to API Keys section
3. Create a new API key
4. Copy the key (starts with `sk-`)

**Security Notes:**
- Keep this key secure and never commit it to version control
- Monitor usage in OpenAI dashboard to manage costs
- The key provides access to your OpenAI account and credits

### Error Monitoring

```env
# Sentry DSN for server-side error tracking
SENTRY_DSN=your-sentry-dsn

# Sentry DSN for client-side error tracking (safe for browser)
NEXT_PUBLIC_SENTRY_DSN=your-public-sentry-dsn
```

**Required for:**
- Production error monitoring and debugging
- AI API route error tracking
- Performance monitoring and alerts

**How to get these:**
1. Create account at [Sentry.io](https://sentry.io/)
2. Create a new project
3. Navigate to Settings → Projects → [Your Project]
4. Go to "Client Keys (DSN)"
5. Copy both the DSN and Public DSN

**Security Notes:**
- `SENTRY_DSN` is server-side only and should be kept private
- `NEXT_PUBLIC_SENTRY_DSN` is safe to expose as it's client-side only
- Both are required for comprehensive error tracking

---

## Optional Variables

### Email Newsletter Integration

```env
# Beehiiv API Configuration
BEEHIIV_API_TOKEN=your-beehiiv-api-token
BEEHIIV_PUBLICATION_ID=your-publication-id
```

**Required for:**
- Newsletter subscription functionality
- Email list management

**How to get these:**
1. Log into your [Beehiiv dashboard](https://app.beehiiv.com/)
2. Navigate to Settings → Integrations → API
3. Create an API token
4. Find your publication ID in the URL or settings

**If not provided:**
- Newsletter subscription will be disabled
- Application will function normally otherwise

### Build & Release Configuration

```env
# Sentry Organization and Project (for automated releases)
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=your-sentry-project

# Sentry Auth Token (for releases and source maps)
SENTRY_AUTH_TOKEN=your-auth-token
```

**Required for:**
- Automated release tracking in Sentry
- Source map uploads for better error debugging
- Build-time integrations

**How to configure:**
1. In Sentry dashboard, go to Settings → Auth Tokens
2. Generate a new token with the required permissions
3. Copy organization and project names from your Sentry URL

### Address Normalization & Geocoding

```env
# Mapbox API Configuration
NEXT_PUBLIC_MAPBOX_PUBLIC_TOKEN=your-mapbox-public-token
```

**Required for:**
- Address normalization and geocoding
- Automatic latitude/longitude population
- Enhanced address validation

**How to get this:**
1. Create account at [Mapbox](https://mapbox.com/)
2. Navigate to Account → Access Tokens
3. Create a new public token or use the default public token
4. Copy the token value

**If not provided:**
- Address normalization will fallback to regex parsing
- Latitude/longitude fields will not be populated
- Address validation will be less accurate

### Analytics & Monitoring

```env
# Vercel Analytics
VERCEL_ANALYTICS_ID=your-analytics-id

# Google Analytics (if using)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## Environment Files

### Development (.env.local)

```env
# Required for local development
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Required for AI features
OPENAI_API_KEY=sk-your-openai-api-key

# Required for error monitoring
SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_SENTRY_DSN=your-public-sentry-dsn

# Recommended for enhanced address processing
NEXT_PUBLIC_MAPBOX_PUBLIC_TOKEN=your-mapbox-public-token

# Optional for local development
BEEHIIV_API_TOKEN=your-beehiiv-token
BEEHIIV_PUBLICATION_ID=your-publication-id
```

### Production (.env.production)

```env
# Same as development but with production values
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key

# AI Integration
OPENAI_API_KEY=sk-your-prod-openai-api-key

# Production monitoring
SENTRY_DSN=your-production-sentry-dsn
NEXT_PUBLIC_SENTRY_DSN=your-production-public-sentry-dsn

# Address normalization and geocoding
NEXT_PUBLIC_MAPBOX_PUBLIC_TOKEN=your-prod-mapbox-token

# Optional production features
BEEHIIV_API_TOKEN=your-prod-beehiiv-token
BEEHIIV_PUBLICATION_ID=your-prod-publication-id
VERCEL_ANALYTICS_ID=your-analytics-id
```

---

## Variable Validation

The application validates environment variables at startup:

### Required Variable Check

```typescript
// src/lib/env-validation.ts
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'SENTRY_DSN',
  'NEXT_PUBLIC_SENTRY_DSN',
] as const

// Application will fail to start if these are missing
```

### Optional Variable Check

```typescript
// Optional variables degrade gracefully
const optionalEnvVars = [
  'NEXT_PUBLIC_MAPBOX_PUBLIC_TOKEN',
  'BEEHIIV_API_TOKEN',
  'BEEHIIV_PUBLICATION_ID',
  'SENTRY_ORG',
  'SENTRY_PROJECT',
  'SENTRY_AUTH_TOKEN',
] as const

// Features are disabled if these are missing
```

---

## Setup Instructions

### 1. Create Environment File

```bash
# Copy the example file
cp .env.example .env.local

# Edit with your values
code .env.local
```

### 2. Get Supabase Credentials

1. **Create Supabase Project** (if you haven't)
   - Go to [supabase.com](https://supabase.com/)
   - Click "New Project"
   - Choose organization, name, and region
   - Wait for setup to complete

2. **Get API Keys**
   - In Supabase dashboard, go to Settings → API
   - Copy "Project URL" for `NEXT_PUBLIC_SUPABASE_URL`
   - Copy "anon public" key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy "service_role" key for `SUPABASE_SERVICE_ROLE_KEY`

3. **Update Environment File**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 3. Test Configuration

```bash
# Start development server
npm run dev

# Check for environment variable errors in console
# Application should start on http://localhost:3001
```

---

## Deployment Configuration

### Vercel Deployment

1. **Connect Repository**
   - Connect your GitHub repository to Vercel
   - Vercel will auto-detect Next.js configuration

2. **Set Environment Variables**
   - In Vercel dashboard, go to Project Settings → Environment Variables
   - Add all required variables for production environment
   - Ensure `SUPABASE_SERVICE_ROLE_KEY` is marked as sensitive

3. **Deploy**
   - Push to main branch to trigger deployment
   - Check deployment logs for any environment variable issues

### Other Platforms

For other deployment platforms:
- Ensure all environment variables are set
- Use platform-specific methods for sensitive variables
- Test in staging environment first

---

## Troubleshooting

### Common Issues

**"Missing required environment variable"**
- Check spelling of variable names
- Ensure `.env.local` file exists in project root
- Restart development server after adding variables

**"Invalid Supabase URL"**
- Ensure URL includes `https://` protocol
- Check for trailing slashes (remove them)
- Verify project is not paused in Supabase

**"Authentication failed"**
- Verify Supabase anon key is correct
- Check service role key hasn't been regenerated
- Ensure Row Level Security policies are properly configured

**"Newsletter subscription fails"**
- Verify Beehiiv API token is active
- Check publication ID format
- Test API endpoint directly with curl

### Debug Commands

```bash
# Check environment variables are loaded
echo $NEXT_PUBLIC_SUPABASE_URL

# Test Supabase connection
npx supabase projects list

# Verify Next.js can read variables
npm run dev 2>&1 | grep -i "env\|supabase"
```

---

## Security Best Practices

### Development
- Never commit `.env.local` to version control
- Use separate Supabase projects for dev/staging/prod
- Rotate keys regularly
- Use minimum required permissions

### Production
- Use secure methods to inject environment variables
- Monitor for exposed keys in client-side code
- Set up alerts for unauthorized API usage
- Regular security audits of environment configuration

---

**Related Documentation:**
- [Getting Started](../tutorials/getting-started.md) - Initial setup with environment variables
- [Database Management](../how-to/database-management.md) - Using environment variables with Supabase
- [Troubleshooting](../how-to/troubleshooting.md) - Environment-related issues 