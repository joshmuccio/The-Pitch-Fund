# Image Upload & SVG Conversion System

## Overview

The Pitch Fund implements a robust two-step image upload and vectorization system that allows users to upload bitmap images (PNG, JPEG, etc.) and automatically convert them to scalable SVG versions using Vectorizer.ai.

## Architecture

### Two-Step Process

1. **Step 1: Original Image Upload**
   - Upload bitmap image to Vercel Blob storage
   - Validate file type and size
   - Generate secure upload token
   - Return original image URL

2. **Step 2: SVG Vectorization**
   - Fetch original image from Vercel Blob
   - Send to Vectorizer.ai for conversion
   - Process and clean SVG output
   - Upload SVG to Vercel Blob storage
   - Return both original and SVG URLs

### Benefits of Two-Step Architecture

- **Reliability**: Original file uploaded first, vectorization as enhancement
- **Transparency**: Users see both URLs and can test functionality
- **Fallback**: Original preserved if SVG creation fails
- **Debugging**: Easy identification of upload vs vectorization issues
- **Performance**: Non-blocking uploads with progressive enhancement
- **User Control**: Manual retry capability and test links

## Database Schema

The system uses two URL fields in the companies table:

```sql
-- Original uploaded image
logo_url TEXT -- Required field

-- Vectorized SVG version
svg_logo_url TEXT -- Optional field
```

### Migration
```sql
-- Added in: 20250716021321_add_svg_logo_url.sql
ALTER TABLE companies ADD COLUMN svg_logo_url TEXT;
```

## API Endpoints

### `/api/upload-logo` - Primary Upload Handler

**Method**: `POST`  
**Runtime**: Edge  
**Content-Type**: `application/json`

**Request Body**:
```typescript
{
  body: HandleUploadBody // Vercel Blob client upload format
}
```

**Features**:
- 5MB file size limit
- Supported formats: PNG, JPEG, GIF, BMP, TIFF, SVG, WebP
- Auto-generates random suffixes for uniqueness
- Session ID tracking for debugging

**Response**:
```typescript
{
  url: string,          // Uploaded file URL
  pathname: string,     // File path
  contentType: string,  // MIME type
  contentDisposition: string
}
```

### `/api/vectorize-logo` - SVG Conversion

**Method**: `POST`  
**Runtime**: Edge  
**Content-Type**: `application/json`

**Request Body**:
```typescript
{
  imageUrl: string // URL of uploaded bitmap image
}
```

**Response**:
```typescript
{
  originalUrl: string,      // Original image URL
  svgUrl: string,          // Vectorized SVG URL
  originalSize: number,    // Original file size in bytes
  svgSize: number,         // SVG file size in bytes
  conversionRatio: string  // Size reduction percentage
}
```

## Frontend Integration

### LogoUploader Component

**Location**: `src/components/LogoUploader.tsx`

**Key Features**:
- Drag & drop file upload
- Auto-triggers vectorization after successful upload
- Manual "Create SVG Version" retry button
- Real-time progress indicators
- Test links for both versions
- Error handling and loading states

**Usage**:
```typescript
<LogoUploader
  currentLogoUrl={logoUrl}
  currentSvgUrl={svgUrl}
  onUploadSuccess={(url) => {
    setLogoUrl(url)
    // Auto-triggers vectorization
  }}
  onSvgUploadSuccess={(url) => {
    setSvgUrl(url)
  }}
/>
```

### Form Integration

**Location**: `src/app/admin/investments/new/steps/AdditionalInfoStep.tsx`

**Integration Points**:
```typescript
// Form field watchers
const logoUrl = watch('logo_url')
const svgUrl = watch('svg_logo_url')

// Upload handlers
const handleLogoUploadSuccess = (url: string) => {
  setValue('logo_url', url, { shouldValidate: true })
}

const handleSvgUploadSuccess = (url: string) => {
  setValue('svg_logo_url', url, { shouldValidate: true })
}
```

## Validation Schema

**Location**: `src/app/admin/schemas/companySchema.ts`

```typescript
// Step 2 Schema (Required)
logo_url: z.string().url('Must be a valid URL').min(1, 'Company logo is required'),
svg_logo_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),

// Partial Schema (Real-time validation)
logo_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
svg_logo_url: z.string().url('Must be a valid URL').optional().or(z.literal(''))
```

## SVG Processing

### XML Cleaning Process

The system implements robust SVG cleaning to ensure browser compatibility:

