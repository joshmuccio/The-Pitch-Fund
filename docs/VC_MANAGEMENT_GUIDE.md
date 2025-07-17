# VC Relationship Management System

Complete guide to managing VC relationships and profiles in The Pitch Fund application.

## Overview

The VC Management System enables comprehensive tracking of venture capitalist profiles and their relationships to portfolio companies. The system provides automated scraping capabilities, manual management interfaces, and rich display components across the application.

## System Architecture

### Database Schema

**`vcs` Table - VC Profiles**
```sql
CREATE TABLE vcs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Profile Information
  name text NOT NULL,
  firm text,
  role text,
  bio text,
  
  -- Social Links
  linkedin_url text,
  twitter_url text,
  instagram_url text,
  youtube_url text,
  website_url text,
  podcast_url text,
  
  -- Profile Management
  profile_image_url text,
  profile_source_url text,
  
  -- Constraints
  CONSTRAINT unique_vc_name_firm UNIQUE (name, firm)
);
```

**`company_vcs` Table - Relationships**
```sql
CREATE TABLE company_vcs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  
  -- Relationships
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  vc_id uuid REFERENCES vcs(id) ON DELETE CASCADE,
  
  -- Episode Context
  episode_season integer,
  episode_number integer,
  episode_url text,
  
  -- Constraints
  CONSTRAINT unique_company_vc UNIQUE (company_id, vc_id)
);
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/scrape-vc-profile` | POST | Scrape VC profile from thepitch.show URL |
| `/api/scrape-episode-vcs` | POST | Extract VCs featured in episode |
| `/api/vcs` | GET/POST/PUT/DELETE | CRUD operations for VC profiles |
| `/api/company-vcs` | GET/POST/DELETE | Manage company-VC relationships |

## Features

### 1. Admin VC Management Interface

**Location**: `/admin/vcs`

**Access Control**: 
- Requires authentication
- Admin role verification
- Protected by middleware

**Components**:
- **VcDashboard**: Main management interface with search, filters, and analytics
- **VcScrapeForm**: 3-step URL scraping process (Input → Preview → Save)
- **VcList**: Rich grid display with profile cards and action buttons
- **VcEditModal**: Full CRUD operations with validation

**Features**:
- URL-based profile scraping from thepitch.show
- Search by name, firm, or role
- Filter by seasons appeared
- Analytics tracking (total VCs, firms, seasons)
- Bulk operations support
- Real-time validation and error handling

### **✅ Enhanced Form Validation System** (January 2025)

The VC management system now features **comprehensive Zod-based validation** with enhanced user experience:

#### **Form Validation Features**
- 🔴 **Required Field Validation**: Name, firm, role, bio, profile image, and ThePitch profile URL are mandatory
- 🟢 **Real-time URL Validation**: Visual feedback for all social media and website URLs
- ⚡ **Auto-scraping Integration**: ThePitch.show URLs automatically populate form fields
- 📸 **Professional Image Upload**: Integrated ProfileImageUploader component with Vercel Blob storage
- 🎨 **Visual Validation States**: Color-coded borders and loading indicators for URL validation

#### **Required vs Optional Fields**
**Required Fields** (marked with *):
- **Name**: VC full name (1-255 characters)
- **Firm Name**: Investment firm (1-255 characters)
- **Role/Title**: Position at firm (1-255 characters)
- **Bio**: Professional biography (1-2000 characters)
- **Profile Image**: Valid image URL or uploaded file
- **ThePitch Profile URL**: Source profile URL from thepitch.show

**Optional Fields** (social media & website):
- LinkedIn URL, Twitter URL, Instagram URL, TikTok URL, YouTube URL, Website URL, Podcast URL

#### **Enhanced User Experience**
```typescript
// Visual validation states
🔵 Validating URLs    // Blue border + loading spinner
🟢 Valid URLs        // Green border + checkmark
🔴 Invalid URLs      // Red border + error message
⚪ Default state     // Gray border
```

#### **Form Submission Protection**
- Form submission disabled until all validation passes
- Real-time error messages with clear guidance
- Auto-cleanup of empty optional fields
- Comprehensive error logging with Sentry integration

### 2. Investment Wizard Integration (Step 4)

**Component**: `VcSelectionStep`

**Auto-Detection**: 
- Watches episode URL from Step 3
- Automatically detects and pre-selects featured VCs
- Displays episode context (season, number)

**Manual Selection**:
- Search all VCs in database
- Filter by name, firm, seasons
- Multi-select with clear selection management
- Visual indicators for selected VCs

**Form Integration**:
- Seamless integration with investment wizard flow
- State management through wizard context
- Validation and error handling
- Automatic relationship creation on submission

### 3. Display Components

**VcRelationships Component**
- **Full Mode**: Complete VC profiles with images, bios, social links
- **Compact Mode**: Condensed cards with key information
- **Minimal Mode**: Simple badges with names and firms

