# The Pitch Fund Documentation

## Overview

This documentation covers The Pitch Fund's admin platform, investment management system, and technical implementation details.

## 🎯 **Recent Updates (January 2025)**

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
- [**Investment Wizard Guide**](INVESTMENT_WIZARD_GUIDE.md) - Complete guide to the three-step investment form system
- [**Form Validation Guide**](FORM_VALIDATION_GUIDE.md) - Zod-exclusive validation system with enhanced visual feedback
- [Currency Formatting Implementation](CURRENCY_FORMATTING_IMPLEMENTATION.md)
- [Sentry Implementation Guide](SENTRY_IMPLEMENTATION_GUIDE.md)
- [Portfolio Filtering Examples](PORTFOLIO_FILTERING_EXAMPLES.md)

### Reference Documentation
- [Database Schema](reference/database-schema.md)
- [Environment Variables](reference/environment-variables.md)
- [Migration History](reference/migration-history.md)

### How-To Guides
- [Database Management](how-to/database-management.md)
- [Form Validation](how-to/form-validation.md)
- [Troubleshooting](how-to/troubleshooting.md)

### Tutorials
- [Getting Started](tutorials/getting-started.md)
- [Creating Your First Investment](tutorials/creating-first-investment.md)

## Architecture

The Pitch Fund uses a modern tech stack:
- **Frontend**: Next.js 14 with TypeScript
- **Database**: Supabase (PostgreSQL)
- **Validation**: Zod with TypeScript integration
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form with enhanced auto-save
- **Monitoring**: Sentry for error tracking

## Key Features

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