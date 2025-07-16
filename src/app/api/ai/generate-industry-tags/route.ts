import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { validateTranscriptLength, generatePrompt, getStandardizedTagsServer } from '@/lib/ai-helpers'
import { createChatCompletion, addRequestDelay, validateOpenAIConfig } from '@/lib/openai-client'

// Edge Runtime for better global performance
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// Initialize Sentry for edge runtime
Sentry.captureException(new Error("Edge AI generate-industry-tags API initialized"))

export async function POST(request: NextRequest) {
  const sessionId = globalThis.crypto.randomUUID()
  console.log(`🚀 [generate-industry-tags:${sessionId}] API call started`)
  
  try {
    // Validate OpenAI configuration
    if (!validateOpenAIConfig()) {
      console.log(`❌ [generate-industry-tags:${sessionId}] OpenAI configuration validation failed`)
      Sentry.captureException(new Error('OpenAI API not properly configured'), {
        tags: { route: 'ai/generate-industry-tags', error_type: 'configuration' }
      })
      return NextResponse.json(
        { error: 'OpenAI API not properly configured' },
        { status: 500 }
      )
    }
    console.log(`✅ [generate-industry-tags:${sessionId}] OpenAI configuration validated`)

    let requestBody
    try {
      requestBody = await request.json()
    } catch (parseError) {
      console.log(`❌ [generate-industry-tags:${sessionId}] JSON parse error:`, parseError)
      Sentry.captureException(parseError, {
        tags: { route: 'ai/generate-industry-tags', error_type: 'json_parse' }
      })
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { transcript, reason_for_investing, description_raw } = requestBody

    // Debug logging for transcript validation
    console.log(`🔍 [generate-industry-tags:${sessionId}] Received transcript length:`, transcript?.length || 0)
    console.log(`🔍 [generate-industry-tags:${sessionId}] Transcript type:`, typeof transcript)
    console.log(`🔍 [generate-industry-tags:${sessionId}] Transcript first 200 chars:`, transcript?.substring(0, 200) || 'undefined')
    console.log(`🔍 [generate-industry-tags:${sessionId}] Reason for investing length:`, reason_for_investing?.length || 0)
    console.log(`🔍 [generate-industry-tags:${sessionId}] Company description length:`, description_raw?.length || 0)

    // Validate transcript
    const validation = validateTranscriptLength(transcript)
    if (!validation.valid) {
      console.log(`❌ [generate-industry-tags:${sessionId}] Validation failed:`, validation.error)
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    console.log(`✅ [generate-industry-tags:${sessionId}] Validation passed, fetching standardized tags...`)

    // Fetch standardized tags from database
    const { industryTags } = await getStandardizedTagsServer()
    console.log(`📋 [generate-industry-tags:${sessionId}] Fetched ${industryTags.length} standardized industry tags`)

    console.log(`✅ [generate-industry-tags:${sessionId}] Generating prompt with standardized tags...`)

    const prompt = generatePrompt('industry', transcript, industryTags, reason_for_investing, description_raw)
    console.log(`📝 [generate-industry-tags:${sessionId}] Generated prompt length:`, prompt.length)
    console.log(`📝 [generate-industry-tags:${sessionId}] Prompt first 300 chars:`, prompt.substring(0, 300))

    // Add small delay to prevent burst rate limits with slightly different timing
    console.log(`⏳ [generate-industry-tags:${sessionId}] Adding 120ms delay before OpenAI request`)
    await addRequestDelay(120)

    const requestOptions = {
      model: 'gpt-4o',
      maxTokens: 500, // Allow for up to 10 tags plus reasoning
      temperature: 0.5, // Balanced temperature for thorough but consistent tag generation
      user: 'investment-form-industry-tags',
      operationName: 'generate industry tags'
    }

    console.log(`🤖 [generate-industry-tags:${sessionId}] Making OpenAI request with options:`, requestOptions)
    console.log(`🤖 [generate-industry-tags:${sessionId}] Request timestamp:`, new Date().toISOString())

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

    console.log(`📊 [generate-industry-tags:${sessionId}] OpenAI response received:`, {
      success: result.success,
      hasData: !!result.data,
      error: result.error,
      rateLimitInfo: result.rateLimitInfo
    })

    if (!result.success) {
      // Check if this is a quota exceeded error
      if (result.rateLimitInfo?.quotaExceeded) {
        console.log(`💳 [generate-industry-tags:${sessionId}] OpenAI quota exceeded:`, {
          error: result.error,
          errorCode: result.rateLimitInfo.errorCode,
          errorType: result.rateLimitInfo.errorType
        })
        
        // Log quota exceeded to Sentry
        Sentry.captureException(new Error(`OpenAI quota exceeded: ${result.error}`), {
          tags: { 
            route: 'ai/generate-industry-tags', 
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
      
      console.log(`❌ [generate-industry-tags:${sessionId}] OpenAI request failed:`, {
        error: result.error,
        statusCode,
        rateLimitInfo: result.rateLimitInfo
      })
      
      // Log OpenAI API failures to Sentry
      Sentry.captureException(new Error(`OpenAI API failed: ${result.error}`), {
        tags: { 
          route: 'ai/generate-industry-tags', 
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

    const tagsResponse = result.data?.choices[0]?.message?.content?.trim()
    const usage = result.data?.usage

    console.log(`🎯 [generate-industry-tags:${sessionId}] Generated tags response:`, tagsResponse)
    console.log(`📈 [generate-industry-tags:${sessionId}] Token usage:`, usage)

    if (!tagsResponse) {
      console.log(`❌ [generate-industry-tags:${sessionId}] No tags generated from OpenAI response`)
      Sentry.captureException(new Error('No industry tags generated from OpenAI response'), {
        tags: { route: 'ai/generate-industry-tags', error_type: 'empty_response' },
        extra: {
          response: result.data?.choices[0]?.message?.content,
          sessionId
        }
      })
      return NextResponse.json(
        { error: 'No industry tags generated. Please try again.' },
        { status: 500 }
      )
    }

    // Parse tags from response (assuming comma-separated format)
    const rawTags = tagsResponse.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    
    // Filter to only include valid standardized tags
    const validTags = rawTags.filter(tag => industryTags.includes(tag))
    const invalidTags = rawTags.filter(tag => !industryTags.includes(tag))
    
    if (invalidTags.length > 0) {
      console.log(`⚠️ [generate-industry-tags:${sessionId}] AI generated invalid tags (filtered out):`, invalidTags)
      Sentry.addBreadcrumb({
        message: 'AI generated invalid industry tags',
        level: 'warning',
        data: { 
          invalidTags,
          validTags,
          sessionId 
        }
      })
    }

    console.log(`✨ [generate-industry-tags:${sessionId}] Valid standardized tags:`, validTags)
    
    const tags = validTags

    // Check if we have any valid tags
    if (tags.length === 0) {
      console.log(`❌ [generate-industry-tags:${sessionId}] No valid standardized tags generated`)
      Sentry.captureException(new Error('No valid standardized industry tags generated'), {
        tags: { route: 'ai/generate-industry-tags', error_type: 'no_valid_tags' },
        extra: {
          rawResponse: tagsResponse,
          rawTags,
          invalidTags,
          sessionId
        }
      })
      return NextResponse.json(
        { error: 'AI could not generate valid industry tags. Please try again or select tags manually.' },
        { status: 500 }
      )
    }

    console.log(`✅ [generate-industry-tags:${sessionId}] API call completed successfully`)
    return NextResponse.json({ 
      tags,
      usage 
    })
    
  } catch (error) {
    console.log(`💥 [generate-industry-tags:${sessionId}] Unexpected error:`, error)
    // Catch any unexpected errors
    Sentry.captureException(error, {
      tags: { route: 'ai/generate-industry-tags', error_type: 'unexpected' },
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