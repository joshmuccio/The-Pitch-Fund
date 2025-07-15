import { load } from 'cheerio'

export interface EpisodeDateResult {
  publishDate: string | null
  originalDate: string | null
  extractionMethod: string | null
  success: boolean
  error?: string
}

export async function extractEpisodeDate(url: string): Promise<EpisodeDateResult> {
  try {
    // Validate URL format
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch (formatError) {
      return {
        publishDate: null,
        originalDate: null,
        extractionMethod: null,
        success: false,
        error: 'Invalid URL format'
      }
    }

    // Check if it's a thepitch.show URL
    if (!parsedUrl.hostname.includes('thepitch.show')) {
      return {
        publishDate: null,
        originalDate: null,
        extractionMethod: null,
        success: false,
        error: 'URL must be from thepitch.show'
      }
    }

    // Fetch the webpage content
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; The Pitch Fund Episode Date Extractor/1.0)'
      }
    })

    if (!response.ok) {
      return {
        publishDate: null,
        originalDate: null,
        extractionMethod: null,
        success: false,
        error: `Failed to fetch webpage: ${response.status}`
      }
    }

    const html = await response.text()
    
    // Parse HTML with Cheerio
    const $ = load(html)
    
    let publishDate: string | null = null
    let extractionMethod: string | null = null

    // Method 1: Look for JSON-LD structured data
    $('script[type="application/ld+json"]').each((_: number, element: any) => {
      try {
        const jsonText = $(element).html()
        if (jsonText) {
          const jsonData = JSON.parse(jsonText)
          
          // Handle array of structured data
          const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData]
          
          for (const data of dataArray) {
            if (data['@type'] === 'Article' || data['@type'] === 'BlogPosting' || data['@type'] === 'Episode') {
              if (data.datePublished) {
                publishDate = data.datePublished
                extractionMethod = 'JSON-LD structured data'
                return false // Break out of each loop
              }
            }
          }
        }
      } catch (jsonError) {
        // Continue to next method if JSON parsing fails
      }
    })

    // Method 2: Look for meta tags
    if (!publishDate) {
      const metaSelectors = [
        'meta[property="article:published_time"]',
        'meta[name="article:published_time"]',
        'meta[property="datePublished"]',
        'meta[name="datePublished"]',
        'meta[property="og:article:published_time"]',
        'meta[name="publishdate"]',
        'meta[name="publish_date"]',
        'meta[property="article:published"]',
        'meta[name="date"]'
      ]

      for (const selector of metaSelectors) {
        const content = $(selector).attr('content')
        if (content) {
          publishDate = content
          extractionMethod = `Meta tag: ${selector}`
          break
        }
      }
    }

    // Method 3: Look for time elements
    if (!publishDate) {
      const timeElement = $('time[datetime]').first()
      if (timeElement.length > 0) {
        publishDate = timeElement.attr('datetime') || null
        extractionMethod = 'HTML time element'
      }
    }

    // Method 4: Look for specific patterns in the text content
    if (!publishDate) {
      // Look for dates in common formats
      const textContent = $('body').text()
      const datePatterns = [
        /(\w+\.?\s+\d{1,2},\s+\d{4})/g, // "June 18, 2025" or "Jun. 18, 2025"
        /(\d{1,2}\/\d{1,2}\/\d{4})/g,   // "6/18/2025"
        /(\d{4}-\d{2}-\d{2})/g,         // "2025-06-18"
        /(\d{1,2}-\d{1,2}-\d{4})/g,     // "18-06-2025"
      ]

      for (const pattern of datePatterns) {
        const matches = textContent.match(pattern)
        if (matches && matches.length > 0) {
          // Take the first match that looks like a reasonable date
          publishDate = matches[0]
          extractionMethod = 'Text pattern matching'
          break
        }
      }
    }

    if (!publishDate) {
      return {
        publishDate: null,
        originalDate: null,
        extractionMethod: null,
        success: false,
        error: 'No publish date found on this page'
      }
    }

    // Try to normalize the date format
    let normalizedDate: string | null = null
    const originalDate = publishDate
    
    try {
      const dateObj = new Date(publishDate)
      if (!isNaN(dateObj.getTime())) {
        normalizedDate = dateObj.toISOString().split('T')[0] // YYYY-MM-DD format
      }
    } catch (dateError) {
      // If normalization fails, use the original date
    }

    return {
      publishDate: normalizedDate || originalDate,
      originalDate: originalDate,
      extractionMethod: extractionMethod,
      success: true
    }

  } catch (error) {
    return {
      publishDate: null,
      originalDate: null,
      extractionMethod: null,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Helper function to integrate with the existing URL validation workflow
export async function getEpisodePublishDate(url: string): Promise<string | null> {
  const result = await extractEpisodeDate(url)
  return result.success ? result.publishDate : null
} 