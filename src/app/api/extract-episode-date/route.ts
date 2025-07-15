import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { extractEpisodeDate } from '@/lib/episode-date-extractor'

// Configure this route to run on Edge Runtime for better performance
export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const sessionId = (() => {
    try {
      return crypto.randomUUID()
    } catch (error) {
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    }
  })()

  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')

  console.log(`🚀 [extract-episode-date:${sessionId}] API call started for URL: ${url}`)

  if (!url) {
    console.log(`❌ [extract-episode-date:${sessionId}] URL parameter is required`)
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
  }

  try {
    console.log(`🔍 [extract-episode-date:${sessionId}] Extracting episode date`)
    
    const result = await extractEpisodeDate(url)

    if (!result.success) {
      console.log(`❌ [extract-episode-date:${sessionId}] Failed to extract date: ${result.error}`)
      
      // Return appropriate status code based on error type
      const statusCode = result.error?.includes('Invalid URL format') ? 400 :
                        result.error?.includes('must be from thepitch.show') ? 400 :
                        result.error?.includes('No publish date found') ? 404 : 500
      
      return NextResponse.json({ 
        error: result.error,
        url: url 
      }, { status: statusCode })
    }

    console.log(`✅ [extract-episode-date:${sessionId}] Successfully extracted date: ${result.publishDate}`)
    
    return NextResponse.json({
      url: url,
      publishDate: result.publishDate,
      originalDate: result.originalDate,
      extractionMethod: result.extractionMethod,
      success: true
    })

  } catch (error) {
    console.log(`💥 [extract-episode-date:${sessionId}] Unexpected error:`, error)
    
    Sentry.captureException(error, {
      tags: { 
        component: 'extract-episode-date',
        error_type: 'unexpected' 
      },
      extra: { 
        url, 
        sessionId 
      }
    })
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 