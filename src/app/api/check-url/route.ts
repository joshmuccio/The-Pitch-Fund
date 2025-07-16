import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

// Configure this route to run on Edge Runtime for better performance
export const runtime = 'edge'

// In-memory cache for URL validation results (Edge Runtime compatible)
const urlValidationCache = new Map<string, {
  result: any
  timestamp: number
  ttl: number
}>()

// Rate limiting: track requests per URL to prevent overwhelming external services
const rateLimitCache = new Map<string, {
  requests: number
  windowStart: number
}>()

// Cache TTL in milliseconds
const CACHE_TTL = {
  success: 10 * 60 * 1000, // 10 minutes for successful validations
  failure: 2 * 60 * 1000,  // 2 minutes for failed validations
  rateLimit: 30 * 1000     // 30 seconds for rate limited responses
}

// Rate limiting: max 3 requests per URL per 30 second window
const RATE_LIMIT = {
  maxRequests: 3,
  windowMs: 30 * 1000
}

// Helper to generate cache key
function getCacheKey(url: string): string {
  try {
    const parsedUrl = new URL(url)
    // Normalize URL for caching (remove fragments, sort query params)
    return parsedUrl.origin + parsedUrl.pathname + (parsedUrl.search || '')
  } catch {
    return url.toLowerCase()
  }
}

// Helper to check rate limit
function checkRateLimit(cacheKey: string): boolean {
  const now = Date.now()
  const rateLimitKey = `rl_${cacheKey}`
  const rateData = rateLimitCache.get(rateLimitKey)
  
  if (!rateData || (now - rateData.windowStart) > RATE_LIMIT.windowMs) {
    // New window
    rateLimitCache.set(rateLimitKey, {
      requests: 1,
      windowStart: now
    })
    return true
  }
  
  if (rateData.requests >= RATE_LIMIT.maxRequests) {
    console.log(`🚫 [Rate Limit] Blocked request for ${cacheKey}: ${rateData.requests}/${RATE_LIMIT.maxRequests} in current window`)
    return false
  }
  
  // Increment request count
  rateData.requests++
  rateLimitCache.set(rateLimitKey, rateData)
  return true
}

// Helper to get cached result
function getCachedResult(cacheKey: string): any | null {
  const cached = urlValidationCache.get(cacheKey)
  if (!cached) return null
  
  const now = Date.now()
  if ((now - cached.timestamp) > cached.ttl) {
    // Cache expired
    urlValidationCache.delete(cacheKey)
    return null
  }
  
  console.log(`💾 [Cache Hit] Using cached result for ${cacheKey}`)
  return cached.result
}

// Helper to cache result
function setCachedResult(cacheKey: string, result: any, ttl: number): void {
  urlValidationCache.set(cacheKey, {
    result,
    timestamp: Date.now(),
    ttl
  })
}

