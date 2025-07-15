'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { track } from '@vercel/analytics'
import * as Sentry from '@sentry/nextjs'
import UnifiedInvestmentForm from '../../../components/UnifiedInvestmentForm'
import { type CompanyFormValues } from '../../../schemas/companySchema'

export default function EditInvestmentPage() {
  const router = useRouter()
  const params = useParams()
  const [company, setCompany] = useState<CompanyFormValues | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const companyId = params?.id as string

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (!companyId) return

    const fetchCompany = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('companies')
          .select(`
            *,
            company_founders (
              role,
              is_active,
              founders (
                id,
                email,
                name,
                first_name,
                last_name,
                title,
                linkedin_url,
                role,
                sex,
                bio
              )
            )
          `)
          .eq('id', companyId)
          .single()

        if (error) throw error

        // Transform the data to match CompanyFormValues structure
        const founder = data.company_founders?.[0]?.founders
        
        const transformedData: CompanyFormValues = {
          // Required fields
          name: data.name || '',
          slug: data.slug || '',
          stage_at_investment: data.stage_at_investment || 'pre_seed',
          founder_email: founder?.email || '',
          
          // Basic info
          tagline: data.tagline || '',
          description_raw: data.description_raw || '',
          website_url: data.website_url || '',
          company_linkedin_url: data.company_linkedin_url || '',
          logo_url: data.logo_url || '',
          
          // Portfolio analytics fields  
          country: data.country || '',
          pitch_season: data.pitch_season || undefined,
          fund: data.fund || 'fund_i',

          // Investment details
          investment_date: data.investment_date || '',
          investment_amount: data.investment_amount || undefined,
          instrument: data.instrument || 'safe_post',
          conversion_cap_usd: data.conversion_cap_usd || undefined,
          discount_percent: data.discount_percent || undefined,
          post_money_valuation: data.post_money_valuation || undefined,

          // 🚀 NEW INVESTMENT FIELDS
          round_size_usd: data.round_size_usd || undefined,
          has_pro_rata_rights: data.has_pro_rata_rights || false,
          reason_for_investing: data.reason_for_investing || '',
          country_of_incorp: data.country_of_incorp || '',
          incorporation_type: data.incorporation_type || undefined,

          // Other fields
          industry_tags: Array.isArray(data.industry_tags) 
            ? data.industry_tags.join(', ') 
            : data.industry_tags || '',
          // 🚀 NEW AI-POWERED FIELDS
          business_model_tags: Array.isArray(data.business_model_tags) 
            ? data.business_model_tags.join(', ') 
            : data.business_model_tags || '',
          keywords: data.keywords || 'No keywords specified',
          pitch_transcript: data.pitch_transcript || '',
          
          status: data.status || 'active',
          co_investors: Array.isArray(data.co_investors) 
            ? data.co_investors.join(', ') 
            : data.co_investors || '',
          pitch_episode_url: data.pitch_episode_url || 'https://thepitch.show/episode/placeholder',
          episode_publish_date: data.episode_publish_date || '2025-01-01',
          notes: data.notes || '',

          // Founder fields
          founder_name: founder?.name || '',
          founder_first_name: founder?.first_name || '',
          founder_last_name: founder?.last_name || '',
          founder_title: founder?.title || '',
          founder_linkedin_url: founder?.linkedin_url || '',
          founder_role: founder?.role || 'founder',
          founder_sex: founder?.sex || '',
          founder_bio: founder?.bio || '',

          // 🆕 NEW COMPANY HQ LOCATION FIELDS
          legal_name: data.legal_name || '',
          hq_address_line_1: data.hq_address_line_1 || '',
          hq_address_line_2: data.hq_address_line_2 || '',
          hq_city: data.hq_city || '',
          hq_state: data.hq_state || '',
          hq_zip_code: data.hq_zip_code || '',
          hq_country: data.hq_country || '',
        }

        setCompany(transformedData)
      } catch (error) {
        console.error('Error fetching company:', error)
        setError('Failed to load investment data')
      } finally {
        setLoading(false)
      }
    }

    fetchCompany()
  }, [companyId, supabase])

  const handleSave = async (data: CompanyFormValues) => {
    setSaving(true)
    
    try {
      track('admin_investment_update_start', { 
        company_name: data.name,
        company_id: companyId,
        location: 'edit_investment_page' 
      })

      // Prepare company data for update
      const companyData = {
        name: data.name,
        slug: data.slug,
        tagline: data.tagline || null,
        description_raw: data.description_raw || null,
        website_url: data.website_url || null,
        company_linkedin_url: data.company_linkedin_url || null,
        logo_url: data.logo_url || null,
        country: data.country || null,
        stage_at_investment: data.stage_at_investment,
        pitch_season: data.pitch_season || null,
        fund: data.fund,
        investment_date: data.investment_date || null,
        investment_amount: data.investment_amount || null,
        instrument: data.instrument,
        conversion_cap_usd: data.conversion_cap_usd || null,
        discount_percent: data.discount_percent || null,
        post_money_valuation: data.post_money_valuation || null,
        industry_tags: data.industry_tags?.split(',').map(tag => tag.trim()).filter(Boolean) || [],
        // 🚀 NEW AI-POWERED FIELDS
        business_model_tags: data.business_model_tags?.split(',').map(tag => tag.trim()).filter(Boolean) || [],
        keywords: data.keywords || null,
        pitch_transcript: data.pitch_transcript || null,
        status: data.status,
        co_investors: data.co_investors?.split(',').map(investor => investor.trim()).filter(Boolean) || [],
        pitch_episode_url: data.pitch_episode_url || null,
        notes: data.notes || null,
        // 🚀 NEW INVESTMENT FIELDS
        round_size_usd: data.round_size_usd || null,
        has_pro_rata_rights: data.has_pro_rata_rights || false,
        reason_for_investing: data.reason_for_investing || null,
        country_of_incorp: data.country_of_incorp || null,
        incorporation_type: data.incorporation_type || null,
        // 🆕 NEW COMPANY HQ LOCATION FIELDS
        legal_name: data.legal_name || null,
        hq_address_line_1: data.hq_address_line_1 || null,
        hq_address_line_2: data.hq_address_line_2 || null,
        hq_city: data.hq_city || null,
        hq_state: data.hq_state || null,
        hq_zip_code: data.hq_zip_code || null,
        hq_country: data.hq_country || null,
        updated_at: new Date().toISOString(),
      }

      // Update company
      const { error: companyError } = await supabase
        .from('companies')
        .update(companyData)
        .eq('id', companyId)

      if (companyError) throw companyError

      // Handle founder updates if provided
      if (data.founder_email) {
        // Check if founder exists
        let { data: existingFounder } = await supabase
          .from('founders')
          .select('id')
          .eq('email', data.founder_email)
          .single()

        let founderId: string

        if (existingFounder) {
          // Update existing founder
          const { data: updatedFounder, error: founderUpdateError } = await supabase
            .from('founders')
            .update({
              name: data.founder_name || null,
              first_name: data.founder_first_name || null,
              last_name: data.founder_last_name || null,
              title: data.founder_title || null,
              linkedin_url: data.founder_linkedin_url || null,
              role: data.founder_role,
              sex: data.founder_sex || null,
              bio: data.founder_bio || null,
              updated_at: new Date().toISOString(),
            })
            .eq('email', data.founder_email)
            .select()
            .single()

          if (founderUpdateError) throw founderUpdateError
          founderId = updatedFounder.id
        } else {
          // Create new founder
          const { data: newFounder, error: founderError } = await supabase
            .from('founders')
            .insert({
              email: data.founder_email,
              name: data.founder_name || null,
              first_name: data.founder_first_name || null,
              last_name: data.founder_last_name || null,
              title: data.founder_title || null,
              linkedin_url: data.founder_linkedin_url || null,
              role: data.founder_role,
              sex: data.founder_sex || null,
              bio: data.founder_bio || null,
            })
            .select()
            .single()

          if (founderError) throw founderError
          founderId = newFounder.id
        }

        // Check if company-founder relationship exists
        const { data: existingLink } = await supabase
          .from('company_founders')
          .select('*')
          .eq('company_id', companyId)
          .eq('founder_id', founderId)
          .single()

        if (!existingLink) {
          // Create new link if it doesn't exist
          const { error: linkError } = await supabase
            .from('company_founders')
            .insert({
              company_id: companyId,
              founder_id: founderId,
              role: data.founder_role,
              is_active: true
            })

          if (linkError) throw linkError
        } else {
          // Update existing link
          const { error: linkUpdateError } = await supabase
            .from('company_founders')
            .update({
              role: data.founder_role,
              is_active: true
            })
            .eq('company_id', companyId)
            .eq('founder_id', founderId)

          if (linkUpdateError) throw linkUpdateError
        }
      }

      track('admin_investment_update_success', { 
        company_name: data.name,
        company_id: companyId,
        location: 'edit_investment_page' 
      })

      // Redirect to admin dashboard after successful save
      router.push('/admin')

    } catch (error) {
      console.error('Error updating investment:', error)
      
      Sentry.captureException(error, {
        tags: {
          component: 'EditInvestmentPage',
          operation: 'updateInvestment'
        },
        extra: {
          companyName: data.name,
          companyId: companyId
        }
      })

      track('admin_investment_update_error', { 
        company_name: data.name,
        company_id: companyId,
        error: error instanceof Error ? error.message : 'Unknown error',
        location: 'edit_investment_page' 
      })

      // For now, we'll still redirect but in a real app you'd show an error message
      alert('Failed to update investment. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-pitch-black text-platinum-mist flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cobalt-pulse mx-auto mb-4"></div>
          <p className="text-gray-400">Loading investment data...</p>
        </div>
      </div>
    )
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-pitch-black text-platinum-mist flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-600 rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Investment</h2>
          <p className="text-gray-400 mb-4">{error || 'Investment not found'}</p>
          <button
            onClick={() => router.push('/admin')}
            className="bg-cobalt-pulse hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-pitch-black text-platinum-mist">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Go back"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-platinum-mist">Edit Investment</h1>
              <p className="text-gray-400 mt-1">
                Update details for <span className="text-white font-medium">{company.name}</span>
              </p>
            </div>
          </div>
          
          {/* Breadcrumb */}
          <nav className="text-sm">
            <ol className="flex items-center space-x-2 text-gray-400">
              <li>
                <button
                  onClick={() => router.push('/admin')}
                  className="hover:text-white transition-colors"
                >
                  Admin Dashboard
                </button>
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-platinum-mist">Edit Investment</span>
              </li>
            </ol>
          </nav>
        </div>

        {/* Form Container */}
        <div className="bg-graphite-gray rounded-lg p-6 max-w-4xl mx-auto">
          <UnifiedInvestmentForm
            company={company}
            onSave={handleSave}
            onCancel={handleCancel}
            title={`✏️ Edit Investment: ${company.name}`}
            submitLabel={saving ? "Updating Investment..." : "Update Investment"}
          />
        </div>
      </div>
    </div>
  )
} 