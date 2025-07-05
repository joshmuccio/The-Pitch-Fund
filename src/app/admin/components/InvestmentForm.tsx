'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { track } from '@vercel/analytics'
import * as Sentry from '@sentry/nextjs'
import countryList from 'country-list'
import startCase from 'lodash.startcase'
import CurrencyInput from 'react-currency-input-field'
import { CompanyStage, COMPANY_STAGES } from '../../../lib/supabase-helpers'
import { 
  CompanyFormSchema, 
  prepareFormDataForValidation,
  type ValidationResult 
} from '../../../lib/validation-schemas'
import type { 
  Database, 
  TablesInsert, 
  TablesUpdate 
} from '../../../lib/supabase.types'

// Re-export types for parent components
export interface Company {
  id: string
  slug: string
  name: string
  logo_url?: string
  tagline?: string
  industry_tags?: string[]
  latest_round?: string
  employees?: number | null
  status?: 'active' | 'acquihired' | 'exited' | 'dead'
  description?: any // Vector embedding (1536 dimensions)
  description_raw?: string // Original text description for user input
  website_url?: string
  company_linkedin_url?: string
  founded_year?: number | null
  investment_date?: string
  investment_amount?: number | null
  instrument?: Database['public']['Enums']['investment_instrument']
  conversion_cap_usd?: number | null
  discount_percent?: number | null
  post_money_valuation?: number | null
  co_investors?: string[]
  pitch_episode_url?: string
  key_metrics?: Record<string, any>
  notes?: string
  // New fields from schema update
  annual_revenue_usd?: number | null
  users?: number | null
  last_scraped_at?: string
  total_funding_usd?: number | null
  // Portfolio analytics fields
  country?: string
  stage_at_investment?: CompanyStage
  pitch_season?: number | null
  fund?: Database['public']['Enums']['fund_number']
}

export interface Founder {
  id?: string
  email: string
  name?: string
  linkedin_url?: string
  role?: string
  bio?: string
}

export interface CompanyWithFounders extends Company {
  founders?: (Founder & {
    company_role?: string
    is_active?: boolean
  })[]
}

interface InvestmentFormProps {
  company: CompanyWithFounders | null
  onSave: () => void
  onCancel: () => void
  title?: string
  submitLabel?: string
  showActions?: boolean
}

export default function InvestmentForm({ 
  company, 
  onSave, 
  onCancel,
  title,
  submitLabel = 'Submit',
  showActions = true
}: InvestmentFormProps) {
  const [saving, setSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})
  const [formData, setFormData] = useState({
    // Company fields
    slug: company?.slug || '',
    name: company?.name || '',
    tagline: company?.tagline || '',
    website_url: company?.website_url || '',
    industry_tags: company?.industry_tags?.join(', ') || '',
    status: company?.status || 'active',
    investment_date: company?.investment_date || '',
    investment_amount: company?.investment_amount || '',
    instrument: company?.instrument || 'safe_post',
    conversion_cap_usd: company?.conversion_cap_usd || '',
    discount_percent: company?.discount_percent || '',
    post_money_valuation: company?.post_money_valuation || '',
    description_raw: company?.description_raw || '',
    fund: company?.fund || 'fund_i',

    // Founder fields (single founder for now)
    founder_name: company?.founders?.[0]?.name || '',
    founder_email: company?.founders?.[0]?.email || '',
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setValidationErrors({})

    track('admin_company_form_submit', { 
      action: company ? 'edit' : 'create',
      company_name: formData.name,
      location: 'investment_form' 
    });

    try {
      const preparedData = prepareFormDataForValidation(formData)
      const validationResult = CompanyFormSchema.safeParse(preparedData)

      if (!validationResult.success) {
        const errors: Record<string, string[]> = {}
        validationResult.error.issues.forEach((issue) => {
          const field = issue.path.join('.')
          if (!errors[field]) {
            errors[field] = []
          }
          errors[field].push(issue.message)
        })
        
        setValidationErrors(errors)
        setSaving(false)
        return
      }

      // Simple success for now - in full implementation, we'd save to database
      track('admin_company_form_success', { 
        action: company ? 'edit' : 'create',
        company_name: formData.name,
        location: 'investment_form' 
      });

      onSave()
    } catch (error) {
      console.error('Error saving investment:', error)
      
      Sentry.captureException(error, {
        tags: {
          component: 'InvestmentForm',
          operation: 'saveInvestment'
        }
      });
    } finally {
      setSaving(false)
    }
  }

  const ErrorDisplay = ({ fieldName }: { fieldName: string }) => {
    if (!validationErrors[fieldName]) return null
    
    return (
      <div className="text-red-400 text-xs mt-1">
        {validationErrors[fieldName].map((error, index) => (
          <div key={index}>{error}</div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {title && (
        <h2 className="text-2xl font-bold text-platinum-mist">{title}</h2>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Information Section */}
        <div className="border border-gray-600 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-platinum-mist mb-4 flex items-center gap-2">
            🏢 Company Info
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                  validationErrors.name ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              <ErrorDisplay fieldName="name" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Slug *
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                  validationErrors.slug ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="e.g. your-company"
              />
              <ErrorDisplay fieldName="slug" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Investment Instrument *
              </label>
              <select
                value={formData.instrument}
                onChange={(e) => setFormData(prev => ({ ...prev, instrument: e.target.value as Database['public']['Enums']['investment_instrument'] }))}
                className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
              >
                <option value="safe_post">SAFE (Post-Money)</option>
                <option value="safe_pre">SAFE (Pre-Money)</option>
                <option value="convertible_note">Convertible Note</option>
                <option value="equity">Priced Equity</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Investment Amount ($)
              </label>
              <CurrencyInput
                name="investment_amount"
                prefix="$"
                value={formData.investment_amount}
                onValueChange={(value, name, values) => {
                  setFormData(prev => ({ ...prev, investment_amount: values?.value || '' }))
                }}
                decimalsLimit={2}
                className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                placeholder="e.g. $50,000"
              />
            </div>

            {/* Conditional fields based on instrument */}
            {(formData.instrument === 'safe_post' || formData.instrument === 'safe_pre' || formData.instrument === 'convertible_note') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Valuation Cap (USD)
                  </label>
                  <CurrencyInput
                    name="conversion_cap_usd"
                    prefix="$"
                    value={formData.conversion_cap_usd}
                    onValueChange={(value, name, values) => {
                      setFormData(prev => ({ ...prev, conversion_cap_usd: values?.value || '' }))
                    }}
                    decimalsLimit={2}
                    className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                    placeholder="e.g. $10,000,000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Discount %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.discount_percent}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_percent: e.target.value }))}
                    className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                    placeholder="e.g. 20"
                  />
                </div>
              </>
            )}

            {formData.instrument === 'equity' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Post-Money Valuation ($)
                </label>
                <CurrencyInput
                  name="post_money_valuation"
                  prefix="$"
                  value={formData.post_money_valuation}
                  onValueChange={(value, name, values) => {
                    setFormData(prev => ({ ...prev, post_money_valuation: values?.value || '' }))
                  }}
                  decimalsLimit={2}
                  className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                  placeholder="e.g. $5,000,000"
                />
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        {showActions && (
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-cobalt-pulse hover:bg-blue-600 disabled:bg-gray-600 text-white px-6 py-2 rounded transition-colors font-medium"
            >
              {saving ? 'Saving...' : submitLabel}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
