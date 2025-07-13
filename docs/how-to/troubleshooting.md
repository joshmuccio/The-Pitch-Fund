# 🚨 Troubleshooting Guide

This guide covers solutions to common issues you might encounter while developing with The Pitch Fund.

## 🔍 Quick Issue Lookup

| Issue | Section |
|-------|---------|
| Setup/Installation problems | [Setup Issues](#setup-issues) |
| Database connection errors | [Database Issues](#database-issues) |
| Form validation not working | [Form & Validation Issues](#form--validation-issues) |
| Build/TypeScript errors | [Build Issues](#build-issues) |
| Email subscription failures | [Email Issues](#email-issues) |
| Performance problems | [Performance Issues](#performance-issues) |

---

## Setup Issues

### "Command not found: supabase"

**Problem:** Terminal doesn't recognize `supabase` command

**Solution:**
```bash
# Install via Homebrew (macOS - recommended)
brew install supabase/tap/supabase

# Verify installation
supabase --version

# If still not working, restart terminal
```

**Alternative:** If Homebrew isn't available, see [Supabase CLI installation docs](https://supabase.com/docs/guides/cli/getting-started).

### Port Conflicts

**Problem:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
- Next.js will automatically try ports 3001, 3002, etc.
- Or manually specify port: `npm run dev -- -p 3005`
- Or kill the process using the port: `lsof -ti:3000 | xargs kill`

### Node Version Issues

**Problem:** Build fails with Node.js version errors

**Solution:**
```bash
# Check current version
node --version

# Should be 18+ for The Pitch Fund
# Use nvm to switch versions
nvm install 18
nvm use 18
```

### Git Large File Issues

**Problem:** "Error: encountered large file" during git operations

**Solution:**
```bash
# Check repository size
du -sh .git/

# If over 100MB, remove large files
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch path/to/large/file' \
  --prune-empty --tag-name-filter cat -- --all

# Or start fresh (for development)
rm -rf .git
git init
git add .
git commit -m "Clean initial commit"
```

---

## Database Issues

### Connection Refused Errors

**Problem:** `Connection refused` or `Cannot connect to database`

**Solution:**
1. **Check environment variables:**
   ```bash
   # Verify .env.local exists and is correct
   cat .env.local
   
   # Must include:
   # NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   # NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Verify Supabase project is running:**
   - Open Supabase dashboard
   - Check project status

3. **Restart development server:**
   ```bash
   # Environment variables only load on startup
   npm run dev
   ```

### Migration Failures

**Problem:** `Error applying migration` or `Migration already exists`

**Solution:**
```bash
# Check existing migrations
ls -la supabase/migrations/

# Check what's been applied
supabase migration list

# Reset local database (development only)
supabase db reset

# Reapply migrations
supabase db push

# If still failing, check migration SQL syntax
head -20 supabase/migrations/[failing-migration].sql
```

### Type Generation Issues

**Problem:** `supabase gen types` fails or generates empty file

**Solution:**
```bash
# Check project is linked
supabase projects list

# Relink if needed
supabase link --project-ref your-project-ref

# Generate types with debug info
supabase gen types typescript --linked --debug > src/types/supabase.types.ts

# Verify file was created
head -20 src/types/supabase.types.ts
```

### RLS Policy Errors

**Problem:** `Row Level Security policy violation` 

**Solution:**
1. **Check your user role:**
   ```sql
   -- In Supabase SQL Editor
   SELECT id, role FROM profiles WHERE id = auth.uid();
   ```

2. **Verify policies exist:**
   ```sql
   SELECT * FROM pg_policies WHERE schemaname = 'public';
   ```

3. **Test policies:**
   ```sql
   -- Test as specific role
   SET role authenticated;
   SELECT * FROM companies LIMIT 1;
   ```

---

## Form & Validation Issues

### Form Validation Not Triggering

**Problem:** Form submits without validation or validation errors don't show

**Solution:**
1. **Check Zod schema imports:**
   ```typescript
   // Ensure schema is imported correctly
   import { companyFormSchema } from '@/lib/validation-schemas'
   ```

2. **Verify form setup:**
   ```typescript
   // Check useForm configuration
   const form = useForm({
     resolver: zodResolver(companyFormSchema),
     defaultValues: { /* ... */ }
   })
   ```

3. **Check error display:**
   ```tsx
   {/* Ensure errors are displayed */}
   {errors.fieldName && (
     <span className="text-red-500">{errors.fieldName.message}</span>
   )}
   ```

### QuickPaste Not Working

**Problem:** AngelList memo parsing doesn't auto-populate fields

**Solution:**
1. **Check console for errors:**
   - Open browser dev tools
   - Look for parsing errors in console

2. **Verify text format:**
   ```
   Company: Company Name
   Investment Date: January 15, 2024
   Investment Amount: $250,000
   ```

3. **Try manual entry if parsing fails**

### Currency Input Issues

**Problem:** Currency fields not formatting correctly or losing values

**Solution:**
```typescript
// Use react-currency-input-field correctly
<CurrencyInput
  id="investment_amount"
  name="investment_amount"
  placeholder="$0"
  defaultValue={formData.investment_amount}
  decimalsLimit={2}
  onValueChange={(value, name, values) => {
    setFormData(prev => ({
      ...prev,
      [name]: values?.float ?? 0
    }))
  }}
/>
```

---

## Build Issues

### TypeScript Compilation Errors

**Problem:** `Type 'X' is not assignable to type 'Y'` during build

**Solution:**
1. **Regenerate Supabase types:**
   ```bash
   supabase gen types typescript --linked > src/types/supabase.types.ts
   ```

2. **Check import paths:**
   ```typescript
   // Use correct import path
   import type { Database } from '@/types/supabase.types'
   ```

3. **Clear TypeScript cache:**
   ```bash
   rm -rf .next
   rm tsconfig.tsbuildinfo
   npm run dev
   ```

### Build Memory Issues

**Problem:** `JavaScript heap out of memory` during build

**Solution:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Or permanently in package.json
"build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
```

### Import Resolution Errors

**Problem:** `Module not found` errors during build

**Solution:**
1. **Check path aliases in `tsconfig.json`:**
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```

2. **Verify file exists:**
   ```bash
   ls -la src/lib/validation-schemas.ts
   ```

---

## Email Issues

### Newsletter Subscription Failures

**Problem:** Email subscription returns success but doesn't actually subscribe

**Solution:**
1. **Check Beehiiv credentials:**
   ```bash
   # Verify environment variables
   echo $BEEHIIV_API_TOKEN
   echo $BEEHIIV_PUBLICATION_ID
   ```

2. **Test API directly:**
   ```bash
   curl -X POST http://localhost:3001/api/subscribe \
     -H "Content-Type: application/json" \
     -d '{"email":"test@gmail.com"}'
   ```

3. **Check Beehiiv dashboard:**
   - Log into Beehiiv
   - Verify API token is active
   - Check publication ID format

### Reserved Domain Errors

**Problem:** Valid emails like `test@example.com` are rejected

**Cause:** Beehiiv blocks reserved domains per RFC 2606

**Solution:** Use real email addresses for testing (e.g., `test@gmail.com`)

---

## Performance Issues

### Slow Page Loads

**Problem:** Pages take a long time to load

**Solution:**
1. **Check database queries:**
   ```sql
   -- In Supabase dashboard
   EXPLAIN ANALYZE SELECT * FROM companies WHERE industry_tags @> ARRAY['fintech'];
   ```

2. **Add missing indexes:**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_companies_industry_tags_gin
ON companies USING GIN(industry_tags);

CREATE INDEX IF NOT EXISTS idx_companies_business_model_tags_gin
ON companies USING GIN(business_model_tags);

CREATE INDEX IF NOT EXISTS idx_companies_keywords_gin
ON companies USING GIN(keywords);
   ```

3. **Optimize images:**
   - Use Next.js Image component
   - Compress large images

### Memory Leaks

**Problem:** Development server becomes sluggish over time

**Solution:**
```bash
# Restart development server
npm run dev

# Check for console errors
# Remove unused imports
# Clear browser cache
```

### Build Performance

**Problem:** Slow build times

**Solution:**
```bash
# Use SWC compiler (should be default in Next.js 14)
# Check next.config.js for performance settings

# Clean builds
rm -rf .next
npm run build
```

---

## Testing Issues

### Cypress Tests Failing

**Problem:** E2E tests fail locally

**Solution:**
1. **Ensure server is running:**
   ```bash
   # In one terminal
   npm run build
   npm run start
   
   # In another terminal
   npx cypress run
   ```

2. **Check test selectors:**
   ```typescript
   // Use data-testid attributes
   cy.get('[data-testid="subscribe-button"]').click()
   ```

3. **Run tests interactively:**
   ```bash
   npx cypress open
   ```

---

## Environment Issues

### Development vs Production Differences

**Problem:** Works locally but fails in production

**Solution:**
1. **Check environment variables:**
   - Verify production env vars in Vercel dashboard
   - Ensure no hardcoded localhost URLs

2. **Test production build locally:**
   ```bash
   npm run build
   npm run start
   ```

3. **Check error monitoring:**
   - Review Sentry dashboard for production errors
   - Check Vercel function logs

### Next.js App Router Issues

**Problem:** Routing or component issues

**Solution:**
1. **Check file naming:**
   ```
   app/
   ├── page.tsx          # /
   ├── admin/
   │   └── page.tsx      # /admin
   └── api/
       └── route.ts      # /api
   ```

2. **Verify client components:**
   ```typescript
   'use client'  // Add to components using hooks
   ```

---

## Getting Additional Help

### Debug Information to Collect

When asking for help, include:

1. **Environment details:**
   ```bash
   node --version
   npm --version
   supabase --version
   ```

2. **Error messages:**
   - Full error text from terminal
   - Browser console errors
   - Network tab errors

3. **Steps to reproduce:**
   - What you were trying to do
   - What happened instead
   - Minimal example if possible

### Useful Commands for Debugging

```bash
# Check environment
env | grep -E "(SUPABASE|BEEHIIV)"

# Check Supabase connection
supabase projects list

# Check database status
supabase db inspect

# View logs
npm run dev 2>&1 | tee debug.log
```

---

**Still stuck?** The issue might be project-specific. Consider:
- Checking the latest [GitHub issues](your-repo-issues)
- Reviewing [Supabase documentation](https://supabase.com/docs)
- Asking in the team Slack/Discord channel 