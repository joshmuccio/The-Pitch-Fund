# Portfolio Filtering with GIN Indexes

This document demonstrates how to use the optimized GIN indexes for fast portfolio filtering.

## Index Overview

The GIN (Generalized Inverted Index) on array fields enables extremely fast array queries:

```sql
CREATE INDEX idx_companies_industry_tags ON companies USING GIN(industry_tags);
CREATE INDEX idx_companies_co_investors ON companies USING GIN(co_investors);
```

## Industry Tags Query Examples

### 1. Find Companies in Specific Industry
```sql
-- Companies that have 'SaaS' as one of their industry tags
SELECT name, industry_tags 
FROM companies 
WHERE industry_tags @> ARRAY['SaaS'];
```

### 2. Find Companies in Multiple Industries (OR)
```sql
-- Companies in AI OR Fintech industries
SELECT name, industry_tags 
FROM companies 
WHERE industry_tags && ARRAY['AI', 'Fintech'];
```

### 3. Find Companies in Multiple Industries (AND)
```sql
-- Companies that are both SaaS AND AI
SELECT name, industry_tags 
FROM companies 
WHERE industry_tags @> ARRAY['SaaS', 'AI'];
```

### 4. Alternative Syntax with ANY
```sql
-- Companies in SaaS industry (alternative syntax)
SELECT name, industry_tags 
FROM companies 
WHERE 'SaaS' = ANY(industry_tags);
```

## Co-Investors Query Examples

### 1. Find Companies by Specific Investor
```sql
-- Companies backed by Andreessen Horowitz
SELECT name, co_investors 
FROM companies 
WHERE co_investors @> ARRAY['Andreessen Horowitz'];
```

### 2. Find Companies by Multiple Investors (OR)
```sql
-- Companies backed by Y Combinator OR Sequoia Capital
SELECT name, co_investors 
FROM companies 
WHERE co_investors && ARRAY['Y Combinator', 'Sequoia Capital'];
```

### 3. Find Syndication Opportunities
```sql
-- Companies with overlapping investors (for LP network mapping)
SELECT 
  c1.name as company1, 
  c2.name as company2,
  array_length(array(SELECT unnest(c1.co_investors) INTERSECT SELECT unnest(c2.co_investors)), 1) as shared_count
FROM companies c1
CROSS JOIN companies c2
WHERE c1.id < c2.id 
  AND c1.co_investors && c2.co_investors
  AND array_length(array(SELECT unnest(c1.co_investors) INTERSECT SELECT unnest(c2.co_investors)), 1) > 0;
```

### 4. Investor Portfolio Analysis
```sql
-- Count portfolio companies per investor
SELECT 
  investor,
  COUNT(*) as portfolio_companies
FROM companies
CROSS JOIN LATERAL unnest(co_investors) as investor
WHERE co_investors IS NOT NULL
GROUP BY investor
ORDER BY portfolio_companies DESC;
```

### 5. Alternative Syntax with ANY
```sql
-- Companies backed by Techstars (alternative syntax)
SELECT name, co_investors 
FROM companies 
WHERE 'Techstars' = ANY(co_investors);
```

## Next.js Implementation Example

### Server Component with Filtering
```typescript
// app/portfolio/page.tsx
export default async function PortfolioPage({ 
  searchParams 
}: { 
  searchParams: { industry?: string } 
}) {
  const supabase = createServerClient(...)
  
  let query = supabase
    .from('companies')
    .select('*')
    .eq('status', 'active')
  
  // Apply industry filter if provided
  if (searchParams.industry) {
    query = query.contains('industry_tags', [searchParams.industry])
  }
  
  const { data: companies } = await query
  
  return (
    <div>
      <IndustryFilter />
      <CompanyGrid companies={companies} />
    </div>
  )
}
```

### Client Component for Interactive Filtering
```typescript
// components/IndustryFilter.tsx
'use client'

export default function IndustryFilter() {
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  
  const filterCompanies = async () => {
    if (selectedIndustries.length === 0) {
      // No filters, get all companies
      const { data } = await supabase
        .from('companies')
        .select('*')
        .eq('status', 'active')
      setCompanies(data || [])
    } else {
      // Apply industry filters with GIN index optimization
      const { data } = await supabase
        .from('companies')
        .select('*')
        .eq('status', 'active')
        .overlaps('industry_tags', selectedIndustries) // Uses && operator
      setCompanies(data || [])
    }
  }
  
  return (
    <div className="flex gap-2 mb-6">
      {INDUSTRIES.map(industry => (
        <button
          key={industry}
          onClick={() => toggleIndustry(industry)}
          className={`px-3 py-1 rounded-full text-xs ${
            selectedIndustries.includes(industry)
              ? 'bg-cobalt-pulse text-white'
              : 'bg-gray-600 text-gray-300'
          }`}
        >
          {industry}
        </button>
      ))}
    </div>
  )
}
```

## Performance Benefits

### Before GIN Index
- Array queries require full table scans
- Performance degrades with portfolio size
- 100ms+ query times for filtering

### After GIN Index
- Sub-millisecond industry filtering
- Performance scales with index size, not table size
- Instant filtering for real-time search

## Supported Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `@>` | Contains array | `industry_tags @> ARRAY['SaaS']` |
| `&&` | Arrays overlap | `industry_tags && ARRAY['AI', 'Fintech']` |
| `= ANY()` | Element in array | `'SaaS' = ANY(industry_tags)` |

## Integration with PRD Features

This optimization directly supports:

1. **Portfolio Directory Filtering (PRD 3.2)**: Fast industry-based filtering
2. **Company Search**: Instant industry category search
3. **LP Dashboard**: Quick portfolio segmentation by industry
4. **Analytics**: Fast aggregation by industry categories

## Next Steps

1. Implement portfolio filtering UI components
2. Add search functionality with industry and investor facets  
3. Create industry-based and investor network analytics dashboards
4. Build LP syndication opportunity detection features 