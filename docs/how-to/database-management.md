# 🗄️ Database Management

This guide covers practical database operations you'll need to perform as a developer or administrator of The Pitch Fund.

## Quick Reference

| Task | Command |
|------|---------|
| Create migration | `supabase migration new migration_name` |
| Apply migrations | `supabase db push` |
| Generate types | `supabase gen types typescript --linked > src/types/supabase.types.ts` |
| Reset database | `supabase db reset` |
| Backup database | Via Supabase dashboard |

---

## Making Schema Changes

### The Migration Workflow

**Always follow this order when making database changes:**

```bash
# 1. Create migration for any schema changes
supabase migration new descriptive_change_name

# 2. Write your SQL changes in the migration file
# Edit: supabase/migrations/[timestamp]_descriptive_change_name.sql

# 3. Push migration to apply changes to database
supabase db push

# 4. CRITICAL: Generate new TypeScript types
supabase gen types typescript --linked > src/types/supabase.types.ts

# 5. Update frontend code to use new types/values
# Update components, schemas, validation, etc.

# 6. Test the changes
npm run build  # Verify TypeScript compilation
npm run dev    # Test in development
```

### Example: Adding a New Column

```sql
-- File: supabase/migrations/20250104000016_add_company_website.sql
ALTER TABLE companies 
ADD COLUMN website_url TEXT;

-- Add index if needed
CREATE INDEX IF NOT EXISTS idx_companies_website 
ON companies(website_url);

-- Add comment
COMMENT ON COLUMN companies.website_url 
IS 'Company website URL for external reference';
```

### Example: Updating Enum Values

```sql
-- File: supabase/migrations/20250104000017_update_company_status.sql

-- Add new value to existing enum
ALTER TYPE company_status ADD VALUE 'dormant';

-- Or replace enum entirely (more complex)
CREATE TYPE company_status_new AS ENUM ('active', 'dormant', 'exited', 'dead');
ALTER TABLE companies 
ALTER COLUMN status TYPE company_status_new 
USING status::text::company_status_new;
DROP TYPE company_status;
ALTER TYPE company_status_new RENAME TO company_status;
```

---

## Generating TypeScript Types

### When to Regenerate Types

Generate new types after:
- ✅ Any database schema changes
- ✅ Adding/removing tables
- ✅ Modifying column types
- ✅ Updating enum values

### Command Options

```bash
# For current linked project (recommended)
supabase gen types typescript --linked > src/types/supabase.types.ts

# For specific project (if not linked)
supabase gen types typescript --project-id your-project-id > src/types/supabase.types.ts

# Verify types were generated correctly
head -20 src/types/supabase.types.ts
```

### Updating Frontend Code

After generating new types, update:

1. **Validation Schemas** (`src/lib/validation-schemas.ts`)
2. **Form Components** (default values, dropdowns)
3. **Helper Functions** (`src/lib/supabase-helpers.ts`)
4. **Component Props** (TypeScript interfaces)

---

## Database Best Practices

### Timezone Management

**Always use UTC for storage:**

```sql
-- ✅ Good: Use timestamptz for all dates
created_at timestamptz DEFAULT now()

-- ❌ Bad: Using timestamp without timezone
created_at timestamp DEFAULT now()
```

**Utility functions available:**

```sql
-- Convert external timestamps to UTC
SELECT ensure_utc_timestamp('2024-01-15 14:30:00-05:00');

-- Get current UTC timestamp
SELECT utc_now();

-- Parse external timestamp strings safely
SELECT safe_parse_timestamp('2024-01-15 14:30:00', 'America/New_York');
```

### Numeric Data Types

**Use consistent precision:**

```sql
-- Money amounts (supports up to $999T with 4 decimal precision)
numeric(20,4)    -- investment_amount, post_money_valuation

-- Sentiment scores (AI analysis range -1.000 to 1.000)
numeric(4,3)     -- sentiment_score

-- Percentages (0.00 to 100.00)
numeric(5,2)     -- discount_percent
```

### Indexing Strategy

**Add indexes for common queries:**

```sql
-- Single column indexes
CREATE INDEX IF NOT EXISTS idx_companies_founded_year 
ON companies(founded_year);

-- Composite indexes for multiple column queries
CREATE INDEX IF NOT EXISTS idx_companies_country_stage 
ON companies(country, stage_at_investment);

-- GIN indexes for array/JSONB columns (Three-Tag System)
CREATE INDEX IF NOT EXISTS idx_companies_industry_tags_gin 
ON companies USING GIN(industry_tags);

CREATE INDEX IF NOT EXISTS idx_companies_business_model_tags_gin 
ON companies USING GIN(business_model_tags);

CREATE INDEX IF NOT EXISTS idx_companies_keywords_gin 
ON companies USING GIN(keywords);

-- Vector indexes for AI features
CREATE INDEX IF NOT EXISTS idx_companies_description_vector 
ON companies USING ivfflat (description vector_cosine_ops);
```

