# Environment Setup Guide

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# The Pitch Fund - Environment Configuration

# Next.js environment
NODE_ENV=development

# Supabase Configuration (when needed)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Beehiiv Newsletter Integration (when needed)
BEEHIIV_API_KEY=your_beehiiv_api_key
BEEHIIV_PUBLICATION_ID=your_beehiiv_publication_id

# Sentry Error Monitoring (when needed)
SENTRY_DSN=https://your-dsn@sentry.io/project-id
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=your-sentry-project
SENTRY_AUTH_TOKEN=your-sentry-auth-token

# Analytics (automatically configured on Vercel)
# GOOGLE_ANALYTICS_ID=G-XXXXXXX

# Base URL (automatically configured on Vercel)
NEXT_PUBLIC_BASE_URL=http://localhost:3001
```

## Environment Variable Details

### **Sentry Configuration**
- **`SENTRY_DSN`**: Server-side Sentry Data Source Name for error tracking
- **`NEXT_PUBLIC_SENTRY_DSN`**: Client-side Sentry DSN (must be public for browser access)
- **`SENTRY_ORG`**: Your Sentry organization slug
- **`SENTRY_PROJECT`**: Your Sentry project slug  
- **`SENTRY_AUTH_TOKEN`**: Auth token for source map uploads and releases

### **Database Configuration**
- **`NEXT_PUBLIC_SUPABASE_URL`**: Your Supabase project URL
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Supabase anonymous/public key
- **`SUPABASE_SERVICE_ROLE_KEY`**: Supabase service role key (server-side only)

### **Email Integration**
- **`BEEHIIV_API_KEY`**: API key for Beehiiv email service
- **`BEEHIIV_PUBLICATION_ID`**: Your Beehiiv publication identifier

### **Application Configuration**
- **`NEXT_PUBLIC_BASE_URL`**: Base URL for the application (used for metadata and sitemaps)

## Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Database Setup (Optional)
If you need database functionality:
```bash
# Install Supabase CLI (macOS)
brew install supabase/tap/supabase

# Login to Supabase
supabase login

# Initialize project (if not already done)
supabase init

# Push schema to database
supabase db push
```

## Architecture Overview

The project uses a clean, modern stack:

- **Frontend**: Next.js 14 with App Router + TypeScript
- **Styling**: Tailwind CSS with custom brand system
- **Database**: Supabase (PostgreSQL with RLS)
- **Deployment**: Vercel

## Brand System

The design system is implemented in Tailwind with:
- **Colors**: `pitch-black`, `graphite-gray`, `platinum-mist`, `cobalt-pulse`, `dawn-gold`
- **Typography**: Inter font with generous tracking
- **Components**: Buttons, cards, forms with hover effects
- **Utilities**: Custom gradients, animations, responsive design

## Key Features

- ✅ **Responsive Design** - Mobile-first approach
- ✅ **Dark Theme** - Professional pitch-black background
- ✅ **Typography System** - Consistent heading hierarchy
- ✅ **Component Library** - Reusable UI components
- ✅ **SEO Ready** - Proper metadata and OpenGraph tags
- ✅ **Accessibility** - Focus states and proper contrast
- ✅ **Error Monitoring** - Sentry integration for real-time error tracking
- ✅ **Edge Runtime** - Globally distributed API endpoints
- ✅ **Analytics Tracking** - Vercel Analytics for user behavior insights

## Troubleshooting

### Common Issues

1. **Port conflicts**: The dev server will automatically try ports 3001, 3002, etc.
2. **Build errors**: Clear cache with `rm -rf .next && npm run dev`
3. **TypeScript errors**: Ensure all dependencies are installed

### Getting Help

- Check the `README.md` for setup instructions
- Review `PRD.md` for project requirements
- See `DATABASE.md` for schema documentation

---

**Note**: This project previously used Plasmic but has been simplified to use pure React + Tailwind for faster development and reduced complexity.

## Additional Documentation

For comprehensive implementation guides:

- **Sentry Best Practices**: See `docs/SENTRY_IMPLEMENTATION_GUIDE.md` for complete error monitoring setup
- **Environment Validation**: Automatic validation implemented in `src/lib/env-validation.ts`
- **Setup Guide**: See `SETUP_GUIDE.md` for complete setup instructions
- **Edge Runtime Guide**: See `docs/EDGE_RUNTIME_GUIDE.md` for performance optimization

## Security Notes

- Never commit `.env.local` to version control
- Use different Sentry projects for development and production
- Rotate API keys regularly
- Keep service role keys secure and never expose them client-side 