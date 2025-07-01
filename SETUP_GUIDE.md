# Development Setup Guide

This guide documents the exact setup process for The Pitch Fund, including all the gotchas and solutions we discovered.

## 🔥 Critical Issues & Solutions

### 1. Supabase CLI Installation

**❌ WRONG WAY:**
```bash
npm install -g supabase  # This will FAIL
```

**✅ CORRECT WAY:**
```bash
brew install supabase/tap/supabase
```

**Why**: Supabase deprecated global npm installation. Always use Homebrew on macOS.

### 2. Database Schema Setup

**❌ WRONG WAY:**
- Just putting `schema.sql` in `supabase/sql/` folder
- Running `supabase db push` without migrations

**✅ CORRECT WAY:**
```bash
# Create a proper migration file
supabase migration new initial_schema

# Copy your schema to the migration file
cp supabase/sql/schema.sql supabase/migrations/[timestamp]_initial_schema.sql

# Push the migration
supabase db push
```

**Why**: Supabase CLI expects migrations in the `migrations/` folder, not standalone SQL files.

### 3. Email Subscription Environment Variables

**❌ WRONG WAY:**
- Setting environment variables without restarting the dev server
- Missing required Beehiiv credentials

**✅ CORRECT WAY:**
```bash
# Create .env.local with required variables
BEEHIIV_API_TOKEN=your_beehiiv_api_token_here
BEEHIIV_PUBLICATION_ID=pub_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# ALWAYS restart the dev server after adding environment variables
npm run dev
```

**Why**: Next.js only loads environment variables on server startup. Changes require a restart.

### 4. Beehiiv Email Validation Issues

**Problem**: Valid-looking emails like `test@example.com` return "Successfully subscribed!" but are actually invalid.

**Root Cause**: Beehiiv API returns HTTP 201 (success) but includes `"status": "invalid"` in the response data for emails it considers invalid.

**✅ SOLUTION:**
The API now checks both HTTP status AND response data:
```typescript
// Check HTTP status
if (!res.ok) {
  // Handle HTTP errors
}

// Check Beehiiv's validation status
if (data.data?.status === 'invalid') {
  // Handle invalid emails
}
```

**Why**: Reserved domains like `example.com` are blocked by Beehiiv per RFC 2606.

### 5. GitHub Push Issues with Large Files

**Problem**: Accidentally committed `node_modules/` (109MB+ files)

**❌ What NOT to do:**
- Try to fix with `git rm` on individual files
- Use `git filter-branch` (complex and error-prone)

**✅ SOLUTION (for new repos):**
```bash
# Nuclear option - start completely fresh
rm -rf .git
git init
git add .
git commit -m "Initial commit with proper .gitignore"
git remote add origin https://github.com/joshmuccio/The-Pitch-Fund.git
git push -u origin main --force
```

**Prevention**: The `.gitignore` file now includes:
```gitignore
node_modules/
/.next/
.DS_Store
*.tsbuildinfo
next-env.d.ts
cypress/screenshots/
cypress/videos/
```

### 9. Analytics Setup

**New Dependencies**: The project now includes Vercel Analytics for comprehensive tracking.

**✅ SETUP:**
```bash
# Analytics package is already included in package.json
npm install  # Will install @vercel/analytics automatically
```

**Environment Variables**: Analytics work automatically on Vercel, but for local development tracking:
```bash
# Add to .env.local (optional for local development)
VERCEL_ANALYTICS_ID=your_vercel_analytics_id
```

**Features Tracked**:
- Newsletter subscription funnel (attempt, success, error)
- CTA button clicks and engagement
- Navigation patterns and user flow
- Admin workflow and form interactions
- Authentication events and security metrics

### 10. Sentry Error Monitoring

**New Dependencies**: The project includes Sentry for comprehensive error tracking and performance monitoring.

**✅ SETUP:**
```bash
# Sentry package is already included in package.json
npm install  # Will install @sentry/nextjs automatically
```

**Environment Variables**: 
```bash
# Add to .env.local
SENTRY_DSN=https://your-dsn@sentry.io/project-id
# Optional: Cron job security (recommended for production)
CRON_SECRET=your_random_secret_string
```

**Configuration Files**:
- `sentry.server.config.ts` - Server-side error tracking
- `sentry.edge.config.ts` - Edge runtime error tracking
- `src/instrumentation.ts` - Sentry initialization

**Features Monitored**:
- Real-time error tracking across all application layers
- Edge runtime function monitoring (API routes, auth callbacks)
- Performance monitoring and trace data
- Production debugging with full context
- Automatic error reports with stack traces

### 6. Cypress Testing Setup

**❌ WRONG WAY:**
- Running tests without building the application first
- Using form selectors that don't match the actual implementation

