# The Pitch Fund

**Investment portfolio tracking for startups featured on The Pitch podcast** 🎙️

[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black)](https://nextjs.org/)
[![Powered by Supabase](https://img.shields.io/badge/Powered%20by-Supabase-3ECF8E)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://vercel.com/)

---

## Overview

The Pitch Fund is a modern, full-stack web application for managing venture capital investment data. Built with Next.js 14, Supabase, and TypeScript, it provides both public portfolio transparency and powerful administrative tools for investment management.

### Key Features

- 📊 **Investment Portfolio Management** - Track investments, valuations, and terms
- 👥 **Founder Database** - Comprehensive founder profiles and updates  
- 🚀 **AI-Powered Data Entry** - Smart parsing of AngelList investment memos
- 📧 **Newsletter Integration** - Automated email subscription via Beehiiv
- 📱 **Responsive Design** - Optimized for desktop and mobile
- 🔒 **Secure Admin Interface** - Role-based access control with Supabase Auth

### Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Deployment**: Vercel Edge Functions
- **Monitoring**: Sentry error tracking
- **Email**: Beehiiv newsletter integration

---

## Quick Start

### Prerequisites

- Node.js 18+
- Git
- Supabase account

### Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd "The Pitch Fund"

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Set up database
supabase db push
supabase gen types typescript --linked > src/types/supabase.types.ts

# Start development server
npm run dev
```

**🚀 Ready!** Your development server is running at `http://localhost:3001`

---

## Documentation

Our documentation follows the [Diátaxis framework](https://diataxis.fr/) for better organization:

### 📖 Learning
New to the project? Start here:

- [**Getting Started**](docs/tutorials/getting-started.md) - Complete setup guide
- [**Creating Your First Investment**](docs/tutorials/creating-first-investment.md) - Learn the core workflow

### 🔧 Problem Solving
Need to solve a specific task:

- [**Database Management**](docs/how-to/database-management.md) - Migrations, types, and best practices
- [**Form Validation**](docs/how-to/form-validation.md) - Implementing validation with Zod
- [**Troubleshooting**](docs/how-to/troubleshooting.md) - Common issues and solutions

### 💡 Understanding
Learn how the system works:

- [**Architecture Overview**](docs/explanation/architecture.md) - System design and technology choices
- [**Investment Workflow**](docs/explanation/investment-workflow.md) - Business process explanation
- [**Database Design**](docs/explanation/database-design.md) - Schema and relationships

### 📋 Reference
Technical specifications:

- [**Database Schema**](docs/reference/database-schema.md) - Complete schema documentation
- [**Environment Variables**](docs/reference/environment-variables.md) - Configuration reference
- [**Migration History**](docs/reference/migration-history.md) - Database change log

**📚 [View All Documentation](docs/README.md)**

---

## Development

### Project Structure

```
The Pitch Fund/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── admin/        # Admin dashboard
│   │   ├── api/          # API routes
│   │   └── portfolio/    # Public portfolio
│   ├── components/       # Reusable UI components
│   ├── lib/              # Utilities and schemas
│   └── types/            # TypeScript definitions
├── supabase/
│   ├── migrations/       # Database migrations
│   └── sql/              # SQL schemas
├── docs/                 # Documentation
└── public/               # Static assets
```

### Key Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Database
supabase db push         # Apply migrations
supabase gen types typescript --linked > src/types/supabase.types.ts

# Testing
npm run test             # Unit tests
npm run test:e2e         # End-to-end tests
```

### Environment Variables

Required environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Email subscriptions
BEEHIIV_API_TOKEN=your-beehiiv-token
BEEHIIV_PUBLICATION_ID=your-publication-id
```

---

## Contributing

We welcome contributions! Here's how to get started:

1. **Read the documentation** - Start with [Getting Started](docs/tutorials/getting-started.md)
2. **Set up your environment** - Follow the development setup above
3. **Pick an issue** - Check GitHub issues for good first contributions
4. **Follow our conventions** - TypeScript, ESLint, and Prettier are enforced
5. **Test your changes** - Run tests before submitting PRs

### Development Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test
npm run dev
npm run test

# Follow conventional commits
git commit -m "feat: add investment filtering"

# Push and create PR
git push origin feature/your-feature-name
```

---

## Architecture

The Pitch Fund uses a modern, scalable architecture:

- **Frontend**: Next.js 14 with App Router for optimal performance
- **Database**: PostgreSQL via Supabase with Row Level Security
- **Authentication**: Supabase Auth with fine-grained permissions
- **Deployment**: Vercel Edge Functions for global distribution
- **Monitoring**: Sentry for error tracking and performance monitoring

See [Architecture Overview](docs/explanation/architecture.md) for detailed information.

---

## License

This project is licensed under the MIT License. See `LICENSE` file for details.

---

## Support

### Getting Help

- 📖 **Documentation**: [docs/README.md](docs/README.md)
- 🐛 **Issues**: Report bugs on GitHub Issues
- 💬 **Discussions**: Use GitHub Discussions for questions
- 🚨 **Troubleshooting**: [Troubleshooting Guide](docs/how-to/troubleshooting.md)

### Useful Links

- [**Live Demo**](https://thepitchfund.com) - Production application
- [**Supabase Dashboard**](https://supabase.com/dashboard) - Database management
- [**Vercel Dashboard**](https://vercel.com/dashboard) - Deployment status
- [**Sentry Dashboard**](https://sentry.io/) - Error monitoring

---

**Built with ❤️ for The Pitch podcast community**