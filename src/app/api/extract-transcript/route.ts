import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { extractEpisodeTranscript } from '@/lib/episode-date-extractor'

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

  console.log(`🚀 [extract-transcript:${sessionId}] API call started for URL: ${url}`)

  if (!url) {
    console.log(`❌ [extract-transcript:${sessionId}] URL parameter is required`)
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
  }

  try {
    console.log(`🔍 [extract-transcript:${sessionId}] Extracting episode transcript`)
    
    const result = await extractEpisodeTranscript(url)

    if (!result.success) {
      console.log(`❌ [extract-transcript:${sessionId}] Failed to extract transcript: ${result.error}`)
      
      // Return appropriate status code based on error type
      const statusCode = result.error?.includes('Invalid URL format') ? 400 :
                        result.error?.includes('must be from thepitch.show') ? 400 :
                        result.error?.includes('No transcript content found') ? 404 : 500
      
      return NextResponse.json({ 
        error: result.error,
        url: url 
      }, { status: statusCode })
    }

    console.log(`✅ [extract-transcript:${sessionId}] Successfully extracted transcript (${result.transcript?.length} characters)`)
    
    return NextResponse.json({
      url: url,
      transcript: result.transcript,
      extractionMethod: result.extractionMethod,
      success: true
    })

  } catch (error) {
    console.log(`💥 [extract-transcript:${sessionId}] Unexpected error:`, error)
    
    Sentry.captureException(error, {
      tags: { 
        component: 'extract-transcript',
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