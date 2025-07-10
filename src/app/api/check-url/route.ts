import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

// Note: is-reachable might not work in Edge Runtime due to Node.js API dependencies
// We'll implement a fallback approach for Edge Runtime
let isReachable: any = null
try {
  // Only import is-reachable if we're in Node.js runtime
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    isReachable = require('is-reachable')
  }
} catch (error) {
  console.log('⚠️ [Runtime] is-reachable not available in current runtime, using HTTP-only validation')
}

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

    // Step 1: Quick reachability check if available (Node.js runtime only)
    if (isReachable) {
      console.log('🔍 [Quick Check] Testing reachability for:', url)
      try {
        const isUrlReachable = await isReachable(url, { timeout: 5000 })
        
        if (!isUrlReachable) {
          console.log('❌ [Quick Check] URL not reachable:', url)
          Sentry.addBreadcrumb({
            message: 'URL failed reachability check',
            level: 'info',
            data: { url }
          })
          return NextResponse.json({ 
            ok: false, 
            status: 0,
            error: 'URL is not reachable' 
          })
        }
        console.log('✅ [Quick Check] URL is reachable, getting detailed info:', url)
      } catch (reachabilityError) {
        // Log but don't fail - fallback to HTTP check
        Sentry.captureException(reachabilityError, {
          tags: { 
            component: 'url-validator',
            validationType: 'reachability' 
          },
          extra: { url }
        })
        console.log('⚠️ [Quick Check] Reachability check failed, proceeding with HTTP check:', reachabilityError)
      }
    } else {
      console.log('ℹ️ [Runtime] Using Edge Runtime - skipping TCP reachability check')
    }

    // Step 2: Get detailed information with HTTP requests
    try {
      console.log('🌐 [Detailed Check] Making HEAD request to:', url)
      const headResponse = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(10000),
      })

      console.log('📡 [Detailed Check] HEAD response:', {
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
        
        // If we had a successful reachability check, trust it
        if (isReachable) {
          return NextResponse.json({
            ok: true, // Trust is-reachable's assessment
            status: 200,
            warning: 'URL is reachable but HTTP requests failed'
          })
        }
        
        // Otherwise, it's likely unreachable
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