**✅ CORRECT WAY:**
```bash
# Always build before running tests
npm run build

# Start server in background
npm run start &

# Wait for server to be ready
npx wait-on http://localhost:3000

# Run tests
npm run cy:run
```

**Why**: Cypress tests need a running server and should test against production builds.

### 7. Next.js Security Vulnerabilities

**Issue**: Original Next.js version had critical security vulnerabilities

**Solution**:
```bash
npm audit fix --force
```

This updated Next.js from vulnerable version to `14.2.30` (security-patched).

### 8. Supabase Project Linking

**Commands for linking existing project:**
```bash
# List available projects
supabase projects list

# Link to specific project (if not auto-linked)
supabase link --project-ref your-project-ref-id
```

## 📋 Complete Setup Checklist

### Basic Setup
- [ ] Node.js 18+ installed
- [ ] Homebrew installed (macOS)
- [ ] Clone repository
- [ ] Run `npm install`

### Supabase Setup
- [ ] Install Supabase CLI via Homebrew (NOT npm)
- [ ] Run `supabase login`
- [ ] Verify project is linked with `supabase projects list`
- [ ] Create migration: `supabase migration new initial_schema`
- [ ] Copy schema to migration file
- [ ] Run `supabase db push`
- [ ] Verify tables in Supabase dashboard

### Email Subscription Setup
- [ ] Get Beehiiv API token from your Beehiiv account
- [ ] Get Publication ID from Beehiiv dashboard
- [ ] Create `.env.local` with required variables:
  ```env
  BEEHIIV_API_TOKEN=your_token_here
  BEEHIIV_PUBLICATION_ID=pub_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  ```
- [ ] Restart dev server: `npm run dev`
- [ ] Test subscription form on homepage

### Testing Setup
- [ ] Install Cypress dependencies (already in package.json)
- [ ] Build application: `npm run build`
- [ ] Start server: `npm run start`
- [ ] Run tests: `npm run cy:run`
- [ ] Verify all tests pass

### Analytics Setup
- [ ] Analytics package already included in package.json
- [ ] Vercel Analytics automatically enabled on Vercel deployment
- [ ] Test tracking in browser dev tools (Network tab)
- [ ] Verify events are firing for key user actions

