# The Pitch Fund

> **A Next.js 14 application for venture capital portfolio management with role-based access for Limited Partners (LPs) and public company showcasing.**

**🎯 Goal:** Spin up the full-stack dev environment (Next.js 14 + Supabase + Beehiiv + Vercel) for **thepitch.fund** in < 30 min.

---

## 🏗️ Tech Stack

- **Frontend**: Next.js 14.2.30 with TypeScript & Tailwind CSS
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth  
- **Email Marketing**: Beehiiv API integration
- **Testing**: Cypress E2E testing with GitHub Actions CI/CD
- **Deployment**: Vercel with Edge Runtime
- **AI Features**: Vector embeddings for Q&A (pgvector)

---

## ✨ New Features

### 📧 Email Subscription System
- **Beehiiv Integration**: Professional newsletter management with API integration
- **Multi-layer Validation**: Client-side, server-side, and Beehiiv domain validation
- **Edge Runtime**: Fast, globally distributed API endpoints
- **Error Handling**: Comprehensive validation with user-friendly error messages

### 🧪 Testing & CI/CD
- **Cypress E2E Tests**: Automated testing for subscription flow
- **GitHub Actions**: Continuous integration with automated test runs
- **Quality Assurance**: Form validation, API mocking, and error handling tests

---

## 📋 Quick-Start Setup

