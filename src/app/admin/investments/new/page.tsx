'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { track } from '@vercel/analytics'
import * as Sentry from '@sentry/nextjs'
import dynamic from 'next/dynamic'
import { type CompanyFormValues } from '../../schemas/companySchema'
import { type SelectedVc } from './steps/MarketingInfoStep'
import { type VcInvestment } from './steps/InvestmentTrackingStep'
import { normalizeKeywords, normalizeCoInvestors } from '@/lib/form-validation'

// Dynamically import the wizard with error boundary
const InvestmentWizard = dynamic(
  () => import('./components/InvestmentWizard'),
  { 
    ssr: false,
    loading: () => <div className="text-white">Loading wizard...</div>
  }
)

export default function NewInvestmentPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savingProgress, setSavingProgress] = useState<string>('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSave = async (data: CompanyFormValues, selectedVcs: SelectedVc[] = [], investmentData: VcInvestment[] = []) => {
    setSaving(true)
    setError(null)
    setSavingProgress('Validating data...')
    
    try {
      // 🔍 DEBUG: Log all form data to see what we're working with
      console.log('🚀 [NEW-INVESTMENT] Form submission started')
      console.log('📋 [NEW-INVESTMENT] Full form data:', JSON.stringify(data, null, 2))
      console.log('🔍 [NEW-INVESTMENT] Received data type:', typeof data)
      console.log('🔍 [NEW-INVESTMENT] Data keys:', Object.keys(data))
      console.log('🔍 [NEW-INVESTMENT] Selected VCs:', selectedVcs)
      console.log('🔍 [NEW-INVESTMENT] Investment data:', investmentData)
      console.log('👥 [NEW-INVESTMENT] Founder data check:', {
        founders_array: (data as any).founders,
        has_founders_array: !!(data as any).founders,
        founders_array_length: (data as any).founders?.length || 0,
      })
      
      track('admin_investment_create_start', { 
        company_name: data.name,
        location: 'new_investment_wizard' 
      })

      // 🔍 DEBUG: Check latitude and longitude values
      console.log('🌍 [NEW-INVESTMENT] Latitude/Longitude debug:', {
        hq_latitude_raw: data.hq_latitude,
        hq_longitude_raw: data.hq_longitude,
        hq_latitude_type: typeof data.hq_latitude,
        hq_longitude_type: typeof data.hq_longitude,
        hq_latitude_converted: data.hq_latitude ? Number(data.hq_latitude) : null,
        hq_longitude_converted: data.hq_longitude ? Number(data.hq_longitude) : null
      })

      // Prepare company data for insertion
      const companyData = {
        name: data.name,
        slug: data.slug,
        founder_name: data.founder_name || null,
        tagline: data.tagline || null,
        description_raw: data.description_raw || null,
        website_url: data.website_url || null,
        company_linkedin_url: data.company_linkedin_url || null,
        logo_url: data.logo_url || null,
        svg_logo_url: data.svg_logo_url || null,
        stage_at_investment: data.stage_at_investment,
        fund: data.fund,
        investment_date: data.investment_date || null,
        investment_amount: data.investment_amount || null,
        instrument: data.instrument,
        // Handle instrument-specific fields to avoid constraint violation
        conversion_cap_usd: ['safe_post', 'safe_pre', 'convertible_note'].includes(data.instrument) ? (data.conversion_cap_usd || null) : null,
        discount_percent: ['safe_post', 'safe_pre', 'convertible_note'].includes(data.instrument) ? (data.discount_percent || null) : null,
        post_money_valuation: data.instrument === 'equity' ? (data.post_money_valuation || null) : null,
        industry_tags: data.industry_tags?.split(',').map((tag: string) => tag.trim()).filter(Boolean) || [],
        // 🚀 NEW AI-POWERED FIELDS
        business_model_tags: data.business_model_tags?.split(',').map((tag: string) => tag.trim()).filter(Boolean) || [],
        keywords: normalizeKeywords(data.keywords?.split(',').map((keyword: string) => keyword.trim()).filter(Boolean) || []),
        pitch_transcript: data.pitch_transcript || null,
        
        status: data.status,
        co_investors: normalizeCoInvestors(data.co_investors?.split(',').map((investor: string) => investor.trim()).filter(Boolean) || []),
        pitch_episode_url: data.pitch_episode_url || null,
        episode_publish_date: data.episode_publish_date || null,
        // 🚀 MISSING EPISODE FIELDS - CRITICAL FIX
        episode_title: data.episode_title || null,
        episode_season: data.episode_season || null,
        episode_number: data.episode_number || null,
        episode_show_notes: data.episode_show_notes || null,
        youtube_url: data.youtube_url || null,
        apple_podcasts_url: data.apple_podcasts_url || null,
        spotify_url: data.spotify_url || null,
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
        hq_latitude: data.hq_latitude ? Number(data.hq_latitude) : null,
        hq_longitude: data.hq_longitude ? Number(data.hq_longitude) : null,
      }

      // Insert company
      setSavingProgress('Creating company record...')
      console.log('🏢 [NEW-INVESTMENT] Creating company with data:', companyData)
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert(companyData)
        .select()
        .single()

      if (companyError) {
        console.error('❌ [NEW-INVESTMENT] Company creation error:', companyError)
        throw new Error(`Failed to create company: ${companyError.message}`)
      }
      console.log('✅ [NEW-INVESTMENT] Company created successfully:', company)

      // Insert founders if provided (supports multiple founders from the founders array)
      const founders = (data as any).founders
      if (founders && founders.length > 0) {
        setSavingProgress(`Processing founder information (${founders.length} founders)...`)
        console.log('👥 [NEW-INVESTMENT] Starting founder processing...')
        console.log('👥 [NEW-INVESTMENT] Processing founders array with length:', founders.length)
        
        for (let i = 0; i < founders.length; i++) {
          const founder = founders[i]
          console.log(`👤 [NEW-INVESTMENT] Processing founder ${i + 1}:`, founder)
          
          if (!founder.email) {
            console.log(`⚠️ [NEW-INVESTMENT] Skipping founder ${i + 1} - no email provided`)
            continue // Skip founders without email
          }
          
          // First check if founder exists
          console.log(`🔍 [NEW-INVESTMENT] Checking if founder ${i + 1} exists with email:`, founder.email)
          let { data: existingFounder } = await supabase
            .from('founders')
            .select('id')
            .eq('email', founder.email)
            .single()

          console.log(`👤 [NEW-INVESTMENT] Existing founder ${i + 1} found:`, existingFounder)
          let founderId: string

          if (existingFounder) {
            // Update existing founder
            console.log(`🔄 [NEW-INVESTMENT] Updating existing founder ${i + 1} with data:`, {
              first_name: founder.first_name || null,
              last_name: founder.last_name || null,
              title: founder.title || null,
              linkedin_url: founder.linkedin_url || null,
              role: founder.role || 'founder',
              sex: founder.sex || null,
              bio: founder.bio || null
            })
            
            const { data: updatedFounder, error: founderUpdateError } = await supabase
              .from('founders')
              .update({
                first_name: founder.first_name || null,
                last_name: founder.last_name || null,
                title: founder.title || null,
                linkedin_url: founder.linkedin_url || null,
                role: founder.role || 'founder',
                sex: founder.sex || null,
                bio: founder.bio || null,
                updated_at: new Date().toISOString(),
              })
              .eq('email', founder.email)
              .select()
              .single()

            if (founderUpdateError) {
              console.error(`❌ [NEW-INVESTMENT] Error updating founder ${i + 1}:`, founderUpdateError)
              throw founderUpdateError
            }
            console.log(`✅ [NEW-INVESTMENT] Founder ${i + 1} updated successfully:`, updatedFounder)
            founderId = updatedFounder.id
          } else {
            // Create new founder
            console.log(`➕ [NEW-INVESTMENT] Creating new founder ${i + 1} with data:`, {
              email: founder.email,
              first_name: founder.first_name || null,
              last_name: founder.last_name || null,
              title: founder.title || null,
              linkedin_url: founder.linkedin_url || null,
              role: founder.role || 'founder',
              sex: founder.sex || null,
              bio: founder.bio || null
            })
            
            const { data: newFounder, error: founderError } = await supabase
              .from('founders')
              .insert({
                email: founder.email,
                first_name: founder.first_name || null,
                last_name: founder.last_name || null,
                title: founder.title || null,
                linkedin_url: founder.linkedin_url || null,
                role: founder.role || 'founder',
                sex: founder.sex || null,
                bio: founder.bio || null,
              })
              .select()
              .single()

            if (founderError) {
              console.error(`❌ [NEW-INVESTMENT] Error creating founder ${i + 1}:`, founderError)
              throw founderError
            }
            console.log(`✅ [NEW-INVESTMENT] New founder ${i + 1} created successfully:`, newFounder)
            founderId = newFounder.id
          }

          // Link founder to company
          console.log(`🔗 [NEW-INVESTMENT] Creating company-founder relationship for founder ${i + 1}:`, {
            company_id: company.id,
            founder_id: founderId,
            role: founder.role || 'founder',
            is_active: true
          })
          
          const { error: linkError } = await supabase
            .from('company_founders')
            .insert({
              company_id: company.id,
              founder_id: founderId,
              role: founder.role || 'founder',
              is_active: true
            })

          if (linkError) {
            console.error(`❌ [NEW-INVESTMENT] Error creating company-founder link for founder ${i + 1}:`, linkError)
            throw linkError
          }
          console.log(`✅ [NEW-INVESTMENT] Company-founder relationship created successfully for founder ${i + 1}`)
        }
        
        console.log('🎉 [NEW-INVESTMENT] All founders processing completed successfully')
      } else {
        console.log('⚠️ [NEW-INVESTMENT] No founders array provided or empty array')
        
        // 🔍 Fallback: Check for legacy single founder fields for backward compatibility
        const founderData = {
          founder_email: (data as any).founder_email,
          founder_first_name: (data as any).founder_first_name,
          founder_last_name: (data as any).founder_last_name,
          founder_title: (data as any).founder_title,
          founder_linkedin_url: (data as any).founder_linkedin_url,
          founder_role: (data as any).founder_role,
          founder_sex: (data as any).founder_sex,
          founder_bio: (data as any).founder_bio
        }
        
        if (founderData.founder_email && founderData.founder_email !== 'founder@example.com') {
          console.log('🎯 [NEW-INVESTMENT] Found legacy founder fields, processing single founder')
          console.log('👤 [NEW-INVESTMENT] Legacy founder data:', founderData)
          
          setSavingProgress('Processing legacy founder information...')
          
          // Check if founder exists
          console.log('🔍 [NEW-INVESTMENT] Checking if legacy founder exists with email:', founderData.founder_email)
          let { data: existingFounder } = await supabase
            .from('founders')
            .select('id')
            .eq('email', founderData.founder_email)
            .single()

          console.log('👤 [NEW-INVESTMENT] Existing legacy founder found:', existingFounder)
          let founderId: string

          if (existingFounder) {
            // Update existing founder
            console.log('🔄 [NEW-INVESTMENT] Updating existing legacy founder with data:', {
              first_name: founderData.founder_first_name || null,
              last_name: founderData.founder_last_name || null,
              title: founderData.founder_title || null,
              linkedin_url: founderData.founder_linkedin_url || null,
              role: founderData.founder_role || 'founder',
              sex: founderData.founder_sex || null,
              bio: founderData.founder_bio || null
            })
            
            const { data: updatedFounder, error: founderUpdateError } = await supabase
              .from('founders')
              .update({
                first_name: founderData.founder_first_name || null,
                last_name: founderData.founder_last_name || null,
                title: founderData.founder_title || null,
                linkedin_url: founderData.founder_linkedin_url || null,
                role: founderData.founder_role || 'founder',
                sex: founderData.founder_sex || null,
                bio: founderData.founder_bio || null,
                updated_at: new Date().toISOString(),
              })
              .eq('email', founderData.founder_email)
              .select()
              .single()

            if (founderUpdateError) {
              console.error('❌ [NEW-INVESTMENT] Error updating legacy founder:', founderUpdateError)
              throw founderUpdateError
            }
            console.log('✅ [NEW-INVESTMENT] Legacy founder updated successfully:', updatedFounder)
            founderId = updatedFounder.id
          } else {
            // Create new founder
            console.log('➕ [NEW-INVESTMENT] Creating new legacy founder with data:', {
              email: founderData.founder_email,
              first_name: founderData.founder_first_name || null,
              last_name: founderData.founder_last_name || null,
              title: founderData.founder_title || null,
              linkedin_url: founderData.founder_linkedin_url || null,
              role: founderData.founder_role || 'founder',
              sex: founderData.founder_sex || null,
              bio: founderData.founder_bio || null
            })
            
            const { data: newFounder, error: founderError } = await supabase
              .from('founders')
              .insert({
                email: founderData.founder_email,
                first_name: founderData.founder_first_name || null,
                last_name: founderData.founder_last_name || null,
                title: founderData.founder_title || null,
                linkedin_url: founderData.founder_linkedin_url || null,
                role: founderData.founder_role || 'founder',
                sex: founderData.founder_sex || null,
                bio: founderData.founder_bio || null,
              })
              .select()
              .single()

            if (founderError) {
              console.error('❌ [NEW-INVESTMENT] Error creating legacy founder:', founderError)
              throw founderError
            }
            console.log('✅ [NEW-INVESTMENT] New legacy founder created successfully:', newFounder)
            founderId = newFounder.id
          }

          // Create company-founder relationship
          console.log('🔗 [NEW-INVESTMENT] Creating company-founder relationship for legacy founder:', {
            company_id: company.id,
            founder_id: founderId,
            role: founderData.founder_role || 'founder',
            is_active: true
          })
          
          const { error: linkError } = await supabase
            .from('company_founders')
            .insert({
              company_id: company.id,
              founder_id: founderId,
              role: founderData.founder_role || 'founder',
              is_active: true
            })

          if (linkError) {
            console.error('❌ [NEW-INVESTMENT] Error creating company-founder link for legacy founder:', linkError)
            throw linkError
          }
          console.log('✅ [NEW-INVESTMENT] Legacy founder company relationship created successfully')
          console.log('🎉 [NEW-INVESTMENT] Legacy founder processing completed successfully')
        } else {
          console.log('⚠️ [NEW-INVESTMENT] No valid founder data found (neither array nor legacy fields)')
        }
      }

      // Create VC relationships if any VCs are selected
      if (selectedVcs && selectedVcs.length > 0) {
        setSavingProgress(`Creating VC relationships (${selectedVcs.length} VCs)...`)
        console.log(`🔗 Creating VC relationships for ${selectedVcs.length} VCs`)
        
        // Validate that all selected VCs have database IDs
        const invalidVcs = selectedVcs.filter(vc => !vc.id)
        if (invalidVcs.length > 0) {
          throw new Error(`Cannot create investment: ${invalidVcs.length} selected VCs don't exist in database: ${invalidVcs.map(vc => vc.name).join(', ')}`)
        }
        
        // Verify all VCs exist in database
        const vcIds = selectedVcs.map(vc => vc.id)
        const { data: existingVcs, error: vcVerifyError } = await supabase
          .from('vcs')
          .select('id, name')
          .in('id', vcIds)
        
        if (vcVerifyError) throw vcVerifyError
        
        if (existingVcs.length !== selectedVcs.length) {
          const foundIds = existingVcs.map(vc => vc.id)
          const missingVcs = selectedVcs.filter(vc => !foundIds.includes(vc.id))
          throw new Error(`Cannot create investment: ${missingVcs.length} VCs not found in database: ${missingVcs.map(vc => vc.name).join(', ')}`)
        }
        
        // Create company-VC relationships for verified VCs with investment tracking data
        const relationshipsToInsert = selectedVcs.map(vc => {
          // Find corresponding investment data for this VC
          const investment = investmentData.find(inv => inv.vcId === vc.id)
          
          return {
            company_id: company.id,
            vc_id: vc.id,
            episode_url: data.pitch_episode_url || null,
            episode_season: data.episode_season ? data.episode_season.toString() : null,
            episode_number: data.episode_number || null,
            // Investment tracking fields
            is_invested: investment?.isInvested || false,
            investment_amount_usd: investment?.isInvested ? investment.investmentAmount : null,
            episode_publish_date: data.episode_publish_date || null // Always use episode publish date
          }
        })
        
        console.log(`🔗 [NEW-INVESTMENT] Creating VC relationships:`, relationshipsToInsert)
        
        const { error: relationshipError } = await supabase
          .from('company_vcs')
          .insert(relationshipsToInsert)
        
        if (relationshipError) {
          console.error('❌ [NEW-INVESTMENT] Error creating VC relationships:', relationshipError)
          throw relationshipError
        }
        
        console.log(`🎉 [NEW-INVESTMENT] Successfully created ${selectedVcs.length} VC relationships for ${data.name}`)
      }

      const investorCount = investmentData.filter(inv => inv.isInvested).length
      const totalInvestment = investmentData
        .filter(inv => inv.isInvested && inv.investmentAmount)
        .reduce((sum, inv) => sum + (inv.investmentAmount || 0), 0)

      track('admin_investment_create_success', { 
        company_name: data.name,
        company_id: company.id,
        location: 'new_investment_wizard',
        vcs_count: selectedVcs?.length || 0,
        investors_count: investorCount,
        total_investment_usd: totalInvestment
      })

      console.log('🎉 [NEW-INVESTMENT] Investment creation completed successfully!')
      setSavingProgress('Investment created successfully!')
      // Redirect to admin dashboard after successful save
      router.push('/admin')

    } catch (error) {
      console.error('❌ [NEW-INVESTMENT] Fatal error during investment creation:', error)
      console.error('❌ [NEW-INVESTMENT] Error details:', {
        name: (error as any)?.name,
        message: (error as any)?.message,
        code: (error as any)?.code,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        stack: (error as any)?.stack
      })
      
      Sentry.captureException(error, {
        tags: {
          component: 'NewInvestmentWizard',
          operation: 'createInvestment'
        },
        extra: {
          companyName: data.name,
          selectedVcsCount: selectedVcs?.length || 0,
          investmentDataCount: investmentData?.length || 0
        }
      })

      track('admin_investment_create_error', { 
        company_name: data.name,
        error: error instanceof Error ? error.message : 'Unknown error',
        location: 'new_investment_wizard' 
      })

      // Set user-friendly error message
      setError(error instanceof Error ? error.message : 'Failed to create investment. Please try again.')
      setSavingProgress('')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin')
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
              <h1 className="text-3xl font-bold text-platinum-mist">Add New Investment</h1>
              <p className="text-gray-400 mt-1">Create a new portfolio company record with multi-step wizard</p>
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
                <span className="text-platinum-mist">New Investment</span>
              </li>
            </ol>
          </nav>
        </div>

        {/* Wizard Container with Error Handling */}
        <div className="bg-graphite-gray rounded-lg p-6 max-w-6xl mx-auto">
          {/* Saving Progress Indicator */}
          {saving && savingProgress && (
            <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-md p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-400 border-t-transparent"></div>
                <div>
                  <h4 className="font-semibold text-blue-400">Saving Investment...</h4>
                  <p className="text-blue-300 text-sm">{savingProgress}</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 text-red-400 bg-red-500/10 border border-red-500/20 rounded-md p-4">
              <h3 className="font-semibold mb-2">Error Creating Investment</h3>
              <p>{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-3 text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}

          <InvestmentWizard
            onSave={handleSave}
            onCancel={handleCancel}
            saving={saving}
          />
        </div>
      </div>
    </div>
  )
} 