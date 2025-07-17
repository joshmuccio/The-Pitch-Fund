import { load } from 'cheerio'

export interface EpisodeDateResult {
  publishDate: string | null
  originalDate: string | null
  extractionMethod: string | null
  success: boolean
  error?: string
}

export interface EpisodeTranscriptResult {
  transcript: string | null
  extractionMethod: string | null
  success: boolean
  error?: string
}

export interface EpisodeTitleResult {
  title: string | null
  extractionMethod: string | null
  success: boolean
  error?: string
}

export interface EpisodeSeasonResult {
  season: number | null
  extractionMethod: string | null
  success: boolean
  error?: string
}

export interface EpisodeShowNotesResult {
  showNotes: string | null
  extractionMethod: string | null
  success: boolean
  error?: string
}

export interface EpisodeDataResult {
  publishDate: string | null
  originalDate: string | null
  dateExtractionMethod: string | null
  transcript: string | null
  transcriptExtractionMethod: string | null
  title: string | null
  titleExtractionMethod: string | null
  season: number | null
  seasonExtractionMethod: string | null
  showNotes: string | null
  showNotesExtractionMethod: string | null
  success: boolean
  error?: string
}

// Helper function to validate thepitch.show URL
function validateThePitchUrl(url: string): { isValid: boolean; error?: string } {
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch (formatError) {
    return { isValid: false, error: 'Invalid URL format' }
  }

  if (!parsedUrl.hostname.includes('thepitch.show')) {
    return { isValid: false, error: 'URL must be from thepitch.show' }
  }

  return { isValid: true }
}

