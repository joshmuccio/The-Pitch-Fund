import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { validateTranscriptLength, generatePrompt } from '@/lib/ai-helpers'
import { openai, executeWithRetry, validateOpenAIConfig } from '@/lib/openai-client'

// Edge Runtime for better global performance
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// Initialize Sentry for edge runtime
Sentry.captureException(new Error("Edge AI generate-tagline API initialized"))

export async function POST(request: NextRequest) {
  try {
    // Validate OpenAI configuration
    if (!validateOpenAIConfig()) {
      Sentry.captureException(new Error('OpenAI API not properly configured'), {
        tags: { route: 'ai/generate-tagline', error_type: 'configuration' }
      })
      return NextResponse.json(
        { error: 'OpenAI API not properly configured' },
        { status: 500 }
      )
    }

    let requestBody
    try {
      requestBody = await request.json()
    } catch (parseError) {
      Sentry.captureException(parseError, {
        tags: { route: 'ai/generate-tagline', error_type: 'json_parse' }
      })
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { transcript } = requestBody

    // Validate transcript
    const validation = validateTranscriptLength(transcript)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const prompt = generatePrompt('tagline', transcript)

    // Execute OpenAI request with proper error handling
    const result = await executeWithRetry(
      () => openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 50,
        temperature: 0.7,
        // Add metadata for tracking
        user: 'investment-form-tagline'
      }),
      'generate tagline'
    )

    if (!result.success) {
      const statusCode = result.error?.includes('Rate limit') ? 429 : 
                         result.error?.includes('authentication') ? 401 :
                         result.error?.includes('rejected') ? 400 : 500
      
      // Log OpenAI API failures to Sentry
      Sentry.captureException(new Error(`OpenAI API failed: ${result.error}`), {
        tags: { 
          route: 'ai/generate-tagline', 
          error_type: 'openai_api_failure',
          status_code: statusCode.toString()
        },
        extra: {
          rateLimitInfo: result.rateLimitInfo
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

    if (!tagline) {
      Sentry.captureException(new Error('No tagline generated from OpenAI response'), {
        tags: { route: 'ai/generate-tagline', error_type: 'empty_response' },
        extra: {
          response: result.data?.choices[0]?.message?.content
        }
      })
      return NextResponse.json(
        { error: 'No tagline generated. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      tagline,
      usage: result.data?.usage 
    })
    
  } catch (error) {
    // Catch any unexpected errors
    Sentry.captureException(error, {
      tags: { route: 'ai/generate-tagline', error_type: 'unexpected' },
      extra: {
        request_url: request.url,
        method: request.method
      }
    })
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 