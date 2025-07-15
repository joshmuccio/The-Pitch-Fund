import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

// Configure this route to run on Edge Runtime for better performance
export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ ok: false, error: 'URL parameter is required' }, { status: 400 })
  }

  try {
    // Validate URL format first
    try {
      new URL(url)
    } catch (formatError) {
      Sentry.captureException(formatError, {
        tags: { 
          component: 'url-validator',
          validationType: 'format' 
        },
        extra: { url }
      })
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid URL format' 
      }, { status: 400 })
    }

    // HTTP-based validation using fetch
    try {
      console.log('🌐 [HTTP Check] Making HEAD request to:', url)
      const headResponse = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(10000),
      })

      console.log('📡 [HTTP Check] HEAD response:', {
        status: headResponse.status,
        finalUrl: headResponse.url,
        ok: headResponse.ok
      })

      Sentry.addBreadcrumb({
        message: 'HEAD request successful',
        level: 'info',
        data: { 
          url, 
          status: headResponse.status, 
          finalUrl: headResponse.url,
          redirected: headResponse.url !== url
        }
      })

      return NextResponse.json({
        ok: headResponse.ok,
        status: headResponse.status,
        finalUrl: headResponse.url !== url ? headResponse.url : undefined,
      })
    } catch (headError) {
      console.log('HEAD request failed, falling back to GET:', headError)
      
      Sentry.addBreadcrumb({
        message: 'HEAD request failed, trying GET',
        level: 'warning',
        data: { url, error: headError instanceof Error ? headError.message : String(headError) }
      })
      
      try {
        console.log('🌐 [Fallback] Making GET request to:', url)
        const getResponse = await fetch(url, {
          method: 'GET',
          redirect: 'follow',
          signal: AbortSignal.timeout(10000),
        })

        console.log('📡 [Fallback] GET response:', {
          status: getResponse.status,
          finalUrl: getResponse.url,
          ok: getResponse.ok
        })

        Sentry.addBreadcrumb({
          message: 'GET request successful after HEAD failure',
          level: 'info',
          data: { 
            url, 
            status: getResponse.status, 
            finalUrl: getResponse.url,
            redirected: getResponse.url !== url
          }
        })

        return NextResponse.json({
          ok: getResponse.ok,
          status: getResponse.status,
          finalUrl: getResponse.url !== url ? getResponse.url : undefined,
        })
      } catch (getError) {
        console.log('💥 [Fallback] GET request also failed:', getError)
        
        Sentry.captureException(getError, {
          tags: { 
            component: 'url-validator',
            validationType: 'http-fallback' 
          },
          extra: { 
            url,
            headError: headError instanceof Error ? headError.message : String(headError),
            getError: getError instanceof Error ? getError.message : String(getError)
          }
        })
        
        return NextResponse.json({
          ok: false,
          error: 'URL validation failed'
        })
      }
    }
  } catch (error) {
    console.log('💥 [Error] Validation failed:', error)
    
    Sentry.captureException(error, {
      tags: { 
        component: 'url-validator',
        validationType: 'general' 
      },
      extra: { url },
      level: 'error'
    })
    
    return NextResponse.json({ 
      ok: false, 
      error: 'fetch failed'
    })
  }
} 