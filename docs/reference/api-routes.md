# API Routes Reference

This document provides a comprehensive list of all API routes in The Pitch Fund application, organized by category.

## Overview

All API routes are configured with:
- **Edge Runtime** (except database operations: `/api/dev-log`, `/api/vcs`, `/api/company-vcs` which use Node.js)
- **Sentry Error Monitoring** for production-ready error tracking
- **Session ID Logging** for debugging and traceability

## File Upload & Processing

### `/api/upload-logo` - Logo Upload Handler
- **Method**: `POST`
- **Runtime**: Edge
- **Description**: Handles client-side logo uploads to Vercel Blob storage
- **Features**: 
  - 5MB file size limit
  - Supports: PNG, JPEG, GIF, BMP, TIFF, SVG, WebP
  - Auto-generates random suffixes for uniqueness
- **File**: `src/app/api/upload-logo/route.ts`

### `/api/vectorize-logo` - SVG Vectorization
- **Method**: `POST`
- **Runtime**: Edge
- **Description**: Converts bitmap images to scalable SVGs using Vectorizer.ai
- **Input**: `{ imageUrl: string }` - URL of uploaded bitmap image
- **Output**: Original and SVG URLs with conversion statistics
- **File**: `src/app/api/vectorize-logo/route.ts`

### `/api/vectorize-and-upload` - Legacy Combined Upload
- **Method**: `POST`
- **Runtime**: Edge
- **Description**: Legacy endpoint that handles upload and vectorization in one step
- **Status**: Deprecated in favor of two-step process
- **File**: `src/app/api/vectorize-and-upload/route.ts`

## AI & Content Generation

### `/api/ai/generate-industry-tags`
- **Method**: `POST`
- **Runtime**: Edge
- **Description**: Generates industry classification tags using OpenAI
- **Input**: Transcript, investment reasoning, company description
- **File**: `src/app/api/ai/generate-industry-tags/route.ts`

### `/api/ai/generate-business-model-tags`
- **Method**: `POST`
- **Runtime**: Edge
- **Description**: Generates business model classification tags
- **Input**: Transcript, investment reasoning, company description
- **File**: `src/app/api/ai/generate-business-model-tags/route.ts`

### `/api/ai/generate-keywords`
- **Method**: `POST`
- **Runtime**: Edge
- **Description**: Generates keyword tags for content categorization
- **Input**: Transcript, investment reasoning, company description
- **File**: `src/app/api/ai/generate-keywords/route.ts`

### `/api/ai/generate-tagline`
- **Method**: `POST`
- **Runtime**: Edge
- **Description**: Generates compelling taglines for companies
- **Input**: Transcript, investment reasoning, company description
- **File**: `src/app/api/ai/generate-tagline/route.ts`

## Data & Content Extraction

### `/api/extract-episode-date`
- **Method**: `GET`
- **Runtime**: Edge
- **Description**: Extracts publish dates from Pitch Episode URLs
- **Parameters**: `url` (episode URL), `extract` (date/transcript/both)
- **File**: `src/app/api/extract-episode-date/route.ts`

### `/api/extract-transcript`
- **Method**: `GET`
- **Runtime**: Edge
- **Description**: Extracts episode transcripts from Pitch URLs
- **Parameters**: `url` (episode URL)
- **File**: `src/app/api/extract-transcript/route.ts`

## Validation & Utilities

### `/api/check-url`
- **Method**: `GET`
- **Runtime**: Edge
- **Description**: Validates URL accessibility and format
- **Parameters**: `url` (URL to validate)
- **Returns**: Status, accessibility, final URL after redirects
- **File**: `src/app/api/check-url/route.ts`

### `/api/tags`
- **Method**: `GET`
- **Runtime**: Edge
- **Description**: Retrieves all valid tags with usage analytics
- **Returns**: Industry tags, business model tags, keywords with metadata
- **File**: `src/app/api/tags/route.ts`

## SEO & Site Management

### `/api/sitemap`
- **Method**: `GET`
- **Runtime**: Edge
- **Description**: Generates dynamic XML sitemap
- **Cache**: 1 hour
- **File**: `src/app/api/sitemap/route.ts`

### `/api/robots`
- **Method**: `GET`
- **Runtime**: Edge
- **Description**: Generates robots.txt file
- **Cache**: 1 hour
- **File**: `src/app/api/robots/route.ts`

### `/api/og`
- **Method**: `GET`
- **Runtime**: Edge
- **Description**: Generates dynamic Open Graph images
- **Parameters**: `title` (optional)
- **File**: `src/app/api/og/route.tsx`

## Authentication & User Management

### `/api/auth/logout`
- **Method**: `POST`
- **Runtime**: Edge
- **Description**: Handles user logout and session cleanup
- **File**: `src/app/api/auth/logout/route.ts`

## Newsletter & Communication

