import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { extractEpisodeDate, extractEpisodeTranscript } from '@/lib/episode-date-extractor'

// Configure this route to run on Edge Runtime for better performance
export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const sessionId = globalThis.crypto.randomUUID()

  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')
  const extractType = searchParams.get('extract') || 'date' // 'date', 'transcript', or 'both'

  console.log(`🚀 [extract-episode-${extractType}:${sessionId}] API call started for URL: ${url}`)

  if (!url) {
    console.log(`❌ [extract-episode-${extractType}:${sessionId}] URL parameter is required`)
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
  }

  try {
    const responseData: any = { url, success: true }

    if (extractType === 'date' || extractType === 'both') {
      console.log(`🔍 [extract-episode-${extractType}:${sessionId}] Extracting episode date`)
      
      const dateResult = await extractEpisodeDate(url)

      if (!dateResult.success) {
        console.log(`❌ [extract-episode-${extractType}:${sessionId}] Failed to extract date: ${dateResult.error}`)
        
        // Return appropriate status code based on error type
        const statusCode = dateResult.error?.includes('Invalid URL format') ? 400 :
                          dateResult.error?.includes('must be from thepitch.show') ? 400 :
                          dateResult.error?.includes('No publish date found') ? 404 : 500
        
        return NextResponse.json({ 
          error: dateResult.error,
          url: url 
        }, { status: statusCode })
      }

      console.log(`✅ [extract-episode-${extractType}:${sessionId}] Successfully extracted date: ${dateResult.publishDate}`)
      
      responseData.publishDate = dateResult.publishDate
      responseData.originalDate = dateResult.originalDate
      responseData.dateExtractionMethod = dateResult.extractionMethod
    }

    if (extractType === 'transcript' || extractType === 'both') {
      console.log(`🔍 [extract-episode-${extractType}:${sessionId}] Extracting episode transcript`)
      
      const transcriptResult = await extractEpisodeTranscript(url)

      if (!transcriptResult.success) {
        console.log(`❌ [extract-episode-${extractType}:${sessionId}] Failed to extract transcript: ${transcriptResult.error}`)
        
        // If we're only extracting transcript, return error
        if (extractType === 'transcript') {
          const statusCode = transcriptResult.error?.includes('Invalid URL format') ? 400 :
                            transcriptResult.error?.includes('must be from thepitch.show') ? 400 :
                            transcriptResult.error?.includes('No transcript content found') ? 404 : 500
          
          return NextResponse.json({ 
            error: transcriptResult.error,
            url: url 
          }, { status: statusCode })
        } else {
          // If extracting both, include transcript error but don't fail the whole request
          responseData.transcriptError = transcriptResult.error
        }
      } else {
        console.log(`✅ [extract-episode-${extractType}:${sessionId}] Successfully extracted transcript (${transcriptResult.transcript?.length} characters)`)
        
        responseData.transcript = transcriptResult.transcript
        responseData.transcriptExtractionMethod = transcriptResult.extractionMethod
      }
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.log(`💥 [extract-episode-${extractType}:${sessionId}] Unexpected error:`, error)
    
    Sentry.captureException(error, {
      tags: { 
        component: 'extract-episode-data',
        error_type: 'unexpected' 
      },
      extra: { 
        url, 
        extractType,
        sessionId 
      }
    })
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 