### Sentry Error Monitoring Setup
- [ ] Sentry package already included in package.json (`@sentry/nextjs`)
- [ ] Create Sentry account and project at [sentry.io](https://sentry.io)
- [ ] Add `SENTRY_DSN` to environment variables
- [ ] Configure Sentry settings in `sentry.server.config.ts` and `sentry.edge.config.ts`
- [ ] Test error tracking with the `/api/sentry-example-api` endpoint
- [ ] Verify errors appear in Sentry dashboard

## #11. OpenGraph Image Generation

### Dynamic Social Media Images
- [ ] OpenGraph API route automatically configured at `/api/og`
- [ ] Edge Runtime enabled for fast global image generation
- [ ] Sentry monitoring integrated for error tracking
- [ ] Caching configured for 1-hour revalidation
- [ ] Test OG image generation: `http://localhost:3001/api/og?title=Test Title`
- [ ] Verify images display properly on social media platforms
- [ ] Centralized metadata system automatically applies OG images to all pages

## #12. Vercel Cron Jobs

### Automated Sitemap Regeneration
- [ ] Cron job API route configured at `/api/cron/sitemap`
- [ ] Runs daily at 2:00 AM UTC via `vercel.json` configuration
- [ ] Regenerates both `sitemap.xml` and `robots.txt` with current timestamp
- [ ] Node.js runtime for file system operations
- [ ] Sentry monitoring for cron job errors
- [ ] Optional: Set `CRON_SECRET` environment variable for security
- [ ] Test manual execution: `curl http://localhost:3001/api/cron/sitemap`
- [ ] Verify sitemap updates: `http://localhost:3001/sitemap.xml`

### Final Verification
- [ ] Start dev server: `npm run dev`
- [ ] Verify homepage loads at http://localhost:3001 (or available port)
- [ ] Test email subscription form
- [ ] Test OpenGraph images: `http://localhost:3001/api/og?title=Test`
- [ ] Test Sentry error tracking: `curl http://localhost:3001/api/sentry-example-api`
- [ ] Check Supabase dashboard for tables
- [ ] Verify Sentry dashboard shows test errors (if configured)
- [ ] Run Cypress tests successfully

## 🐛 Debugging Commands

```bash
# Check Supabase CLI version
supabase --version

# List projects and check linking
supabase projects list

# Check current working directory structure
ls -la supabase/

# Verify migration files exist
ls -la supabase/migrations/

# Check git status for any large files
git status
du -sh .git/  # Check git repo size

# Test email subscription API directly
curl -X POST http://localhost:3000/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com"}'

# Check environment variables are loaded
node -e "console.log(process.env.BEEHIIV_API_TOKEN ? 'Token loaded' : 'Token missing')"

# Test OpenGraph image generation
curl http://localhost:3001/api/og?title=Test

# Test cron job (sitemap regeneration)
curl http://localhost:3001/api/cron/sitemap

# Test Sentry error tracking
curl http://localhost:3001/api/sentry-example-api

# Check Sentry configuration
node -e "console.log(process.env.SENTRY_DSN ? 'Sentry DSN configured' : 'Sentry DSN missing')"

# Run single Cypress test
npx cypress run --spec "cypress/e2e/subscribe.cy.ts"

# Check Cypress version
npx cypress --version
```

## 🚨 Emergency Recovery

### If you accidentally commit large files:

1. **Check repository size:**
```bash
du -sh .git/
```

2. **If .git folder is >100MB, start fresh:**
```bash
rm -rf .git
git init
git add .
git commit -m "Clean initial commit"
git remote add origin [your-repo-url]
git push -u origin main --force
```

### If email subscription fails:

1. **Check environment variables:**
```bash
# Verify .env.local exists and has correct format
cat .env.local

# Restart dev server
npm run dev
```

2. **Test API directly:**
```bash
curl -X POST http://localhost:3000/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com"}'
```

3. **Check Beehiiv credentials:**
- Log into Beehiiv dashboard
- Verify API token is active
- Confirm Publication ID format: `pub_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### If Supabase migrations fail:

1. **Check migration file location:**
```bash
ls -la supabase/migrations/
```

2. **Verify migration content:**
```bash
head -20 supabase/migrations/[your-migration-file].sql
```

3. **Re-run with verbose output:**
```bash
supabase db push --debug
```

### If Cypress tests fail:

1. **Ensure server is running:**
```bash
curl http://localhost:3000
```

2. **Check test selectors:**
```bash
# Open Cypress UI to debug interactively
npx cypress open
```

3. **Run with debug output:**
```bash
npm run cy:run -- --headed --no-exit
```

## 📝 Notes for Future Developers

### General
1. **Never commit `node_modules/`** - It's excluded in `.gitignore`
2. **Always use Homebrew for Supabase CLI** - npm global install is deprecated
3. **Database changes must be migrations** - Use `supabase migration new [name]`
4. **Test locally first** - Use `supabase start` (requires Docker) for local testing
5. **Check file sizes before committing** - GitHub has 100MB limit per file

### Email Subscription
1. **Environment variables require server restart** - Changes to `.env.local` need `npm run dev` restart
2. **Beehiiv validates domains** - `example.com` and test domains are blocked
3. **Check both HTTP status and response data** - Beehiiv returns 201 with `status: 'invalid'`
4. **Use real email domains for testing** - `gmail.com`, `yahoo.com`, etc.

### Testing
1. **Build before testing** - Cypress should test production builds
2. **Use correct selectors** - Forms use `onSubmit` handlers, not `action` attributes
3. **Mock API responses** - Use `cy.intercept()` for reliable testing
4. **Screenshots on failure** - Cypress automatically captures failure screenshots

## 🔍 Verification Steps

After completing setup, verify everything works:

1. **Development server**: http://localhost:3000 shows homepage with subscription form
2. **Email subscription**: Form accepts valid emails and shows success message
3. **Supabase dashboard**: Tables visible in Table Editor
4. **Cypress tests**: `npm run cy:run` passes all tests
5. **Git status**: No large files in staging
6. **CLI tools**: `supabase --version` shows 2.26.9+

## 📚 Reference Links

- [Supabase CLI Installation](https://supabase.com/docs/guides/cli/getting-started)
- [Next.js Documentation](https://nextjs.org/docs)
- [Beehiiv API Documentation](https://developers.beehiiv.com)
- [Cypress Documentation](https://docs.cypress.io)
- [Git Large File Storage](https://git-lfs.github.com/) (if needed in future)
- [Homebrew](https://brew.sh/)

## 🧪 Testing Email Validation

### Valid Email Examples
```bash
# These should work
curl -X POST http://localhost:3000/api/subscribe -H "Content-Type: application/json" -d '{"email":"test@gmail.com"}'
curl -X POST http://localhost:3000/api/subscribe -H "Content-Type: application/json" -d '{"email":"user@yahoo.com"}'
```

### Invalid Email Examples
```bash
# These should return 400 errors
curl -X POST http://localhost:3000/api/subscribe -H "Content-Type: application/json" -d '{"email":"invalid-email"}'
curl -X POST http://localhost:3000/api/subscribe -H "Content-Type: application/json" -d '{"email":"test@example.com"}'  # Blocked by Beehiiv
curl -X POST http://localhost:3000/api/subscribe -H "Content-Type: application/json" -d '{"email":"user@"}'
```

---

**Last Updated**: January 2025  
**CLI Version**: Supabase 2.26.9  
**Next.js Version**: 14.2.30  
**Cypress Version**: 14.5.0 