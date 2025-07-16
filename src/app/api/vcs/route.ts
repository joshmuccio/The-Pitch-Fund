import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'

// Configure this route to run on Node.js runtime for database operations
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Initialize Sentry
Sentry.captureException(new Error("VCs API initialized"))

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const sessionId = globalThis.crypto.randomUUID()
  console.log(`📋 [vcs:${sessionId}] Fetching VCs list`)

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const firm = searchParams.get('firm')
    const season = searchParams.get('season')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('vcs')
      .select('*')
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,firm_name.ilike.%${search}%`)
    }
    
    if (firm) {
      query = query.eq('firm_name', firm)
    }
    
    if (season) {
      query = query.contains('seasons_appeared', [season])
    }

    const { data: vcs, error } = await query

    if (error) {
      throw error
    }

    console.log(`✅ [vcs:${sessionId}] Fetched ${vcs?.length || 0} VCs`)

    return NextResponse.json({
      success: true,
      data: vcs || [],
      total: vcs?.length || 0
    })

  } catch (error: any) {
    console.error(`❌ [vcs:${sessionId}] Error fetching VCs:`, error)
    Sentry.captureException(error, {
      tags: { route: 'api/vcs', method: 'GET', session_id: sessionId }
    })
    return NextResponse.json(
      { error: 'Failed to fetch VCs: ' + error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const sessionId = globalThis.crypto.randomUUID()
  console.log(`➕ [vcs:${sessionId}] Creating new VC`)

  try {
    const vcData = await request.json()

    // Validate required fields
    if (!vcData.name || !vcData.name.trim()) {
      return NextResponse.json(
        { error: 'VC name is required' },
        { status: 400 }
      )
    }

    // Check for existing VC with same name (handle uniqueness)
    const { data: existingVc, error: checkError } = await supabase
      .from('vcs')
      .select('*')
      .eq('name', vcData.name.trim())
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw checkError
    }

    if (existingVc) {
      // VC exists - update their information (handle firm changes)
      console.log(`🔄 [vcs:${sessionId}] VC exists, updating: ${vcData.name}`)
      
      const { data: updatedVc, error: updateError } = await supabase
        .from('vcs')
        .update({
          firm_name: vcData.firm_name || existingVc.firm_name,
          role_title: vcData.role_title || existingVc.role_title,
          bio: vcData.bio || existingVc.bio,
          profile_image_url: vcData.profile_image_url || existingVc.profile_image_url,
          linkedin_url: vcData.linkedin_url || existingVc.linkedin_url,
          twitter_url: vcData.twitter_url || existingVc.twitter_url,
          website_url: vcData.website_url || existingVc.website_url,
          podcast_url: vcData.podcast_url || existingVc.podcast_url,
          seasons_appeared: mergeArrays(existingVc.seasons_appeared || [], vcData.seasons_appeared || []),
          thepitch_profile_url: vcData.thepitch_profile_url || existingVc.thepitch_profile_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingVc.id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      console.log(`✅ [vcs:${sessionId}] VC updated successfully: ${updatedVc.name}`)
      
      return NextResponse.json({
        success: true,
        data: updatedVc,
        action: 'updated'
      })
    } else {
      // Create new VC
      console.log(`🆕 [vcs:${sessionId}] Creating new VC: ${vcData.name}`)
      
      const { data: newVc, error: insertError } = await supabase
        .from('vcs')
        .insert({
          name: vcData.name.trim(),
          firm_name: vcData.firm_name?.trim() || null,
          role_title: vcData.role_title?.trim() || null,
          bio: vcData.bio?.trim() || null,
          profile_image_url: vcData.profile_image_url || null,
          linkedin_url: vcData.linkedin_url || null,
          twitter_url: vcData.twitter_url || null,
          website_url: vcData.website_url || null,
          podcast_url: vcData.podcast_url || null,
          seasons_appeared: vcData.seasons_appeared || [],
          total_episodes_count: vcData.total_episodes_count || 0,
          thepitch_profile_url: vcData.thepitch_profile_url || null
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      console.log(`✅ [vcs:${sessionId}] VC created successfully: ${newVc.name}`)
      
      return NextResponse.json({
        success: true,
        data: newVc,
        action: 'created'
      })
    }

  } catch (error: any) {
    console.error(`❌ [vcs:${sessionId}] Error creating/updating VC:`, error)
    Sentry.captureException(error, {
      tags: { route: 'api/vcs', method: 'POST', session_id: sessionId }
    })
    return NextResponse.json(
      { error: 'Failed to create/update VC: ' + error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const sessionId = globalThis.crypto.randomUUID()
  console.log(`🔄 [vcs:${sessionId}] Updating VC`)

  try {
    const { id, ...updateData } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'VC ID is required for updates' },
        { status: 400 }
      )
    }

    const { data: updatedVc, error } = await supabase
      .from('vcs')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    console.log(`✅ [vcs:${sessionId}] VC updated: ${updatedVc.name}`)

    return NextResponse.json({
      success: true,
      data: updatedVc
    })

  } catch (error: any) {
    console.error(`❌ [vcs:${sessionId}] Error updating VC:`, error)
    Sentry.captureException(error, {
      tags: { route: 'api/vcs', method: 'PUT', session_id: sessionId }
    })
    return NextResponse.json(
      { error: 'Failed to update VC: ' + error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const sessionId = globalThis.crypto.randomUUID()
  console.log(`🗑️ [vcs:${sessionId}] Deleting VC`)

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'VC ID is required for deletion' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('vcs')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    console.log(`✅ [vcs:${sessionId}] VC deleted: ${id}`)

    return NextResponse.json({
      success: true,
      message: 'VC deleted successfully'
    })

  } catch (error: any) {
    console.error(`❌ [vcs:${sessionId}] Error deleting VC:`, error)
    Sentry.captureException(error, {
      tags: { route: 'api/vcs', method: 'DELETE', session_id: sessionId }
    })
    return NextResponse.json(
      { error: 'Failed to delete VC: ' + error.message },
      { status: 500 }
    )
  }
}

// Helper function to merge season arrays without duplicates
function mergeArrays(existing: string[], incoming: string[]): string[] {
  const merged = [...existing]
  incoming.forEach(item => {
    if (!merged.includes(item)) {
      merged.push(item)
    }
  })
  return merged.sort((a, b) => parseInt(a) - parseInt(b))
} 