export async function GET(request: NextRequest) {
  const sessionId = globalThis.crypto.randomUUID()
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')

  console.log(`🌐 [check-url:${sessionId}] Validating URL:`, url)

  if (!url) {
    return NextResponse.json({ ok: false, error: 'URL parameter is required' }, { status: 400 })
  }

  // Generate cache key
  const cacheKey = getCacheKey(url)
  
  // Check cache first
  const cachedResult = getCachedResult(cacheKey)
  if (cachedResult) {
    console.log(`💾 [check-url:${sessionId}] Returning cached result for:`, url)
    return NextResponse.json(cachedResult)
  }

  // Check rate limit
  if (!checkRateLimit(cacheKey)) {
    const rateLimitResponse = {
      ok: false,
      status: 429,
      error: 'Rate limit exceeded. Please wait before retrying.'
    }
    setCachedResult(cacheKey, rateLimitResponse, CACHE_TTL.rateLimit)
    return NextResponse.json(rateLimitResponse, { status: 429 })
  }

  try {
    // Validate URL format first
    try {
      new URL(url)
    } catch (formatError) {
      const errorResponse = { ok: false, error: 'Invalid URL format' }
      setCachedResult(cacheKey, errorResponse, CACHE_TTL.failure)
      
      Sentry.captureException(formatError, {
        tags: { 
          component: 'url-validator',
          validationType: 'format',
          session_id: sessionId
        },
        extra: { url }
      })
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // Add delay for LinkedIn URLs to be more respectful
    const urlLower = url.toLowerCase()
    if (urlLower.includes('linkedin.com')) {
      console.log(`⏱️ [check-url:${sessionId}] LinkedIn URL detected, adding 1s delay`)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // HTTP-based validation using fetch
    try {
      console.log(`🌐 [check-url:${sessionId}] Making HEAD request to:`, url)
      const headResponse = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(10000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; URL-Validator/1.0)'
        }
      })

      console.log(`📡 [check-url:${sessionId}] HEAD response:`, {
        status: headResponse.status,
        finalUrl: headResponse.url,
        ok: headResponse.ok
      })

      const result = {
        ok: headResponse.ok,
        status: headResponse.status,
        finalUrl: headResponse.url !== url ? headResponse.url : undefined,
      }

      // Cache the result
      const cacheTtl = headResponse.ok ? CACHE_TTL.success : 
                      headResponse.status === 429 ? CACHE_TTL.rateLimit : 
                      CACHE_TTL.failure
      setCachedResult(cacheKey, result, cacheTtl)

      Sentry.addBreadcrumb({
        message: 'HEAD request successful',
        level: 'info',
        data: { 
          url, 
          status: headResponse.status, 
          finalUrl: headResponse.url,
          redirected: headResponse.url !== url,
          session_id: sessionId
        }
      })

      return NextResponse.json(result)
    } catch (headError) {
      console.log(`⚠️ [check-url:${sessionId}] HEAD request failed, falling back to GET:`, headError)
      
      Sentry.addBreadcrumb({
        message: 'HEAD request failed, trying GET',
        level: 'warning',
        data: { 
          url, 
          error: headError instanceof Error ? headError.message : String(headError),
          session_id: sessionId
        }
      })
      
      try {
        console.log(`🌐 [check-url:${sessionId}] Making GET request to:`, url)
        const getResponse = await fetch(url, {
          method: 'GET',
          redirect: 'follow',
          signal: AbortSignal.timeout(10000),
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; URL-Validator/1.0)'
          }
        })

        console.log(`📡 [check-url:${sessionId}] GET response:`, {
          status: getResponse.status,
          finalUrl: getResponse.url,
          ok: getResponse.ok
        })

        const result = {
          ok: getResponse.ok,
          status: getResponse.status,
          finalUrl: getResponse.url !== url ? getResponse.url : undefined,
        }

        // Cache the result
        const cacheTtl = getResponse.ok ? CACHE_TTL.success : 
                        getResponse.status === 429 ? CACHE_TTL.rateLimit : 
                        CACHE_TTL.failure
        setCachedResult(cacheKey, result, cacheTtl)

        Sentry.addBreadcrumb({
          message: 'GET request successful after HEAD failure',
          level: 'info',
          data: { 
            url, 
            status: getResponse.status, 
            finalUrl: getResponse.url,
            redirected: getResponse.url !== url,
            session_id: sessionId
          }
        })

        return NextResponse.json(result)
      } catch (getError) {
        console.log(`💥 [check-url:${sessionId}] GET request also failed:`, getError)
        
        const errorResult = {
          ok: false,
          error: 'URL validation failed'
        }
        setCachedResult(cacheKey, errorResult, CACHE_TTL.failure)
        
        Sentry.captureException(getError, {
          tags: { 
            component: 'url-validator',
            validationType: 'http-fallback',
            session_id: sessionId
          },
          extra: { 
            url,
            headError: headError instanceof Error ? headError.message : String(headError),
            getError: getError instanceof Error ? getError.message : String(getError)
          }
        })
        
        return NextResponse.json(errorResult)
      }
    }
  } catch (error) {
    console.log(`💥 [check-url:${sessionId}] Validation failed:`, error)
    
    const errorResult = {
      ok: false, 
      error: 'fetch failed'
    }
    setCachedResult(cacheKey, errorResult, CACHE_TTL.failure)
    
    Sentry.captureException(error, {
      tags: { 
        component: 'url-validator',
        validationType: 'general',
        session_id: sessionId
      },
      extra: { url },
      level: 'error'
    })
    
    return NextResponse.json(errorResult)
  }
} 