# Environment Setup Guide

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# The Pitch Fund - Environment Configuration

# Next.js environment
NODE_ENV=development

# Supabase Configuration (when needed)
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Database Setup (Optional)
If you need database functionality:
```bash
# Install Supabase CLI (macOS)
brew install supabase/tap/supabase

# Login to Supabase
supabase login

# Initialize project (if not already done)
supabase init

# Push schema to database
supabase db push
```

## Architecture Overview

The project uses a clean, modern stack:

- **Frontend**: Next.js 14 with App Router + TypeScript
- **Styling**: Tailwind CSS with custom brand system
- **Database**: Supabase (PostgreSQL with RLS)
- **Deployment**: Vercel

## Brand System

The design system is implemented in Tailwind with:
- **Colors**: `pitch-black`, `graphite-gray`, `platinum-mist`, `cobalt-pulse`, `dawn-gold`
- **Typography**: Inter font with generous tracking
- **Components**: Buttons, cards, forms with hover effects
- **Utilities**: Custom gradients, animations, responsive design

## Key Features

- ✅ **Responsive Design** - Mobile-first approach
- ✅ **Dark Theme** - Professional pitch-black background
- ✅ **Typography System** - Consistent heading hierarchy
- ✅ **Component Library** - Reusable UI components
- ✅ **SEO Ready** - Proper metadata and OpenGraph tags
- ✅ **Accessibility** - Focus states and proper contrast

## Troubleshooting

### Common Issues

1. **Port conflicts**: The dev server will automatically try ports 3001, 3002, etc.
2. **Build errors**: Clear cache with `rm -rf .next && npm run dev`
3. **TypeScript errors**: Ensure all dependencies are installed

### Getting Help

- Check the `README.md` for setup instructions
- Review `PRD.md` for project requirements
- See `DATABASE.md` for schema documentation

---

**Note**: This project previously used Plasmic but has been simplified to use pure React + Tailwind for faster development and reduced complexity. 