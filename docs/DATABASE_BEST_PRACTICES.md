# Database Best Practices

This document outlines the database best practices implemented in The Pitch Fund schema.

## ✅ Timezone Management

### **Always Use UTC for Storage**
- All `timestamptz` columns store data in UTC
- Use provided utility functions for consistent timezone handling

### **Utility Functions**
```sql
-- Convert external timestamps to UTC
SELECT ensure_utc_timestamp('2024-01-15 14:30:00-05:00');

-- Get current UTC timestamp
SELECT utc_now();

-- Parse external timestamp strings safely
SELECT safe_parse_timestamp('2024-01-15 14:30:00', 'America/New_York');
```

### **Data Ingestion Best Practices**
```typescript
// ✅ Next.js API Route Example
export async function POST(request: Request) {
  const scrapedData = await request.json();
  
  // Always convert to UTC before storage
  const { data, error } = await supabase
    .from('companies')
    .update({
      last_scraped_at: new Date(scrapedData.timestamp).toISOString(), // UTC
      annual_revenue_usd: scrapedData.revenue
    })
    .eq('id', companyId);
}
```

```sql
-- ✅ Direct SQL Example
UPDATE companies 
SET last_scraped_at = ensure_utc_timestamp(scraped_timestamp_from_api)
WHERE id = company_id;
```

## 🔢 Numeric Data Types

### **Consistent Terminology**
- ✅ Use `numeric(precision, scale)` - PostgreSQL standard
- ❌ Avoid `DECIMAL` - inconsistent terminology

### **Precision Standards**
```sql
-- Money amounts (supports up to $999T with 4 decimal precision)
numeric(20,4)    -- investment_amount, post_money_valuation, etc.

-- Sentiment scores (AI analysis range -1.000 to 1.000)
numeric(4,3)     -- sentiment_score

-- Percentages (0.00 to 100.00)
numeric(5,2)     -- any percentage fields

-- Generic metrics (flexible precision)
numeric(20,4)    -- kpi_values.value for consistency
```

### **Why These Standards?**
- **JavaScript Compatibility**: Avoids float precision issues
- **Future-Proofing**: Handles unicorn+ valuations ($1B+)
- **AI-Friendly**: Precise sentiment analysis scores
- **Consistent Calculations**: Same precision across all money fields

## 📊 Example Use Cases

### **Data Scraping Pipeline**
```typescript
// Scraping company financials
async function updateCompanyMetrics(companyId: string, externalData: any) {
  const { data, error } = await supabase
    .rpc('update_company_from_external', {
      company_id: companyId,
      revenue: parseFloat(externalData.revenue), // Will be stored as numeric(20,4)
      scraped_at: new Date().toISOString(), // UTC timestamp
      source_timezone: externalData.timezone || 'UTC'
    });
}
```

### **Founder Update Processing**
```sql
-- Insert founder update with proper timezone handling
INSERT INTO founder_updates (
  company_id,
  period_start,
  sentiment_score,
  created_at
) VALUES (
  $1,
  safe_parse_timestamp($2, 'America/New_York'), -- Convert to UTC
  $3::numeric(4,3), -- Precise sentiment score
  utc_now() -- Explicit UTC timestamp
);
```

## 🛡️ Security Integration

These best practices integrate with your existing RLS policies:
- Timezone utilities work with all user roles
- Numeric precision maintains data integrity across public/private data
- UTC storage prevents timezone-based data leaks

## 📋 Checklist for New Features

When adding new database features:

- [ ] Use `timestamptz` for all timestamp columns
- [ ] Apply `ensure_utc_timestamp()` when ingesting external data
- [ ] Use `numeric(precision,scale)` instead of `DECIMAL`
- [ ] Follow precision standards: `numeric(20,4)` for money, `numeric(4,3)` for scores
- [ ] Add appropriate RLS policies for LP/Admin access
- [ ] Test timezone conversion with external data sources
- [ ] Document any new timezone-sensitive operations

## 🔍 Monitoring

Query the built-in documentation view:
```sql
-- View all timezone best practices
SELECT * FROM timezone_best_practices;
```

Check for any remaining inconsistencies:
```sql
-- Verify all timestamps are UTC
SELECT schemaname, tablename, columnname, data_type 
FROM information_schema.columns 
WHERE data_type IN ('timestamp without time zone')
AND table_schema = 'public';
-- Should return no results ✅
``` 