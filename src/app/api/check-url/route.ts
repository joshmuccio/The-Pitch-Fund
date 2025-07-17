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

    // Special handling for social media platforms that often block HEAD requests
    // but are still valid URLs
    const isValidSocialMediaResponse = (status: number, url: string) => {
      const urlLower = url.toLowerCase()
      if (urlLower.includes('linkedin.com') && (status === 405 || status === 403 || status === 429 || status === 999)) {
        return true // LinkedIn often returns these for bot protection and rate limiting
      }
      if (urlLower.includes('twitter.com') && (status === 403 || status === 429)) {
        return true // Twitter blocks many automated requests
      }
      if (urlLower.includes('x.com') && (status === 403 || status === 429)) {
        return true // X.com (formerly Twitter) blocks many automated requests
      }
      if (urlLower.includes('tiktok.com') && (status === 403 || status === 429 || status === 405)) {
        return true // TikTok often blocks automated requests
      }
      if (urlLower.includes('wikipedia.org') && (status === 403 || status === 429 || status === 405)) {
        return true // Wikipedia may block automated requests or return these codes for valid URLs
      }
      // Handle 405 Method Not Allowed for podcast URLs and general websites
      // Many servers don't support HEAD requests but do support GET requests
      if (status === 405) {
        return true // Method Not Allowed often means the URL is valid but doesn't support HEAD requests
      }
      return false
    }

    // Helper to validate Instagram URLs - handle server request limitations
    const isValidInstagramUrl = (originalUrl: string, finalUrl: string) => {
      const originalLower = originalUrl.toLowerCase()
      const finalLower = finalUrl.toLowerCase()
      
      // Only apply Instagram validation to Instagram URLs
      if (!originalLower.includes('instagram.com')) {
        return true // Not an Instagram URL, skip this validation
      }
      
      // Check if original URL is a direct profile URL pattern
      const isDirectProfileUrl = (url: string) => {
        try {
          const urlObj = new URL(url)
          const path = urlObj.pathname
          // Direct profile URLs follow pattern: /username/ or /username
          // Should not contain: /accounts/, /p/, /reel/, /tv/, etc.
          return /^\/[a-zA-Z0-9_.]+\/?$/.test(path) && 
                 !path.includes('/accounts/') && 
                 !path.includes('/p/') && 
                 !path.includes('/reel/') &&
                 !path.includes('/tv/')
        } catch {
          return false
        }
      }
      
      // If original URL is a direct profile URL and gets redirected to login,
      // treat it as valid since Instagram blocks server requests to legitimate profiles
      if (isDirectProfileUrl(originalUrl) && finalLower.includes('/accounts/login/')) {
        console.log(`✅ [Instagram] Allowing direct profile URL despite login redirect: ${originalUrl}`)
        console.log(`📝 [Instagram] Note: Instagram redirected server request to login, but URL pattern is valid`)
        return true
      }
      
      // Reject if final URL is a login page for non-direct profile URLs
      if (finalLower.includes('/accounts/login/')) {
        console.log(`🚫 [Instagram] Rejecting login redirect for non-profile URL: ${originalUrl} -> ${finalUrl}`)
        return false
      }
      
      // Reject if final URL is significantly different from original (suspicious redirect)
      try {
        const originalPath = new URL(originalUrl).pathname
        const finalPath = new URL(finalUrl).pathname
        
        // Allow minor differences (trailing slashes, etc.) but reject major path changes
        const normalizedOriginal = originalPath.replace(/\/$/, '').toLowerCase()
        const normalizedFinal = finalPath.replace(/\/$/, '').toLowerCase()
        
        if (normalizedOriginal !== normalizedFinal && finalLower.includes('instagram.com')) {
          console.log(`🚫 [Instagram] Rejecting suspicious redirect: ${originalPath} -> ${finalPath}`)
          return false
        }
      } catch (error) {
        console.log(`⚠️ [Instagram] URL parsing error:`, error)
        return false
      }
      
      return true
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

      const isValidUrl = headResponse.ok || isValidSocialMediaResponse(headResponse.status, url)
      
      // Additional Instagram validation - handle server request limitations
      const isValidInstagram = isValidInstagramUrl(url, headResponse.url)
      const finalIsValid = isValidUrl && isValidInstagram

      const result = {
        ok: finalIsValid,
        status: headResponse.status,
        finalUrl: headResponse.url !== url ? headResponse.url : undefined,
        ...(url.toLowerCase().includes('instagram.com') && !isValidInstagram && {
          error: 'Instagram URL appears to be invalid or inaccessible. Please verify the URL and try again.'
        })
      }

      // Cache the result
      const cacheTtl = finalIsValid ? CACHE_TTL.success : 
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
          instagramValidation: url.toLowerCase().includes('instagram.com') ? isValidInstagram : 'N/A',
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

        // Apply same social media validation logic for GET requests
        const isValidUrlGet = getResponse.ok || isValidSocialMediaResponse(getResponse.status, url)
        
        // Additional Instagram validation - handle server request limitations
        const isValidInstagramGet = isValidInstagramUrl(url, getResponse.url)
        const finalIsValidGet = isValidUrlGet && isValidInstagramGet

        const result = {
          ok: finalIsValidGet,
          status: getResponse.status,
          finalUrl: getResponse.url !== url ? getResponse.url : undefined,
          ...(url.toLowerCase().includes('instagram.com') && !isValidInstagramGet && {
            error: 'Instagram URL appears to be invalid or inaccessible. Please verify the URL and try again.'
          })
        }

        // Cache the result
        const cacheTtl = finalIsValidGet ? CACHE_TTL.success : 
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
            instagramValidation: url.toLowerCase().includes('instagram.com') ? isValidInstagramGet : 'N/A',
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