import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  
  const supabase = createServerClient(
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

  try {
    // Get the most recent companies (last 5) - fetch ALL columns
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (companiesError) {
      throw companiesError
    }

    // Get founders for these companies - fetch ALL columns
    const companyIds = companies?.map(c => c.id) || []
    const { data: founders, error: foundersError } = await supabase
      .from('founders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (foundersError) {
      console.error('Error fetching founders:', foundersError)
    }

    // Get company-founder relationships - fetch ALL columns
    const { data: companyFounders, error: relationshipsError } = await supabase
      .from('company_founders')
      .select('*')
      .in('company_id', companyIds)

    if (relationshipsError) {
      console.error('Error fetching relationships:', relationshipsError)
    }

    // Get VC relationships - fetch ALL columns plus VC details
    const { data: vcRelationships, error: vcError } = await supabase
      .from('company_vcs')
      .select(`
        *,
        vcs:vc_id(*)
      `)
      .in('company_id', companyIds)

    if (vcError) {
      console.error('Error fetching VC relationships:', vcError)
    }

    return NextResponse.json({
      success: true,
      data: {
        companies: companies || [],
        founders: founders || [],
        companyFounders: companyFounders || [],
        vcRelationships: vcRelationships || [],
        summary: {
          totalCompanies: companies?.length || 0,
          totalFounders: founders?.length || 0,
          totalRelationships: companyFounders?.length || 0,
          totalVcRelationships: vcRelationships?.length || 0
        }
      }
    })

  } catch (error: any) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch debug data: ' + error.message },
      { status: 500 }
    )
  }
} 