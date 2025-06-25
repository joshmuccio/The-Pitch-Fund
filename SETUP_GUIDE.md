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

### 3. GitHub Push Issues with Large Files

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
```

### 4. Next.js Security Vulnerabilities

**Issue**: Original Next.js version had critical security vulnerabilities

**Solution**:
```bash
npm audit fix --force
```

This updated Next.js from vulnerable version to `14.2.30` (security-patched).

### 5. Supabase Project Linking

**Commands for linking existing project:**
```bash
# List available projects
supabase projects list

# Link to specific project (if not auto-linked)
supabase link --project-ref your-project-ref-id
```

## 📋 Complete Setup Checklist

- [ ] Node.js 18+ installed
- [ ] Homebrew installed (macOS)
- [ ] Clone repository
- [ ] Run `npm install`
- [ ] Install Supabase CLI via Homebrew (NOT npm)
- [ ] Run `supabase login`
- [ ] Verify project is linked with `supabase projects list`
- [ ] Create migration: `supabase migration new initial_schema`
- [ ] Copy schema to migration file
- [ ] Run `supabase db push`
- [ ] Verify tables in Supabase dashboard
- [ ] Start dev server: `npm run dev`

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

## 📝 Notes for Future Developers

1. **Never commit `node_modules/`** - It's excluded in `.gitignore`
2. **Always use Homebrew for Supabase CLI** - npm global install is deprecated
3. **Database changes must be migrations** - Use `supabase migration new [name]`
4. **Test locally first** - Use `supabase start` (requires Docker) for local testing
5. **Check file sizes before committing** - GitHub has 100MB limit per file

## 🔍 Verification Steps

After completing setup, verify everything works:

1. **Development server**: http://localhost:3000 shows "Hello Pitch Fund"
2. **Supabase dashboard**: Tables visible in Table Editor
3. **Git status**: No large files in staging
4. **CLI tools**: `supabase --version` shows 2.26.9+

## 📚 Reference Links

- [Supabase CLI Installation](https://supabase.com/docs/guides/cli/getting-started)
- [Next.js Documentation](https://nextjs.org/docs)
- [Git Large File Storage](https://git-lfs.github.com/) (if needed in future)
- [Homebrew](https://brew.sh/)

---

**Last Updated**: June 2025  
**CLI Version**: Supabase 2.26.9  
**Next.js Version**: 14.2.30 