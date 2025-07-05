'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import * as Sentry from '@sentry/nextjs'
import UnifiedInvestmentForm from './UnifiedInvestmentForm'
import { type CompanyFormValues } from '../schemas/companySchema'

// Define the company type with founders for display purposes
interface CompanyWithFounders extends CompanyFormValues {
  id: string
  created_at?: string
  founded_year?: number | null
  latest_round?: string
  founders?: (Founder & {
    company_role?: string
    is_active?: boolean
  })[]
}

interface Founder {
  id: string
  email: string
  name?: string
  linkedin_url?: string
  role?: string
  bio?: string
  sex?: 'male' | 'female'
}

interface CompanyManagerProps {
  showForm: boolean
  editingCompany: CompanyWithFounders | null
  onEdit: (company: CompanyWithFounders) => void
  onClose: () => void
  onSave: () => void
}

export default function CompanyManager({ 
  showForm, 
  editingCompany, 
  onEdit, 
  onClose, 
  onSave 
}: CompanyManagerProps) {
  const [companies, setCompanies] = useState<CompanyWithFounders[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
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
              linkedin_url,
              role,
              bio
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Transform the data to flatten founders
      const transformedData = (data || []).map(company => ({
        ...company,
        founders: company.company_founders?.map((cf: any) => ({
          ...cf.founders,
          company_role: cf.role,
          is_active: cf.is_active
        })) || []
      }))
      
      setCompanies(transformedData)
    } catch (error) {
      console.error('Error fetching companies:', error)
      // Track database error in Sentry
      Sentry.captureException(error, {
        tags: {
          component: 'CompanyManager',
          operation: 'fetchCompanies'
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveComplete = () => {
    fetchCompanies()
    onSave()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-platinum-mist">Loading companies...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Companies List */}
      <div className="grid gap-4">
        {companies.map((company) => (
          <div
            key={company.id}
            className="bg-graphite-gray rounded-lg p-6 border border-gray-700"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-platinum-mist">
                    {company.name}
                  </h3>
                  <span className="text-sm text-gray-400">({company.slug})</span>
                  {company.status === 'active' && (
                    <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                      Active
                    </span>
                  )}
                </div>
                
                {company.tagline && (
                  <p className="text-gray-300 mb-2">{company.tagline}</p>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                  {company.founded_year && (
                    <div>
                      <span className="text-gray-400">Founded:</span>
                      <span className="text-platinum-mist ml-1">{company.founded_year}</span>
                    </div>
                  )}
                  {company.investment_date && (
                    <div>
                      <span className="text-gray-400">Investment:</span>
                      <span className="text-platinum-mist ml-1">
                        {new Date(company.investment_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {company.investment_amount && (
                    <div>
                      <span className="text-gray-400">Amount:</span>
                      <span className="text-platinum-mist ml-1">
                        \${company.investment_amount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {company.latest_round && (
                    <div>
                      <span className="text-gray-400">Round:</span>
                      <span className="text-platinum-mist ml-1">{company.latest_round}</span>
                    </div>
                  )}
                  {company.fund && (
                    <div>
                      <span className="text-gray-400">Fund:</span>
                      <span className="text-platinum-mist ml-1">
                        {company.fund === 'fund_i' && 'Fund I'}
                        {company.fund === 'fund_ii' && 'Fund II'}
                        {company.fund === 'fund_iii' && 'Fund III'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Associated Founders */}
                {company.founders && company.founders.length > 0 && (
                  <div className="mt-3">
                    <span className="text-gray-400 text-sm">Founders:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {company.founders.map((founder, index) => (
                        <span
                          key={founder.id || index}
                          className="bg-blue-600 text-white text-xs px-2 py-1 rounded"
                        >
                          {founder.name || founder.email} 
                          {founder.company_role && ` (${founder.company_role})`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => onEdit(company)}
                className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {companies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No companies found. Add your first portfolio company!</p>
        </div>
      )}

      {/* Company + Founder Form Modal */}
      {showForm && (
        <InvestmentFormModal
          company={editingCompany}
          onSave={handleSaveComplete}
          onClose={onClose}
        />
      )}
    </div>
  )
}

// Modal wrapper for the UnifiedInvestmentForm
function InvestmentFormModal({ 
  company, 
  onSave, 
  onClose 
}: { 
  company: CompanyWithFounders | null
  onSave: () => void
  onClose: () => void 
}) {
  // Convert CompanyWithFounders to CompanyFormValues for the form
  const formData = company ? {
    // Core fields
    name: company.name || '',
    slug: company.slug || '',
    tagline: company.tagline || '',
    description_raw: company.description_raw || '',
    website_url: company.website_url || '',
    company_linkedin_url: company.company_linkedin_url || '',
    
    // Investment fields
    investment_date: company.investment_date || '',
    investment_amount: company.investment_amount || 0,
    instrument: company.instrument || 'safe_post',
    fund: company.fund || 'fund_i',
    round_size_usd: company.round_size_usd || 0,
    has_pro_rata_rights: company.has_pro_rata_rights || false,
    conversion_cap_usd: company.conversion_cap_usd,
    discount_percent: company.discount_percent,
    post_money_valuation: company.post_money_valuation,
    
    // Company details
    country_of_incorp: company.country_of_incorp || '',
    incorporation_type: company.incorporation_type || 'c_corp',
    industry_tags: company.industry_tags || '',
    status: company.status || 'active',
    co_investors: company.co_investors || '',
    pitch_episode_url: company.pitch_episode_url || '',
    reason_for_investing: company.reason_for_investing || '',
    
    // Portfolio analytics
    country: company.country || '',
    stage_at_investment: company.stage_at_investment || 'pre_seed',
    pitch_season: company.pitch_season,
    
    // Founder fields (take first founder if available)
    founder_email: company.founders?.[0]?.email || '',
    founder_name: company.founders?.[0]?.name || '',
    founder_linkedin_url: company.founders?.[0]?.linkedin_url || '',
    founder_role: company.founders?.[0]?.role as any || 'solo_founder',
    founder_sex: company.founders?.[0]?.sex as any || '',
    founder_bio: company.founders?.[0]?.bio || '',
    
    // Other fields
    notes: company.notes || '',
  } as CompanyFormValues : null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-graphite-gray rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-platinum-mist">
            {company ? 'Edit Investment' : 'Add New Investment'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <UnifiedInvestmentForm
          company={formData}
          onSave={(data) => {
            // Here we would need to handle the update logic
            // For now, just call onSave
            onSave()
          }}
          onCancel={onClose}
          showActions={true}
          submitLabel="Submit"
        />
      </div>
    </div>
  )
}
