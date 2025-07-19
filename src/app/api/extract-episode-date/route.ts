import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { 
  extractEpisodeDate, 
  extractEpisodeTranscript, 
  extractEpisodeTitle,
  extractEpisodeSeason,
  extractEpisodeShowNotes,
  extractAllEpisodeData
} from '@/lib/episode-date-extractor'

// Configure this route to run on Edge Runtime for better performance
export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const sessionId = globalThis.crypto.randomUUID()

  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')
  const extractType = searchParams.get('extract') || 'date' // 'date', 'transcript', 'title', 'season', 'shownotes', 'all', or 'both'

  console.log(`🚀 [extract-episode-${extractType}:${sessionId}] API call started for URL: ${url}`)

  if (!url) {
    console.log(`❌ [extract-episode-${extractType}:${sessionId}] URL parameter is required`)
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
  }

  try {
    const responseData: any = { url, success: true }

    // Handle the 'all' extraction type first (most comprehensive)
    if (extractType === 'all') {
      console.log(`🔍 [extract-episode-${extractType}:${sessionId}] Extracting all episode data`)
      
      const allDataResult = await extractAllEpisodeData(url)
      
      if (!allDataResult.success) {
        console.log(`❌ [extract-episode-${extractType}:${sessionId}] Failed to extract episode data: ${allDataResult.error}`)
        return NextResponse.json({ 
          error: allDataResult.error,
          url: url 
        }, { status: 500 })
      }

      console.log(`✅ [extract-episode-${extractType}:${sessionId}] Successfully extracted all episode data`)
      
      return NextResponse.json({
        url,
        success: true,
        publishDate: allDataResult.publishDate,
        originalDate: allDataResult.originalDate,
        dateExtractionMethod: allDataResult.dateExtractionMethod,
        transcript: allDataResult.transcript,
        transcriptExtractionMethod: allDataResult.transcriptExtractionMethod,
        title: allDataResult.title,
        titleExtractionMethod: allDataResult.titleExtractionMethod,
        season: allDataResult.season,
        seasonExtractionMethod: allDataResult.seasonExtractionMethod,
        episodeNumber: allDataResult.episodeNumber,
        episodeNumberExtractionMethod: allDataResult.episodeNumberExtractionMethod,
        showNotes: allDataResult.showNotes,
        showNotesExtractionMethod: allDataResult.showNotesExtractionMethod,
        youtubeUrl: allDataResult.youtubeUrl,
        applePodcastsUrl: allDataResult.applePodcastsUrl,
        spotifyUrl: allDataResult.spotifyUrl,
        platformUrlsExtractionMethod: allDataResult.platformUrlsExtractionMethod
      })
    }

    // Handle individual extraction types
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

    if (extractType === 'title') {
      console.log(`🔍 [extract-episode-${extractType}:${sessionId}] Extracting episode title`)
      
      const titleResult = await extractEpisodeTitle(url)

      if (!titleResult.success) {
        console.log(`❌ [extract-episode-${extractType}:${sessionId}] Failed to extract title: ${titleResult.error}`)
        
        const statusCode = titleResult.error?.includes('Invalid URL format') ? 400 :
                          titleResult.error?.includes('must be from thepitch.show') ? 400 :
                          titleResult.error?.includes('No episode title found') ? 404 : 500
        
        return NextResponse.json({ 
          error: titleResult.error,
          url: url 
        }, { status: statusCode })
      }

      console.log(`✅ [extract-episode-${extractType}:${sessionId}] Successfully extracted title: ${titleResult.title}`)
      
      responseData.title = titleResult.title
      responseData.titleExtractionMethod = titleResult.extractionMethod
    }

    if (extractType === 'season') {
      console.log(`🔍 [extract-episode-${extractType}:${sessionId}] Extracting episode season`)
      
      const seasonResult = await extractEpisodeSeason(url)

      if (!seasonResult.success) {
        console.log(`❌ [extract-episode-${extractType}:${sessionId}] Failed to extract season: ${seasonResult.error}`)
        
        const statusCode = seasonResult.error?.includes('Invalid URL format') ? 400 :
                          seasonResult.error?.includes('must be from thepitch.show') ? 400 :
                          seasonResult.error?.includes('No season number found') ? 404 : 500
        
        return NextResponse.json({ 
          error: seasonResult.error,
          url: url 
        }, { status: statusCode })
      }

      console.log(`✅ [extract-episode-${extractType}:${sessionId}] Successfully extracted season: ${seasonResult.season}`)
      
      responseData.season = seasonResult.season
      responseData.seasonExtractionMethod = seasonResult.extractionMethod
    }

    if (extractType === 'shownotes') {
      console.log(`🔍 [extract-episode-${extractType}:${sessionId}] Extracting episode show notes`)
      
      const showNotesResult = await extractEpisodeShowNotes(url)

      if (!showNotesResult.success) {
        console.log(`❌ [extract-episode-${extractType}:${sessionId}] Failed to extract show notes: ${showNotesResult.error}`)
        
        const statusCode = showNotesResult.error?.includes('Invalid URL format') ? 400 :
                          showNotesResult.error?.includes('must be from thepitch.show') ? 400 :
                          showNotesResult.error?.includes('No show notes content found') ? 404 : 500
        
        return NextResponse.json({ 
          error: showNotesResult.error,
          url: url 
        }, { status: statusCode })
      }

      console.log(`✅ [extract-episode-${extractType}:${sessionId}] Successfully extracted show notes (${showNotesResult.showNotes?.length} characters)`)
      
      responseData.showNotes = showNotesResult.showNotes
      responseData.showNotesExtractionMethod = showNotesResult.extractionMethod
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