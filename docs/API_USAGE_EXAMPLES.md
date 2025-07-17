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
The episode date extraction functionality allows you to extract publish dates, episode titles, season numbers, and show notes from Pitch Episode URLs. This is useful for automatically populating episode-related fields when adding episode URLs to investment records.

### API Endpoint
```
GET /api/extract-episode-date?url={episode_url}&extract={type}
```

**Parameters**:
- `url` (required): The thepitch.show episode URL
- `extract` (optional): Type of data to extract
  - `date` - Extract publish date only (default)
  - `title` - Extract episode title only
  - `season` - Extract season number only  
  - `shownotes` - Extract show notes only
  - `all` - Extract all episode data

### Example Usage

#### Using the API Route - Extract All Episode Data
```javascript
// Example: Extract all episode data from episode URL
const episodeUrl = 'https://www.thepitch.show/164-sundae-ltk-for-groceries/'

const response = await fetch(`/api/extract-episode-date?url=${encodeURIComponent(episodeUrl)}&extract=all`)
const data = await response.json()

if (data.success) {
  console.log('Publish Date:', data.publishDate)        // "2025-06-18"
  console.log('Original Date:', data.originalDate)      // "June 18, 2025"
  console.log('Episode Title:', data.episodeTitle)      // "#164 Sundae: LTK for Groceries"
  console.log('Episode Season:', data.episodeSeason)    // 13
  console.log('Show Notes:', data.episodeShowNotes)     // "Sundae is building a platform that makes it easier..."
  console.log('Extraction Method:', data.extractionMethod) // "Text pattern matching"
} else {
  console.error('Error:', data.error)
}
```

#### Extract Specific Data Types
```javascript
// Extract only episode title
const titleResponse = await fetch(`/api/extract-episode-date?url=${encodeURIComponent(episodeUrl)}&extract=title`)
const titleData = await titleResponse.json()
console.log('Title:', titleData.episodeTitle) // "#164 Sundae: LTK for Groceries"

// Extract only season number
const seasonResponse = await fetch(`/api/extract-episode-date?url=${encodeURIComponent(episodeUrl)}&extract=season`)
const seasonData = await seasonResponse.json()
console.log('Season:', seasonData.episodeSeason) // 13

// Extract only show notes (with ellipsis truncation)
const notesResponse = await fetch(`/api/extract-episode-date?url=${encodeURIComponent(episodeUrl)}&extract=shownotes`)
const notesData = await notesResponse.json()
console.log('Show Notes:', notesData.episodeShowNotes) // Truncated at ellipsis
```

#### Using the Utility Functions
```javascript
import { 
  extractEpisodeDate, 
  extractEpisodeTitle,
  extractEpisodeSeason,
  extractEpisodeShowNotes,
  extractAllEpisodeData,
  getEpisodePublishDate 
} from '@/lib/episode-date-extractor'

// Extract all episode data efficiently
const allData = await extractAllEpisodeData('https://www.thepitch.show/164-sundae-ltk-for-groceries/')
console.log(allData)
// {
//   publishDate: "2025-06-18",
//   originalDate: "June 18, 2025",
//   episodeTitle: "#164 Sundae: LTK for Groceries",
//   episodeSeason: 13,
//   episodeShowNotes: "Sundae is building a platform...",
//   extractionMethod: "Show notes tab content",
//   success: true
// }

// Extract individual data types
const titleResult = await extractEpisodeTitle('https://www.thepitch.show/164-sundae-ltk-for-groceries/')
const seasonResult = await extractEpisodeSeason('https://www.thepitch.show/164-sundae-ltk-for-groceries/')
const notesResult = await extractEpisodeShowNotes('https://www.thepitch.show/164-sundae-ltk-for-groceries/')

// Simple date extraction (legacy function)
const publishDate = await getEpisodePublishDate('https://www.thepitch.show/164-sundae-ltk-for-groceries/')
console.log(publishDate) // "2025-06-18" or null if not found
```

### Response Format

#### Success Response (All Data)
```json
{
  "url": "https://www.thepitch.show/164-sundae-ltk-for-groceries/",
  "publishDate": "2025-06-18",
  "originalDate": "June 18, 2025",
  "episodeTitle": "#164 Sundae: LTK for Groceries",
  "episodeSeason": 13,
  "episodeShowNotes": "Sundae is building a platform that makes it easier for busy parents to get groceries. Parents can order via text, Instagram, or the app.",
  "extractionMethod": "Show notes tab content",
  "success": true
}
```

