# Schema Mismatch Fix: companies.is_active Column Error

## Problem Summary

The error "column companies.is_active does not exist" was occurring when admin users tried to access the `/companies` page because of a **database schema migration mismatch**.

## Root Cause

The issue was caused by a schema evolution that wasn't properly synchronized with the frontend code:

1. **Initial Migration (20250102000000)**: Added `is_active` boolean column to the `companies` table
2. **Later Migration (20250104000000)**: **Removed** the `is_active` column and replaced it with a `status` enum column
3. **Frontend Code**: Still trying to query the old `is_active` column that no longer existed

## Migration Timeline

### Before (Old Schema)
```sql
-- companies table had:
is_active BOOLEAN DEFAULT true

-- Queries used:
.select('..., is_active')
.eq('is_active', true)
```

### After (New Schema)  
```sql
-- companies table now has:
status TEXT CHECK (status IN ('active', 'acquihired', 'exited', 'dead')) DEFAULT 'active'

-- Queries should use:
.select('..., status')
.eq('status', 'active')
```

## Files Fixed

### 1. `/workspace/src/app/portfolio/page.tsx`
**Problem**: Selecting `is_active` and filtering by `is_active = true`
**Fix**: Changed to select `status` and filter by `status = 'active'`

```typescript
// Before
.select(`
  ...,
  is_active
`)
.eq('is_active', true)

// After  
.select(`
  ...,
  status
`)
.eq('status', 'active')
```

### 2. `/workspace/src/app/lp/dashboard/page.tsx`
**Problem**: Same issue as portfolio page
**Fix**: Same changes - replaced `is_active` with `status`

```typescript
// Before
.select(`
  ...,
  is_active,
  ...
`)
.eq('is_active', true)

// After
.select(`
  ...,
  status,
  ...
`)
.eq('status', 'active')
```

## Files That Were Already Correct

### TypeScript Types (`/workspace/src/lib/supabase.types.ts`)
✅ **Already correct** - The types were properly updated to use `status` enum instead of `is_active`

### Admin Components
✅ **Already correct** - The admin components were already using the new `status` field:
- `CompanyManager.tsx` - Uses `company.status === 'active'`
- `AdminDashboard.tsx` - Uses `company.status === 'active'`
- `UnifiedInvestmentForm.tsx` - Uses `status: 'active'`

### Schema Definitions
✅ **Already correct** - The schema files properly define the new enum:
- `companySchema.ts` - Uses `z.enum(['active', 'acquihired', 'exited', 'dead'])`

## Important Notes

### `company_founders` Table Still Has `is_active`
The `company_founders` table correctly retains the `is_active` boolean column, which is used to track whether a founder is still active at a company. This is different from the company's overall status.

```sql
-- This is correct and should remain:
company_founders.is_active BOOLEAN DEFAULT true
```

### Status Enum Values
The new `status` column uses these enum values:
- `'active'` - Company is still operating
- `'acquihired'` - Company was acquired for talent
- `'exited'` - Company had a successful exit
- `'dead'` - Company is no longer operating

## Testing
After these fixes, the admin users should be able to:
1. Load the `/companies` page without errors
2. View the portfolio page with active companies
3. Access the LP dashboard with proper company filtering

## Prevention
To prevent similar issues in the future:
1. Always update frontend code when database schema changes
2. Use TypeScript types to catch schema mismatches early
3. Test all endpoints after running migrations
4. Consider using database schema validation tools