---

## Troubleshooting Common Issues

### Migration Failures

**"Migration already exists"**
```bash
# Check existing migrations
ls -la supabase/migrations/

# If duplicate, rename or delete the duplicate
```

**"Cannot drop type X because other objects depend on it"**
```sql
-- Solution: Drop dependent objects first
DROP VIEW IF EXISTS view_using_type;
DROP FUNCTION IF EXISTS function_using_type();
-- Then drop and recreate the type
-- Then recreate the dropped objects
```

**"Unsafe use of new value"**
```sql
-- PostgreSQL doesn't allow using newly added enum values in same transaction
-- Solution: Add value in one migration, use it in another
```

### Type Generation Issues

**"Project not linked"**
```bash
# Check current project
supabase projects list

# Link to correct project
supabase link --project-ref your-project-ref
```

**"Permission denied"**
```bash
# Ensure you're logged in
supabase login

# Check you have access to the project
supabase projects list
```

### Database Connection Issues

**"Connection refused"**
- Verify environment variables in `.env.local`
- Check Supabase project is running
- Confirm network connectivity

**"Invalid JWT token"**
- Regenerate Supabase keys in dashboard
- Update environment variables
- Restart development server

---

## Backup and Recovery

### Creating Backups

**Via Supabase Dashboard:**
1. Go to Settings → Database
2. Click "Create Backup"
3. Choose full backup or table-specific

**Via CLI (for schemas only):**
```bash
# Export schema only
supabase db dump --schema-only > backup_schema.sql

# Export data only
supabase db dump --data-only > backup_data.sql
```

### Restoring from Backup

**For development:**
```bash
# Reset to clean state
supabase db reset

# Apply backup (if needed)
psql -f backup.sql
```

**For production:**
- Use Supabase dashboard restore feature
- **Never** run destructive commands in production

---

## Monitoring and Performance

### Database Monitoring

**Key metrics to track:**
- Connection count
- Query execution time
- Index usage
- Storage size

**Via Supabase Dashboard:**
- Reports → Database
- View connection pool usage
- Monitor query performance

### Query Optimization

**Use EXPLAIN for slow queries:**
```sql
EXPLAIN ANALYZE 
SELECT * FROM companies 
WHERE industry_tags @> ARRAY['fintech'];
```

**Common optimizations:**
- Add indexes for WHERE clauses
- Use proper data types
- Avoid SELECT * in production
- Use LIMIT for large result sets

---

## Advanced Operations

### Row Level Security (RLS)

**Understanding current policies:**
```sql
-- View all policies
SELECT schemaname, tablename, policyname, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public';
```

**Testing RLS:**
```sql
-- Test as specific user
SET role authenticated;
SELECT * FROM companies;  -- Should respect RLS

-- Reset to admin
RESET role;
```

### Custom Functions

**Creating utility functions:**
```sql
CREATE OR REPLACE FUNCTION get_company_age(founded_year INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM CURRENT_DATE) - founded_year;
END;
$$ LANGUAGE plpgsql;
```

---

## Migration Rollback

### Safe Rollback Process

**For development:**
```bash
# Reset database to clean state
supabase db reset

# Apply migrations up to specific point
# (Remove unwanted migration files temporarily)
supabase db push
```

**For production:**
- Create rollback migration
- Test in staging first
- Coordinate with team
- Have data backup ready

### Writing Rollback Migrations

```sql
-- File: supabase/migrations/20250104000018_rollback_company_website.sql
-- Rollback: Remove website_url column added in previous migration

ALTER TABLE companies DROP COLUMN IF EXISTS website_url;
DROP INDEX IF EXISTS idx_companies_website;
```

---

## Key Principles

1. **Migrations are the source of truth** - They define what actually gets applied
2. **Generated types reflect reality** - They're created from the live database state  
3. **Always regenerate types after schema changes** - Ensures frontend stays in sync
4. **Test migrations in development first** - Never test directly in production
5. **Use descriptive migration names** - Make changes easy to understand

---

**Need more help?** Check the [Troubleshooting Guide](troubleshooting.md) or [Database Schema Reference](../reference/database-schema.md). 