1. **Multiline Attribute Fixing**: Removes line breaks within XML attributes
2. **Whitespace Normalization**: Cleans up formatting
3. **Color Standardization**: Replaces `currentColor` with `#000000`
4. **CSS Styling**: Adds `<img>` tag compatibility styles

**Processing Code**:
```typescript
// Fix multiline attributes
svgContent = svgContent.replace(/(\w+)="([^"]*[\r\n][^"]*)"/g, (match, attr, value) => {
  const cleanValue = value.replace(/[\r\n\s]+/g, ' ').trim()
  return `${attr}="${cleanValue}"`
})

// Replace currentColor and normalize
svgContent = svgContent
  .replace(/currentColor/gi, '#000000')
  .replace(/[\r\n]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
```

## Error Handling

### Comprehensive Error Tracking

All endpoints include:
- **Sentry Integration**: Automatic exception capture
- **Session ID Tracking**: Unique identifiers for debugging
- **Structured Logging**: Consistent log formats with emojis
- **Error Context**: Rich metadata for debugging

### Common Error Scenarios

1. **File Too Large**: 5MB limit exceeded
2. **Invalid File Type**: Unsupported format
3. **Vectorizer API Error**: Third-party service issues
4. **Network Timeout**: Connection failures
5. **SVG Processing Error**: XML parsing issues

### Error Response Format

```typescript
{
  error: string,          // Human-readable error message
  details?: string,       // Additional technical details
  sessionId?: string      // For debugging support
}
```

## Environment Configuration

### Required Environment Variables

```bash
# Vectorizer.ai Configuration
VECTORIZER_AI_USER_ID=your_user_id
VECTORIZER_AI_API_TOKEN=your_api_token

# Feature Toggle
ENABLE_IMAGE_VECTORIZATION=true

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=your_blob_token
```

### Feature Toggle

The system includes a feature toggle for vectorization:

```typescript
const enableVectorization = process.env.ENABLE_IMAGE_VECTORIZATION
if (enableVectorization !== 'true') {
  // Skip vectorization, return graceful fallback
}
```

## Testing & Development

### Manual Testing

1. **Upload Test**: Upload various image formats
2. **Vectorization Test**: Verify SVG creation and quality
3. **Error Scenarios**: Test file size limits, invalid formats
4. **Browser Compatibility**: Test SVG rendering across browsers

### Test URLs

The system provides test links for uploaded files:
- **Original Image**: Opens in new tab (blue button)
- **SVG Version**: Opens in new tab (green button)

### Development Logging

Session-based logging with crypto.randomUUID() for traceability:

```typescript
const sessionId = crypto.randomUUID()
console.log(`🚀 [upload-logo:${sessionId}] Client upload handler started`)
console.log(`✅ [upload-logo:${sessionId}] Token generated successfully`)
```

## Performance Considerations

### Edge Runtime Benefits

- **Global Distribution**: Runs closer to users worldwide
- **Faster Cold Starts**: Reduced latency for API calls
- **Auto-scaling**: Handles traffic spikes seamlessly
- **Cost Efficiency**: Better resource utilization

### Optimization Strategies

1. **Parallel Processing**: Upload and vectorization run independently
2. **Progressive Enhancement**: Original image available immediately
3. **Caching**: Vercel Blob provides global CDN caching
4. **Error Recovery**: Manual retry capabilities

## Future Enhancements

### Planned Improvements

1. **Batch Processing**: Multiple image uploads
2. **Advanced SVG Options**: Custom vectorization parameters
3. **Image Optimization**: Automatic compression and resizing
4. **Preview Generation**: Thumbnail creation
5. **Alternative Providers**: Fallback vectorization services

### Integration Opportunities

1. **AI Image Enhancement**: Upscaling and quality improvement
2. **Brand Guidelines**: Automatic color extraction and analysis
3. **Accessibility**: Alt text generation from image content
4. **SEO Optimization**: Structured data for images

## Troubleshooting

### Common Issues

1. **SVG Not Displaying**: Check XML syntax in browser dev tools
2. **Upload Failures**: Verify file size and format
3. **Vectorization Timeout**: Check Vectorizer.ai service status
4. **CORS Issues**: Ensure proper domain configuration

### Debug Information

Use session IDs to trace requests across logs:
```bash
# Search logs for specific session
grep "session-id-here" application.log
```

### Support Resources

- **Vectorizer.ai Documentation**: API parameter reference
- **Vercel Blob Docs**: Storage and CDN configuration
- **Next.js Edge Runtime**: Performance and limitations 