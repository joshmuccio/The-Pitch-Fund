'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { track } from '@vercel/analytics'
import * as Sentry from '@sentry/nextjs'
import { type CompanyFormValues } from '../../../schemas/companySchema'
import VcRelationships from '@/components/VcRelationships'
import EditInvestmentWizard from './components/EditInvestmentWizard'
import { type SelectedVc } from '../../new/steps/MarketingInfoStep'
import { type VcInvestment } from '../../new/steps/InvestmentTrackingStep'
import { normalizeKeywords } from '@/lib/form-validation'

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
          founder_name: data.founder_name || '',
          stage_at_investment: data.stage_at_investment || 'pre_seed',
          founder_email: founder?.email || '',
          
          // Basic info
          tagline: data.tagline || 'Company tagline not specified',
          description_raw: data.description_raw || 'Company description not specified',
          website_url: data.website_url || 'https://example.com',
          company_linkedin_url: data.company_linkedin_url || 'https://linkedin.com/company/example',
          logo_url: data.logo_url || 'https://via.placeholder.com/150',
          
          // Portfolio analytics fields  
          fund: data.fund || 'fund_i',

          // Investment details
          investment_date: data.investment_date || '',
          investment_amount: data.investment_amount || 0,
          instrument: data.instrument || 'safe_post',
          conversion_cap_usd: data.conversion_cap_usd || 0,
          discount_percent: data.discount_percent !== null && data.discount_percent !== undefined ? data.discount_percent : 0,
          post_money_valuation: data.post_money_valuation || undefined,

          // Investment fields
          round_size_usd: data.round_size_usd || 0,
          has_pro_rata_rights: data.has_pro_rata_rights || false,
          reason_for_investing: data.reason_for_investing || 'Investment reason not specified',
          country_of_incorp: data.country_of_incorp || 'US',
          incorporation_type: data.incorporation_type || 'c_corp',

          // Other fields
          industry_tags: Array.isArray(data.industry_tags) 
            ? data.industry_tags.join(', ') 
            : data.industry_tags || 'Technology',
          business_model_tags: Array.isArray(data.business_model_tags) 
            ? data.business_model_tags.join(', ') 
            : data.business_model_tags || 'SaaS',
          keywords: Array.isArray(data.keywords) 
            ? data.keywords.join(', ') 
            : data.keywords || 'startup, technology, innovation',
          pitch_transcript: data.pitch_transcript || 'Transcript not available',
          
          status: data.status || 'active',
          co_investors: Array.isArray(data.co_investors) 
            ? data.co_investors.join(', ') 
            : data.co_investors || '',
          pitch_episode_url: data.pitch_episode_url || 'https://thepitch.show/episode/placeholder',
          episode_publish_date: data.episode_publish_date || '2025-01-01',
          
          // Episode extraction fields
          episode_title: data.episode_title || 'Episode Title Placeholder',
          episode_season: data.episode_season || 1,
          episode_show_notes: data.episode_show_notes || 'Episode show notes placeholder',
          
          // Episode podcast platform URLs
          youtube_url: data.youtube_url || 'https://youtube.com/placeholder',
          apple_podcasts_url: data.apple_podcasts_url || 'https://podcasts.apple.com/placeholder',
          spotify_url: data.spotify_url || 'https://open.spotify.com/placeholder',
          
          notes: data.notes || '',

          // Founder fields
          founder_first_name: founder?.first_name || '',
          founder_last_name: founder?.last_name || '',
          founder_title: founder?.title || '',
          founder_linkedin_url: founder?.linkedin_url || '',
          founder_role: founder?.role || 'founder',
          founder_sex: founder?.sex || '',
          founder_bio: founder?.bio || '',

          // Company HQ location fields
          legal_name: data.legal_name || '',
          hq_address_line_1: data.hq_address_line_1 || '',
          hq_address_line_2: data.hq_address_line_2 || '',
          hq_city: data.hq_city || '',
          hq_state: data.hq_state || '',
          hq_zip_code: data.hq_zip_code || '',
          hq_country: data.hq_country || '',
          hq_latitude: data.hq_latitude ? Number(data.hq_latitude) : undefined,
          hq_longitude: data.hq_longitude ? Number(data.hq_longitude) : undefined,
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

  const handleSave = async (data: CompanyFormValues, selectedVcs: SelectedVc[], investmentData: VcInvestment[]) => {
    setSaving(true)
    
    try {
      // 🔍 DEBUG: Log all form data to see what we're working with
      console.log('🚀 [EDIT-INVESTMENT] Form submission started')
      console.log('📋 [EDIT-INVESTMENT] Full form data:', JSON.stringify(data, null, 2))
      console.log('👥 [EDIT-INVESTMENT] Founder data check:', {
        founder_email: data.founder_email,
        founder_first_name: data.founder_first_name,
        founder_last_name: data.founder_last_name,
        founders_array: (data as any).founders,
        has_founders_array: !!(data as any).founders,
        founders_array_length: (data as any).founders?.length || 0
      })
      
      track('admin_investment_update_start', { 
        company_name: data.name,
        company_id: companyId,
        location: 'edit_investment_page' 
      })

      // Prepare company data for update
      const companyData = {
        name: data.name,
        slug: data.slug,
        founder_name: data.founder_name || null,
        tagline: data.tagline || null,
        description_raw: data.description_raw || null,
        website_url: data.website_url || null,
        company_linkedin_url: data.company_linkedin_url || null,
        logo_url: data.logo_url || null,
        stage_at_investment: data.stage_at_investment,
        fund: data.fund,
        investment_date: data.investment_date || null,
        investment_amount: data.investment_amount || null,
        instrument: data.instrument,
        conversion_cap_usd: data.conversion_cap_usd || null,
        discount_percent: data.discount_percent || null,
        post_money_valuation: data.post_money_valuation || null,
        industry_tags: data.industry_tags?.split(',').map(tag => tag.trim()).filter(Boolean) || [],
        business_model_tags: data.business_model_tags?.split(',').map(tag => tag.trim()).filter(Boolean) || [],
        keywords: normalizeKeywords(data.keywords?.split(',').map(keyword => keyword.trim()).filter(Boolean) || []),
        pitch_transcript: data.pitch_transcript || null,
        status: data.status,
        co_investors: data.co_investors?.split(',').map(investor => investor.trim()).filter(Boolean) || [],
        pitch_episode_url: data.pitch_episode_url || null,
        episode_publish_date: data.episode_publish_date || null,
        episode_title: data.episode_title || null,
        episode_season: data.episode_season || null,
        episode_show_notes: data.episode_show_notes || null,
        youtube_url: data.youtube_url || null,
        apple_podcasts_url: data.apple_podcasts_url || null,
        spotify_url: data.spotify_url || null,
        notes: data.notes || null,
        round_size_usd: data.round_size_usd || null,
        has_pro_rata_rights: data.has_pro_rata_rights || false,
        reason_for_investing: data.reason_for_investing || null,
        country_of_incorp: data.country_of_incorp || null,
        incorporation_type: data.incorporation_type || null,
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
      console.log('🏢 [EDIT-INVESTMENT] Updating company with data:', companyData)
      const { error: companyError } = await supabase
        .from('companies')
        .update(companyData)
        .eq('id', companyId)

      if (companyError) throw companyError
      console.log('✅ [EDIT-INVESTMENT] Company updated successfully')

      // 🔍 DEBUG: Check what founder data we have
      console.log('👥 [EDIT-INVESTMENT] Starting founder processing...')
      console.log('👥 [EDIT-INVESTMENT] founder_email:', data.founder_email)
      console.log('👥 [EDIT-INVESTMENT] Is placeholder email?:', data.founder_email === 'founder@example.com')
      console.log('👥 [EDIT-INVESTMENT] founders array:', (data as any).founders)

      // Handle founder updates if provided (skip placeholder emails)
      if (data.founder_email && data.founder_email !== 'founder@example.com') {
        console.log('🎯 [EDIT-INVESTMENT] Processing single founder via founder_email field')
        // Check if founder exists
        console.log('🔍 [EDIT-INVESTMENT] Checking if founder exists with email:', data.founder_email)
        let { data: existingFounder } = await supabase
          .from('founders')
          .select('id')
          .eq('email', data.founder_email)
          .single()

        console.log('👤 [EDIT-INVESTMENT] Existing founder found:', existingFounder)
        let founderId: string

        if (existingFounder) {
          // Update existing founder
          console.log('🔄 [EDIT-INVESTMENT] Updating existing founder with data:', {
            first_name: data.founder_first_name || null,
            last_name: data.founder_last_name || null,
            title: data.founder_title || null,
            linkedin_url: data.founder_linkedin_url || null,
            role: data.founder_role,
            sex: data.founder_sex || null,
            bio: data.founder_bio || null
          })
          
          const { data: updatedFounder, error: founderUpdateError } = await supabase
            .from('founders')
            .update({
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

          if (founderUpdateError) {
            console.error('❌ [EDIT-INVESTMENT] Error updating founder:', founderUpdateError)
            throw founderUpdateError
          }
          console.log('✅ [EDIT-INVESTMENT] Founder updated successfully:', updatedFounder)
          founderId = updatedFounder.id
        } else {
          // Create new founder
          console.log('➕ [EDIT-INVESTMENT] Creating new founder with data:', {
            email: data.founder_email,
            first_name: data.founder_first_name || null,
            last_name: data.founder_last_name || null,
            title: data.founder_title || null,
            linkedin_url: data.founder_linkedin_url || null,
            role: data.founder_role,
            sex: data.founder_sex || null,
            bio: data.founder_bio || null
          })
          
          const { data: newFounder, error: founderError } = await supabase
            .from('founders')
            .insert({
              email: data.founder_email,
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

          if (founderError) {
            console.error('❌ [EDIT-INVESTMENT] Error creating founder:', founderError)
            throw founderError
          }
          console.log('✅ [EDIT-INVESTMENT] New founder created successfully:', newFounder)
          founderId = newFounder.id
        }

        // Check if company-founder relationship exists
        console.log('🔗 [EDIT-INVESTMENT] Checking company-founder relationship for company:', companyId, 'founder:', founderId)
        const { data: existingLink } = await supabase
          .from('company_founders')
          .select('*')
          .eq('company_id', companyId)
          .eq('founder_id', founderId)
          .single()

        console.log('🔗 [EDIT-INVESTMENT] Existing company-founder link:', existingLink)

        if (!existingLink) {
          // Create new link if it doesn't exist
          console.log('➕ [EDIT-INVESTMENT] Creating new company-founder relationship with data:', {
            company_id: companyId,
            founder_id: founderId,
            role: data.founder_role,
            is_active: true
          })
          
          const { error: linkError } = await supabase
            .from('company_founders')
            .insert({
              company_id: companyId,
              founder_id: founderId,
              role: data.founder_role,
              is_active: true
            })

          if (linkError) {
            console.error('❌ [EDIT-INVESTMENT] Error creating company-founder link:', linkError)
            throw linkError
          }
          console.log('✅ [EDIT-INVESTMENT] Company-founder relationship created successfully')
        } else {
          // Update existing link
          console.log('🔄 [EDIT-INVESTMENT] Updating existing company-founder relationship with role:', data.founder_role)
          const { error: linkUpdateError } = await supabase
            .from('company_founders')
            .update({
              role: data.founder_role,
              is_active: true
            })
            .eq('company_id', companyId)
            .eq('founder_id', founderId)

          if (linkUpdateError) {
            console.error('❌ [EDIT-INVESTMENT] Error updating company-founder link:', linkUpdateError)
            throw linkUpdateError
          }
          console.log('✅ [EDIT-INVESTMENT] Company-founder relationship updated successfully')
        }
        console.log('🎉 [EDIT-INVESTMENT] Single founder processing completed successfully')
      } else {
        console.log('⚠️ [EDIT-INVESTMENT] No valid founder_email found or it was a placeholder. Skipping single founder processing.')
        
        // 🔍 TODO: Add support for founders array processing here if needed
        if ((data as any).founders && Array.isArray((data as any).founders)) {
          console.log('📋 [EDIT-INVESTMENT] Found founders array with', (data as any).founders.length, 'founders')
          console.log('📋 [EDIT-INVESTMENT] Founders array:', (data as any).founders)
          console.log('⚠️ [EDIT-INVESTMENT] Multiple founders support not yet implemented in edit form')
        }
      }

      track('admin_investment_update_success', { 
        company_name: data.name,
        company_id: companyId,
        location: 'edit_investment_page' 
      })

      console.log('🎉 [EDIT-INVESTMENT] Investment update completed successfully!')
      console.log('🏠 [EDIT-INVESTMENT] Redirecting to admin dashboard...')

      // Redirect to admin dashboard after successful save
      router.push('/admin')

    } catch (error) {
      console.error('❌ [EDIT-INVESTMENT] Fatal error during investment update:', error)
      console.error('❌ [EDIT-INVESTMENT] Error details:', {
        name: (error as any)?.name,
        message: (error as any)?.message,
        code: (error as any)?.code,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        stack: (error as any)?.stack
      })
      
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

        {/* Edit Wizard Container */}
        <div className="bg-graphite-gray rounded-lg p-6 max-w-6xl mx-auto mb-8">
          <EditInvestmentWizard
            initialData={company}
            onSave={handleSave}
            onCancel={handleCancel}
            saving={saving}
          />
        </div>

        {/* VC Relationships Management */}
        <div className="bg-graphite-gray rounded-lg p-6 max-w-6xl mx-auto">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-platinum-mist mb-2">
              VC Relationships
            </h2>
            <p className="text-gray-400 text-sm">
              Manage VCs and investors associated with this investment
            </p>
          </div>
          
          <VcRelationships 
            companyId={companyId}
            mode="full"
            showEpisodeContext={true}
            showManageButton={true}
          />
        </div>
      </div>
    </div>
  )
} 