# Security Definer View Fix

## Problem

Supabase security linter detected multiple views with `SECURITY DEFINER` property, which is a security concern because:

- Views with `SECURITY DEFINER` run with the permissions of the view creator
- This bypasses Row Level Security (RLS) policies on underlying tables
- Users could potentially access data they shouldn't have permission to see

## Affected Views

The following views were flagged by the Supabase security linter:

1. `public.portfolio_demographics`
2. `public.season_performance` 
3. `public.founder_timeline_analysis`
4. `public.company_progress_timeline`
5. `public.founder_insights`
6. `public.tag_analytics`
7. `public.embedding_size_monitor`
8. `public.timezone_best_practices`

## Solution

Created migration `20250115000000_fix_security_definer_views.sql` that:

1. **Recreates all views with `SECURITY INVOKER`** (default behavior)
2. **Ensures views respect RLS policies** on underlying tables
3. **Maintains data security** through existing RLS policies

## Security Impact

### Before Fix
- Views ran with creator permissions (`SECURITY DEFINER`)
- Could bypass RLS policies
- Potential data exposure risk

### After Fix  
- Views run with user permissions (`SECURITY INVOKER`)
- Respect RLS policies on all underlying tables
- Users only see data they have permission to access

## RLS Policy Overview

The views now properly respect these RLS policies:

| Table | Read Access | Write Access |
|-------|-------------|--------------|
| `companies` | Public | Admin only |
| `founders` | Admin only | Admin only |
| `company_founders` | Admin only | Admin only |
| `founder_updates` | LP/Admin | Admin only |
| `embeddings` | LP/Admin | Admin only |

## Data Access by Role

### Public Users
- Can access: `companies` table data
- Cannot access: Founder data, updates, embeddings, KPIs
- Views will only show company-related analytics

### LP Users  
- Can access: Companies, founder updates, embeddings, KPIs
- Cannot access: Founder personal data (admin only)
- Views will show portfolio analytics and insights

### Admin Users
- Can access: All data
- Can modify: All data
- Views will show complete analytics

## Secure Functions for LP-Only Data

For sensitive data that requires explicit permission checking, continue using these secure functions:

- `get_founder_timeline_analysis()` - LP/Admin only
- `get_company_progress_timeline()` - LP/Admin only  
- `get_founder_insights()` - LP/Admin only

These functions have explicit permission checks and use `SECURITY DEFINER` intentionally for controlled access.

## Migration Details

The migration:
1. Recreates all 8 affected views
2. Uses `CREATE OR REPLACE VIEW` to ensure clean replacement
3. Maintains all existing functionality and data
4. Adds security-focused comments to each view
5. Preserves all indexes and performance optimizations

## Testing

After applying the migration:

1. **Verify views work correctly** for different user roles
2. **Confirm RLS policies are respected** - users only see permitted data
3. **Check that Supabase security linter** no longer flags these views
4. **Test application functionality** to ensure no breaking changes

## Rollback Plan

If issues arise, the migration can be rolled back by:
1. Reverting the migration file
2. Recreating views with previous definitions
3. Testing to ensure functionality is restored

## Best Practices Going Forward

1. **Always use `SECURITY INVOKER`** for views unless there's a specific need for `SECURITY DEFINER`
2. **Rely on RLS policies** for data access control rather than view permissions
3. **Use secure functions** with explicit permission checks for sensitive operations
4. **Test views with different user roles** to ensure proper access control
5. **Monitor Supabase security linter** for future security issues