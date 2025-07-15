import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import * as Sentry from '@sentry/nextjs'

export async function POST(request: NextRequest) {
  const sessionId = (() => {
    try {
      return crypto.randomUUID()
    } catch (error) {
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    }
  })()

  console.log(`🎨 [vectorize-and-upload:${sessionId}] Creating scalable SVG logo`)

  try {
    // Check if vectorization is enabled
    const vectorizationEnabled = process.env.ENABLE_PNG_VECTORIZATION === 'true'
    if (!vectorizationEnabled) {
      return NextResponse.json(
        { error: 'Image vectorization is currently disabled' },
        { status: 503 }
      )
    }

    // Validate environment variables
    const vectorizerUserId = process.env.VECTORIZER_AI_USER_ID
    const vectorizerApiToken = process.env.VECTORIZER_AI_API_TOKEN

    if (!vectorizerUserId || !vectorizerApiToken) {
      console.error(`❌ [vectorize-and-upload:${sessionId}] Missing Vectorizer.ai credentials`)
      return NextResponse.json(
        { error: 'Vectorizer.ai credentials not configured' },
        { status: 500 }
      )
    }

    // Parse the multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type (bitmap images supported by Vectorizer.ai)
    const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp', 'image/tiff']
    if (!supportedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Supported file types: PNG, JPEG, GIF, BMP, TIFF' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    console.log(`📤 [vectorize-and-upload:${sessionId}] Processing ${file.name} (${file.size} bytes)`)

    // Prepare form data for Vectorizer.ai with optimized settings
    const vectorizerFormData = new FormData()
    vectorizerFormData.append('image', file)
    
    // === SIMPLE LOGO CONVERSION SETTINGS ===
    // Let Vectorizer.ai handle quality optimization with sensible defaults
    // Only specify what we NEED for CSS-styleable logos
    vectorizerFormData.append('processing.max_colors', '1') // Force single color for CSS styling

    // Call Vectorizer.ai API
    const vectorizerResponse = await fetch('https://vectorizer.ai/api/v1/vectorize', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${vectorizerUserId}:${vectorizerApiToken}`).toString('base64')}`
      },
      body: vectorizerFormData
    })

    if (!vectorizerResponse.ok) {
      const errorText = await vectorizerResponse.text()
      console.error(`❌ [vectorize-and-upload:${sessionId}] Vectorizer.ai API error:`, vectorizerResponse.status, errorText)
      
      return NextResponse.json(
        { 
          error: `Vectorization failed: ${vectorizerResponse.status}`,
          fallback: true // Signal that client should fall back to original PNG
        },
        { status: 400 }
      )
    }

    // Get the SVG content and post-process it for CSS styling
    const svgBuffer = await vectorizerResponse.arrayBuffer()
    let svgContent = new TextDecoder().decode(svgBuffer)

    // Post-process SVG to make it CSS-styleable (remove colors)
    svgContent = svgContent
      .replace(/fill="[^"]*"/g, 'fill="currentColor"')      // Replace fills with currentColor
      .replace(/stroke="[^"]*"/g, 'stroke="currentColor"')  // Replace strokes with currentColor
      .replace(/fill:#[a-fA-F0-9]{6}/g, 'fill:currentColor') // CSS-style fills
      .replace(/stroke:#[a-fA-F0-9]{6}/g, 'stroke:currentColor') // CSS-style strokes
      .replace(/fill:#[a-fA-F0-9]{3}/g, 'fill:currentColor') // Short hex colors
      .replace(/stroke:#[a-fA-F0-9]{3}/g, 'stroke:currentColor') // Short hex strokes
    
    // Add CSS class for easy styling
    svgContent = svgContent.replace('<svg', '<svg class="logo-svg"')
    
    const processedSvgBuffer = Buffer.from(svgContent, 'utf-8')

    console.log(`✅ [vectorize-and-upload:${sessionId}] Scalable SVG created: ${processedSvgBuffer.length} bytes`)

    // Generate SVG filename (replace extension with .svg)
    const originalName = file.name.replace(/\.[^/.]+$/, '') // Remove extension
    const svgFilename = `logos/${originalName}_vectorized.svg`

    // Upload processed SVG to Vercel Blob
    const blob = await put(svgFilename, processedSvgBuffer, {
      access: 'public',
      contentType: 'image/svg+xml',
      addRandomSuffix: true
    })

    console.log(`🎯 [vectorize-and-upload:${sessionId}] SVG uploaded to Vercel Blob:`, blob.url)

    // Return success response
    return NextResponse.json({
      success: true,
      url: blob.url,
      filename: blob.pathname,
      originalSize: file.size,
      svgSize: svgBuffer.byteLength,
      conversionRatio: ((file.size - svgBuffer.byteLength) / file.size * 100).toFixed(1)
    })

  } catch (error) {
    console.error(`💥 [vectorize-and-upload:${sessionId}] Conversion failed:`, error)
    
    Sentry.captureException(error, {
      tags: {
        component: 'vectorize-and-upload',
        sessionId
      }
    })

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Vectorization failed',
        fallback: true // Signal that client should fall back to original PNG
      },
      { status: 500 }
    )
  }
} 