'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { track } from '@vercel/analytics'
import * as Sentry from '@sentry/nextjs'
import dynamic from 'next/dynamic'
import { type CompanyFormValues } from '../../schemas/companySchema'

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

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSave = async (data: CompanyFormValues) => {
    setSaving(true)
    
    try {
      track('admin_investment_create_start', { 
        company_name: data.name,
        location: 'new_investment_wizard' 
      })

      // Prepare company data for insertion
      const companyData = {
        name: data.name,
        slug: data.slug,
        tagline: data.tagline || null,
        description_raw: data.description_raw || null,
        website_url: data.website_url || null,
        company_linkedin_url: data.company_linkedin_url || null,
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
        industry_tags: data.industry_tags?.split(',').map((tag: string) => tag.trim()).filter(Boolean) || [],
        status: data.status,
        co_investors: data.co_investors?.split(',').map((investor: string) => investor.trim()).filter(Boolean) || [],
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
      }

      // Insert company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert(companyData)
        .select()
        .single()

      if (companyError) throw companyError

      // Insert founder if provided
      if (data.founder_email) {
        // First check if founder exists
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

        // Link founder to company
        const { error: linkError } = await supabase
          .from('company_founders')
          .insert({
            company_id: company.id,
            founder_id: founderId,
            role: data.founder_role,
            is_active: true
          })

        if (linkError) throw linkError
      }

      track('admin_investment_create_success', { 
        company_name: data.name,
        company_id: company.id,
        location: 'new_investment_wizard' 
      })

      // Redirect to admin dashboard after successful save
      router.push('/admin')

    } catch (error) {
      console.error('Error creating investment:', error)
      
      Sentry.captureException(error, {
        tags: {
          component: 'NewInvestmentWizard',
          operation: 'createInvestment'
        },
        extra: {
          companyName: data.name
        }
      })

      track('admin_investment_create_error', { 
        company_name: data.name,
        error: error instanceof Error ? error.message : 'Unknown error',
        location: 'new_investment_wizard' 
      })

      // For now, we'll still redirect but in a real app you'd show an error message
      alert('Failed to create investment. Please try again.')
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
          {error ? (
            <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-md p-4">
              <h3 className="font-semibold mb-2">Error Loading Wizard</h3>
              <p>{error}</p>
            </div>
          ) : (
            <InvestmentWizard
              onSave={handleSave}
              onCancel={handleCancel}
              saving={saving}
            />
          )}
        </div>
      </div>
    </div>
  )
} 