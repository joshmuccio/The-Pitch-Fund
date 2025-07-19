import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import * as Sentry from '@sentry/nextjs'

// Configure this route to run on Node.js runtime for database operations
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Helper function to get Supabase client
function getSupabaseClient() {
  const cookieStore = cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export async function GET(request: NextRequest) {
  const sessionId = globalThis.crypto.randomUUID()
  console.log(`📋 [company-vcs:${sessionId}] Fetching company-VC relationships`)

  try {
    const supabase = getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    const vcId = searchParams.get('vc_id')
    
    console.log(`🔍 [company-vcs:${sessionId}] Query parameters:`, { companyId, vcId, url: request.url })

    let query = supabase
      .from('company_vcs')
      .select(`
        *,
        companies:company_id(id, name, slug),
        vcs:vc_id(
          id, 
          name, 
          firm_name, 
          role_title, 
          profile_image_url, 
          linkedin_url, 
          twitter_url, 
          website_url, 
          podcast_url, 
          thepitch_profile_url
        )
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (companyId) {
      query = query.eq('company_id', companyId)
    }
    
    if (vcId) {
      query = query.eq('vc_id', vcId)
    }

    console.log(`🔍 [company-vcs:${sessionId}] Executing query...`)
    const { data: relationships, error } = await query

    console.log(`🔍 [company-vcs:${sessionId}] Query result:`, { 
      hasError: !!error, 
      error: error?.message, 
      dataLength: relationships?.length || 0,
      rawData: relationships 
    })

    if (error) {
      throw error
    }

    console.log(`✅ [company-vcs:${sessionId}] Fetched ${relationships?.length || 0} relationships`)
    console.log(`🔍 [company-vcs:${sessionId}] Raw relationship sample:`, relationships?.[0])

    // Transform the data to match frontend interface expectations
    const transformedData = relationships?.map(relationship => {
      const { vcs, companies, ...rest } = relationship
      return {
        ...rest,
        vc: vcs, // Map 'vcs' to 'vc' for frontend compatibility
        company: companies, // Also provide 'company' for consistency
      }
    }) || []

    console.log(`🔍 [company-vcs:${sessionId}] Sample transformed relationship:`, transformedData[0])
    console.log(`🔍 [company-vcs:${sessionId}] Transformation results:`, {
      originalCount: relationships?.length || 0,
      transformedCount: transformedData.length,
      hasValidVcs: transformedData.filter(r => r.vc).length,
      hasValidCompanies: transformedData.filter(r => r.company).length
    })

    return NextResponse.json({
      success: true,
      data: transformedData
    })

  } catch (error: any) {
    console.error(`❌ [company-vcs:${sessionId}] Error fetching relationships:`, error)
    Sentry.captureException(error, {
      tags: { route: 'api/company-vcs', method: 'GET', session_id: sessionId }
    })
    return NextResponse.json(
      { error: 'Failed to fetch company-VC relationships: ' + error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const sessionId = globalThis.crypto.randomUUID()
  console.log(`➕ [company-vcs:${sessionId}] Creating company-VC relationships`)

  try {
    const supabase = getSupabaseClient()
    const { company_id, vc_ids, episode_season, episode_number, episode_url } = await request.json()

    // Validate required fields
    if (!company_id || !vc_ids || !Array.isArray(vc_ids) || vc_ids.length === 0) {
      return NextResponse.json(
        { error: 'Company ID and VC IDs array are required' },
        { status: 400 }
      )
    }

    // First, delete existing relationships for this company to avoid conflicts
    const { error: deleteError } = await supabase
      .from('company_vcs')
      .delete()
      .eq('company_id', company_id)

    if (deleteError) {
      console.log(`⚠️ [company-vcs:${sessionId}] Warning deleting existing relationships:`, deleteError.message)
    }

    // Create new relationships
    const relationshipsToInsert = vc_ids.map(vc_id => ({
      company_id,
      vc_id,
      episode_season: episode_season || null,
      episode_number: episode_number || null,
      episode_url: episode_url || null
    }))

    const { data: relationships, error: insertError } = await supabase
      .from('company_vcs')
      .insert(relationshipsToInsert)
      .select(`
        *,
        vcs:vc_id(id, name, firm_name, role_title, profile_image_url)
      `)

    if (insertError) {
      throw insertError
    }

    console.log(`✅ [company-vcs:${sessionId}] Created ${relationships?.length || 0} relationships`)

    return NextResponse.json({
      success: true,
      data: relationships,
      count: relationships?.length || 0
    })

  } catch (error: any) {
    console.error(`❌ [company-vcs:${sessionId}] Error creating relationships:`, error)
    Sentry.captureException(error, {
      tags: { route: 'api/company-vcs', method: 'POST', session_id: sessionId }
    })
    return NextResponse.json(
      { error: 'Failed to create company-VC relationships: ' + error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const sessionId = globalThis.crypto.randomUUID()
  console.log(`🔄 [company-vcs:${sessionId}] Updating company-VC relationship`)

  try {
    const supabase = getSupabaseClient()
    const { id, ...updateData } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Relationship ID is required for updates' },
        { status: 400 }
      )
    }

    const { data: updatedRelationship, error } = await supabase
      .from('company_vcs')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        companies:company_id(id, name, slug),
        vcs:vc_id(id, name, firm_name, role_title, profile_image_url)
      `)
      .single()

    if (error) {
      throw error
    }

    console.log(`✅ [company-vcs:${sessionId}] Relationship updated: ${id}`)

    return NextResponse.json({
      success: true,
      data: updatedRelationship
    })

  } catch (error: any) {
    console.error(`❌ [company-vcs:${sessionId}] Error updating relationship:`, error)
    Sentry.captureException(error, {
      tags: { route: 'api/company-vcs', method: 'PUT', session_id: sessionId }
    })
    return NextResponse.json(
      { error: 'Failed to update company-VC relationship: ' + error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const sessionId = globalThis.crypto.randomUUID()
  console.log(`🗑️ [company-vcs:${sessionId}] Deleting company-VC relationship`)

  try {
    const supabase = getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const company_id = searchParams.get('company_id')

    if (!id && !company_id) {
      return NextResponse.json(
        { error: 'Relationship ID or Company ID is required for deletion' },
        { status: 400 }
      )
    }

    let query = supabase.from('company_vcs').delete()

    if (id) {
      query = query.eq('id', id)
    } else if (company_id) {
      query = query.eq('company_id', company_id)
    }

    const { error } = await query

    if (error) {
      throw error
    }

    console.log(`✅ [company-vcs:${sessionId}] Relationship(s) deleted`)

    return NextResponse.json({
      success: true,
      message: 'Company-VC relationship(s) deleted successfully'
    })

  } catch (error: any) {
    console.error(`❌ [company-vcs:${sessionId}] Error deleting relationship:`, error)
    Sentry.captureException(error, {
      tags: { route: 'api/company-vcs', method: 'DELETE', session_id: sessionId }
    })
    return NextResponse.json(
      { error: 'Failed to delete company-VC relationship: ' + error.message },
      { status: 500 }
    )
  }
} 