# How to Manage VC Relationships

A practical guide to using the VC management system in The Pitch Fund application.

## Getting Started

### Prerequisites

- Admin access to The Pitch Fund application
- Understanding of thepitch.show episode structure
- Basic knowledge of venture capital industry

### Access Points

**Admin VC Management**: `/admin/vcs`
**Investment Wizard Step 3**: VC selection integrated in marketing information step
**Company Edit Pages**: Dedicated VC management section

## Adding VCs to the System

### Manual Entry

1. **Navigate to VC Management**
   - Go to `/admin/vcs`
   - Click "Add VC" button

2. **Fill Required Fields**
   - Name (required)
   - Firm (required)
   - Role (required - e.g., "Partner", "Managing Director")
   - Bio (required)
   - Profile Image (required)
   - ThePitch Profile URL (required)

3. **Add Optional Information**
   - Social media links (LinkedIn, Twitter, Instagram, etc.)
   - Website and podcast URLs

### Handling Duplicates

- System automatically detects duplicates by name+firm
- If VC exists but with different firm:
  - Updates firm to new value
  - Preserves existing social links
- Manual review required for conflicting information

## Managing VC Relationships

### During Investment Creation (Step 3)

**Automatic Detection**:
- System watches episode URL from Step 3
- Automatically detects VCs featured in the episode
- Pre-selects detected VCs that exist in the database
- Provides guidance for VCs detected but not found in database

**Manual Selection**:
- Search all VCs in database
- Filter by name, firm, or seasons
- Select/deselect VCs as needed
- Visual confirmation of selections

**Data Integrity**:
- Only existing database VCs can be selected
- No temporary VC creation during investment form
- Clear messaging when detected VCs need to be added first
- Users directed to VC Management for missing VCs

### On Company Edit Pages

**Adding Relationships**:
1. Navigate to company edit page
2. Find "VC Relationships" section
3. Search and select VCs to associate
4. Optionally add episode context

**Removing Relationships**:
1. Find existing VC relationship
2. Click "Remove" button
3. Confirm deletion

## Searching and Filtering

### VC Dashboard Filters

**By Name/Firm**:
```
Search: "John Doe" or "Acme Ventures"
```

**By Season**:
```
Season filter: "11" (shows VCs who appeared in Season 11)
```

**By Role**:
```
Role filter: "Partner" or "Managing Director"
```

### Advanced Search

**Combination Filters**:
- Search by name AND filter by season
- Filter by firm AND role
- Multiple criteria supported

**Search Tips**:
- Partial matches supported ("John" finds "John Doe")
- Case-insensitive search
- Searches name, firm, and role fields

## VC Profile Management

### Editing Existing VCs

1. **Find VC in dashboard**
2. **Click "Edit" button**
3. **Update information**:
   - Basic info (name, firm, role)
   - Bio/description
   - Social links
   - Seasons appeared

4. **Save changes**

### Updating Social Links

**Supported Platforms**:
- LinkedIn profiles
- Twitter/X handles
- Personal websites
- Podcast URLs

**Format Examples**:
```
LinkedIn: https://linkedin.com/in/johndoe
Twitter: https://twitter.com/johndoe
Website: https://johndoe.com
Podcast: https://thepitch.show/guests/johndoe
```

### Managing Profile Images

**Automatic**: Scraped from thepitch.show profiles
**Manual**: Add image URL in edit form
**Best Practices**: 
- Use square aspect ratio images
- Minimum 200x200 pixels
- HTTPS URLs only

## Episode Context Management

### Adding Episode Information

When creating company-VC relationships:

**Episode URL**: `https://thepitch.show/episodes/season-11-episode-5`
**Season**: 11 (extracted automatically)
**Episode Number**: 5 (extracted automatically)

### Episode Auto-Detection

**Investment Wizard Integration**:
1. User enters episode URL in Step 3
2. System extracts season/episode number
3. Scrapes episode page for featured VCs
4. Pre-selects VCs in Step 4
5. Saves episode context with relationships

**Manual Override**:
- Users can modify auto-detected VCs
- Add VCs not detected automatically
- Remove incorrectly detected VCs

## Display Integration

### Company Views

**Admin Dashboard** (Compact Mode):
- Shows VC firm names with count
- "Manage VCs" link for quick access
- Episode season badges

**LP Dashboard** (Full Mode):
- Complete VC profiles with photos
- Bio excerpts and social links
- Episode context when available

**Public Portfolio** (Minimal Mode):
- Subtle VC firm badges
- Clean, professional display
- No detailed information

### Customizing Display

**Mode Selection**:
```typescript
// Component usage
<VcRelationships 
  relationships={companyVcs}
  mode="full"  // or "compact" or "minimal"
  showEpisodeContext={true}
/>
```

## Analytics and Reporting

### VC Dashboard Analytics

**Overview Metrics**:
- Total VCs in system
- Number of unique firms
- Seasons represented
- Recent additions

**Firm Distribution**:
- VCs per firm
- Most active firms
- Cross-portfolio investment patterns

### Season Analysis

**Participation Tracking**:
- VCs by season appearance
- Episode participation rates
- Historical VC involvement

## Troubleshooting

### Common Issues

**Scraping Failures**:
- Verify thepitch.show URL format
- Check episode/profile exists
- Review network connectivity
- Check Sentry logs for errors

**Duplicate VCs**:
- Review name/firm combination
- Check for slight variations in names
- Use edit function to merge information

**Missing Episode Data**:
- Verify episode URL format
- Ensure episode exists on site
- Check for parsing pattern updates needed

**Display Issues**:
- Verify component mode settings
- Check image URL accessibility
- Review console for React errors

### Error Messages

**"Invalid URL format"**:
- URL must be from thepitch.show domain
- Include full URL with protocol (https://)

**"VC already exists"**:
- System found matching name+firm
- Use edit function to update existing VC

**"Episode not found"**:
- Episode URL may be incorrect
- Episode might not exist on thepitch.show

### Getting Help

**Logging**: All operations include session IDs for debugging
**Monitoring**: Sentry integration captures errors
**Support**: Check application logs for detailed error information

## Best Practices

### Data Quality

**Consistent Naming**:
- Use full legal names for VCs
- Standardize firm names (e.g., "Acme Ventures" not "Acme")
- Include appropriate titles/roles

**Complete Profiles**:
- Add social links when available
- Include bio information from scraping
- Update firm changes when VCs move

**Episode Context**:
- Always include episode information when available
- Verify season/episode numbers
- Use canonical episode URLs

### Workflow Efficiency

**Bulk Operations**:
- Scrape multiple VCs from same firm together
- Use search to find and update related VCs
- Batch relationship creation when possible

**Regular Maintenance**:
- Review and update VC information quarterly
- Monitor for firm changes and VC moves
- Clean up outdated or duplicate entries

### Performance Optimization

**Search Strategy**:
- Use specific search terms when possible
- Filter by season to narrow results
- Combine filters for precise targeting

**Image Management**:
- Use high-quality profile images
- Ensure images are accessible via HTTPS
- Optimize for web display (reasonable file sizes)

This guide provides comprehensive coverage of the VC management system, from basic operations to advanced usage patterns and troubleshooting. 