# The Pitch Fund Documentation

## Overview

This documentation covers The Pitch Fund's admin platform, investment management system, and technical implementation details.

## 🎯 **Recent Updates (January 2025)**

### **Enhanced AI-Powered Transcript Analysis** ✨
- ✅ **Optimized Model Selection**: GPT-4o for industry tags (superior VC-focused reasoning), GPT-4o-mini for other fields (cost optimization)
- ✅ **VC Analyst Persona**: Enhanced industry categorization with investment thesis focus and market opportunity analysis
- ✅ **Comprehensive Tag Distinctions**: Clear martech/adtech vs data analytics classification for accurate investment categorization
- ✅ **Transcript Analysis**: Generate taglines, industry tags, and business model tags from pitch episode transcripts
- ✅ **Edge Runtime**: Global performance optimization for AI API routes
- ✅ **Comprehensive Error Monitoring**: Sentry integration with detailed error categorization
- ✅ **Production-Ready Implementation**: Enterprise-grade error handling and rate limiting

### **Investment Wizard Enhancements**
- ✅ **Manual Input Highlighting**: Orange borders for fields that couldn't be auto-populated via QuickPaste
- ✅ **Pitch Episode URL Validation**: Domain-specific validation requiring thepitch.show domain
- ✅ **Form Submission Protection**: Fixed inappropriate form submissions during step navigation
- ✅ **Enhanced parseQuickPaste**: Detailed parsing results with success/failure tracking
- ✅ **Improved User Experience**: Auto-clearing highlights and real-time feedback

## Quick Start

For development setup and deployment instructions, see [Getting Started](tutorials/getting-started.md).

## Core Documentation

### Implementation Guides
- [**OpenAI Best Practices Implementation**](OPENAI_BEST_PRACTICES_IMPLEMENTATION.md) - Enterprise-grade AI integration with GPT-4o-mini
- [**Investment Wizard Guide**](INVESTMENT_WIZARD_GUIDE.md) - Complete guide to the three-step investment form system
- [**Form Validation Guide**](FORM_VALIDATION_GUIDE.md) - Zod-exclusive validation system with enhanced visual feedback
- [Currency Formatting Implementation](CURRENCY_FORMATTING_IMPLEMENTATION.md)
- [Sentry Implementation Guide](SENTRY_IMPLEMENTATION_GUIDE.md)
- [Edge Runtime Guide](EDGE_RUNTIME_GUIDE.md)
- [Portfolio Filtering Examples](PORTFOLIO_FILTERING_EXAMPLES.md)

### Reference Documentation
- [Database Schema](reference/database-schema.md)
- [Environment Variables](reference/environment-variables.md)
- [Migration History](reference/migration-history.md)

### How-To Guides
- [Database Management](how-to/database-management.md)
- [Form Validation](how-to/form-validation.md)
- [Debugging](how-to/debugging.md) - Browser-to-terminal logging system
- [Troubleshooting](how-to/troubleshooting.md)

### Tutorials
- [Getting Started](tutorials/getting-started.md)
- [Creating Your First Investment](tutorials/creating-first-investment.md)

## Architecture

The Pitch Fund uses a modern tech stack:
- **Frontend**: Next.js 14 with TypeScript
- **Database**: Supabase (PostgreSQL)
- **AI Integration**: OpenAI GPT-4o-mini with Edge Runtime
- **Validation**: Zod with TypeScript integration
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form with enhanced auto-save
- **Monitoring**: Sentry for error tracking
- **Debugging**: Browser-to-terminal logger for development

## Key Features

- **AI-Powered Transcript Analysis**: Generate taglines, industry tags, and business model tags from pitch episode transcripts using GPT-4o-mini
- **Investment Wizard**: Three-step form with QuickPaste integration and manual input highlighting
- **Auto-Save System**: Intelligent draft persistence with toast notifications
- **URL Validation**: Real-time validation with domain-specific rules
- **Dynamic Founder Management**: Support for 1-3 founders with full validation
- **Portfolio Analytics**: Comprehensive investment tracking and filtering
- **Admin Dashboard**: Complete investment management interface

## Recent Technical Improvements

- **Enhanced QuickPaste**: Visual feedback for parsing success/failure
- **Form Submission Protection**: Robust protection against inappropriate submissions  
- **Domain Validation**: Pitch episode URLs must be from thepitch.show
- **Visual Feedback System**: Color-coded borders for different field states
- **Zod-Exclusive Validation**: Eliminated HTML5 validation conflicts 