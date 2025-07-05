'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { companySchema, type CompanyFormValues } from '../schemas/companySchema'
import { countries } from '@/lib/countries'
import CurrencyInput from 'react-currency-input-field'

interface UnifiedInvestmentFormProps {
  company?: CompanyFormValues | null
  onSave: (data: CompanyFormValues) => void
  onCancel: () => void
  title?: string
  submitLabel?: string
  showActions?: boolean
}

export default function UnifiedInvestmentForm({
  company,
  onSave,
  onCancel,
  title,
  submitLabel = 'Save Investment',
  showActions = true
}: UnifiedInvestmentFormProps) {
  const [saving, setSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)
  
  const { 
    register, 
    watch, 
    handleSubmit, 
    formState: { errors },
    getValues,
    setValue,
    trigger
  } = useForm({
    resolver: zodResolver(companySchema),
    mode: 'onBlur',
    defaultValues: {
      has_pro_rata_rights: false,
      fund: 'fund_i',
      stage_at_investment: 'pre_seed',
      instrument: 'safe_post',
      status: 'active',
      founder_role: 'solo_founder',
      ...company,
    },
  })

  const instrument = watch('instrument')
  const companyName = watch('name')
  const currentSlug = watch('slug')
  const isSafeOrNote = ['safe_pre', 'safe_post', 'convertible_note'].includes(instrument ?? '')
  const isEquity = instrument === 'equity'

  // Helper function to generate slug from company name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // Auto-generate slug when company name changes (unless manually edited)
  useEffect(() => {
    if (companyName && !isSlugManuallyEdited) {
      const newSlug = generateSlug(companyName)
      if (newSlug !== currentSlug) {
        setValue('slug', newSlug)
      }
    }
  }, [companyName, setValue, isSlugManuallyEdited, currentSlug])

  // Check if user has manually edited the slug
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugManuallyEdited(true)
    // Let react-hook-form handle the actual value change
  }

  // Reset manual edit flag when form is reset or new company is loaded
  useEffect(() => {
    if (company?.slug) {
      setIsSlugManuallyEdited(true) // If editing existing company, consider slug as manually set
    } else {
      setIsSlugManuallyEdited(false)
    }
  }, [company])

  // Save form data to localStorage for persistence
  useEffect(() => {
    const formData = getValues()
    localStorage.setItem('investmentFormData', JSON.stringify(formData))
  }, [getValues])

  // Load form data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('investmentFormData')
    if (savedData && !company) {
      try {
        const parsed = JSON.parse(savedData)
        Object.keys(parsed).forEach(key => {
          setValue(key as keyof CompanyFormValues, parsed[key])
        })
      } catch (error) {
        console.error('Error loading saved form data:', error)
      }
    }
  }, [company, setValue])

  const prepareFormDataForValidation = (formData: any) => {
    const prepared = { ...formData }
    
    // Convert string numbers to actual numbers for validation
    const numericFields = [
      'investment_amount', 'post_money_valuation', 'pitch_season',
      'conversion_cap_usd', 'discount_percent', 'round_size_usd'
    ]
    
    numericFields.forEach(field => {
      if (prepared[field] && prepared[field] !== '') {
        const parsed = parseFloat(prepared[field])
        prepared[field] = isNaN(parsed) ? prepared[field] : parsed
      }
    })

    // Convert empty strings to undefined for optional fields
    Object.keys(prepared).forEach(key => {
      if (prepared[key] === '') {
        prepared[key] = undefined
      }
    })

    // Ensure country codes are uppercase
    if (prepared.country && typeof prepared.country === 'string') {
      prepared.country = prepared.country.toUpperCase()
    }
    if (prepared.country_of_incorp && typeof prepared.country_of_incorp === 'string') {
      prepared.country_of_incorp = prepared.country_of_incorp.toUpperCase()
    }

    // Convert has_pro_rata_rights to boolean if it's a string
    if (typeof prepared.has_pro_rata_rights === 'string') {
      prepared.has_pro_rata_rights = prepared.has_pro_rata_rights === 'true'
    }

    return prepared
  }

  const onSubmit = async (data: CompanyFormValues) => {
    setSaving(true)
    setValidationErrors({})

    try {
      const preparedData = prepareFormDataForValidation(data)
      const validationResult = companySchema.safeParse(preparedData)

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

      // Clear saved form data on successful submission
      localStorage.removeItem('investmentFormData')
      
      await onSave(validationResult.data)
    } catch (error) {
      console.error('Error saving investment:', error)
      // Handle error appropriately
    } finally {
      setSaving(false)
    }
  }

  const ErrorDisplay = ({ fieldName }: { fieldName: string }) => {
    const errorMessages = validationErrors[fieldName] || errors[fieldName as keyof CompanyFormValues]?.message
    if (!errorMessages) return null
    
    const messages = Array.isArray(errorMessages) ? errorMessages : [errorMessages]
    
    return (
      <div className="text-red-400 text-xs mt-1">
        {messages.map((error, index) => (
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
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                {...register('name')}
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
                {...register('slug')}
                onChange={handleSlugChange}
                className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                  validationErrors.slug ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="e.g. company-name"
              />
              {currentSlug && (
                <p className="text-xs text-gray-400 mt-1">
                  URL: /portfolio/{currentSlug}
                </p>
              )}
              <ErrorDisplay fieldName="slug" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Tagline *
              </label>
              <input
                type="text"
                {...register('tagline')}
                className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                  validationErrors.tagline ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="One line description"
              />
              <ErrorDisplay fieldName="tagline" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Website URL *
              </label>
              <input
                type="url"
                {...register('website_url')}
                className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                  validationErrors.website_url ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="https://example.com"
              />
              <ErrorDisplay fieldName="website_url" />
            </div>
          </div>
        </div>

        {/* Investment Details Section */}
        <div className="border border-gray-600 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-platinum-mist mb-4 flex items-center gap-2">
            💰 Investment Details
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Investment Date *
              </label>
              <input
                type="date"
                {...register('investment_date')}
                className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                  validationErrors.investment_date ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              <ErrorDisplay fieldName="investment_date" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Investment Amount ($) *
              </label>
              <CurrencyInput
                name="investment_amount"
                prefix="$"
                value={watch('investment_amount')}
                onValueChange={(value, name, values) => {
                  setValue('investment_amount', values?.float ?? 0)
                }}
                decimalsLimit={2}
                className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                  validationErrors.investment_amount ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="e.g. $50,000"
              />
              <ErrorDisplay fieldName="investment_amount" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Investment Instrument *
              </label>
              <select
                {...register('instrument')}
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
                Fund *
              </label>
              <select
                {...register('fund')}
                className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                  validationErrors.fund ? 'border-red-500' : 'border-gray-600'
                }`}
              >
                <option value="fund_i">Fund I</option>
                <option value="fund_ii">Fund II</option>
                <option value="fund_iii">Fund III</option>
              </select>
            </div>

            {/* Round Size */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Round Size (USD) *
              </label>
              <CurrencyInput
                name="round_size_usd"
                prefix="$"
                value={watch('round_size_usd')}
                onValueChange={(value, name, values) => {
                  setValue('round_size_usd', values?.float ?? 0)
                }}
                decimalsLimit={2}
                className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                  validationErrors.round_size_usd ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="e.g. $1,000,000"
              />
              <ErrorDisplay fieldName="round_size_usd" />
            </div>

            {/* Pro-rata Rights */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Pro-rata Rights
              </label>
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  {...register('has_pro_rata_rights')}
                  className="w-4 h-4 text-cobalt-pulse bg-pitch-black border-gray-600 rounded focus:ring-cobalt-pulse focus:ring-2"
                />
                <label className="ml-2 text-sm text-gray-300">
                  SAFE/Note includes pro-rata clause
                </label>
              </div>
              <ErrorDisplay fieldName="has_pro_rata_rights" />
            </div>

            {/* Country of Incorporation */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Country of Incorporation *
              </label>
              <select
                {...register('country_of_incorp')}
                className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                  validationErrors.country_of_incorp ? 'border-red-500' : 'border-gray-600'
                }`}
              >
                <option value="">Select country...</option>
                {countries.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.name} ({country.code})
                  </option>
                ))}
              </select>
              <ErrorDisplay fieldName="country_of_incorp" />
            </div>

            {/* Incorporation Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Incorporation Type *
              </label>
              <select
                {...register('incorporation_type')}
                className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                  validationErrors.incorporation_type ? 'border-red-500' : 'border-gray-600'
                }`}
              >
                <option value="">Select type...</option>
                <option value="c_corp">C Corporation</option>
                <option value="s_corp">S Corporation</option>
                <option value="llc">Limited Liability Company (LLC)</option>
                <option value="bcorp">Benefit Corporation (B-Corp)</option>
                <option value="gmbh">GmbH</option>
                <option value="ltd">Limited Company (Ltd)</option>
                <option value="plc">Public Limited Company (PLC)</option>
                <option value="other">Other</option>
              </select>
              <ErrorDisplay fieldName="incorporation_type" />
            </div>

            {/* SAFE/Note specific fields */}
            {isSafeOrNote && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Conversion Cap (USD)
                  </label>
                  <CurrencyInput
                    name="conversion_cap_usd"
                    prefix="$"
                    value={watch('conversion_cap_usd')}
                    onValueChange={(value, name, values) => {
                      setValue('conversion_cap_usd', values?.float ?? undefined)
                    }}
                    decimalsLimit={2}
                    className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                    placeholder="e.g. $10,000,000"
                  />
                  <ErrorDisplay fieldName="conversion_cap_usd" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Discount Percentage
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      {...register('discount_percent', { valueAsNumber: true })}
                      className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none pr-8"
                      placeholder="e.g. 20"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-sm">%</span>
                    </div>
                  </div>
                  <ErrorDisplay fieldName="discount_percent" />
                </div>
              </>
            )}

            {/* Equity specific fields */}
            {isEquity && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Post-Money Valuation (USD)
                </label>
                <CurrencyInput
                  name="post_money_valuation"
                  prefix="$"
                  value={watch('post_money_valuation')}
                  onValueChange={(value, name, values) => {
                    setValue('post_money_valuation', values?.float ?? undefined)
                  }}
                  decimalsLimit={2}
                  className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                  placeholder="e.g. $5,000,000"
                />
                <ErrorDisplay fieldName="post_money_valuation" />
              </div>
            )}
          </div>
        </div>

        {/* Additional Information Section */}
        <div className="border border-gray-600 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-platinum-mist mb-4 flex items-center gap-2">
            📝 Additional Information
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Industry Tags
              </label>
              <input
                type="text"
                {...register('industry_tags')}
                className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                placeholder="e.g. fintech, b2b, saas"
              />
              <ErrorDisplay fieldName="industry_tags" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="acquihired">Acquihired</option>
                <option value="exited">Exited</option>
                <option value="dead">Dead</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Co-Investors
              </label>
              <input
                type="text"
                {...register('co_investors')}
                className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                placeholder="e.g. Acme Ventures, Beta Capital"
              />
              <ErrorDisplay fieldName="co_investors" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Pitch Episode URL
              </label>
              <input
                type="url"
                {...register('pitch_episode_url')}
                className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                placeholder="https://..."
              />
              <ErrorDisplay fieldName="pitch_episode_url" />
            </div>
          </div>

          {/* Reason for Investing */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Reason for Investing *
            </label>
            <textarea
              {...register('reason_for_investing')}
              className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                validationErrors.reason_for_investing ? 'border-red-500' : 'border-gray-600'
              }`}
              rows={4}
              placeholder="Why this investment fits our thesis and strategy..."
            />
            <ErrorDisplay fieldName="reason_for_investing" />
          </div>

          {/* Company Description */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Company Description
            </label>
            <textarea
              {...register('description_raw')}
              className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
              rows={3}
              placeholder="Brief description of what the company does..."
            />
            <ErrorDisplay fieldName="description_raw" />
          </div>
        </div>

        {/* Founder Information Section */}
        <div className="border border-gray-600 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-platinum-mist mb-4 flex items-center gap-2">
            👤 Founder Information
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Founder Email *
              </label>
              <input
                type="email"
                {...register('founder_email')}
                className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                  validationErrors.founder_email ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="founder@company.com"
              />
              <ErrorDisplay fieldName="founder_email" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Founder Name
              </label>
              <input
                type="text"
                {...register('founder_name')}
                className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                placeholder="John Doe"
              />
              <ErrorDisplay fieldName="founder_name" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Founder LinkedIn
              </label>
              <input
                type="url"
                {...register('founder_linkedin_url')}
                className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                placeholder="https://linkedin.com/in/..."
              />
              <ErrorDisplay fieldName="founder_linkedin_url" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Founder Role
              </label>
              <select
                {...register('founder_role')}
                className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
              >
                <option value="solo_founder">Solo Founder</option>
                <option value="cofounder">Co-Founder</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Founder Gender
              </label>
              <select
                {...register('founder_sex')}
                className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
              >
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Founder Bio
            </label>
            <textarea
              {...register('founder_bio')}
              className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
              rows={3}
              placeholder="Brief background and experience..."
            />
            <ErrorDisplay fieldName="founder_bio" />
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