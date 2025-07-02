# Database Schema Update - January 2025

## Summary of Changes

This update modifies the `companies` table to support enhanced business metrics tracking and AI-powered semantic search.

### New Columns Added
- `annual_revenue_usd` (numeric) - Last known annual recurring revenue
- `users` (integer) - Total user count 
- `last_scraped_at` (timestamptz) - Timestamp for cron job tracking
- `total_funding_usd` (numeric) - Total funding raised to date

### Schema Changes
- **Description field**: Converted from `text` to `vector(1536)` for AI embeddings
- **Description backup**: Added `description_backup` text field to preserve original descriptions
- **Status field**: Changed from free-text to enum constraint: `CHECK (status IN ('active', 'acquihired', 'exited', 'dead'))`

### Removed Columns
- `is_active` (boolean) - Replaced by status enum
- Old `status` (text) - Replaced with constrained enum

### New Indexes
- `idx_companies_annual_revenue` - For revenue-based queries
- `idx_companies_users` - For user-based filtering  
- `idx_companies_last_scraped_at` - For cron job optimization
- `idx_companies_total_funding` - For funding-based queries
- `idx_companies_status` - For status-based filtering
- `idx_companies_description_vector` - Vector similarity search (IVFFLAT)

## How to Apply

### 1. Run the Migration
```bash
# Apply the migration to your Supabase database
supabase db push

# Or manually run the migration file
psql -f supabase/migrations/20250104000000_update_companies_schema.sql
```

### 2. Verify the Changes
```sql
-- Check new columns exist
\d companies

-- Verify status constraint
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE table_name = 'companies';

-- Test vector similarity (after adding data)
SELECT name, description <=> '[0.1,0.2,...]' as similarity 
FROM companies 
WHERE description IS NOT NULL 
ORDER BY similarity 
LIMIT 5;
```

### 3. Data Migration Notes

**Important**: Existing description data has been backed up to `description_backup` before conversion to vector format. You'll need to:

1. **Convert text descriptions to embeddings**: Use OpenAI's text-embedding-ada-002 model to generate 1536-dimension vectors
2. **Update description field**: Insert the generated vectors into the `description` column
3. **Set default status**: Update any NULL status values to 'active' or appropriate status

### 4. Admin Interface Updates

The admin interface has been updated to include:
- New business metrics fields (revenue, users, total funding)
- Status dropdown with proper enum values
- Description field now uses `description_backup` for text input
- Form validation for new numeric fields

### 5. Required Environment Variables

No new environment variables required for this update.

## Rollback Plan

If you need to rollback these changes:

```sql
-- Restore original schema (WARNING: This will lose vector data)
ALTER TABLE companies ADD COLUMN description_text text;
UPDATE companies SET description_text = description_backup;
ALTER TABLE companies DROP COLUMN description;
ALTER TABLE companies DROP COLUMN description_backup;
ALTER TABLE companies RENAME COLUMN description_text TO description;

-- Restore old status/is_active fields
ALTER TABLE companies ADD COLUMN is_active boolean DEFAULT true;
-- Note: You'll need to manually map status enum back to is_active boolean

-- Drop new columns
ALTER TABLE companies DROP COLUMN annual_revenue_usd;
ALTER TABLE companies DROP COLUMN users;
ALTER TABLE companies DROP COLUMN last_scraped_at;
ALTER TABLE companies DROP COLUMN total_funding_usd;
```

## Next Steps

1. **Generate embeddings**: Create a script to convert existing `description_backup` text to vectors
2. **Update queries**: Modify any existing queries that reference the old schema
3. **Test thoroughly**: Verify all admin functionality works with new schema
4. **Monitor performance**: Check query performance with new indexes

## Files Modified

- `supabase/migrations/20250104000000_update_companies_schema.sql` - New migration
- `supabase/sql/schema.sql` - Updated schema documentation  
- `src/app/admin/components/CompanyManager.tsx` - Updated admin interface
- `DATABASE_SCHEMA_UPDATE.md` - This documentation file

---

**Migration Status**: ✅ **SUCCESSFULLY APPLIED** (January 4, 2025)  
**Backward Compatibility**: ⚠️ Breaking changes (requires data migration)  
**Testing Required**: ✅ Test admin interface and portfolio queries

## Migration Results

✅ **Successfully Applied**: January 4, 2025
- All new columns added (`annual_revenue_usd`, `users`, `last_scraped_at`, `total_funding_usd`)
- Description field converted to `vector(1536)` for AI embeddings
- Original descriptions backed up to `description_backup` column
- Status field updated to enum constraint: `('active', 'acquihired', 'exited', 'dead')`
- All indexes created successfully including vector similarity search
- Database views (company_progress_timeline, founder_timeline_analysis, founder_insights) recreated
- Admin interface updated with new form fields 