# The Pitch Fund

A Next.js application for venture capital fund portfolio management, featuring role-based access for Limited Partners (LPs) and public company showcasing.

## 🏗️ Tech Stack

- **Frontend**: Next.js 14.2.30 with TypeScript
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **AI Features**: Vector embeddings for Q&A (pgvector)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Homebrew (for macOS)
- Supabase account

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/joshmuccio/The-Pitch-Fund.git
cd "The Pitch Fund"
npm install
```

### 2. Install Supabase CLI

**Important**: Do NOT use `npm install -g supabase` (deprecated)

```bash
# macOS (recommended)
brew install supabase/tap/supabase

# Verify installation
supabase --version
```

### 3. Setup Supabase

```bash
# Login to Supabase
supabase login

# Initialize project (if not already done)
supabase init
# Answer 'N' to both Deno settings questions for Next.js projects

# Link to existing project
supabase link --project-ref your-project-ref
```

### 4. Deploy Database Schema

The database schema is automatically applied via migrations:

```bash
# Push schema to your Supabase database
supabase db push
```

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📊 Database Schema

### Tables Overview

- **`profiles`** - User roles (admin/lp) linked to Supabase Auth
- **`companies`** - Portfolio companies (public access)
- **`kpis` & `kpi_values`** - Performance metrics (LP-only)
- **`founder_updates`** - Company updates (LP-only)
- **`embeddings`** - AI vector data for Q&A features (LP-only)

### User Roles

- **`admin`** - Full CRUD access to all data
- **`lp`** (Limited Partner) - Access to private metrics and updates
- **Public** - Can view basic company information only

### Row Level Security (RLS)

All tables have RLS policies ensuring:
- Public users see only basic company info
- LPs access financial metrics and founder communications
- Admins have full access to everything

## 🔧 Development

### Database Migrations

Schema changes are managed through Supabase migrations:

```bash
# Create new migration
supabase migration new migration_name

# Apply migrations locally (requires Docker)
supabase db reset

# Apply to remote database
supabase db push
```

### Generate TypeScript Types

```bash
# Generate types from your Supabase schema
supabase gen types typescript --local > types/supabase.ts
```

## 🐛 Troubleshooting

### Common Issues

1. **"Command not found: supabase"**
   - Use Homebrew installation, not npm global install
   - Restart terminal after installation

2. **"Cannot connect to Docker daemon"**
   - This error appears when using local Supabase commands
   - For remote database, use `supabase db push` instead of local commands

3. **"No tables visible after db push"**
   - Ensure schema is in `supabase/migrations/` folder, not just `supabase/sql/`
   - Use `supabase migration new` to create proper migration files

4. **GitHub push fails with large files**
   - `node_modules` should never be committed
   - Use the provided `.gitignore` file
   - If you accidentally committed large files, see Git history cleanup section below

### Git History Cleanup (if needed)

If you accidentally committed `node_modules`:

```bash
# Nuclear option - start fresh (only for new repos)
rm -rf .git
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main --force
```

## 📁 Project Structure

```
The Pitch Fund/
├── src/
│   └── app/
│       ├── layout.tsx          # Root layout
│       └── page.tsx            # Home page
├── supabase/
│   ├── config.toml             # Supabase configuration
│   ├── migrations/             # Database migrations
│   │   └── *_initial_schema.sql
│   └── sql/
│       └── schema.sql          # Original schema reference
├── .gitignore                  # Excludes node_modules, .next, etc.
├── package.json                # Dependencies and scripts
├── tailwind.config.js          # Tailwind CSS config
├── tsconfig.json              # TypeScript config
└── next.config.js             # Next.js config
```

## 🔐 Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 📚 Key Dependencies

- `next@14.2.30` - React framework (security-patched version)
- `react@18.x` - UI library
- `typescript@5.x` - Type safety
- `tailwindcss@3.x` - Styling
- `@supabase/supabase-js` - Supabase client (add when needed)

## 🚨 Security Notes

- All tables use Row Level Security (RLS)
- Authentication handled by Supabase Auth
- API routes should validate user roles
- Never expose service role key in client-side code

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues or questions:
- Check the troubleshooting section above
- Review Supabase docs: [supabase.com/docs](https://supabase.com/docs)
- Open an issue on GitHub

---

**Note for Future AI Assistants**: This project uses Supabase with Next.js. The database schema is in `supabase/migrations/` and must be applied using `supabase db push`. Never use `npm install -g supabase` - always use Homebrew on macOS. The `.gitignore` is configured to prevent committing `node_modules` and other large files to avoid GitHub's 100MB file limit.