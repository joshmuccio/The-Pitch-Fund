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
- AI-powered transcript analysis (taglines, industry tags, business model tags, keywords)
- GPT-4o model integration for industry tags (VC-focused reasoning)
- GPT-4o-mini model integration for other fields (cost optimization)
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

### Image Vectorization

```env
# Vectorizer.ai API credentials for PNG to SVG conversion
VECTORIZER_AI_USER_ID=your-user-id
VECTORIZER_AI_API_TOKEN=your-api-token

# Feature flag to enable/disable vectorization
ENABLE_IMAGE_VECTORIZATION=true
```

**Required for:**
- Automatic bitmap to SVG conversion for company logos (PNG, JPEG, GIF, BMP, TIFF)
- High-quality vectorization using AI algorithms
- Scalable logo formats for responsive design
- **CSS-styleable SVG generation** - SVGs use `currentColor` for dynamic theming

**Simple & Effective Configuration:**
Our implementation uses a **minimal, plug-and-play approach**:

- **Single Setting**: `max_colors: 1` forces monochrome output perfect for CSS styling
- **Smart Defaults**: Vectorizer.ai handles all quality optimization automatically
- **Transparency Support**: Built-in handling of transparent PNGs without custom configuration
- **CSS-Ready Output**: Post-processing converts colors to `currentColor` for dynamic theming

**Why This Simple Approach Works Better:**
- **Proven Defaults**: Vectorizer.ai's defaults are optimized for general logo/image conversion
- **Less Complexity**: Fewer custom settings = fewer potential issues
- **Future-Proof**: Vectorizer.ai improvements automatically benefit your integration
- **Reliable Results**: Simple configuration is more predictable and easier to debug
- **Faster Development**: No need to understand dozens of technical parameters

**What You Get:**
- ✅ **High-quality SVG conversion** from any bitmap format (PNG, JPG, GIF, BMP, TIFF)
- ✅ **CSS-styleable output** - change colors dynamically with CSS
- ✅ **Automatic transparency handling** - no configuration needed  
- ✅ **Optimal file sizes** - Vectorizer.ai's algorithms choose the best approach
- ✅ **Professional results** - industry-standard vectorization quality

**Key Features:**
- **CSS-Styleable SVGs**: Generated SVGs use `currentColor` instead of fixed colors
- **Responsive Scaling**: Vector format scales perfectly at any size
- **Fallback Support**: Automatically falls back to original image if conversion fails
- **Multiple Formats**: Supports PNG, JPEG, GIF, BMP, and TIFF input formats

**CSS Styling Examples:**
```css
/* Basic color styling */
.logo-svg {
  color: #3b82f6; /* Blue logo */
}

/* Dynamic theming */
.dark-theme .logo-svg {
  color: white;
}

.light-theme .logo-svg {
  color: black;
}

/* Hover effects */
.logo-svg:hover {
  color: #ef4444; /* Red on hover */
  transition: color 0.2s ease;
}
```

**How to get these:**
1. Create account at [Vectorizer.ai](https://vectorizer.ai/)
2. Subscribe to an API plan (starting at $9.99/month for 50 credits)
3. Navigate to your API dashboard
4. Copy your User ID and API Token

**Security Notes:**
- Keep credentials secure and never commit to version control
- Monitor usage to control API costs ($0.20 per image on smallest plan)
- `ENABLE_PNG_VECTORIZATION` can be set to `false` to disable the feature
- If disabled or credentials missing, uploads fall back to original PNG

**Cost Management:**
- Each image conversion uses 1 API credit (PNG, JPEG, GIF, BMP, TIFF)
- Monitor usage in Vectorizer.ai dashboard
- Set `ENABLE_IMAGE_VECTORIZATION=false` to disable and avoid costs
- Failed conversions automatically fall back to original image upload

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

# Optional for bitmap to SVG conversion
VECTORIZER_AI_USER_ID=your-user-id
VECTORIZER_AI_API_TOKEN=your-api-token
ENABLE_IMAGE_VECTORIZATION=true  # Controls vectorization for all bitmap formats (PNG, JPG, GIF, BMP, TIFF)

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

# Image vectorization (optional)
VECTORIZER_AI_USER_ID=your-prod-user-id
VECTORIZER_AI_API_TOKEN=your-prod-api-token
ENABLE_IMAGE_VECTORIZATION=true  # Controls vectorization for all bitmap formats

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
  'VECTORIZER_AI_USER_ID',
  'VECTORIZER_AI_API_TOKEN',
  'ENABLE_IMAGE_VECTORIZATION',
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