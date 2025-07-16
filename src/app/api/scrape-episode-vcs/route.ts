import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

// Configure this route to run on Edge Runtime for better performance
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// Initialize Sentry for edge runtime
Sentry.captureException(new Error("Edge scrape-episode-vcs API initialized"))

export async function POST(request: NextRequest) {
  const sessionId = globalThis.crypto.randomUUID()
  console.log(`🔍 [scrape-episode-vcs:${sessionId}] Starting episode VCs scraping`)

  try {
    const { episodeUrl } = await request.json()

    if (!episodeUrl) {
      return NextResponse.json(
        { error: 'Episode URL is required' },
        { status: 400 }
      )
    }

    // Validate that this is a thepitch.show episode URL
    if (!episodeUrl.includes('thepitch.show/') || !episodeUrl.match(/\/\d+[-\w]/)) {
      return NextResponse.json(
        { error: 'URL must be a thepitch.show episode URL' },
        { status: 400 }
      )
    }

    console.log(`📤 [scrape-episode-vcs:${sessionId}] Fetching episode from: ${episodeUrl}`)

    // Fetch the episode page
    const response = await fetch(episodeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Episode-VCs-Scraper/1.0)'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch episode page: ${response.status}`)
    }

    const htmlContent = await response.text()
    console.log(`📥 [scrape-episode-vcs:${sessionId}] Episode page fetched: ${htmlContent.length} characters`)

    // Extract episode metadata and featured VCs
    const episodeData = extractEpisodeVcsFromHtml(htmlContent, episodeUrl, sessionId)

    console.log(`✅ [scrape-episode-vcs:${sessionId}] Successfully extracted ${episodeData.featuredVcs.length} VCs`)

    return NextResponse.json({
      success: true,
      data: episodeData
    })

  } catch (error: any) {
    console.error(`❌ [scrape-episode-vcs:${sessionId}] Error:`, error)
    Sentry.captureException(error, {
      tags: { route: 'api/scrape-episode-vcs', session_id: sessionId, error_type: 'scraping_failed' }
    })
    return NextResponse.json(
      { 
        error: 'Episode VCs scraping failed: ' + error.message
      },
      { status: 500 }
    )
  }
}

function extractEpisodeVcsFromHtml(html: string, episodeUrl: string, sessionId: string) {
  console.log(`🔍 [scrape-episode-vcs:${sessionId}] Extracting VCs from episode HTML`)

  // Helper function to extract text between patterns
  const extractBetween = (pattern: RegExp, fallback: string = '') => {
    const match = html.match(pattern)
    return match ? match[1].trim() : fallback
  }

  // Extract episode number and season from URL
  const urlMatch = episodeUrl.match(/\/(\d+)[-\w]/)
  const episodeNumber = urlMatch ? urlMatch[1] : ''

  // Extract season from URL or content (common patterns)
  const seasonMatch = html.match(/Season\s+(\d+)/i) || 
                     episodeUrl.match(/season[\/\-]?(\d+)/i) ||
                     html.match(/S(\d+)E\d+/i)
  const episodeSeason = seasonMatch ? seasonMatch[1] : ''

  // Extract episode title
  const episodeTitle = extractBetween(/<h1[^>]*>([^<]+)<\/h1>/i) ||
                      extractBetween(/<title>([^<|]+)/i, '')

  // Extract featured VCs - look for investor profiles section
  const featuredVcs: Array<{
    name: string
    firm: string
    profileUrl?: string
  }> = []

  // Look for investor profile sections (common patterns on thepitch.show)
  const investorSections = html.match(/<div[^>]*class="[^"]*(?:investor|guest|profile)[^"]*"[^>]*>[\s\S]*?<\/div>/gi) || []
  
  // Alternative: Look for links to guest profiles
  const guestProfileLinks = html.match(/href="([^"]*\/guests\/[^"]+)"[^>]*>([^<]+)<\/a>/gi) || []
  
  // Extract VCs from profile links (most reliable method)
  guestProfileLinks.forEach(linkMatch => {
    const fullMatch = linkMatch.match(/href="([^"]*\/guests\/[^"]+)"[^>]*>([^<]+)<\/a>/i)
    if (fullMatch) {
      const profileUrl = fullMatch[1]
      const name = fullMatch[2].trim()
      
      // Try to extract firm from the profile URL or adjacent text
      const firmMatch = name.match(/^(.+?)\s*\/\/\s*(.+)$/) || // "Name // Firm" format
                       name.match(/^(.+?)\s*-\s*(.+)$/) ||      // "Name - Firm" format
                       name.match(/^(.+?)\s*\|\s*(.+)$/)        // "Name | Firm" format
      
      if (firmMatch) {
        featuredVcs.push({
          name: firmMatch[1].trim(),
          firm: firmMatch[2].trim(),
          profileUrl: profileUrl.startsWith('http') ? profileUrl : `https://thepitch.show${profileUrl}`
        })
      } else {
        // If no firm in name, extract from URL
        const urlFirmMatch = profileUrl.match(/\/guests\/[^\/]+-([^\/]+)\/?$/)
        const firmFromUrl = urlFirmMatch ? urlFirmMatch[1].replace(/-/g, ' ') : ''
        
        featuredVcs.push({
          name: name.trim(),
          firm: firmFromUrl,
          profileUrl: profileUrl.startsWith('http') ? profileUrl : `https://thepitch.show${profileUrl}`
        })
      }
    }
  })

  // Alternative extraction: Look for "Featuring investors" text
  const featuringMatch = html.match(/featuring\s+investors?\s*([^<\n]+)/i)
  if (featuringMatch && featuredVcs.length === 0) {
    const investorNames = featuringMatch[1]
      .split(/[,&]/)
      .map(name => name.trim())
      .filter(name => name.length > 2)

    investorNames.forEach(name => {
      featuredVcs.push({
        name: name,
        firm: '', // Will need to be filled manually or from VC database
        profileUrl: undefined
      })
    })
  }

  // Look for structured data in footer/credits
  const creditsMatch = html.match(/<div[^>]*class="[^"]*(?:credits|investors|guests)[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
  if (creditsMatch && featuredVcs.length === 0) {
    const creditsText = creditsMatch[1]
    const nameMatches = creditsText.match(/(?:^|\s)([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s|$)/g) || []
    
    nameMatches.forEach(nameMatch => {
      const cleanName = nameMatch.trim()
      if (cleanName.length > 3 && !featuredVcs.find(vc => vc.name === cleanName)) {
        featuredVcs.push({
          name: cleanName,
          firm: '',
          profileUrl: undefined
        })
      }
    })
  }

  const extractedData = {
    episodeUrl,
    episodeNumber,
    episodeSeason,
    episodeTitle: episodeTitle.replace(/\s*-.*$/, '').trim(), // Remove trailing info
    featuredVcs: featuredVcs.slice(0, 10) // Limit to reasonable number
  }

  console.log(`📊 [scrape-episode-vcs:${sessionId}] Extracted:`, {
    episode: `S${extractedData.episodeSeason}E${extractedData.episodeNumber}`,
    title: extractedData.episodeTitle,
    vcsCount: extractedData.featuredVcs.length,
    vcs: extractedData.featuredVcs.map(vc => `${vc.name} (${vc.firm})`)
  })

  return extractedData
} 