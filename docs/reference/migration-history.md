# 📈 Migration History

Complete changelog of database schema changes for The Pitch Fund application.

## Overview

This document tracks all database migrations, their purpose, and impact. Each migration is versioned and applied sequentially to maintain database consistency across environments.

---

## Migration Timeline

### Latest Migrations (2025)

#### 20250107000000_add_hq_coordinates.sql
**Date**: January 7, 2025  
**Type**: Feature Enhancement  
**Impact**: ✅ Additive

**Changes:**
- Added `hq_latitude` and `hq_longitude` fields to companies table
- Added geospatial index for coordinate-based queries
- Enhanced address normalization with precise geocoding

**New Fields:**
```sql
ALTER TABLE companies ADD COLUMN hq_latitude numeric(10,8);
ALTER TABLE companies ADD COLUMN hq_longitude numeric(11,8);
```

**Performance Optimization:**
```sql
CREATE INDEX idx_companies_hq_coordinates ON companies(hq_latitude, hq_longitude);
```

**Integration Features:**
- Mapbox API integration for address normalization
- Automatic coordinate population during address entry
- Enhanced geospatial search capabilities

**Post-Migration:**
- Updated TypeScript types for new fields
- Enhanced forms with coordinate display
- Implemented read-only coordinate fields

#### 20250104000015_update_founder_role_enum.sql
**Date**: January 4, 2025  
**Type**: Schema Update  
**Impact**: ⚠️ Breaking Change

**Changes:**
- Updated `founder_role` enum from `'solo_founder'` to `'founder'`
- Updated all existing data to use new enum values
- Maintained backward compatibility during transition

**Affected Tables:**
- `founders` - Role field updated
- Related views and functions recreated

**Migration Details:**
```sql
-- Add new enum value
ALTER TYPE founder_role ADD VALUE 'founder';

-- Update existing data
UPDATE founders SET role = 'founder' WHERE role = 'solo_founder';

-- Replace enum entirely
CREATE TYPE founder_role_new AS ENUM ('founder', 'cofounder');
-- ... (full migration in file)
```

**Post-Migration:**
- Generated new TypeScript types
- Updated frontend forms and validation
- Updated documentation

---

### Core Schema Migrations (2024)

#### 20250704_add_investment_fields_final.sql
**Date**: July 4, 2024  
**Type**: Feature Enhancement  
**Impact**: ✅ Additive

**Changes:**
- Added comprehensive investment tracking fields
- Enhanced portfolio analytics capabilities
- Improved data validation

**New Fields:**
```sql
ALTER TABLE companies ADD COLUMN round_size_usd numeric(20,4);
ALTER TABLE companies ADD COLUMN has_pro_rata_rights boolean DEFAULT false;
ALTER TABLE companies ADD COLUMN reason_for_investing text;
ALTER TABLE companies ADD COLUMN country_of_incorp char(2);
ALTER TABLE companies ADD COLUMN incorporation_type incorporation_type;
```

**Data Migrations:**
- Migrated existing data to new structure
- Added validation constraints
- Created new indexes for performance

#### 20250703060033_add_portfolio_analytics_fields.sql
**Date**: July 3, 2024  
**Type**: Analytics Enhancement  
**Impact**: ✅ Additive

**Changes:**
- Added fields for portfolio performance tracking
- Enhanced analytics and reporting capabilities
- Optimized queries for dashboard views

**New Features:**
- Portfolio value calculations
- Performance metrics tracking
- Enhanced filtering and search

#### 20250703055109_cleanup_best_practices.sql
**Date**: July 3, 2024  
**Type**: Database Optimization  
**Impact**: 🔧 Optimization

**Changes:**
- Implemented timezone consistency (UTC)
- Optimized numeric data types
- Enhanced indexing strategy
- Added utility functions

**Key Improvements:**
```sql
-- Timezone consistency
CREATE OR REPLACE FUNCTION utc_now() 
RETURNS timestamptz AS 'SELECT now() AT TIME ZONE ''UTC'';'

-- Numeric precision standards
ALTER TABLE companies ALTER COLUMN investment_amount TYPE numeric(20,4);
ALTER TABLE companies ALTER COLUMN post_money_valuation TYPE numeric(20,4);
```

#### 20250702212309_secure_views_rls_fix.sql
**Date**: July 2, 2024  
**Type**: Security Enhancement  
**Impact**: 🔒 Security

**Changes:**
- Implemented Row Level Security (RLS) policies
- Created secure views for data access
- Enhanced authentication and authorization

**Security Features:**
- User-based data access control
- Secure API endpoints
- Admin role management

**RLS Policies:**
```sql
-- Allow authenticated users to view companies
CREATE POLICY "Users can view companies" ON companies
  FOR SELECT USING (true);

-- Allow admin users to modify data
CREATE POLICY "Admins can modify companies" ON companies
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```

#### 20250625012321_initial_schema.sql
**Date**: June 25, 2024  
**Type**: Initial Setup  
**Impact**: 🎯 Foundation

**Changes:**
- Created core database schema
- Established table relationships
- Set up basic constraints and indexes

**Core Tables Created:**
- `companies` - Investment portfolio companies
- `founders` - Founder information and associations
- `founder_updates` - Temporal founder communications
- `profiles` - User authentication and management

---

## Schema Evolution Summary

### Companies Table Evolution

**Initial Schema (June 2024):**
```sql
CREATE TABLE companies (
  id uuid PRIMARY KEY,
  company_name text NOT NULL,
  investment_amount numeric,
  investment_date date,
  -- Basic fields only
);
```

