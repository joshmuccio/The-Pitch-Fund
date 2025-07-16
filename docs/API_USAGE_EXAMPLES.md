# API Usage Examples

## Image Upload & SVG Conversion

### Overview
The image upload system provides a two-step process for uploading bitmap images and converting them to scalable SVG versions. This system is used for company logos in the investment wizard.

### Upload Logo API

#### Upload Original Image
```javascript
// Example: Upload a logo image file
const file = event.target.files[0] // File from input
const formData = new FormData()
formData.append('file', file)

// Generate upload token
const uploadResponse = await fetch('/api/upload-logo', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    pathname: `logos/${file.name}`,
    // Additional upload configuration
  })
})

const { url } = await uploadResponse.json()
console.log('Original image uploaded:', url)
```

#### Convert to SVG
```javascript
// Example: Convert uploaded image to SVG
const vectorizeResponse = await fetch('/api/vectorize-logo', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    imageUrl: 'https://blob.vercel.com/your-uploaded-image.png'
  })
})

const result = await vectorizeResponse.json()
console.log('Vectorization result:', {
  originalUrl: result.originalUrl,
  svgUrl: result.svgUrl,
  originalSize: result.originalSize,
  svgSize: result.svgSize,
  conversionRatio: result.conversionRatio + '% size reduction'
})
```

### Using the LogoUploader Component

```typescript
import { LogoUploader } from '@/components/LogoUploader'

function CompanyForm() {
  const [logoUrl, setLogoUrl] = useState('')
  const [svgUrl, setSvgUrl] = useState('')

  return (
    <LogoUploader
      currentLogoUrl={logoUrl}
      currentSvgUrl={svgUrl}
      onUploadSuccess={(url) => {
        setLogoUrl(url)
        console.log('Original logo uploaded:', url)
      }}
      onSvgUploadSuccess={(url) => {
        setSvgUrl(url)
        console.log('SVG version created:', url)
      }}
    />
  )
}
```

### Error Handling

```javascript
try {
  const response = await fetch('/api/vectorize-logo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl })
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('Vectorization failed:', error.error)
    return
  }

  const result = await response.json()
  console.log('Success:', result)
} catch (error) {
  console.error('Network error:', error)
}
```

## Episode Date Extraction

### Overview
The episode date extraction functionality allows you to extract publish dates from Pitch Episode URLs. This is useful for automatically populating the publish date field when adding episode URLs to investment records.

### API Endpoint
```
GET /api/extract-episode-date?url={episode_url}
```

### Example Usage

#### Using the API Route
```javascript
// Example: Extract publish date from episode URL
const episodeUrl = 'https://www.thepitch.show/164-sundae-ltk-for-groceries/'

const response = await fetch(`/api/extract-episode-date?url=${encodeURIComponent(episodeUrl)}`)
const data = await response.json()

if (data.success) {
  console.log('Publish Date:', data.publishDate)        // "2025-06-18"
  console.log('Original Date:', data.originalDate)      // "June 18, 2025"
  console.log('Extraction Method:', data.extractionMethod) // "Text pattern matching"
} else {
  console.error('Error:', data.error)
}
```

#### Using the Utility Function
```javascript
import { extractEpisodeDate, getEpisodePublishDate } from '@/lib/episode-date-extractor'

// Full result with metadata
const result = await extractEpisodeDate('https://www.thepitch.show/164-sundae-ltk-for-groceries/')
console.log(result)
// {
//   publishDate: "2025-06-18",
//   originalDate: "June 18, 2025",
//   extractionMethod: "Text pattern matching",
//   success: true
// }

// Simple date extraction
const publishDate = await getEpisodePublishDate('https://www.thepitch.show/164-sundae-ltk-for-groceries/')
console.log(publishDate) // "2025-06-18" or null if not found
```

### Response Format

#### Success Response
```json
{
  "url": "https://www.thepitch.show/164-sundae-ltk-for-groceries/",
  "publishDate": "2025-06-18",
  "originalDate": "June 18, 2025",
  "extractionMethod": "Text pattern matching",
  "success": true
}
```

#### Error Response
```json
{
  "error": "No publish date found on this page",
  "url": "https://www.thepitch.show/some-episode/",
  "success": false
}
```

### Extraction Methods

The system uses multiple methods to extract dates in order of preference:

1. **JSON-LD structured data** - Looks for `datePublished` in structured data
2. **Meta tags** - Searches for various meta tags like `article:published_time`
3. **HTML time elements** - Looks for `<time datetime="...">` elements
4. **Text pattern matching** - Searches for date patterns in the page content

### Integration with URL Validation

You can combine this with the existing URL validation:

```javascript
// First validate the URL
const urlValidation = await fetch(`/api/check-url?url=${encodeURIComponent(episodeUrl)}`)
const urlData = await urlValidation.json()

if (urlData.ok) {
  // URL is valid, now extract the date
  const dateExtraction = await fetch(`/api/extract-episode-date?url=${encodeURIComponent(episodeUrl)}`)
  const dateData = await dateExtraction.json()
  
  if (dateData.success) {
    // Use the extracted date
    console.log('Episode published on:', dateData.publishDate)
  }
}
```

### Error Handling

The API returns different status codes for different error types:

- **400 Bad Request**: Invalid URL format or not from thepitch.show
- **404 Not Found**: No publish date found on the page
- **500 Internal Server Error**: Unexpected server error

### Notes

- The function specifically works with thepitch.show URLs
- Dates are normalized to YYYY-MM-DD format when possible
- The original date format is preserved in the response
- Extraction method is provided for debugging and transparency
- Session IDs are generated for logging and debugging purposes [[memory:3001483]] 