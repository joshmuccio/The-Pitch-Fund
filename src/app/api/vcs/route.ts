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
  console.log(`📋 [vcs:${sessionId}] Fetching VCs list`)

  try {
    const supabase = getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const firm = searchParams.get('firm')
    const role = searchParams.get('role')
    const season = searchParams.get('season')

    let query = supabase
      .from('vcs')
      .select('*')
      .order('name', { ascending: true })

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,firm.ilike.%${search}%,role.ilike.%${search}%`)
    }
    if (firm) {
      query = query.ilike('firm', `%${firm}%`)
    }
    if (role) {
      query = query.ilike('role', `%${role}%`)
    }
    // Season filtering removed

    const { data: vcs, error } = await query

    if (error) {
      console.log(`❌ [vcs:${sessionId}] Error fetching VCs:`, error.message)
      throw error
    }

    console.log(`✅ [vcs:${sessionId}] Successfully fetched ${vcs?.length || 0} VCs`)

    return NextResponse.json({ vcs })
  } catch (error: any) {
    console.log(`💥 [vcs:${sessionId}] Unexpected error:`, error.message)

    Sentry.captureException(error, {
      tags: {
        component: 'vcs-api',
        action: 'fetch',
        sessionId
      },
      contexts: {
        request: {
          url: request.url,
          method: 'GET'
        }
      }
    })

    return NextResponse.json(
      { error: 'Failed to fetch VCs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const sessionId = globalThis.crypto.randomUUID()
  console.log(`➕ [vcs:${sessionId}] Creating new VC`)

  try {
    const supabase = getSupabaseClient()
    const vcData = await request.json()

    // Check for existing VC with same name and firm to handle duplicates
    if (vcData.name && vcData.firm_name) {
      const { data: existingVc } = await supabase
        .from('vcs')
        .select('*')
        .eq('name', vcData.name)
        .eq('firm_name', vcData.firm_name)
        .single()

      if (existingVc) {
        // Update existing VC
        const { data: updatedVc, error: updateError } = await supabase
          .from('vcs')
          .update({
            ...vcData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingVc.id)
          .select()
          .single()

        if (updateError) throw updateError

        console.log(`🔄 [vcs:${sessionId}] Updated existing VC: ${vcData.name}`)
        return NextResponse.json({ vc: updatedVc })
      }
    }

    // Create new VC
    const { data: newVc, error } = await supabase
      .from('vcs')
      .insert([vcData])
      .select()
      .single()

    if (error) {
      console.log(`❌ [vcs:${sessionId}] Error creating VC:`, error.message)
      throw error
    }

    console.log(`✅ [vcs:${sessionId}] Successfully created VC: ${newVc.name}`)

    return NextResponse.json({ vc: newVc })
  } catch (error: any) {
    console.log(`💥 [vcs:${sessionId}] Unexpected error:`, error.message)

    Sentry.captureException(error, {
      tags: {
        component: 'vcs-api',
        action: 'create',
        sessionId
      },
      contexts: {
        request: {
          url: request.url,
          method: 'POST'
        }
      }
    })

    return NextResponse.json(
      { error: 'Failed to create VC' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const sessionId = globalThis.crypto.randomUUID()
  console.log(`🔄 [vcs:${sessionId}] Updating VC`)

  try {
    const supabase = getSupabaseClient()
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
      console.log(`❌ [vcs:${sessionId}] Error updating VC:`, error.message)
      throw error
    }

    console.log(`✅ [vcs:${sessionId}] Successfully updated VC: ${updatedVc.name}`)

    return NextResponse.json({ vc: updatedVc })
  } catch (error: any) {
    console.log(`💥 [vcs:${sessionId}] Unexpected error:`, error.message)

    Sentry.captureException(error, {
      tags: {
        component: 'vcs-api',
        action: 'update',
        sessionId
      },
      contexts: {
        request: {
          url: request.url,
          method: 'PUT'
        }
      }
    })

    return NextResponse.json(
      { error: 'Failed to update VC' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const sessionId = globalThis.crypto.randomUUID()
  console.log(`🗑️ [vcs:${sessionId}] Deleting VC`)

  try {
    const supabase = getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'VC ID is required for deletion' },
        { status: 400 }
      )
    }

    // First check if VC has any company relationships
    const { data: relationships, error: relationshipError } = await supabase
      .from('company_vcs')
      .select('id')
      .eq('vc_id', id)

    if (relationshipError) {
      console.log(`⚠️ [vcs:${sessionId}] Warning checking relationships:`, relationshipError.message)
    }

    if (relationships && relationships.length > 0) {
      console.log(`⚠️ [vcs:${sessionId}] VC has ${relationships.length} company relationships`)
      return NextResponse.json(
        { 
          error: 'Cannot delete VC with existing company relationships',
          relationshipCount: relationships.length
        },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('vcs')
      .delete()
      .eq('id', id)

    if (error) {
      console.log(`❌ [vcs:${sessionId}] Error deleting VC:`, error.message)
      throw error
    }

    console.log(`✅ [vcs:${sessionId}] Successfully deleted VC`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.log(`💥 [vcs:${sessionId}] Unexpected error:`, error.message)

    Sentry.captureException(error, {
      tags: {
        component: 'vcs-api',
        action: 'delete',
        sessionId
      },
      contexts: {
        request: {
          url: request.url,
          method: 'DELETE'
        }
      }
    })

    return NextResponse.json(
      { error: 'Failed to delete VC' },
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