### `/api/subscribe`
- **Method**: `POST`
- **Runtime**: Edge
- **Description**: Handles newsletter subscriptions via Beehiiv
- **Input**: `{ email: string }`
- **Validation**: Email format validation
- **File**: `src/app/api/subscribe/route.ts`

## Monitoring & Development

### `/api/dev-log`
- **Method**: `POST`
- **Runtime**: Node.js
- **Description**: Handles client-side logging for development
- **Input**: Browser log payloads
- **File**: `src/app/api/dev-log/route.ts`

### `/api/sentry-example-api`
- **Method**: `GET`
- **Runtime**: Edge
- **Description**: Test endpoint for Sentry error monitoring
- **File**: `src/app/api/sentry-example-api/route.ts`

## Cron Jobs & Automation

### `/api/cron/sitemap`
- **Method**: `GET`, `POST`
- **Runtime**: Edge
- **Description**: ISR cache refresh for sitemap and robots.txt
- **Authentication**: Bearer token via `CRON_SECRET`
- **File**: `src/app/api/cron/sitemap/route.ts`

## Runtime Configuration Summary

| Runtime Type | Routes Count | Purpose |
|--------------|--------------|---------|
| **Edge Runtime** | 20 routes | Global performance, faster cold starts |
| **Node.js Runtime** | 3 routes | Database operations and server-side logging |

## Error Monitoring

All routes include:
- **Sentry Integration**: Automatic exception capture and reporting
- **Session ID Tracking**: Unique identifiers for debugging (using `crypto.randomUUID()`)
- **Structured Logging**: Consistent log formats with emojis for easy parsing
- **Error Context**: Rich metadata for debugging (tags, session IDs, route info)

## VC Management

### `/api/scrape-vc-profile` - VC Profile Scraper
- **Method**: `POST`
- **Runtime**: Edge
- **Description**: Scrapes VC profile data from thepitch.show profile URLs
- **Input**: `{ url: string }` - thepitch.show profile URL
- **Output**: Complete VC profile data (name, firm, role, bio, social links, seasons)
- **Features**:
  - Regex-based HTML parsing for robust extraction
  - Social links detection (LinkedIn, Twitter, website, podcast)
  - Season appearance parsing from profile pages
  - URL validation (must be thepitch.show domain)
- **File**: `src/app/api/scrape-vc-profile/route.ts`

### `/api/scrape-episode-vcs` - Episode VC Extractor
- **Method**: `POST`
- **Runtime**: Edge
- **Description**: Extracts featured VCs from thepitch.show episode pages
- **Input**: `{ episodeUrl: string }` - Episode URL
- **Output**: Array of VC names featured in the episode
- **Features**:
  - Multiple extraction patterns for different episode formats
  - Season and episode number parsing from URL
  - Handles various episode URL structures
- **File**: `src/app/api/scrape-episode-vcs/route.ts`

### `/api/vcs` - VC CRUD Operations
- **Methods**: `GET`, `POST`, `PUT`, `DELETE`
- **Runtime**: Node.js (database operations)
- **Description**: Complete CRUD operations for VC profiles
- **Features**:
  - **GET**: Search and filter VCs (name, firm, seasons)
  - **POST**: Create new VC profiles with duplicate detection and **Zod validation**
  - **PUT**: Update existing VC profiles and merge season data
  - **DELETE**: Remove VC profiles (with relationship cleanup)
  - Smart duplicate handling (updates firm when VCs change companies)
  - Comprehensive validation and error handling
  - **Enhanced social media support**: LinkedIn, Twitter, Instagram, YouTube, website, podcast URLs
  - **Required field validation**: Name, firm, role, bio, profile image, ThePitch profile URL
  - **Real-time URL validation**: Integration with URL checking API for all social media fields
- **File**: `src/app/api/vcs/route.ts`

### `/api/company-vcs` - Company-VC Relationship Management
- **Methods**: `GET`, `POST`, `DELETE`
- **Runtime**: Node.js (database operations)
- **Description**: Manages many-to-many relationships between companies and VCs
- **Features**:
  - **GET**: Retrieve VCs for specific company with full profile data
  - **POST**: Create company-VC relationships with episode context
  - **DELETE**: Remove specific relationships
  - Episode metadata tracking (season, number, URL)
  - Bulk relationship operations support
  - Prevents duplicate relationships with same company-VC pair
- **File**: `src/app/api/company-vcs/route.ts`

## Authentication Patterns

Most routes currently use placeholder authentication:
```typescript
// TODO: Add authentication check here
// const session = await getServerSession()
// if (!session?.user) {
//   throw new Error('Unauthorized')
// }
```

## Rate Limiting

Rate limiting is handled at the Vercel platform level. Individual routes do not implement custom rate limiting.

## CORS Configuration

CORS is configured globally in the Next.js application. API routes inherit the global CORS policy. 