import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { validateTranscriptLength, generatePrompt } from '@/lib/ai-helpers'
import { createChatCompletion, addRequestDelay, validateOpenAIConfig } from '@/lib/openai-client'

// Edge Runtime for better global performance
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// Initialize Sentry for edge runtime
Sentry.captureException(new Error("Edge AI generate-tagline API initialized"))

export async function POST(request: NextRequest) {
  const sessionId = globalThis.crypto.randomUUID()
  console.log(`🚀 [generate-tagline:${sessionId}] API call started`)
  
  try {
    // Validate OpenAI configuration
    if (!validateOpenAIConfig()) {
      console.log(`❌ [generate-tagline:${sessionId}] OpenAI configuration validation failed`)
      Sentry.captureException(new Error('OpenAI API not properly configured'), {
        tags: { route: 'ai/generate-tagline', error_type: 'configuration' }
      })
      return NextResponse.json(
        { error: 'OpenAI API not properly configured' },
        { status: 500 }
      )
    }
    console.log(`✅ [generate-tagline:${sessionId}] OpenAI configuration validated`)

    let requestBody
    try {
      requestBody = await request.json()
    } catch (parseError) {
      console.log(`❌ [generate-tagline:${sessionId}] JSON parse error:`, parseError)
      Sentry.captureException(parseError, {
        tags: { route: 'ai/generate-tagline', error_type: 'json_parse' }
      })
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { transcript, reason_for_investing, description_raw } = requestBody

    // Debug logging for transcript validation
    console.log(`🔍 [generate-tagline:${sessionId}] Received transcript length:`, transcript?.length || 0)
    console.log(`🔍 [generate-tagline:${sessionId}] Transcript type:`, typeof transcript)
    console.log(`🔍 [generate-tagline:${sessionId}] Transcript first 200 chars:`, transcript?.substring(0, 200) || 'undefined')
    console.log(`🔍 [generate-tagline:${sessionId}] Reason for investing length:`, reason_for_investing?.length || 0)
    console.log(`🔍 [generate-tagline:${sessionId}] Company description length:`, description_raw?.length || 0)

    // Validate transcript
    const validation = validateTranscriptLength(transcript)
    if (!validation.valid) {
      console.log(`❌ [generate-tagline:${sessionId}] Validation failed:`, validation.error)
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    console.log(`✅ [generate-tagline:${sessionId}] Validation passed, generating prompt...`)

    const prompt = generatePrompt('tagline', transcript, undefined, reason_for_investing, description_raw)
    console.log(`📝 [generate-tagline:${sessionId}] Generated prompt length:`, prompt.length)
    console.log(`📝 [generate-tagline:${sessionId}] Prompt first 300 chars:`, prompt.substring(0, 300))

    // Add small delay to prevent burst rate limits
    console.log(`⏳ [generate-tagline:${sessionId}] Adding 100ms delay before OpenAI request`)
    await addRequestDelay(100)

    const requestOptions = {
      model: 'gpt-4o-mini',
      maxTokens: 100,
      temperature: 0.7,
      user: 'investment-form-tagline',
      operationName: 'generate tagline'
    }

    console.log(`🤖 [generate-tagline:${sessionId}] Making OpenAI request with options:`, requestOptions)
    console.log(`🤖 [generate-tagline:${sessionId}] Request timestamp:`, new Date().toISOString())

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

    console.log(`📊 [generate-tagline:${sessionId}] OpenAI response received:`, {
      success: result.success,
      hasData: !!result.data,
      error: result.error,
      rateLimitInfo: result.rateLimitInfo
    })

    if (!result.success) {
      // Check if this is a quota exceeded error
      if (result.rateLimitInfo?.quotaExceeded) {
        console.log(`💳 [generate-tagline:${sessionId}] OpenAI quota exceeded:`, {
          error: result.error,
          errorCode: result.rateLimitInfo.errorCode,
          errorType: result.rateLimitInfo.errorType
        })
        
        // Log quota exceeded to Sentry
        Sentry.captureException(new Error(`OpenAI quota exceeded: ${result.error}`), {
          tags: { 
            route: 'ai/generate-tagline', 
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
      
      console.log(`❌ [generate-tagline:${sessionId}] OpenAI request failed:`, {
        error: result.error,
        statusCode,
        rateLimitInfo: result.rateLimitInfo
      })
      
      // Log OpenAI API failures to Sentry
      Sentry.captureException(new Error(`OpenAI API failed: ${result.error}`), {
        tags: { 
          route: 'ai/generate-tagline', 
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

    const tagline = result.data?.choices[0]?.message?.content?.trim()
    const usage = result.data?.usage

    console.log(`🎯 [generate-tagline:${sessionId}] Generated tagline:`, tagline)
    console.log(`📈 [generate-tagline:${sessionId}] Token usage:`, usage)

    if (!tagline) {
      console.log(`❌ [generate-tagline:${sessionId}] No tagline generated from OpenAI response`)
      Sentry.captureException(new Error('No tagline generated from OpenAI response'), {
        tags: { route: 'ai/generate-tagline', error_type: 'empty_response' },
        extra: {
          response: result.data?.choices[0]?.message?.content,
          sessionId
        }
      })
      return NextResponse.json(
        { error: 'No tagline generated. Please try again.' },
        { status: 500 }
      )
    }

    // Clean up the tagline response by removing surrounding quotes and extra formatting
    const cleanedTagline = tagline
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/^\s*[\-\*\+]\s*/, '') // Remove leading bullet points
      .trim()

    console.log(`✨ [generate-tagline:${sessionId}] Cleaned tagline:`, cleanedTagline)

    console.log(`✅ [generate-tagline:${sessionId}] API call completed successfully`)
    return NextResponse.json({ 
      tagline: cleanedTagline,
      usage 
    })
    
  } catch (error) {
    console.log(`💥 [generate-tagline:${sessionId}] Unexpected error:`, error)
    // Catch any unexpected errors
    Sentry.captureException(error, {
      tags: { route: 'ai/generate-tagline', error_type: 'unexpected' },
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