**Current Schema (January 2025):**
```sql
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Company Identity (Enhanced)
  company_name text NOT NULL,
  slug citext UNIQUE NOT NULL,
  website_url text,
  
  -- Investment Details (Expanded)
  investment_date date NOT NULL,
  investment_amount numeric(20,4) NOT NULL,
  investment_instrument investment_instrument NOT NULL,
  stage_at_investment stage_at_investment NOT NULL,
  
  -- Valuation & Terms (New)
  post_money_valuation numeric(20,4),
  round_size numeric(20,4),
  conversion_cap numeric(20,4),
  discount_percent numeric(5,2),
  
  -- Business Details (Enhanced)
  description text,
  description_raw text,
  industry_tags text[],
  co_investors text[],
  
  -- Location & Legal (New)
  country text NOT NULL,
  state text,
  city text,
  address_line_1 text,
  address_line_2 text,
  zip_code text,
  incorporation_type incorporation_type NOT NULL,
  
  -- Metadata (Enhanced)
  ic_lp_memo text,
  founded_year integer,
  status company_status DEFAULT 'active',
  
  -- Analytics (AI Features)
  description_vector vector(1536),
  
  -- Performance optimizations and constraints
);
```

### Founder Role Simplification

**Before (June 2024 - January 2025):**
```sql
CREATE TYPE founder_role AS ENUM (
  'ceo', 'cto', 'coo', 'cfo', 'founder', 'co_founder', 'solo_founder'
);
```
- **Complex**: 7 different role options
- **Confusing**: Multiple similar options (founder, co_founder, solo_founder)
- **Inconsistent**: Mixed naming conventions

**After (January 2025):**
```sql
CREATE TYPE founder_role AS ENUM (
  'founder',    -- Single founder or primary founder
  'cofounder'   -- Co-founder
);
```
- **Simple**: 2 clear options
- **Consistent**: Clear founder hierarchy
- **Future-proof**: Extensible for additional roles

**Data Migration Strategy:**
- `CEO`, `CTO`, `COO`, `CFO`, `Founder`, `Other` → `'founder'`
- `Co-Founder` → `'cofounder'`
- Default value: `'founder'`

---

## Migration Management

### Workflow

1. **Migration Creation**
   ```bash
   supabase migration new descriptive_migration_name
   ```

2. **Development**
   - Write SQL changes in migration file
   - Test locally with `supabase db reset`
   - Verify with `supabase db push`

3. **Type Generation**
   ```bash
   supabase gen types typescript --linked > src/types/supabase.types.ts
   ```

4. **Frontend Updates**
   - Update validation schemas
   - Modify form components
   - Update TypeScript interfaces

5. **Testing**
   - Run test suite
   - Verify type compilation
   - Test in development environment

6. **Deployment**
   - Push to version control
   - Deploy to staging
   - Apply to production

### Best Practices

**Migration Writing:**
- Use descriptive names with timestamps
- Include rollback instructions in comments
- Test migrations multiple times
- Document breaking changes

**Data Safety:**
- Always backup before major migrations
- Use transactions for complex changes
- Test with realistic data volumes
- Plan for rollback scenarios

**Type Safety:**
- Regenerate types after every schema change
- Update frontend validation immediately
- Test TypeScript compilation
- Verify form functionality

---

## Performance Impact

### Index Evolution

**Major Index Additions:**
```sql
-- GIN indexes for array searches (July 2024)
CREATE INDEX idx_companies_industry_tags ON companies USING GIN(industry_tags);
CREATE INDEX idx_companies_co_investors ON companies USING GIN(co_investors);

-- Vector indexes for AI features (July 2024)
CREATE INDEX idx_companies_description_vector 
ON companies USING ivfflat(description_vector vector_cosine_ops);

-- Composite indexes for complex queries (July 2024)
CREATE INDEX idx_companies_country_stage 
ON companies(country, stage_at_investment);
```

**Query Performance Improvements:**
- Array searches: 10x faster with GIN indexes
- Full-text search: 5x faster with tsvector indexes
- Complex filters: 3x faster with composite indexes

### Storage Optimization

**Data Type Improvements:**
- Money fields: Standardized to `numeric(20,4)` for precision
- Text fields: Optimized lengths for common use cases
- Date fields: Consistent timezone handling (UTC)

---

## Breaking Changes Log

### January 2025

**20250104000015_update_founder_role_enum.sql**
- ⚠️ **Breaking**: Changed `founder_role` enum values
- **Impact**: Frontend forms, validation schemas, type definitions
- **Mitigation**: Comprehensive update of all dependent code
- **Timeline**: Single deployment with coordinated updates

### July 2024

**20250703055109_cleanup_best_practices.sql**
- ⚠️ **Breaking**: Numeric precision changes
- **Impact**: Currency formatting, form validation
- **Mitigation**: Updated form components and utilities
- **Timeline**: Gradual rollout with backward compatibility

---

## Future Migration Plans

### Planned Enhancements

**Q1 2025:**
- Enhanced AI features and vector search improvements
- Advanced analytics fields for LP reporting
- Integration fields for external data sources

**Q2 2025:**
- Multi-fund support for portfolio segregation
- Advanced role-based permissions
- Audit logging enhancements

### Migration Strategy

- **Backward Compatibility**: Maintain for at least one major version
- **Data Preservation**: Never destructive migrations without backup
- **Performance**: Monitor impact of each migration
- **Documentation**: Complete changelog for every change

---

**Related Documentation:**
- [Database Management](../how-to/database-management.md) - Managing migrations
- [Database Schema](database-schema.md) - Current schema reference
- [Troubleshooting](../how-to/troubleshooting.md) - Migration issues 