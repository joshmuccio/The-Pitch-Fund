# 🚀 Getting Started

Welcome to The Pitch Fund! This tutorial will get you up and running with the development environment in about 15 minutes.

## What You'll Build

By the end of this tutorial, you'll have:
- ✅ A fully functional local development environment
- ✅ The database connected and seeded with sample data
- ✅ The admin interface running locally
- ✅ Created your first test investment

## Prerequisites

Before you begin, make sure you have:
- **Node.js 18+** installed
- **Git** for version control
- **A Supabase account** (free tier is fine)
- **A code editor** (VS Code recommended)

---

## Step 1: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd "The Pitch Fund"

# Install dependencies
npm install
```

**Expected result:** You should see packages installing without errors.

---

## Step 2: Set Up Supabase

### Create Your Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project" 
3. Choose a project name (e.g., "the-pitch-fund-dev")
4. Set a secure password and region
5. Wait for the database to initialize (~2 minutes)

### Install Supabase CLI

```bash
# macOS (recommended)
brew install supabase/tap/supabase

# Verify installation
supabase --version
```

### Connect to Your Project

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref-id
```

**💡 Find your project ref:** In your Supabase dashboard, go to Settings > General. The Project Reference ID is shown there.

---

## Step 3: Set Up Environment Variables

Create a `.env.local` file in your project root:

```bash
# Copy the example environment file
cp .env.example .env.local
```

Add your Supabase credentials to `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Email subscriptions (can skip for now)
BEEHIIV_API_TOKEN=your-beehiiv-token
BEEHIIV_PUBLICATION_ID=your-publication-id
```

**💡 Find your keys:** In Supabase dashboard → Settings → API

---

## Step 4: Set Up the Database

```bash
# Apply all database migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --linked > src/types/supabase.types.ts
```

**Expected result:** You should see "Finished supabase db push" with no errors.

---

## Step 5: Start the Development Server

```bash
# Start the Next.js development server
npm run dev
```

**Expected result:** The server starts on `http://localhost:3001` (or next available port).

---

## Step 6: Verify Everything Works

### Check the Homepage
1. Open `http://localhost:3001` in your browser
2. You should see The Pitch Fund homepage with the newsletter signup

### Check the Admin Interface
1. Navigate to `http://localhost:3001/admin`
2. You should see the login page
3. Sign up with your email to create an admin account

### Test Database Connection
1. After signing up, you should see the admin dashboard
2. Try clicking "Add New Investment" to verify forms are working

---

## 🎉 Success!

You now have The Pitch Fund running locally! Here's what you can do next:

### Immediate Next Steps
- **Create your first investment:** Follow [Creating Your First Investment](creating-first-investment.md)
- **Explore the admin interface:** Add test companies and founders
- **Check the database:** View your data in the Supabase dashboard

### When You're Ready to Go Deeper
- **Learn the architecture:** See [Architecture Overview](../explanation/architecture.md)
- **Understand the database:** Read [Database Design](../explanation/database-design.md)
- **Set up monitoring:** Check [Deployment Guide](../how-to/deployment.md)

---

## 🚨 Troubleshooting

### Common Issues

**"Command not found: supabase"**
- Solution: Install Supabase CLI via Homebrew (not npm)

**"Connection refused" errors**
- Solution: Verify your `.env.local` file has the correct Supabase URL and keys

**Port conflicts**
- Solution: The dev server will automatically try ports 3001, 3002, etc.

**Database migration failures**
- Solution: Check [Database Management](../how-to/database-management.md) for detailed troubleshooting

Need more help? See the full [Troubleshooting Guide](../how-to/troubleshooting.md).

---

## 📚 What's Next?

Ready to create your first investment? Continue to [Creating Your First Investment](creating-first-investment.md) → 