#### Success Response (Individual Type)
```json
{
  "url": "https://www.thepitch.show/164-sundae-ltk-for-groceries/",
  "episodeTitle": "#164 Sundae: LTK for Groceries",
  "extractionMethod": "H1 element extraction",
  "success": true
}
```

#### Error Response
```json
{
  "error": "No episode title found on this page",
  "url": "https://www.thepitch.show/some-episode/",
  "success": false
}
```

### Extraction Methods

The system uses multiple methods to extract different types of data:

#### Episode Date Extraction
1. **JSON-LD structured data** - Looks for `datePublished` in structured data
2. **Meta tags** - Searches for various meta tags like `article:published_time`
3. **HTML time elements** - Looks for `<time datetime="...">` elements
4. **Text pattern matching** - Searches for date patterns in the page content

#### Episode Title Extraction
1. **H1 elements** - Searches for main heading elements
2. **Title tags** - Extracts from page title
3. **JSON-LD structured data** - Looks for structured episode data
4. **Open Graph meta tags** - Falls back to social media meta tags

#### Episode Season Extraction
1. **Tagcloud season links** - Searches for `/episodes/season/13/` style links
2. **URL pattern analysis** - Extracts season from episode URL structure
3. **Content pattern matching** - Searches for season mentions in page content

#### Episode Show Notes Extraction (with Ellipsis Truncation)
1. **Show notes tab content** - Primary extraction from `#show-notes .post-content-body`
2. **Alternative selectors** - Fallback to other show notes containers
3. **JSON-LD structured data** - Structured data description fallback
4. **Smart truncation** - Automatically truncates content before ellipsis (`...`, `…`)

### Show Notes Ellipsis Truncation

The show notes extraction includes intelligent truncation that stops at the first ellipsis:

**Supported Ellipsis Patterns**:
- `...` (three dots)
- `…` (Unicode ellipsis character)
- `. . .` (spaced dots)

**Example**:
```
Original: "Sundae is building a platform... Read full episode notes on our website."
Extracted: "Sundae is building a platform"
```

**Benefits**:
- Extracts only the introductory content before "read more" sections
- Prevents including website navigation text or lengthy episode descriptions
- Maintains clean, focused content for database storage

### Integration with URL Validation

You can combine this with the existing URL validation:

```javascript
// First validate the URL
const urlValidation = await fetch(`/api/check-url?url=${encodeURIComponent(episodeUrl)}`)
const urlData = await urlValidation.json()

if (urlData.ok) {
  // URL is valid, now extract all episode data
  const episodeExtraction = await fetch(`/api/extract-episode-date?url=${encodeURIComponent(episodeUrl)}&extract=all`)
  const episodeData = await episodeExtraction.json()
  
  if (episodeData.success) {
    // Use the extracted data
    console.log('Episode Title:', episodeData.episodeTitle)
    console.log('Season:', episodeData.episodeSeason)
    console.log('Show Notes:', episodeData.episodeShowNotes)
    console.log('Published on:', episodeData.publishDate)
  }
}
```

### Error Handling

The API returns different status codes for different error types:

- **400 Bad Request**: Invalid URL format or not from thepitch.show
- **404 Not Found**: No episode data found on the page
- **500 Internal Server Error**: Unexpected server error

### Investment Wizard Integration

The Investment Wizard (Step 3) automatically uses the combined extraction:

```javascript
// Automatic extraction when episode URL is entered
if (fieldName === 'pitch_episode_url') {
  try {
    const response = await fetch(`/api/extract-episode-date?url=${encodeURIComponent(url)}&extract=all`);
    const data = await response.json();
    
    if (data.success) {
      // Auto-populate all episode fields
      if (data.publishDate) setValue('episode_publish_date', data.publishDate);
      if (data.episodeTitle) setValue('episode_title', data.episodeTitle);
      if (data.episodeSeason) setValue('episode_season', data.episodeSeason);
      if (data.episodeShowNotes) setValue('episode_show_notes', data.episodeShowNotes);
      
      // Clear validation errors
      trigger(['episode_publish_date', 'episode_title', 'episode_season', 'episode_show_notes']);
    }
  } catch (error) {
    console.log('Error during automatic extraction:', error);
  }
}
```

### Notes

- All extraction functions specifically work with thepitch.show URLs
- Dates are normalized to YYYY-MM-DD format when possible
- Episode titles include episode numbers and full episode names
- Season numbers are extracted as integers (1-50)
- Show notes are automatically truncated at ellipsis for clean content
- Extraction methods are provided for debugging and transparency 