**Integration Points**:
- **Admin Dashboard**: Compact mode with management links
- **LP Dashboard**: Full mode with complete profiles
- **Public Portfolio**: Minimal mode for subtle display
- **Company Edit Page**: Dedicated VC management section

## Usage Guide

### Adding VCs via URL Scraping

1. **Navigate to VC Management**
   ```
   /admin/vcs
   ```

2. **Enter Profile URL**
   - Use "Scrape VC Profile" button
   - Enter thepitch.show profile URL
   - System validates URL format

3. **Preview and Confirm**
   - Review extracted information
   - Edit any fields if needed
   - Confirm to save profile

4. **Handle Duplicates**
   - System checks for existing VCs by name+firm
   - Updates firm if VC has moved companies
   - Merges season data automatically

### Managing VC Relationships

1. **Automatic Assignment (Investment Wizard)**
   - Step 4 auto-detects VCs from episode URL
   - Users can modify selection
   - Relationships created on form submission

2. **Manual Assignment (Admin Interface)**
   - Edit company page includes VC management
   - Search and select VCs to associate
   - Remove relationships as needed

3. **Bulk Operations**
   - Select multiple VCs for batch actions
   - Export VC data for external use
   - Import from CSV (future feature)

### Display and Analytics

**Company Views**:
- VC relationships displayed contextually
- Different modes for different audiences
- Social links and season badges
- Episode context when available

**Analytics and Reporting**:
- Track VCs by season participation
- Firm representation metrics
- Investment overlap analysis
- Geographic distribution (future)

## API Usage Examples

### Scraping a VC Profile

```typescript
const response = await fetch('/api/scrape-vc-profile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://thepitch.show/profiles/john-doe'
  })
});

const vcData = await response.json();
```

### Getting Episode VCs

```typescript
const response = await fetch('/api/scrape-episode-vcs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    episodeUrl: 'https://thepitch.show/episodes/season-11-episode-5'
  })
});

const episodeVcs = await response.json();
```

### Managing Company-VC Relationships

```typescript
// Add relationship
await fetch('/api/company-vcs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    companyId: 'company-uuid',
    vcId: 'vc-uuid',
    episodeSeason: 11,
    episodeNumber: 5,
    episodeUrl: 'https://thepitch.show/episodes/...'
  })
});

// Get company VCs
const response = await fetch(`/api/company-vcs?companyId=${companyId}`);
const relationships = await response.json();
```

## Security and Performance

### Access Control
- Admin routes protected by authentication middleware
- Role-based access verification
- RLS policies on database tables

### Performance Optimization
- Indexed searches on name, firm, seasons
- Efficient relationship queries
- Cached profile images
- Lazy loading for large VC lists

### Error Handling
- Session ID logging for debugging
- Sentry integration for production monitoring
- Graceful fallbacks for network failures
- User-friendly error messages

## Troubleshooting

### Common Issues

**1. Scraping Failures**
- Verify URL format (must be thepitch.show domain)
- Check network connectivity
- Review Sentry logs for parsing errors

**2. Duplicate VCs**
- System automatically handles name+firm uniqueness
- Manual merge required for data conflicts
- Check logs for resolution details

**3. Missing Episode Data**
- Ensure episode URL format is correct
- Verify episode exists on thepitch.show
- Check regex patterns in scraping logic

**4. Display Issues**
- Verify image URLs are accessible
- Check component mode configuration
- Review console for rendering errors

### Logging and Debugging

All VC operations include session ID logging:
```
[VC_SCRAPE] Session: abc-123 | Action: scrape_profile | URL: https://...
[VC_RELATIONSHIP] Session: abc-123 | Action: create | Company: xyz | VC: abc
```

## Future Enhancements

### Planned Features
- CSV import/export for bulk VC management
- Advanced analytics and reporting
- Geographic mapping of VC locations
- Integration with external VC databases
- Automated profile updates and monitoring
- Email notifications for new VC relationships

### API Extensions
- Webhook support for external integrations
- Advanced search with fuzzy matching
- Bulk operations API endpoints
- Historical relationship tracking
- Performance metrics and caching

## Component Reference

### VcDashboard
```typescript
interface VcDashboardProps {
  initialVcs?: Vc[];
  searchParams?: VcSearchParams;
}
```

### VcRelationships
```typescript
interface VcRelationshipsProps {
  relationships: CompanyVcWithVc[];
  mode?: 'full' | 'compact' | 'minimal';
  showEpisodeContext?: boolean;
  className?: string;
}
```

### VcSelectionStep
```typescript
interface VcSelectionStepProps {
  selectedVcs: string[];
  onVcsChange: (vcIds: string[]) => void;
  episodeUrl?: string;
  className?: string;
}
```

This comprehensive system provides end-to-end VC relationship management with automated data collection, rich display options, and seamless integration throughout the application. 