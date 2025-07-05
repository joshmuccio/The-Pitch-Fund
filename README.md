# The Pitch Fund

A community-powered venture fund backing founders featured on The Pitch podcast.

This is a Next.js application built for managing investment portfolio data with enhanced tracking capabilities.

## Features

### 🚀 Advanced Investment Form System

#### Multi-Step Form Process
- **Step 1: Company & Investment Details** - Complete company information and investment terms
- **Step 2: Founder Information** - Dedicated founder data collection
- **Progress Persistence** - Form data saved to localStorage as you navigate
- **Smart Navigation** - Back/Next buttons with step validation
- **Visual Progress** - Clear progress indicator showing current step

#### Enhanced Investment Tracking
- **5 New Investment Fields**:
  - `round_size_usd` - Full target round size tracking
  - `has_pro_rata_rights` - SAFE/Note pro-rata clause tracking
  - `reason_for_investing` - Internal IC/LP memo storage (4000 chars)
  - `country_of_incorp` - ISO-3166-1 alpha-2 country codes
  - `incorporation_type` - 8 standardized entity types

#### Form Technology
- **React Hook Form** - Modern form state management
- **Zod Validation** - Type-safe validation with auto-complete
- **Conditional Fields** - Different fields based on investment instrument
- **Real-time Validation** - Immediate feedback on errors
- **Form Persistence** - Progress saved between steps

### 📊 Portfolio Management

- Portfolio company management dashboard
- Advanced filtering and search capabilities  
- Real-time founder association tracking
- Investment performance analytics
- Structured data with full-text search

### 🏗️ Technical Architecture

#### Database & Authentication
- **Supabase** - PostgreSQL with Row Level Security
- **Database Migrations** - Complete schema versioning
- **User Authentication** - Secure admin access
- **Production Ready** - Vercel deployment with SSR

#### Frontend Technology
- **Next.js 14** - App Router with React Server Components
- **TypeScript** - Strict typing throughout
- **Tailwind CSS** - Utility-first styling
- **React Hook Form** - Optimized form handling
- **Zod** - Runtime type validation

#### Monitoring & Analytics
- **Sentry** - Error tracking and performance monitoring
- **Vercel Analytics** - User behavior tracking
- **Structured Data** - SEO optimization

## Investment Form Usage

### Creating New Investments

1. **Navigate to Admin**: `/admin/investments/new`
2. **Step 1 - Company Details**:
   - Fill in company information (name, slug, website)
   - Set investment details (amount, instrument, round size)
   - Configure incorporation details
   - Add investment reasoning
3. **Step 2 - Founder Information**:
   - Enter founder email (required)
   - Add founder details (name, LinkedIn, bio)
   - Set founder role and demographics
4. **Submit**: Creates company and founder records with proper relationships

### Editing Existing Investments

1. **Navigate to Edit**: `/admin/investments/[id]/edit`
2. **Multi-step Process**: Same as creation but pre-populated
3. **Update Mode**: Existing founder data loads automatically
4. **Save Changes**: Updates both company and founder information

### Form Features

- **Conditional Fields**: SAFE/Note vs Equity instrument differences
- **Country Selection**: 43 supported countries with ISO validation
- **Incorporation Types**: 8 business entity classifications
- **Validation**: Multi-layer error handling with specific field feedback
- **Progress Persistence**: Form data saved automatically between steps

## Project Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── components/
│   │   │   ├── MultiStepInvestmentForm.tsx    # New multi-step form
│   │   │   ├── CompanyForm.tsx                # Legacy single-step form
│   │   │   ├── AdminDashboard.tsx             # Portfolio management
│   │   │   └── FounderManager.tsx             # Founder-specific management
│   │   ├── investments/
│   │   │   ├── new/page.tsx                   # Create investment
│   │   │   └── [id]/edit/page.tsx             # Edit investment
│   │   └── schemas/
│   │       └── companySchema.ts               # Extended Zod validation
│   ├── api/                                   # API routes
│   └── components/                            # Shared components
├── lib/
│   ├── countries.ts                           # ISO country codes (43 countries)
│   ├── validation-schemas.ts                  # Form validation
│   └── supabase-helpers.ts                   # Database utilities
└── components/                                # Reusable UI components
```

### Key Files

- **`MultiStepInvestmentForm.tsx`** - Main multi-step form component
- **`companySchema.ts`** - Extended validation with all investment fields
- **`countries.ts`** - ISO-3166-1 alpha-2 country codes (43 supported)
- **Database migrations** - Complete schema in `supabase/migrations/`

## Database Schema

### Enhanced Tables

#### `companies` Table
- Standard portfolio company fields
- **5 New Investment Fields**:
  - `round_size_usd` (numeric)
  - `has_pro_rata_rights` (boolean, default false)
  - `reason_for_investing` (text, 4000 char limit)
  - `country_of_incorp` (char(2), ISO codes)
  - `incorporation_type` (enum: 8 entity types)

#### `founders` Table
- Complete founder information
- Email, name, LinkedIn, role, bio
- Demographics tracking
- Company association via `company_founders` junction table

#### Key Features
- **Row Level Security** - Secure data access
- **GIN Indexes** - Optimized search performance
- **Enum Types** - Standardized categorical data
- **JSON Fields** - Flexible data storage

## Development

### Prerequisites

- Node.js 18+
- Supabase account
- Vercel account (for deployment)

### Setup

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd the-pitch-fund
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   # Add your Supabase and other environment variables
   ```

4. **Database setup**
   ```bash
   # Run migrations in Supabase SQL Editor
   # Files in supabase/migrations/ in chronological order
   ```

5. **Development server**
   ```bash
   npm run dev
   ```

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Sentry (optional)
SENTRY_DSN=your_sentry_dsn

# Analytics (optional)
VERCEL_ANALYTICS_ID=your_analytics_id
```

## Recent Updates

### Week 4 - Multi-Step Investment Form
- ✅ **Multi-step form system** with progress saving
- ✅ **Founder information step** with dedicated UI
- ✅ **Form persistence** using localStorage
- ✅ **Enhanced validation** with step-specific error handling
- ✅ **5 new investment fields** fully integrated
- ✅ **Countries support** with 43 ISO-validated options
- ✅ **Type safety** throughout form handling

### Week 3 - Investment Fields Enhancement
- ✅ **5 comprehensive investment tracking fields**
- ✅ **React Hook Form integration** for better UX
- ✅ **Advanced validation** with Zod schemas
- ✅ **Country incorporation tracking** with ISO standards
- ✅ **Entity type standardization** (8 business types)

### Previous Weeks
- Authentication system with Supabase
- Portfolio management dashboard
- Database schema optimization
- Sentry error monitoring
- Vercel deployment pipeline

## Contributing

1. Create feature branch
2. Make changes with tests
3. Update documentation
4. Submit pull request

## License

Private repository - The Pitch Fund

---

**The Pitch Fund** - Backing world-class startups you hear on The Pitch podcast.