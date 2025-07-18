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
    // Get the most recent companies (last 5)
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        slug,
        tagline,
        description_raw,
        website_url,
        company_linkedin_url,
        logo_url,
        svg_logo_url,
        investment_date,
        investment_amount,
        instrument,
        stage_at_investment,
        round_size_usd,
        conversion_cap_usd,
        discount_percent,
        post_money_valuation,
        has_pro_rata_rights,
        country_of_incorp,
        incorporation_type,
        reason_for_investing,
        co_investors,
        industry_tags,
        business_model_tags,
        keywords,
        pitch_episode_url,
        episode_publish_date,
        episode_title,
        episode_season,
        episode_show_notes,
        pitch_transcript,
        youtube_url,
        apple_podcasts_url,
        spotify_url,
        legal_name,
        hq_address_line_1,
        hq_city,
        hq_state,
        hq_zip_code,
        hq_country,
        status,
        notes,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    if (companiesError) {
      throw companiesError
    }

    // Get founders for these companies
    const companyIds = companies?.map(c => c.id) || []
    const { data: founders, error: foundersError } = await supabase
      .from('founders')
      .select(`
        id,
        email,
        first_name,
        last_name,
        title,
        linkedin_url,
        role,
        sex,
        bio,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (foundersError) {
      console.error('Error fetching founders:', foundersError)
    }

    // Get company-founder relationships
    const { data: companyFounders, error: relationshipsError } = await supabase
      .from('company_founders')
      .select(`
        company_id,
        founder_id,
        role,
        is_active
      `)
      .in('company_id', companyIds)

    if (relationshipsError) {
      console.error('Error fetching relationships:', relationshipsError)
    }

    // Get VC relationships
    const { data: vcRelationships, error: vcError } = await supabase
      .from('company_vcs')
      .select(`
        id,
        company_id,
        vc_id,
        episode_season,
        episode_number,
        episode_url,
        is_invested,
        investment_amount_usd,
        investment_date,
        created_at,
        vcs:vc_id(name, firm_name)
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