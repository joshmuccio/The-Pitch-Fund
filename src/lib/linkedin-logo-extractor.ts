import { load } from 'cheerio'

export interface LinkedInLogoResult {
  logoUrl: string | null
  logoResolution: string | null
  extractionMethod: string | null
  success: boolean
  error?: string
}

export async function extractLinkedInLogo(url: string): Promise<LinkedInLogoResult> {
  try {
    // Validate URL format
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch (formatError) {
      return {
        logoUrl: null,
        logoResolution: null,
        extractionMethod: null,
        success: false,
        error: 'Invalid URL format'
      }
    }

    // Check if it's a LinkedIn company URL
    if (!parsedUrl.hostname.includes('linkedin.com') || !url.includes('/company/')) {
      return {
        logoUrl: null,
        logoResolution: null,
        extractionMethod: null,
        success: false,
        error: 'URL must be a LinkedIn company page'
      }
    }

    // Fetch the webpage content
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; The Pitch Fund LinkedIn Logo Extractor/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    })

    if (!response.ok) {
      return {
        logoUrl: null,
        logoResolution: null,
        extractionMethod: null,
        success: false,
        error: `Failed to fetch LinkedIn page: ${response.status} ${response.statusText}`
      }
    }

    const html = await response.text()
    const $ = load(html)

    // Strategy 1: Look for company logo in the organization header
    let logoUrl: string | null = null
    let extractionMethod: string | null = null
    let logoResolution: string | null = null

    // Try multiple selectors for LinkedIn company logos
    const logoSelectors = [
      // Modern LinkedIn company page logo
      '.org-top-card-primary-content__logo img',
      '.org-company-logo img',
      '.organization-outlet__logo img',
      '.org-outlet__logo img',
      
      // Fallback selectors
      '.top-card-layout__entity-image img',
      '[data-test-id="company-logo"] img',
      '.org-top-card__logo img',
      
      // Generic company logo selectors
      'img[alt*="logo" i]',
      'img[src*="company-logo" i]',
      'img[src*="organization-logo" i]'
    ]

    for (const selector of logoSelectors) {
      const logoElement = $(selector).first()
      if (logoElement.length > 0) {
        const src = logoElement.attr('src')
        const dataSrc = logoElement.attr('data-src')
        const srcSet = logoElement.attr('srcset')
        
        // Prefer data-src or srcset over src for higher quality
        if (srcSet) {
          // Parse srcset to find highest resolution
          const srcSetEntries = srcSet.split(',').map(entry => entry.trim())
          const highestRes = srcSetEntries
            .map(entry => {
              const [url, descriptor] = entry.split(' ')
              const resolution = descriptor?.includes('w') ? parseInt(descriptor.replace('w', '')) : 
                               descriptor?.includes('x') ? parseInt(descriptor.replace('x', '')) * 100 : 0
              return { url: url.trim(), resolution }
            })
            .sort((a, b) => b.resolution - a.resolution)[0]
          
          if (highestRes?.url) {
            logoUrl = highestRes.url
            logoResolution = `${highestRes.resolution}w`
            extractionMethod = `${selector} (srcset)`
            break
          }
        }
        
        if (dataSrc && !logoUrl) {
          logoUrl = dataSrc
          extractionMethod = `${selector} (data-src)`
          logoResolution = 'unknown'
          break
        }
        
        if (src && !logoUrl) {
          logoUrl = src
          extractionMethod = `${selector} (src)`
          logoResolution = 'unknown'
          break
        }
      }
    }

    // Strategy 2: Look for Open Graph image if no logo found
    if (!logoUrl) {
      const ogImage = $('meta[property="og:image"]').attr('content')
      if (ogImage) {
        logoUrl = ogImage
        extractionMethod = 'Open Graph image'
        logoResolution = 'unknown'
      }
    }

    // Strategy 3: Look for JSON-LD structured data
    if (!logoUrl) {
      $('script[type="application/ld+json"]').each(function() {
        try {
          const jsonData = JSON.parse($(this).html() || '{}')
          if (jsonData.logo) {
            if (typeof jsonData.logo === 'string') {
              logoUrl = jsonData.logo
            } else if (jsonData.logo.url) {
              logoUrl = jsonData.logo.url
            }
            if (logoUrl) {
              extractionMethod = 'JSON-LD structured data'
              logoResolution = 'unknown'
              return false // Break out of each loop
            }
          }
        } catch (e) {
          // Continue to next script tag
        }
      })
    }

    if (!logoUrl) {
      return {
        logoUrl: null,
        logoResolution: null,
        extractionMethod: null,
        success: false,
        error: 'No company logo found on LinkedIn page'
      }
    }

    // Clean up the URL if it's relative
    if (logoUrl.startsWith('//')) {
      logoUrl = 'https:' + logoUrl
    } else if (logoUrl.startsWith('/')) {
      logoUrl = 'https://linkedin.com' + logoUrl
    }

    // Validate that we got a proper image URL
    if (!logoUrl.match(/\.(jpg|jpeg|png|gif|svg|webp)(\?.*)?$/i) && !logoUrl.includes('media.licdn.com')) {
      return {
        logoUrl: null,
        logoResolution: null,
        extractionMethod: null,
        success: false,
        error: 'Found logo element but URL does not appear to be a valid image'
      }
    }

    return {
      logoUrl,
      logoResolution,
      extractionMethod,
      success: true
    }

  } catch (error) {
    return {
      logoUrl: null,
      logoResolution: null,
      extractionMethod: null,
      success: false,
      error: `Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
} 