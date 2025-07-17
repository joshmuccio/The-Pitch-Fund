import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { load } from 'cheerio'

// Configure this route to run on Edge Runtime for better performance
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// Initialize Sentry for edge runtime
Sentry.captureException(new Error("Edge scrape-vc-profile API initialized"))

export async function POST(request: NextRequest) {
  const sessionId = globalThis.crypto.randomUUID()
  console.log(`🔍 [scrape-vc-profile:${sessionId}] Starting VC profile scraping`)

  try {
    const { profileUrl } = await request.json()

    if (!profileUrl) {
      return NextResponse.json(
        { error: 'Profile URL is required' },
        { status: 400 }
      )
    }

    // Validate that this is a thepitch.show profile URL
    if (!profileUrl.includes('thepitch.show/guests/')) {
      return NextResponse.json(
        { error: 'URL must be a thepitch.show guest profile URL' },
        { status: 400 }
      )
    }

    console.log(`📤 [scrape-vc-profile:${sessionId}] Fetching profile from: ${profileUrl}`)

    // Fetch the profile page
    const response = await fetch(profileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VC-Profile-Scraper/1.0)'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch profile page: ${response.status}`)
    }

    const htmlContent = await response.text()
    console.log(`📥 [scrape-vc-profile:${sessionId}] Profile page fetched: ${htmlContent.length} characters`)

    // Extract VC data from HTML using regex patterns
    const vcData = extractVcDataFromHtml(htmlContent, profileUrl, sessionId)

    console.log(`✅ [scrape-vc-profile:${sessionId}] Successfully extracted VC data:`, vcData.name)

    return NextResponse.json({
      success: true,
      data: vcData
    })

  } catch (error: any) {
    console.error(`❌ [scrape-vc-profile:${sessionId}] Error:`, error)
    Sentry.captureException(error, {
      tags: { route: 'api/scrape-vc-profile', session_id: sessionId, error_type: 'scraping_failed' }
    })
    return NextResponse.json(
      { 
        error: 'Profile scraping failed: ' + error.message
      },
      { status: 500 }
    )
  }
}

