import { NextRequest, NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import * as Sentry from '@sentry/nextjs'

export async function POST(request: NextRequest) {
  const sessionId = (() => {
    try {
      return crypto.randomUUID()
    } catch (error) {
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    }
  })()

  console.log(`🚀 [upload-logo:${sessionId}] Client upload handler started`)

  try {
    const body = (await request.json()) as HandleUploadBody

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        console.log(`🔐 [upload-logo:${sessionId}] Generating token for: ${pathname}`)

        // TODO: Add authentication check here
        // const session = await getServerSession()
        // if (!session?.user) {
        //   throw new Error('Unauthorized')
        // }

        return {
          allowedContentTypes: [
            'image/jpeg', 
            'image/jpg', 
            'image/png', 
            'image/gif', 
            'image/svg+xml', 
            'image/webp'
          ],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            sessionId,
            uploadedAt: new Date().toISOString()
          }),
          maximumSizeInBytes: 5 * 1024 * 1024, // 5MB limit
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log(`✅ [upload-logo:${sessionId}] Upload completed:`, blob.url)
        
        try {
          const payload = JSON.parse(tokenPayload || '{}')
          console.log(`📊 [upload-logo:${sessionId}] Upload metadata:`, payload)
          
          // Here you could update your database with the logo URL
          // await db.update({ logo_url: blob.url, company_id: payload.companyId })
          
        } catch (error) {
          console.error(`❌ [upload-logo:${sessionId}] Failed to process upload completion:`, error)
          Sentry.captureException(error, {
            tags: { component: 'upload-logo-completion', sessionId }
          })
        }
      },
    })

    console.log(`✅ [upload-logo:${sessionId}] Token generated successfully`)
    return NextResponse.json(jsonResponse)

  } catch (error) {
    console.error(`❌ [upload-logo:${sessionId}] Upload handler failed:`, error)
    
    Sentry.captureException(error, {
      tags: {
        component: 'upload-logo-handler',
        sessionId
      }
    })

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Upload failed'
      },
      { status: 400 } // Vercel recommends 400 for client upload errors
    )
  }
} 