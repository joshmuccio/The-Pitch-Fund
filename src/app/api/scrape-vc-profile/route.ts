import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

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
  console.log(`🔍 [scrape-vc-profile:${sessionId}] Extracting data from HTML`)

  // Helper function to extract text between patterns
  const extractBetween = (pattern: RegExp, fallback: string = '') => {
    const match = html.match(pattern)
    return match ? match[1].trim() : fallback
  }

  // Helper function to extract URL from href
  const extractUrl = (pattern: RegExp) => {
    const match = html.match(pattern)
    return match ? match[1].trim() : null
  }

  // Extract profile image URL
  const profileImageMatch = html.match(/<img[^>]+class="[^"]*profile[^"]*"[^>]+src="([^"]+)"/i) ||
                           html.match(/<img[^>]+src="([^"]+)"[^>]*class="[^"]*profile[^"]*"/i) ||
                           html.match(/<img[^>]+src="([^"]+)"[^>]*alt="[^"]*profile[^"]*"/i)
  
  // Extract name (usually in h1 or title)
  const name = extractBetween(/<h1[^>]*>([^<]+)<\/h1>/i) ||
               extractBetween(/<title>([^<|]+)/i) ||
               extractBetween(/class="[^"]*name[^"]*"[^>]*>([^<]+)/i, '')

  // Extract firm and role (usually together)
  const firmAndRole = extractBetween(/(?:investor|partner|founder|managing|general).*?(?:at|with|@)\s*([^<\n]+)/i) ||
                     extractBetween(/<h2[^>]*>([^<]+)<\/h2>/i) ||
                     extractBetween(/class="[^"]*(?:firm|company|role)[^"]*"[^>]*>([^<]+)/i, '')

  // Try to split firm and role if they're together
  let firmName = ''
  let roleTitle = ''
  
  if (firmAndRole) {
    // Common patterns like "Managing Partner at Precursor Ventures"
    const roleAtFirmMatch = firmAndRole.match(/^(.+?)\s+(?:at|with|@)\s+(.+)$/i)
    if (roleAtFirmMatch) {
      roleTitle = roleAtFirmMatch[1].trim()
      firmName = roleAtFirmMatch[2].trim()
    } else {
      // If no clear split, treat as firm name
      firmName = firmAndRole
    }
  }

  // Extract bio/description
  const bio = extractBetween(/<p[^>]*class="[^"]*(?:bio|description|about)[^"]*"[^>]*>([^<]+)<\/p>/i) ||
              extractBetween(/<div[^>]*class="[^"]*(?:bio|description|about)[^"]*"[^>]*>\s*<p[^>]*>([^<]+)<\/p>/i) ||
              extractBetween(/<p[^>]*>([^<]{100,})<\/p>/i, '') // Fallback to first long paragraph

  // Extract seasons appeared
  const seasonsText = extractBetween(/seasons?\s*(\d+(?:[,\s]+\d+)*)/i) ||
                     extractBetween(/appeared.*?seasons?\s*([^<\n]+)/i, '')
  
  const seasonsAppeared = seasonsText ? 
    seasonsText.split(/[,\s]+/).filter(s => s.match(/^\d+$/)).map(s => s.trim()) : []

  // Extract social and web links
  const linkedinUrl = extractUrl(/href="(https?:\/\/(?:www\.)?linkedin\.com\/[^"]+)"/i)
  const twitterUrl = extractUrl(/href="(https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^"]+)"/i)
  const websiteUrl = extractUrl(/href="(https?:\/\/(?!(?:www\.)?(?:linkedin|twitter|x|thepitch)\.)[^"]+\.[^"]{2,})"/i)
  
  // Extract podcast URL (might be in bio or as a link)
  const podcastUrl = extractUrl(/href="(https?:\/\/[^"]*podcast[^"]*)"/) ||
                    extractUrl(/href="(https?:\/\/[^"]*(?:spotify|apple|google)[^"]*podcast[^"]*)"/)

  const extractedData = {
    name: name.replace(/\s*-.*$/, '').trim(), // Remove trailing info after dash
    firm_name: firmName,
    role_title: roleTitle,
    bio: bio.substring(0, 1000), // Limit bio length
    profile_image_url: profileImageMatch ? profileImageMatch[1] : null,
    linkedin_url: linkedinUrl,
    twitter_url: twitterUrl,
    website_url: websiteUrl,
    podcast_url: podcastUrl,
    seasons_appeared: seasonsAppeared,
    total_episodes_count: 0, // Will be calculated when saving
    thepitch_profile_url: profileUrl
  }

  console.log(`📊 [scrape-vc-profile:${sessionId}] Extracted:`, {
    name: extractedData.name,
    firm: extractedData.firm_name,
    role: extractedData.role_title,
    seasons: extractedData.seasons_appeared,
    hasLinks: {
      linkedin: !!extractedData.linkedin_url,
      twitter: !!extractedData.twitter_url,
      website: !!extractedData.website_url,
      podcast: !!extractedData.podcast_url
    }
  })

  return extractedData
} 