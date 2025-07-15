import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { extractLinkedInLogo } from '@/lib/linkedin-logo-extractor'

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

  console.log(`🚀 [extract-linkedin-logo:${sessionId}] API call started for URL: ${url}`)

  if (!url) {
    console.log(`❌ [extract-linkedin-logo:${sessionId}] URL parameter is required`)
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
  }

  try {
    console.log(`🔍 [extract-linkedin-logo:${sessionId}] Extracting company logo`)
    
    const result = await extractLinkedInLogo(url)

    if (!result.success) {
      console.log(`❌ [extract-linkedin-logo:${sessionId}] Failed to extract logo: ${result.error}`)
      
      // Return appropriate status code based on error type
      const statusCode = result.error?.includes('Invalid URL format') ? 400 :
                        result.error?.includes('must be a LinkedIn company page') ? 400 :
                        result.error?.includes('No company logo found') ? 404 : 500
      
      return NextResponse.json({ 
        error: result.error,
        url: url 
      }, { status: statusCode })
    }

    console.log(`✅ [extract-linkedin-logo:${sessionId}] Successfully extracted logo: ${result.logoUrl}`)
    console.log(`📏 [extract-linkedin-logo:${sessionId}] Logo resolution: ${result.logoResolution}, method: ${result.extractionMethod}`)
    
    return NextResponse.json({
      url: url,
      logoUrl: result.logoUrl,
      logoResolution: result.logoResolution,
      extractionMethod: result.extractionMethod,
      success: true
    })

  } catch (error) {
    console.log(`💥 [extract-linkedin-logo:${sessionId}] Unexpected error:`, error)
    
    Sentry.captureException(error, {
      tags: { 
        component: 'extract-linkedin-logo',
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