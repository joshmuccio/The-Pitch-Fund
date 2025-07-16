import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { openai } from '@/lib/openai-client'
import crypto from 'crypto'
import * as Sentry from '@sentry/nextjs'

// Configure this route to run on Edge Runtime for better performance
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// Initialize Sentry for edge runtime
Sentry.captureException(new Error("Edge vectorize-logo API initialized"))

export async function POST(request: Request) {
  const sessionId = crypto.randomUUID()
  console.log(`🎨 [vectorize-logo:${sessionId}] Starting logo vectorization`)

  try {
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

    console.log(`📤 [vectorize-logo:${sessionId}] Fetching image from: ${imageUrl}`)

    // Check if vectorization is enabled
    const enableVectorization = process.env.ENABLE_IMAGE_VECTORIZATION
    console.log(`🔍 [vectorize-logo:${sessionId}] ENABLE_IMAGE_VECTORIZATION: ${enableVectorization}`)

    if (enableVectorization !== 'true') {
      console.log(`⚠️ [vectorize-logo:${sessionId}] Vectorization disabled, skipping`)
      return NextResponse.json(
        { 
          error: 'Vectorization disabled',
          originalUrl: imageUrl
        },
        { status: 400 }
      )
    }

    // Fetch the image from the provided URL
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`)
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    console.log(`📥 [vectorize-logo:${sessionId}] Image fetched: ${imageBuffer.byteLength} bytes`)

    // Prepare form data for Vectorizer.ai
    const vectorizerFormData = new FormData()
    const blob = new Blob([imageBuffer], { type: 'image/png' })
    vectorizerFormData.append('image', blob, 'logo.png')
    // Note: mode parameter is not supported by Vectorizer.ai API

    // Call Vectorizer.ai API
    const vectorizerResponse = await fetch('https://vectorizer.ai/api/v1/vectorize', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.VECTORIZER_AI_USER_ID}:${process.env.VECTORIZER_AI_API_TOKEN}`).toString('base64')}`
      },
      body: vectorizerFormData
    })

    if (!vectorizerResponse.ok) {
      const errorText = await vectorizerResponse.text()
      console.error(`❌ [vectorize-logo:${sessionId}] Vectorizer.ai API error:`, vectorizerResponse.status, errorText)
      
      return NextResponse.json(
        { 
          error: `Vectorization failed: ${vectorizerResponse.status}`,
          originalUrl: imageUrl
        },
        { status: 400 }
      )
    }

    // Get the SVG content and post-process it for CSS styling
    const svgBuffer = await vectorizerResponse.arrayBuffer()
    let svgContent = new TextDecoder().decode(svgBuffer)

    // === CRITICAL: Fix broken XML syntax first ===
    // Handle multiline attribute values - specifically target attributes with line breaks
    // Use a more targeted approach to find and fix broken viewBox and other multi-line attributes
    svgContent = svgContent.replace(/(\w+)="([^"]*[\r\n][^"]*)"/g, (match, attrName, attrValue) => {
      // Clean up the attribute value: remove line breaks and normalize whitespace
      const cleanValue = attrValue.replace(/\r?\n\s*/g, ' ').replace(/\s+/g, ' ').trim()
      return `${attrName}="${cleanValue}"`
    })
    
    // Additional cleanup for any remaining line breaks in XML
    svgContent = svgContent.replace(/\r?\n\s*/g, ' ').replace(/\s+/g, ' ')

    // Post-process SVG to make it CSS-styleable with fallback for <img> tags
    svgContent = svgContent
      .replace(/fill="[^"]*"/g, 'fill="#000000"')      // Replace fills with black
      .replace(/stroke="[^"]*"/g, 'stroke="#000000"')  // Replace strokes with black
      .replace(/currentColor/g, '#000000')             // Replace any remaining currentColor

    // Add styling attributes for <img> tag compatibility
    svgContent = svgContent.replace(
      /<svg([^>]*)>/,
      '<svg$1 class="logo-svg" style="color: #000000;">'
    )

    console.log(`✅ [vectorize-logo:${sessionId}] Scalable SVG created: ${svgContent.length} bytes`)

    // Upload SVG to Vercel Blob
    const filename = `logos/${imageUrl.split('/').pop()?.replace(/\.[^.]+$/, '')}_vectorized-${crypto.randomUUID().slice(0, 8)}.svg`
    
    const svgBlob = await put(filename, svgContent, {
      access: 'public',
      contentType: 'image/svg+xml'
    })

    console.log(`🎯 [vectorize-logo:${sessionId}] SVG uploaded to Vercel Blob: ${svgBlob.url}`)

    return NextResponse.json({
      success: true,
      originalUrl: imageUrl,
      svgUrl: svgBlob.url,
      originalSize: imageBuffer.byteLength,
      svgSize: svgContent.length,
      conversionRatio: ((1 - svgContent.length / imageBuffer.byteLength) * 100).toFixed(1)
    })

  } catch (error: any) {
    console.error(`❌ [vectorize-logo:${sessionId}] Error:`, error)
    Sentry.captureException(error, {
      tags: { route: 'api/vectorize-logo', session_id: sessionId, error_type: 'vectorization_failed' }
    })
    return NextResponse.json(
      { 
        error: 'Vectorization failed: ' + error.message
      },
      { status: 500 }
    )
  }
} 