function extractVcDataFromHtml(html: string, profileUrl: string, sessionId: string) {
  console.log(`🔍 [scrape-vc-profile:${sessionId}] Extracting data from HTML using Cheerio`)

  // Use Cheerio for better HTML parsing
  const $ = load(html)

  // Extract name and firm from title (format: "Name // Firm")
  let vcName = ''
  let firmName = ''
  
  // Method 1: Parse title tag for "Name // Firm" format
  const titleText = $('title').text().trim()
  console.log(`🔍 [scrape-vc-profile:${sessionId}] Title found:`, titleText)
  
  if (titleText.includes(' // ')) {
    const titleParts = titleText.split(' // ')
    vcName = titleParts[0].trim()
    firmName = titleParts[1].trim()
    console.log(`📊 [scrape-vc-profile:${sessionId}] Parsed from title - Name: "${vcName}", Firm raw: "${firmName}"`)
  }
  
  // Method 2: Try h1 tag if title didn't work
  if (!vcName) {
    const h1Text = $('h1').first().text().trim()
    console.log(`🔍 [scrape-vc-profile:${sessionId}] H1 found:`, h1Text)
    
    if (h1Text.includes(' // ')) {
      const h1Parts = h1Text.split(' // ')
      vcName = h1Parts[0].trim()
      firmName = h1Parts[1].trim()
      console.log(`📊 [scrape-vc-profile:${sessionId}] Parsed from h1 - Name: "${vcName}", Firm: "${firmName}"`)
    } else if (h1Text) {
      vcName = h1Text
    }
  }

  // Clean up firm name - remove any HTML tags or extra content
  if (firmName) {
    console.log(`🔍 [scrape-vc-profile:${sessionId}] Raw firm name:`, firmName)
    
    // Remove common trailing content patterns
    firmName = firmName
      .replace(/\s*-.*$/, '') // Remove everything after dash
      .replace(/\.\s*In this role.*$/i, '') // Remove descriptive text
      .replace(/\s*\|.*$/, '') // Remove everything after pipe
      .replace(/[<>"].*$/, '') // Remove HTML remnants after < > or "
      .replace(/\s*$/, '') // Remove trailing whitespace
      .replace(/[.]\s*$/, '') // Remove trailing period
      .trim()
    
    console.log(`🔍 [scrape-vc-profile:${sessionId}] Cleaned firm name:`, firmName)
  }

  // Extract firm from bio if not found in title
  if (!firmName && vcName) {
    const bioText = $('p').text()
    // Look for patterns like "founder of X" or "partner at Y"
    const firmPatterns = [
      new RegExp(`${vcName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*?(?:founder|partner|managing partner|general partner).*?(?:of|at)\\s+([^.]+?)(?:\\.|,|$)`, 'i'),
      /(?:founder|partner|managing partner|general partner).*?(?:of|at)\\s+([^.]+?)(?:\\.|,|$)/i,
      /(?:works?|serves?).*?(?:at|with)\\s+([^.]+?)(?:\\.|,|$)/i
    ]
    
    for (const pattern of firmPatterns) {
      const match = bioText.match(pattern)
      if (match) {
        firmName = match[1].trim()
        // Clean up firm name
        firmName = firmName
          .replace(/\s*[,.].*$/, '') // Remove everything after comma or period
          .replace(/\s+(and|&).*$/, '') // Remove additional firms
          .trim()
        break
      }
    }
  }

  // Extract role from bio or description
  let roleTitle = ''
  const bioText = $('p').text()
  const rolePatterns = [
    new RegExp(`${vcName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*?is\\s+(?:a\\s+|the\\s+)?([^.]+?)\\s+(?:at|with|of)`, 'i'),
    /is\s+(?:a\s+|the\s+)?([^.]+?)(?:\s+(?:at|with|of)\s+|\s+and\s+)/i,
    /works?\s+as\s+(?:a\s+|the\s+)?([^.]+?)(?:\s+(?:at|with|of)\s+|\s+and\s+)/i,
    /serves?\s+as\s+(?:a\s+|the\s+)?([^.]+?)(?:\s+(?:at|with|of)\s+|\s+and\s+)/i
  ]
  
  for (const pattern of rolePatterns) {
    const match = bioText.match(pattern)
    if (match) {
      roleTitle = match[1].trim()
      // Clean up common role patterns
      roleTitle = roleTitle
        .replace(/^(the\s+)?/, '') // Remove "the"
        .replace(/\s+(and|&).*$/, '') // Remove multiple roles
        .trim()
      break
    }
  }

  // Extract bio - look for paragraphs with substantial content
  let bio = ''
  $('p').each((i: number, elem: any) => {
    const pText = $(elem).text().trim()
    if (pText.length > 50 && !bio) {
      bio = pText
    }
  })

  // Extract profile image with priority on high-resolution S3 URLs
  let profileImageUrl = null
  
  // First, look for the specific image container you described
  const profileImgContainer = $('.col-md-3.col-sm-4.col-6 img, .rounded-circle img, img[alt*="Profile Photo"]')
  
  if (profileImgContainer.length > 0) {
    const img = profileImgContainer.first()
    
    // Try to extract high-res URL from srcset or src
    const srcset = img.attr('srcset')
    const src = img.attr('src')
    
    if (srcset) {
      // Extract the S3 URL pattern from srcset (highest quality available) - support .jpg, .jpeg, and .webp
      const s3UrlMatch = srcset.match(/https:\/\/s3\.us-west-1\.amazonaws\.com\/redwood-labs\/showpage\/uploads\/images\/[a-f0-9-]+\.(jpg|jpeg|webp)/g)
      if (s3UrlMatch && s3UrlMatch.length > 0) {
        profileImageUrl = s3UrlMatch[0] // Take the first (and usually only) S3 URL
        console.log(`📸 [scrape-vc-profile:${sessionId}] Found high-res S3 profile image:`, profileImageUrl)
      }
    }
    
    // Fallback to src attribute if srcset didn't contain S3 URL
    if (!profileImageUrl && src) {
      // Check if src contains S3 URL pattern - support .jpg, .jpeg, and .webp
      const s3UrlInSrc = src.match(/https:\/\/s3\.us-west-1\.amazonaws\.com\/redwood-labs\/showpage\/uploads\/images\/[a-f0-9-]+\.(jpg|jpeg|webp)/)
      if (s3UrlInSrc) {
        profileImageUrl = s3UrlInSrc[0]
        console.log(`📸 [scrape-vc-profile:${sessionId}] Found S3 profile image in src:`, profileImageUrl)
      } else if (src.startsWith('http')) {
        profileImageUrl = src
        console.log(`📸 [scrape-vc-profile:${sessionId}] Using fallback profile image:`, profileImageUrl)
      }
    }
  }
  
  // Fallback to other image selectors if the specific container wasn't found
  if (!profileImageUrl) {
    const imgSelectors = [
      'img[class*="profile"]',
      'img[alt*="profile"]', 
      'img[src*="headshot"]',
      'img[src*="photo"]',
      '.profile img',
      '.headshot img'
    ]
    
    for (const selector of imgSelectors) {
      const imgSrc = $(selector).first().attr('src')
      if (imgSrc) {
        profileImageUrl = imgSrc.startsWith('http') ? imgSrc : `https://thepitch.show${imgSrc}`
        console.log(`📸 [scrape-vc-profile:${sessionId}] Fallback profile image found:`, profileImageUrl)
        break
      }
    }
  }

  // Seasons tracking removed

  // Extract social links from testimonial-content div using specific class selectors
  const testimonialContent = $('.testimonial-content')
  const linkedinUrl = testimonialContent.find('a.linkedin').attr('href') || null
  const twitterUrl = testimonialContent.find('a.x-twitter').attr('href') || null
  const instagramUrl = testimonialContent.find('a.instagram').attr('href') || null
  const tiktokUrl = testimonialContent.find('a.tiktok').attr('href') || null
  const youtubeUrl = testimonialContent.find('a.youtube').attr('href') || null
  const websiteUrl = testimonialContent.find('a.globe').attr('href') || null
  const podcastUrl = testimonialContent.find('a.podcast').attr('href') || null

  console.log(`🔗 [scrape-vc-profile:${sessionId}] Social links found:`, {
    linkedin: linkedinUrl,
    twitter: twitterUrl,
    instagram: instagramUrl,
    tiktok: tiktokUrl,
    youtube: youtubeUrl,
    website: websiteUrl,
    podcast: podcastUrl
  })

  // Final cleanup and validation
  console.log(`🔍 [scrape-vc-profile:${sessionId}] Before final cleanup - vcName: "${vcName}", firmName: "${firmName}"`)
  
  let finalVcName = vcName
  let finalFirmName = firmName

  // Fix name parsing - if vcName still contains ' // ', split it
  if (finalVcName && finalVcName.includes(' // ')) {
    const parts = finalVcName.split(' // ')
    finalVcName = parts[0].trim()
    if (!finalFirmName || finalFirmName.includes('<') || finalFirmName.includes('>')) {
      finalFirmName = parts[1].trim()
    }
  }

  // Clean up firm name
  if (finalFirmName) {
    finalFirmName = finalFirmName
      .replace(/[<>"].*$/, '') // Remove HTML remnants
      .replace(/[.].*$/, '') // Remove everything after first period
      .trim()
  }

  // Extract firm from bio as fallback if firm name is still problematic
  if (!finalFirmName || finalFirmName.length > 50 || finalFirmName.includes('<') || finalFirmName.includes('>')) {
    const bioText = $('p').text()
    const firmFromBio = bioText.match(/(?:Managing Partner and )?Founder of\s+([A-Z][a-zA-Z\s&]+?)(?:[,.]|$)/i) ||
                       bioText.match(/(?:partner|founder).*?(?:of|at)\s+([A-Z][a-zA-Z\s&]+?)(?:[,.]|$)/i)
    if (firmFromBio) {
      finalFirmName = firmFromBio[1].trim()
    }
  }

  console.log(`🔍 [scrape-vc-profile:${sessionId}] After final cleanup - finalVcName: "${finalVcName}", finalFirmName: "${finalFirmName}"`)

  const extractedData = {
    name: finalVcName || 'Unknown',
    firm_name: finalFirmName || null,
    role_title: roleTitle || null,
    bio: bio ? bio.substring(0, 1000) : null, // Limit bio length
    profile_image_url: profileImageUrl,
    linkedin_url: linkedinUrl,
    twitter_url: twitterUrl,
    instagram_url: instagramUrl,
    tiktok_url: tiktokUrl,
    youtube_url: youtubeUrl,
    website_url: websiteUrl,
    podcast_url: podcastUrl,
    // Seasons and episodes tracking removed
    thepitch_profile_url: profileUrl
  }

  // Post-processing cleanup
  if (extractedData.name.includes(' // ')) {
    const nameParts = extractedData.name.split(' // ')
    extractedData.name = nameParts[0].trim()
    if (!extractedData.firm_name || extractedData.firm_name.includes('<')) {
      extractedData.firm_name = nameParts[1].trim()
    }
  }

  // Clean up firm name if it contains HTML
  if (extractedData.firm_name && extractedData.firm_name.includes('<')) {
    extractedData.firm_name = extractedData.firm_name.split('<')[0].trim()
  }

  // Extract firm from bio if still needed or if current firm_name is bad
  if (!extractedData.firm_name || extractedData.firm_name.includes('<') || extractedData.firm_name.length > 50) {
    const firmMatch = extractedData.bio?.match(/Managing Partner and Founder of ([^,]+)/i) ||
                     extractedData.bio?.match(/Founder of ([^,]+)/i) ||
                     extractedData.bio?.match(/Partner at ([^,]+)/i)
    if (firmMatch) {
      extractedData.firm_name = firmMatch[1].trim()
    }
  }

  console.log(`📊 [scrape-vc-profile:${sessionId}] Final extracted data:`, {
    name: extractedData.name,
    firm: extractedData.firm_name,
    role: extractedData.role_title,
    profileImage: extractedData.profile_image_url,
    // Seasons removed
    hasLinks: {
      linkedin: !!extractedData.linkedin_url,
      twitter: !!extractedData.twitter_url,
      instagram: !!extractedData.instagram_url,
      youtube: !!extractedData.youtube_url,
      website: !!extractedData.website_url,
      podcast: !!extractedData.podcast_url
    }
  })

  return extractedData
} 