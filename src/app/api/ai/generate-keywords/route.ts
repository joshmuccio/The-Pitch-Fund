import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { validateTranscriptLength, generatePrompt, getStandardizedTagsServer } from '@/lib/ai-helpers'
import { createChatCompletion, addRequestDelay, validateOpenAIConfig } from '@/lib/openai-client'

// Edge Runtime for better global performance
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// Initialize Sentry for edge runtime
Sentry.captureException(new Error("Edge AI generate-keywords API initialized"))

export async function POST(request: NextRequest) {
  const sessionId = globalThis.crypto.randomUUID()
  console.log(`🚀 [generate-keywords:${sessionId}] API call started`)
  
  try {
    // Validate OpenAI configuration
    if (!validateOpenAIConfig()) {
      console.log(`❌ [generate-keywords:${sessionId}] OpenAI configuration validation failed`)
      Sentry.captureException(new Error('OpenAI API not properly configured'), {
        tags: { route: 'ai/generate-keywords', error_type: 'configuration' }
      })
      return NextResponse.json(
        { error: 'OpenAI API not properly configured' },
        { status: 500 }
      )
    }
    console.log(`✅ [generate-keywords:${sessionId}] OpenAI configuration validated`)

    let requestBody
    try {
      requestBody = await request.json()
    } catch (parseError) {
      console.log(`❌ [generate-keywords:${sessionId}] JSON parse error:`, parseError)
      Sentry.captureException(parseError, {
        tags: { route: 'ai/generate-keywords', error_type: 'json_parse' }
      })
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { transcript, reason_for_investing, description_raw, episode_show_notes } = requestBody

    // Debug logging for transcript validation
    console.log(`🔍 [generate-keywords:${sessionId}] Received transcript length:`, transcript?.length || 0)
    console.log(`🔍 [generate-keywords:${sessionId}] Transcript type:`, typeof transcript)
    console.log(`🔍 [generate-keywords:${sessionId}] Transcript first 200 chars:`, transcript?.substring(0, 200) || 'undefined')
    console.log(`🔍 [generate-keywords:${sessionId}] Reason for investing length:`, reason_for_investing?.length || 0)
    console.log(`🔍 [generate-keywords:${sessionId}] Company description length:`, description_raw?.length || 0)
    console.log(`🔍 [generate-keywords:${sessionId}] Episode show notes length:`, episode_show_notes?.length || 0)

    // Validate transcript
    const validation = validateTranscriptLength(transcript)
    if (!validation.valid) {
      console.log(`❌ [generate-keywords:${sessionId}] Validation failed:`, validation.error)
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    console.log(`✅ [generate-keywords:${sessionId}] Validation passed, fetching standardized tags...`)

    // Fetch standardized tags from database
    const { keywords, industryTags, businessModelTags } = await getStandardizedTagsServer()
    console.log(`📋 [generate-keywords:${sessionId}] Fetched ${keywords.length} standardized keywords`)
    console.log(`📋 [generate-keywords:${sessionId}] Fetched ${industryTags.length} industry tags and ${businessModelTags.length} business model tags for overlap prevention`)

    console.log(`✅ [generate-keywords:${sessionId}] Generating prompt with standardized keywords...`)

    const prompt = generatePrompt('keywords', transcript, keywords, reason_for_investing, description_raw, episode_show_notes)
    console.log(`📝 [generate-keywords:${sessionId}] Generated prompt length:`, prompt.length)
    console.log(`📝 [generate-keywords:${sessionId}] Prompt first 300 chars:`, prompt.substring(0, 300))

    // Add small delay to prevent burst rate limits with slightly different timing
    console.log(`⏳ [generate-keywords:${sessionId}] Adding 140ms delay before OpenAI request`)
    await addRequestDelay(140)

    const requestOptions = {
      model: 'gpt-4.1',
      maxTokens: 550, // Allow for up to 20 keywords
      temperature: 0.5, // Lower temperature for more consistent keyword generation
      user: 'investment-form-keywords',
      operationName: 'generate keywords'
    }

    console.log(`🤖 [generate-keywords:${sessionId}] Making OpenAI request with options:`, requestOptions)
    console.log(`🤖 [generate-keywords:${sessionId}] Request timestamp:`, new Date().toISOString())

    // Execute OpenAI request with proper exponential backoff
    const result = await createChatCompletion(
      [
        {
          role: 'user',
          content: prompt,
        },
      ],
      requestOptions
    )

    console.log(`📊 [generate-keywords:${sessionId}] OpenAI response received:`, {
      success: result.success,
      hasData: !!result.data,
      error: result.error,
      rateLimitInfo: result.rateLimitInfo
    })

    if (!result.success) {
      // Check if this is a quota exceeded error
      if (result.rateLimitInfo?.quotaExceeded) {
        console.log(`💳 [generate-keywords:${sessionId}] OpenAI quota exceeded:`, {
          error: result.error,
          errorCode: result.rateLimitInfo.errorCode,
          errorType: result.rateLimitInfo.errorType
        })
        
        // Log quota exceeded to Sentry
        Sentry.captureException(new Error(`OpenAI quota exceeded: ${result.error}`), {
          tags: { 
            route: 'ai/generate-keywords', 
            error_type: 'quota_exceeded'
          },
          extra: {
            rateLimitInfo: result.rateLimitInfo,
            sessionId
          }
        })
        
        return NextResponse.json(
          { 
            error: 'OpenAI quota exceeded. Please check your plan and billing details.',
            quotaExceeded: true,
            rateLimitInfo: result.rateLimitInfo
          },
          { status: 429 }
        )
      }
      
      // Handle other error types
      const statusCode = result.error?.includes('Rate limit') ? 429 : 
                         result.error?.includes('authentication') ? 401 :
                         result.error?.includes('rejected') ? 400 : 500
      
      console.log(`❌ [generate-keywords:${sessionId}] OpenAI request failed:`, {
        error: result.error,
        statusCode,
        rateLimitInfo: result.rateLimitInfo
      })
      
      // Log OpenAI API failures to Sentry
      Sentry.captureException(new Error(`OpenAI API failed: ${result.error}`), {
        tags: { 
          route: 'ai/generate-keywords', 
          error_type: 'openai_api_failure',
          status_code: statusCode.toString()
        },
        extra: {
          rateLimitInfo: result.rateLimitInfo,
          sessionId
        }
      })
      
      return NextResponse.json(
        { 
          error: result.error,
          ...(result.rateLimitInfo && { rateLimitInfo: result.rateLimitInfo })
        },
        { status: statusCode }
      )
    }

    const keywordsResponse = result.data?.choices[0]?.message?.content?.trim()
    const usage = result.data?.usage

    console.log(`🎯 [generate-keywords:${sessionId}] Generated keywords response:`, keywordsResponse)
    console.log(`📈 [generate-keywords:${sessionId}] Token usage:`, usage)

    if (!keywordsResponse) {
      console.log(`❌ [generate-keywords:${sessionId}] No keywords generated from OpenAI response`)
      Sentry.captureException(new Error('No keywords generated from OpenAI response'), {
        tags: { route: 'ai/generate-keywords', error_type: 'empty_response' },
        extra: {
          response: result.data?.choices[0]?.message?.content,
          sessionId
        }
      })
      return NextResponse.json(
        { error: 'No keywords generated. Please try again.' },
        { status: 500 }
      )
    }

    // Parse keywords from response (assuming comma-separated format)
    const rawKeywords = keywordsResponse.split(',').map(keyword => keyword.trim()).filter(keyword => keyword.length > 0)
    
    // Separate existing approved keywords from new keywords
    // Use case-insensitive matching but preserve the database case
    const existingKeywords = rawKeywords.filter(keyword => 
      keywords.some(dbKeyword => dbKeyword.toLowerCase() === keyword.toLowerCase())
    ).map(keyword => {
      // Find the matching database keyword to preserve correct case
      const dbKeyword = keywords.find(dbKeyword => dbKeyword.toLowerCase() === keyword.toLowerCase())
      return dbKeyword || keyword
    })
    
    const newKeywords = rawKeywords.filter(keyword => 
      !keywords.some(dbKeyword => dbKeyword.toLowerCase() === keyword.toLowerCase())
    ).map(keyword => keyword.toLowerCase())
    
    // Filter out new keywords that overlap with industry or business model tags
    const allowedNewKeywords = newKeywords.filter(keyword => {
      const overlapIndustry = industryTags.includes(keyword)
      const overlapBusiness = businessModelTags.includes(keyword)
      
      if (overlapIndustry || overlapBusiness) {
        console.log(`🚫 [generate-keywords:${sessionId}] Filtering out overlapping keyword: "${keyword}" (overlaps with ${overlapIndustry ? 'industry' : 'business model'} tags)`)
        return false
      }
      
      // Basic validation for new keywords
      const validFormat = /^[a-z][a-z0-9_]*[a-z0-9]$/.test(keyword) || /^[a-z]+$/.test(keyword)
      if (!validFormat) {
        console.log(`🚫 [generate-keywords:${sessionId}] Filtering out invalid format keyword: "${keyword}"`)
        return false
      }
      
      return true
    })
    
    const overlappingKeywords = newKeywords.filter(keyword => 
      industryTags.includes(keyword) || businessModelTags.includes(keyword)
    )
    const invalidFormatKeywords = newKeywords.filter(keyword => 
      !allowedNewKeywords.includes(keyword) && 
      !overlappingKeywords.includes(keyword)
    )
    
    if (overlappingKeywords.length > 0) {
      console.log(`⚠️ [generate-keywords:${sessionId}] AI generated overlapping keywords (filtered out):`, overlappingKeywords)
      Sentry.addBreadcrumb({
        message: 'AI generated keywords that overlap with industry/business model tags',
        level: 'warning',
        data: { 
          overlappingKeywords,
          existingKeywords,
          allowedNewKeywords,
          sessionId 
        }
      })
    }
    
    if (invalidFormatKeywords.length > 0) {
      console.log(`⚠️ [generate-keywords:${sessionId}] AI generated invalid format keywords (filtered out):`, invalidFormatKeywords)
    }

    console.log(`✨ [generate-keywords:${sessionId}] Existing approved keywords:`, existingKeywords)
    console.log(`✨ [generate-keywords:${sessionId}] New allowed keywords:`, allowedNewKeywords)
    
    const finalKeywords = [...existingKeywords, ...allowedNewKeywords]

    // Check if we have any valid keywords
    if (finalKeywords.length === 0) {
      console.log(`❌ [generate-keywords:${sessionId}] No valid keywords generated`)
      Sentry.captureException(new Error('No valid keywords generated'), {
        tags: { route: 'ai/generate-keywords', error_type: 'no_valid_keywords' },
        extra: {
          rawResponse: keywordsResponse,
          rawKeywords,
          overlappingKeywords,
          invalidFormatKeywords,
          sessionId
        }
      })
      return NextResponse.json(
        { error: 'AI could not generate valid keywords. Please try again or select keywords manually.' },
        { status: 500 }
      )
    }

    console.log(`✅ [generate-keywords:${sessionId}] API call completed successfully`)
    return NextResponse.json({ 
      keywords: finalKeywords,
      usage 
    })
    
  } catch (error) {
    console.log(`💥 [generate-keywords:${sessionId}] Unexpected error:`, error)
    // Catch any unexpected errors
    Sentry.captureException(error, {
      tags: { route: 'ai/generate-keywords', error_type: 'unexpected' },
      extra: {
        request_url: request.url,
        method: request.method,
        sessionId
      }
    })
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 