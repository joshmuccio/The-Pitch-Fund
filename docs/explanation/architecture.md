# 🏗️ Architecture Overview

This document explains the system architecture, design decisions, and technology choices behind The Pitch Fund platform.

## System Overview

The Pitch Fund is a full-stack web application built to manage investment portfolio data for a venture capital fund. It provides both public-facing content and private administrative tools for investment management.

### Core Purpose
- **Track investments** in startups featured on The Pitch podcast
- **Manage portfolio** data including companies, founders, and investment terms
- **Provide transparency** to LPs through public portfolio pages
- **Streamline data entry** with AI-powered parsing and validation

---

## Technology Stack

### Frontend Architecture
```
Next.js 14 (App Router)
├── React 18 (Server/Client Components)
├── TypeScript (Type Safety)
├── Tailwind CSS (Styling)
├── React Hook Form + Zod (Form Validation)
└── Cursor AI (Development Assistant)
```

### Backend Architecture
```
Supabase (Backend-as-a-Service)
├── PostgreSQL (Database)
├── Authentication (Row Level Security)
├── Real-time subscriptions
├── Edge Functions (Serverless)
└── Storage (File uploads)
```

### Supporting Services
```
Vercel (Deployment & Edge Functions)
├── Sentry (Error Monitoring)
├── Beehiiv (Email Marketing)
├── Google Analytics (Analytics)
├── Terminal Logger (Development Debugging)
└── Cloudflare (CDN & Security)
```

---

## Application Architecture

### Layered Architecture Pattern

```
┌─────────────────────────────────────────┐
│              Presentation Layer          │
│  (Next.js Pages, Components, UI)        │
├─────────────────────────────────────────┤
│              Application Layer           │
│  (API Routes, Server Actions, Hooks)    │
├─────────────────────────────────────────┤
│              Business Logic Layer        │
│  (Validation, Parsing, Utilities)       │
├─────────────────────────────────────────┤
│              Data Access Layer           │
│  (Supabase Client, Database Helpers)    │
├─────────────────────────────────────────┤
│              Infrastructure Layer        │
│  (Supabase Database, Vercel, Sentry)    │
└─────────────────────────────────────────┘
```

### Key Components

**1. Public Website**
- Homepage with newsletter signup
- Portfolio page showing investments
- SEO-optimized static pages
- Responsive design

**2. Admin Dashboard**
- Investment creation wizard
- Portfolio management
- Founder management
- Data export capabilities

**3. Data Processing**
- AngelList memo parsing
- Form validation and sanitization
- Currency formatting
- Date/time handling

**4. Infrastructure**
- Database with RLS policies
- Email subscription API
- Error monitoring
- Performance analytics

---

## Database Design Philosophy

### Core Principles

**1. Normalization** - Separate entities for companies, founders, and investments
**2. Flexibility** - JSONB fields for varying data structures
**3. Performance** - Strategic indexing and query optimization
**4. Security** - Row Level Security (RLS) for data access control

### Entity Relationship Model

```
companies (1) ──────── (M) investments
    │                       │
    │                       │
    └─── (1:M) ────── founders
                       │
                       │
            founder_updates (M)
```

### Data Consistency Strategy

- **Single Source of Truth**: Companies table contains canonical company data
- **Immutable Investments**: Investment records are append-only with audit trails
- **Flexible Founder Data**: Founders can be associated with multiple companies
- **Temporal Data**: Timestamps track when data was created/modified

---

## Security Architecture

### Authentication & Authorization