// Helper function to fetch page content
async function fetchPageContent(url: string): Promise<{ html: string; success: boolean; error?: string }> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; The Pitch Fund Data Extractor/1.0)'
      }
    })

    if (!response.ok) {
      return {
        html: '',
        success: false,
        error: `Failed to fetch webpage: ${response.status}`
      }
    }

    const html = await response.text()
    return { html, success: true }
  } catch (error) {
    return {
      html: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
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

export async function extractEpisodeTranscript(url: string): Promise<EpisodeTranscriptResult> {
  try {
    // Validate URL format
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch (formatError) {
      return {
        transcript: null,
        extractionMethod: null,
        success: false,
        error: 'Invalid URL format'
      }
    }

    // Check if it's a thepitch.show URL
    if (!parsedUrl.hostname.includes('thepitch.show')) {
      return {
        transcript: null,
        extractionMethod: null,
        success: false,
        error: 'URL must be from thepitch.show'
      }
    }

    // Construct transcript URL by appending #transcript
    const transcriptUrl = url.includes('#transcript') ? url : `${url}#transcript`

    // Fetch the webpage content
    const response = await fetch(transcriptUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; The Pitch Fund Transcript Extractor/1.0)'
      }
    })

    if (!response.ok) {
      return {
        transcript: null,
        extractionMethod: null,
        success: false,
        error: `Failed to fetch page: ${response.status} ${response.statusText}`
      }
    }

    const html = await response.text()
    const $ = load(html)

    // Try multiple selectors to find the transcript content
    const transcriptSelectors = [
      '#transcript',
      '.transcript',
      '[id*="transcript"]',
      '[class*="transcript"]',
      'section[aria-label*="transcript" i]',
      'div[data-transcript]',
      '.episode-transcript',
      '.pitch-transcript'
    ]

    let transcriptElement: any = null
    let method: string | null = null

    for (const selector of transcriptSelectors) {
      const element = $(selector)
      if (element.length > 0) {
        // Get the HTML content, preserving formatting
        const elementHtml = element.html()
        
        // Clean up the transcript HTML - remove scripts and unnecessary elements
        if (elementHtml && elementHtml.length > 100) {
          // Remove script tags, style tags, and other non-content elements
          const cleanElement = element.clone()
          cleanElement.find('script, style, noscript, iframe').remove()
          
          // Basic validation - check if it looks like transcript content
          const textContent = cleanElement.text().trim()
          if (textContent.length > 100) {
            transcriptElement = cleanElement
            method = `Found using selector: ${selector}`
            break
          }
        }
      }
    }

    // If no transcript found with specific selectors, try broader content search
    if (!transcriptElement) {
      // Look for elements containing the word "transcript" or common transcript patterns
      const possibleTranscripts = $('*').filter(function(this: any) {
        const text = $(this).text().toLowerCase()
        const hasTranscriptKeyword = text.includes('transcript') || 
                                   text.includes('welcome to the pitch') ||
                                   text.includes('josh muccio') ||
                                   text.includes('today we have')
        const isLongEnough = text.length > 500
        const hasConversationPattern = text.includes(':') && (text.match(/:/g) || []).length > 5
        
        return hasTranscriptKeyword && isLongEnough && hasConversationPattern
      })

      if (possibleTranscripts.length > 0) {
        // Get the longest element (likely the full transcript)
        let longestElement: any = null
        let longestLength = 0
        
        possibleTranscripts.each(function(this: any) {
          const textLength = $(this).text().trim().length
          if (textLength > longestLength) {
            longestLength = textLength
            longestElement = $(this)
          }
        })

        if (longestElement && longestLength > 500) {
          // Clean the element
          const cleanElement = longestElement.clone()
          cleanElement.find('script, style, noscript, iframe').remove()
          transcriptElement = cleanElement
          method = 'Found using content pattern matching'
        }
      }
    }

    if (!transcriptElement || transcriptElement.text().trim().length < 100) {
      return {
        transcript: null,
        extractionMethod: null,
        success: false,
        error: 'No transcript content found on the page'
      }
    }

    // Convert to clean text with paragraph breaks
    let cleanTranscript = ''
    
    // Process each paragraph element
    transcriptElement.find('p').each(function(this: any) {
      const paragraphText = $(this).text().trim()
      if (paragraphText.length > 0) {
        cleanTranscript += paragraphText + '\n\n'
      }
    })

    // If no paragraphs found, try to extract text and create paragraphs from line breaks
    if (cleanTranscript.trim().length === 0) {
      const allText = transcriptElement.text().trim()
      
      // Split on double line breaks or specific patterns that indicate paragraph breaks
      const paragraphs = allText
        .split(/\n\s*\n|\[break\]|\[applause\]/)
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 0)
      
      cleanTranscript = paragraphs.join('\n\n')
    }

    // Final cleanup
    cleanTranscript = cleanTranscript
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .split('\n') // Split into lines to process each separately
      .map((line: string) => line.replace(/[ \t]+/g, ' ').trim()) // Normalize spaces/tabs within each line only
      .join('\n') // Rejoin with newlines
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Ensure max 2 consecutive newlines
      .trim()

    if (cleanTranscript.length < 100) {
      return {
        transcript: null,
        extractionMethod: null,
        success: false,
        error: 'Extracted transcript is too short'
      }
    }

    return {
      transcript: cleanTranscript,
      extractionMethod: method,
      success: true
    }

  } catch (error) {
    console.error('Error extracting episode transcript:', error)
    return {
      transcript: null,
      extractionMethod: null,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export async function extractEpisodeTitle(url: string): Promise<EpisodeTitleResult> {
  try {
    const urlValidation = validateThePitchUrl(url)
    if (!urlValidation.isValid) {
      return {
        title: null,
        extractionMethod: null,
        success: false,
        error: urlValidation.error
      }
    }

    const fetchResult = await fetchPageContent(url)
    if (!fetchResult.success) {
      return {
        title: null,
        extractionMethod: null,
        success: false,
        error: fetchResult.error
      }
    }

    const $ = load(fetchResult.html)
    
    let title: string | null = null
    let extractionMethod: string | null = null

    // Method 1: Look for h1 tag (most common)
    const h1Element = $('h1').first()
    if (h1Element.length > 0) {
      const h1Text = h1Element.text().trim()
      if (h1Text && h1Text.length > 0) {
        title = h1Text
        extractionMethod = 'H1 element'
      }
    }

    // Method 2: Look for title tag in head
    if (!title) {
      const titleElement = $('head title')
      if (titleElement.length > 0) {
        const titleText = titleElement.text().trim()
        // Clean up the title (remove site name if present)
        const cleanTitle = titleText.replace(/\s*\|\s*The Pitch.*$/i, '').trim()
        if (cleanTitle && cleanTitle.length > 0) {
          title = cleanTitle
          extractionMethod = 'Title tag'
        }
      }
    }

    // Method 3: Look for JSON-LD structured data
    if (!title) {
      $('script[type="application/ld+json"]').each((_: number, element: any) => {
        try {
          const jsonText = $(element).html()
          if (jsonText) {
            const jsonData = JSON.parse(jsonText)
            const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData]
            
            for (const data of dataArray) {
              if ((data['@type'] === 'Article' || data['@type'] === 'BlogPosting' || data['@type'] === 'Episode') && data.headline) {
                title = data.headline.trim()
                extractionMethod = 'JSON-LD structured data'
                return false // Break out of loop
              }
            }
          }
        } catch (jsonError) {
          // Continue to next method if JSON parsing fails
        }
      })
    }

    // Method 4: Look for meta property="og:title"
    if (!title) {
      const ogTitle = $('meta[property="og:title"]').attr('content')
      if (ogTitle && ogTitle.trim().length > 0) {
        title = ogTitle.trim()
        extractionMethod = 'Open Graph title'
      }
    }

    if (!title) {
      return {
        title: null,
        extractionMethod: null,
        success: false,
        error: 'No episode title found on this page'
      }
    }

    return {
      title: title,
      extractionMethod: extractionMethod,
      success: true
    }

  } catch (error) {
    return {
      title: null,
      extractionMethod: null,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export async function extractEpisodeSeason(url: string): Promise<EpisodeSeasonResult> {
  try {
    const urlValidation = validateThePitchUrl(url)
    if (!urlValidation.isValid) {
      return {
        season: null,
        extractionMethod: null,
        success: false,
        error: urlValidation.error
      }
    }

    const fetchResult = await fetchPageContent(url)
    if (!fetchResult.success) {
      return {
        season: null,
        extractionMethod: null,
        success: false,
        error: fetchResult.error
      }
    }

    const $ = load(fetchResult.html)
    
    let season: number | null = null
    let extractionMethod: string | null = null

    // Method 1: Look for season link in tagcloud
    const tagcloudDiv = $('.tagcloud')
    if (tagcloudDiv.length > 0) {
      const seasonLink = tagcloudDiv.find('a[href*="/episodes/season/"]')
      if (seasonLink.length > 0) {
        const href = seasonLink.attr('href')
        const text = seasonLink.text().trim()
        
        // Extract season number from href like "/episodes/season/13/"
        if (href) {
          const seasonMatch = href.match(/\/episodes\/season\/(\d+)\//i)
          if (seasonMatch && seasonMatch[1]) {
            const seasonNum = parseInt(seasonMatch[1], 10)
            if (!isNaN(seasonNum)) {
              season = seasonNum
              extractionMethod = 'Tagcloud season link (href)'
            }
          }
        }
        
        // If href didn't work, try to extract from text like "Season 13"
        if (!season && text) {
          const textMatch = text.match(/season\s+(\d+)/i)
          if (textMatch && textMatch[1]) {
            const seasonNum = parseInt(textMatch[1], 10)
            if (!isNaN(seasonNum)) {
              season = seasonNum
              extractionMethod = 'Tagcloud season link (text)'
            }
          }
        }
      }
    }

    // Method 2: Look for season in the URL itself
    if (!season) {
      const urlSeasonMatch = url.match(/\/(\d+)-/i) // Pattern like "/164-sundae-ltk-for-groceries/"
      if (urlSeasonMatch && urlSeasonMatch[1]) {
        const episodeNumber = parseInt(urlSeasonMatch[1], 10)
        if (!isNaN(episodeNumber)) {
          // Estimate season based on episode number (rough calculation)
          // This is approximate - you might need to adjust based on actual episode numbering
          if (episodeNumber >= 160) season = 13
          else if (episodeNumber >= 140) season = 12
          else if (episodeNumber >= 120) season = 11
          else if (episodeNumber >= 100) season = 10
          else if (episodeNumber >= 80) season = 9
          else if (episodeNumber >= 60) season = 8
          else if (episodeNumber >= 40) season = 7
          else if (episodeNumber >= 20) season = 6
          else season = Math.max(1, Math.ceil(episodeNumber / 20))
          
          if (season) {
            extractionMethod = 'URL episode number estimation'
          }
        }
      }
    }

    // Method 3: Look for season in page content
    if (!season) {
      const bodyText = $('body').text()
      const seasonMatches = bodyText.match(/season\s+(\d+)/gi)
      if (seasonMatches && seasonMatches.length > 0) {
        // Take the first match and extract the number
        const firstMatch = seasonMatches[0]
        const seasonNum = parseInt(firstMatch.match(/\d+/)?.[0] || '', 10)
        if (!isNaN(seasonNum) && seasonNum > 0 && seasonNum < 50) { // Reasonable season bounds
          season = seasonNum
          extractionMethod = 'Page content text pattern'
        }
      }
    }

    if (!season) {
      return {
        season: null,
        extractionMethod: null,
        success: false,
        error: 'No season number found on this page'
      }
    }

    return {
      season: season,
      extractionMethod: extractionMethod,
      success: true
    }

  } catch (error) {
    return {
      season: null,
      extractionMethod: null,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export async function extractEpisodeShowNotes(url: string): Promise<EpisodeShowNotesResult> {
  try {
    const urlValidation = validateThePitchUrl(url)
    if (!urlValidation.isValid) {
      return {
        showNotes: null,
        extractionMethod: null,
        success: false,
        error: urlValidation.error
      }
    }

    const fetchResult = await fetchPageContent(url)
    if (!fetchResult.success) {
      return {
        showNotes: null,
        extractionMethod: null,
        success: false,
        error: fetchResult.error
      }
    }

    const $ = load(fetchResult.html)
    
    let showNotes: string | null = null
    let extractionMethod: string | null = null

    // Method 1: Look for show notes tab content
    const showNotesTab = $('#show-notes')
    if (showNotesTab.length > 0) {
      const contentBody = showNotesTab.find('.post-content-body')
      if (contentBody.length > 0) {
        // Remove script tags and other unwanted elements
        const cleanContent = contentBody.clone()
        cleanContent.find('script, style, noscript, iframe').remove()
        
        // Extract text content with paragraph structure
        let cleanText = ''
        
        // Process each paragraph element to maintain structure
        cleanContent.find('p').each(function(this: any) {
          const paragraphText = $(this).text().trim()
          if (paragraphText.length > 0) {
            cleanText += paragraphText + '\n\n'
          }
        })

        // If no paragraphs found, try to get all text
        if (cleanText.trim().length === 0) {
          cleanText = cleanContent.text().trim()
        }

        // Clean up the text
        cleanText = cleanText
          .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
          .split('\n')
          .map((line: string) => line.replace(/[ \t]+/g, ' ').trim()) // Normalize spaces within lines
          .join('\n')
          .replace(/\n\s*\n\s*\n/g, '\n\n') // Ensure max 2 consecutive newlines
          .trim()

        // Truncate at ellipsis if present
        cleanText = truncateAtEllipsis(cleanText)

        if (cleanText.length > 50) { // Minimum length check
          showNotes = cleanText
          extractionMethod = 'Show notes tab content'
        }
      }
    }

    // Method 2: Look for other show notes containers
    if (!showNotes) {
      const alternativeSelectors = [
        '.show-notes',
        '[class*="show-notes"]',
        '[id*="show-notes"]',
        '.episode-notes',
        '.episode-description',
        '.post-content',
        '.entry-content'
      ]

      for (const selector of alternativeSelectors) {
        const element = $(selector)
        if (element.length > 0) {
          const cleanElement = element.clone()
          cleanElement.find('script, style, noscript, iframe').remove()
          
          let textContent = cleanElement.text().trim()
          // Truncate at ellipsis if present
          textContent = truncateAtEllipsis(textContent)
          
          if (textContent.length > 100) { // Reasonable minimum length
            showNotes = textContent
            extractionMethod = `Alternative selector: ${selector}`
            break
          }
        }
      }
    }

    // Method 3: Look for structured data description
    if (!showNotes) {
      $('script[type="application/ld+json"]').each((_: number, element: any) => {
        try {
          const jsonText = $(element).html()
          if (jsonText) {
            const jsonData = JSON.parse(jsonText)
            const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData]
            
            for (const data of dataArray) {
              if ((data['@type'] === 'Article' || data['@type'] === 'BlogPosting' || data['@type'] === 'Episode') && data.description) {
                let description = data.description.trim()
                // Truncate at ellipsis if present
                description = truncateAtEllipsis(description)
                
                if (description.length > 100) {
                  showNotes = description
                  extractionMethod = 'JSON-LD structured data description'
                  return false // Break out of loop
                }
              }
            }
          }
        } catch (jsonError) {
          // Continue to next method if JSON parsing fails
        }
      })
    }

    if (!showNotes) {
      return {
        showNotes: null,
        extractionMethod: null,
        success: false,
        error: 'No show notes content found on this page'
      }
    }

    return {
      showNotes: showNotes,
      extractionMethod: extractionMethod,
      success: true
    }

  } catch (error) {
    return {
      showNotes: null,
      extractionMethod: null,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Helper function to truncate show notes content at ellipsis
function truncateAtEllipsis(content: string): string {
  if (!content) return content
  
  // Look for various ellipsis patterns and truncate before them
  const ellipsisPatterns = [
    /\.\.\./,          // Three dots
    /…/,               // Unicode ellipsis character
    /\s*\.\s*\.\s*\./  // Spaced dots
  ]
  
  for (const pattern of ellipsisPatterns) {
    const match = content.search(pattern)
    if (match !== -1) {
      // Truncate at the ellipsis and clean up trailing whitespace
      const truncated = content.substring(0, match).trim()
      
      // Remove any trailing periods or punctuation that might look odd
      return truncated.replace(/[.,;:]\s*$/, '')
    }
  }
  
  // If no ellipsis found, return original content
  return content
}

// Combined extraction function for all episode data
export async function extractAllEpisodeData(url: string): Promise<EpisodeDataResult> {
  try {
    const urlValidation = validateThePitchUrl(url)
    if (!urlValidation.isValid) {
      return {
        publishDate: null,
        originalDate: null,
        dateExtractionMethod: null,
        transcript: null,
        transcriptExtractionMethod: null,
        title: null,
        titleExtractionMethod: null,
        season: null,
        seasonExtractionMethod: null,
        showNotes: null,
        showNotesExtractionMethod: null,
        success: false,
        error: urlValidation.error
      }
    }

    // Run all extractions in parallel for better performance
    const [dateResult, transcriptResult, titleResult, seasonResult, showNotesResult] = await Promise.all([
      extractEpisodeDate(url),
      extractEpisodeTranscript(url),
      extractEpisodeTitle(url),
      extractEpisodeSeason(url),
      extractEpisodeShowNotes(url)
    ])

    // Combine all results
    return {
      publishDate: dateResult.success ? dateResult.publishDate : null,
      originalDate: dateResult.success ? dateResult.originalDate : null,
      dateExtractionMethod: dateResult.success ? dateResult.extractionMethod : null,
      transcript: transcriptResult.success ? transcriptResult.transcript : null,
      transcriptExtractionMethod: transcriptResult.success ? transcriptResult.extractionMethod : null,
      title: titleResult.success ? titleResult.title : null,
      titleExtractionMethod: titleResult.success ? titleResult.extractionMethod : null,
      season: seasonResult.success ? seasonResult.season : null,
      seasonExtractionMethod: seasonResult.success ? seasonResult.extractionMethod : null,
      showNotes: showNotesResult.success ? showNotesResult.showNotes : null,
      showNotesExtractionMethod: showNotesResult.success ? showNotesResult.extractionMethod : null,
      success: true // Overall success even if some individual extractions fail
    }

  } catch (error) {
    return {
      publishDate: null,
      originalDate: null,
      dateExtractionMethod: null,
      transcript: null,
      transcriptExtractionMethod: null,
      title: null,
      titleExtractionMethod: null,
      season: null,
      seasonExtractionMethod: null,
      showNotes: null,
      showNotesExtractionMethod: null,
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