| ✅ | Step | Commands & Notes |
|----|------|------------------|
| ✅ | **Clone repo** | ```bash<br>git clone https://github.com/joshmuccio/The-Pitch-Fund.git<br>cd "The Pitch Fund"<br>``` |
| ✅ | **Install dependencies** | ```bash<br>npm install<br>npm audit fix --force  # security patches<br>``` |
| ☐ | **Environment setup** | Create `.env.local`:<br>```env<br>NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co<br>NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...<br>SUPABASE_SERVICE_ROLE_KEY=eyJ...  # optional<br>BEEHIIV_API_TOKEN=your_beehiiv_api_token<br>BEEHIIV_PUBLICATION_ID=pub_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx<br>GOOGLE_ANALYTICS_ID=G-XXXXXXX<br>``` |
| ✅ | **Supabase CLI** | ```bash<br># ❌ DON'T USE: npm i -g supabase (deprecated!)<br>brew install supabase/tap/supabase  # ✅ macOS<br>supabase login<br>supabase init  # answer 'N' to Deno questions<br>``` |
| ✅ | **Database setup** | ```bash<br># ✅ DONE: Migration already applied<br># File: supabase/migrations/20250625012321_initial_schema.sql<br>supabase db push  # if needed<br>``` |
| ☐ | **Create admin user** | 1. Supabase Dashboard → Auth → "Invite User"<br>2. SQL Editor: `insert into profiles (id, role) values ('<user_uid>', 'admin');` |
| ☐ | **Start dev server** | `npm run dev` → [localhost:3000](http://localhost:3000) |
| ☐ | **Deploy to Vercel** | 1. [vercel.com](https://vercel.com) → Import project<br>2. Add environment variables<br>3. Deploy → `https://thepitch-fund.vercel.app` |

---

## 🚀 Development Commands

| Purpose | Command |
|---------|---------|
| **Local development** | `npm run dev` |
| **Production build** | `npm run build && npm start` |
| **Run E2E tests** | `npm run cy:run` |
| **Open Cypress UI** | `npx cypress open` |
| **Database migrations** | `supabase db push` |
| **Local Supabase Studio** | `supabase studio` |
| **Generate types** | `supabase gen types typescript --local > types/supabase.ts` |

---

## 📧 Email Subscription Features

### Beehiiv Integration
- **Professional Newsletter Platform**: Integrated with Beehiiv for email marketing
- **API-First**: Server-side subscription handling with proper error management
- **Edge Runtime**: Fast, globally distributed subscription endpoints

### Validation Layers
1. **Client-side**: Real-time email format validation with regex
2. **Server-side**: Duplicate validation before API calls
3. **Beehiiv**: Domain validation and deliverability checks

### Error Handling
- Invalid email formats (missing @, domain, etc.)
- Reserved domains (example.com, test domains)
- Network errors and API failures
- User-friendly error messages

### Example Usage
```typescript
// POST /api/subscribe
{
  "email": "user@example.com"
}

// Success Response (200)
{
  "ok": true,
  "message": "Successfully subscribed!"
}

// Error Response (400)
{
  "error": "Please enter a valid email address"
}
```

---

## 🧪 Testing Infrastructure

### Cypress E2E Tests
- **Form Rendering**: Validates subscription form display
- **Success Flow**: Tests successful subscription with API mocking
- **Error Handling**: Validates error states and user feedback
- **Cross-browser**: Chrome testing with screenshot capture

### GitHub Actions CI/CD
- **Automated Testing**: Runs on every push and pull request
- **Build Verification**: Ensures production builds work correctly
- **Timeout Protection**: 15-minute timeout to prevent hanging jobs
- **Node.js 20**: Latest LTS version for optimal performance

### Test Files
```
cypress/
├── e2e/
│   └── subscribe.cy.ts     # Email subscription tests
└── screenshots/            # Test failure screenshots
```

---

## 📊 Database Architecture

### User Roles & Access Control

- **🌐 Public** - View basic company information
- **💼 LP (Limited Partners)** - Access private metrics and founder updates  
- **👑 Admin** - Full CRUD access to all data

### Database Tables

```sql
profiles         → User roles (admin/lp) linked to Supabase Auth
companies        → Portfolio companies (PUBLIC ACCESS)
├── kpis         → Key performance indicators (LP-ONLY)
│   └── kpi_values → Time-series metrics data
├── founder_updates → Periodic company communications (LP-ONLY)
└── embeddings   → AI vector data for Q&A features (LP-ONLY)
```

### Row Level Security (RLS)

All tables use PostgreSQL RLS policies:
- **Public users**: Basic company info only
- **LPs**: Financial metrics + founder communications  
- **Admins**: Full database access

---

## 🗂️ Project Structure

```
The Pitch Fund/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── subscribe/
│   │   │       └── route.ts        # Beehiiv API integration (Edge Runtime)
│   │   ├── components/
│   │   │   └── Header.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── SubscribeForm.tsx       # Email subscription component
│   │   ├── ErrorBoundary.tsx
│   │   └── NavLink.tsx
│   └── lib/
│       └── error-handler.ts
├── cypress/
│   ├── e2e/
│   │   └── subscribe.cy.ts         # E2E tests for subscription
│   └── screenshots/
├── .github/
│   └── workflows/
│       └── cypress.yml             # CI/CD pipeline
├── supabase/
│   ├── migrations/                 # Database schema versions
│   ├── sql/                        # Reference schema files
│   └── config.toml                 # Local development config
├── .env.local                      # Environment variables (gitignored)
└── tailwind.config.js              # Styling configuration
```

---

## 🔧 API Documentation

### POST /api/subscribe

**Description**: Subscribe an email address to the newsletter via Beehiiv API

**Runtime**: Edge Runtime for global distribution and fast cold starts

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Success Response (200)**:
```json
{
  "ok": true,
  "message": "Successfully subscribed!"
}
```

**Error Responses**:
```json
// Invalid email format (400)
{
  "error": "Please enter a valid email address"
}

// Server configuration error (500)
{
  "error": "Server configuration error"
}

// Beehiiv API error (varies)
{
  "error": "Subscription failed"
}
```

**Environment Variables Required**:
- `BEEHIIV_API_TOKEN`: Your Beehiiv API token
- `BEEHIIV_PUBLICATION_ID`: Your publication ID (format: `pub_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

---

## 🔧 Database Management

### Creating Migrations

```bash
# Create new migration
supabase migration new add_new_feature

# Edit the generated file
# supabase/migrations/[timestamp]_add_new_feature.sql

# Apply to remote database
supabase db push
```

### Common Queries

```sql
-- Get all public companies
SELECT slug, name, tagline, industry_tags FROM companies;

-- Get LP-accessible KPI data
SELECT k.label, k.unit, kv.period_date, kv.value
FROM kpis k JOIN kpi_values kv ON k.id = kv.kpi_id
WHERE k.company_id = 'uuid' ORDER BY kv.period_date DESC;

-- Recent founder updates
SELECT period_start, period_end, ai_summary FROM founder_updates
WHERE company_id = 'uuid' ORDER BY period_start DESC LIMIT 5;
```

---

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| **`supabase: command not found`** | Use `brew install supabase/tap/supabase` (NOT npm global) |
| **"No tables after db push"** | Ensure schema is in `supabase/migrations/`, not just `sql/` |
| **GitHub push fails (large files)** | Check `.gitignore` excludes `node_modules/`, `.next/` |
| **"Permission denied for table"** | Verify user role in `profiles` table and RLS policies |
| **Vercel build fails** | Add all environment variables in Vercel → Settings |
| **Internal server error** | Clear `.next/` cache: `rm -rf .next && npm run dev` |
| **Email subscription fails** | Check `BEEHIIV_API_TOKEN` and `BEEHIIV_PUBLICATION_ID` in `.env.local` |
| **Cypress tests fail** | Run `npm run build` before testing, ensure server is running |
| **"Invalid email" for valid emails** | Beehiiv validates domains - some test domains are blocked |

---

## 🔐 Security & Best Practices

- ✅ **Environment variables** properly gitignored (`.env.local`)
- ✅ **Row Level Security** enabled on all tables
- ✅ **Next.js 14.2.30** security-patched version
- ✅ **Edge Runtime** for improved security and performance
- ✅ **Multi-layer validation** for email inputs
- ✅ **Comprehensive `.gitignore** excludes sensitive files
- ✅ **Database migrations** version-controlled
- ✅ **TypeScript** for type safety
- ✅ **Automated testing** with CI/CD pipeline

---

## 📚 Additional Resources

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)  
- **Beehiiv API**: [developers.beehiiv.com](https://developers.beehiiv.com)
- **Cypress Docs**: [docs.cypress.io](https://docs.cypress.io)
- **Database Schema**: See `DATABASE.md` for detailed schema documentation
- **Setup Issues**: See `SETUP_GUIDE.md` for troubleshooting gotchas

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test thoroughly
4. Run tests: `npm run cy:run`
5. Commit: `git commit -m "feat: add amazing feature"`
6. Push: `git push origin feature/amazing-feature`
7. Open Pull Request

---

### 🚀 Happy shipping!  
Questions? Ping @Josh on Slack or open an issue. PRs welcome! 🎙

---

**Note for Future AI Assistants**: This project uses Supabase with Next.js and Beehiiv for email marketing. The subscription API uses Edge Runtime for performance. Database schema is in `supabase/migrations/` and must be applied using `supabase db push`. Never use `npm install -g supabase` - always use Homebrew on macOS. All email validation happens at multiple layers (client, server, and Beehiiv API). The `.gitignore` prevents committing `node_modules` and other large files to avoid GitHub's 100MB limit.