**Row Level Security (RLS)**
```sql
-- Example: Only authenticated users can view companies
CREATE POLICY "Users can view all companies" ON companies
  FOR SELECT USING (true);

-- Only authenticated users can insert
CREATE POLICY "Authenticated users can insert companies" ON companies
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

**API Security**
- All API routes validate authentication
- Input validation using Zod schemas
- Rate limiting on public endpoints
- CORS configuration for external integrations

### Data Protection

**Environment Variables**
- Sensitive keys stored in environment variables
- Separate environments for dev/staging/prod
- No hardcoded secrets in source code

**Database Security**
- Connection pooling and SSL encryption
- Backup and recovery procedures
- Audit logging for sensitive operations

---

## Performance Architecture

### Frontend Performance

**Next.js Optimizations**
- Server Components for initial page loads
- Static generation for public pages
- Dynamic imports for code splitting
- Image optimization with next/image

**Caching Strategy**
- Static assets cached at CDN level
- Database queries cached in memory
- API responses cached with appropriate headers

### Database Performance

**Query Optimization**
- Composite indexes for multi-column queries
- GIN indexes for array/JSON searches
- Vector indexes for AI-powered search
- Connection pooling to handle load

**Monitoring & Alerting**
- Sentry for error tracking
- Vercel Analytics for performance metrics
- Custom dashboard for business metrics

---

## Integration Architecture

### External Services

**Email Marketing (Beehiiv)**
```typescript
// Newsletter subscription flow
User submits email → Validation → Beehiiv API → Database logging
```

**Error Monitoring (Sentry)**
```typescript
// Error tracking flow
Error occurs → Sentry capture → Alert → Dashboard → Resolution
```

**Analytics (Google Analytics)**
```typescript
// Event tracking flow
User action → GA4 event → Data collection → Reporting
```

### API Design

**RESTful Endpoints**
- `/api/subscribe` - Newsletter subscription
- `/api/investments` - Investment CRUD operations
- `/api/companies` - Company management
- `/api/founders` - Founder management

**Error Handling**
- Consistent error response format
- Appropriate HTTP status codes
- Detailed error messages in development
- Sanitized errors in production

---

## Development Architecture

### Code Organization

```
src/
├── app/                 # Next.js App Router pages
│   ├── (public)/        # Public pages
│   ├── admin/           # Admin dashboard
│   └── api/             # API routes
├── components/          # Reusable UI components
├── lib/                 # Utility functions and schemas
├── hooks/               # Custom React hooks
└── types/               # TypeScript definitions
```

### Development Workflow

**1. Local Development**
```bash
npm run dev → Development server
supabase start → Local database
```

**2. Testing**
```bash
npm run test → Unit tests
npm run test:e2e → End-to-end tests
```

**3. Deployment**
```bash
git push → Vercel deployment
supabase db push → Database migrations
```

### Quality Assurance

**Code Quality**
- TypeScript for type safety
- ESLint and Prettier for consistency
- Husky for pre-commit hooks
- Automated testing in CI/CD

**Data Quality**
- Zod schemas for validation
- Database constraints and checks
- Error boundaries in React components
- Comprehensive error logging

---

## Scalability Considerations

### Horizontal Scaling

**Database Scaling**
- Supabase handles connection pooling
- Read replicas for query performance
- Partitioning for large datasets

**Application Scaling**
- Vercel Edge Functions for global distribution
- Stateless server components
- CDN for static assets

### Vertical Scaling

**Performance Optimization**
- Query optimization and indexing
- Component memoization
- Lazy loading for large datasets
- Image optimization and compression

### Monitoring & Observability

**Key Metrics**
- Response times and error rates
- Database query performance
- User engagement metrics
- Business KPIs (investments, portfolio value)

**Alerting Strategy**
- Error rate thresholds
- Performance degradation alerts
- Database health monitoring
- Business metric anomalies

---

## Future Architecture Considerations

### Planned Enhancements

**AI Integration**
- Enhanced memo parsing with GPT-4
- Automated founder research and enrichment
- Investment recommendation engine
- Automated due diligence summaries

**Advanced Analytics**
- Real-time dashboard for LPs
- Performance tracking and benchmarking
- Predictive analytics for portfolio companies
- Integration with external data sources

### Technical Debt Management

**Regular Maintenance**
- Dependency updates and security patches
- Database performance optimization
- Code refactoring and modernization
- Documentation updates

**Migration Strategy**
- Gradual migration to new technologies
- Backward compatibility during transitions
- Comprehensive testing of changes
- Rollback procedures for emergencies

---

## Key Design Decisions

### Why Next.js 14?
- **App Router**: Better performance and developer experience
- **Server Components**: Reduced client-side JavaScript
- **Built-in Optimization**: Image optimization, fonts, analytics
- **Vercel Integration**: Seamless deployment and scaling

### Why Supabase?
- **PostgreSQL**: Full-featured relational database
- **Real-time**: WebSocket support for live updates
- **Authentication**: Built-in user management
- **Row Level Security**: Fine-grained access control

### Why TypeScript?
- **Type Safety**: Catch errors at compile time
- **Developer Experience**: Better IDE support and autocompletion
- **Maintainability**: Easier to refactor and understand code
- **Integration**: Excellent support with React and Next.js

---

**Related Documentation:**
- [Database Design](database-design.md) - Detailed schema and relationships
- [Investment Workflow](investment-workflow.md) - Business process explanation
- [Getting Started](../tutorials/getting-started.md) - Setting up the development environment 