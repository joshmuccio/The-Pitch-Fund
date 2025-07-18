'use client'

import { useState, useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { companySchema, type CompanyFormValues } from '../schemas/companySchema'
import { countries } from '@/lib/countries'
import CurrencyInput from 'react-currency-input-field'
import QuickPastePanel from '@/components/QuickPastePanel'
import { useDraftPersist } from '@/hooks/useDraftPersist'
import TagSelector from '@/components/TagSelector'

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
  // Removed isSlugManuallyEdited since slug is now auto-generated only
  
  const formMethods = useForm({
    resolver: zodResolver(companySchema),
    mode: 'onBlur',
    defaultValues: {
      has_pro_rata_rights: false,
      fund: 'fund_i',
      stage_at_investment: 'pre_seed',
      instrument: 'safe_post',
      status: company?.status || 'active', // Use existing status or default to active
      founder_role: 'founder',
      ...company,
    },
  })

  const { 
    register, 
    watch, 
    handleSubmit, 
    formState: { errors },
    getValues,
    setValue,
    trigger,
    reset
  } = formMethods

  // Use draft persistence hook only for new investments (not when editing existing companies)
  const { clearDraft } = !company ? useDraftPersist<CompanyFormValues>(
    'investmentFormData',
    700 // 700ms debounce delay
  ) : { clearDraft: () => {} }

  const instrument = watch('instrument')
  const companyName = watch('name')
  const currentSlug = watch('slug')
  const isSafeOrNote = ['safe_pre', 'safe_post', 'convertible_note'].includes(instrument ?? '')
  const isEquity = instrument === 'equity'

  // Watch currency fields 
  const investmentAmount = watch('investment_amount')
  const roundSize = watch('round_size_usd')
  const conversionCap = watch('conversion_cap_usd')
  const postMoneyValuation = watch('post_money_valuation')

  // Helper function to generate slug from company name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // Auto-generate slug when company name changes
  useEffect(() => {
    if (companyName) {
      const newSlug = generateSlug(companyName)
      if (newSlug !== currentSlug) {
        setValue('slug', newSlug)
      }
    }
  }, [companyName, setValue, currentSlug])

  const prepareFormDataForValidation = (formData: any) => {
    const prepared = { ...formData }
    
    // Force status to 'active' for new investments
    if (!company) {
      prepared.status = 'active'
    }
    
    // Convert string numbers to actual numbers for validation
    const numericFields = [
      'investment_amount', 'post_money_valuation', 'conversion_cap_usd', 
      'discount_percent', 'round_size_usd'
    ]
    
    numericFields.forEach(field => {
      if (prepared[field] && prepared[field] !== '') {
        const parsed = parseFloat(prepared[field])
        prepared[field] = isNaN(parsed) ? prepared[field] : parsed
      }
    })

    // Handle pitch_season separately to extract number from "Season 13" format
    if (prepared.pitch_season && prepared.pitch_season !== '') {
      if (typeof prepared.pitch_season === 'string') {
        const seasonMatch = prepared.pitch_season.match(/season\s*(\d+)/i) || prepared.pitch_season.match(/(\d+)/)
        if (seasonMatch && seasonMatch[1]) {
          prepared.pitch_season = parseInt(seasonMatch[1], 10)
        } else {
          const parsed = parseInt(prepared.pitch_season, 10)
          prepared.pitch_season = isNaN(parsed) ? prepared.pitch_season : parsed
        }
      }
    }

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
      clearDraft()
      
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
    <FormProvider {...formMethods}>
      <div className="space-y-6">
        {title && (
          <h2 className="text-2xl font-bold text-platinum-mist">{title}</h2>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left side: Investment Form */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* AngelList Auto-Populated Fields Section */}
              <div className="border border-gray-600 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-platinum-mist mb-4 flex items-center gap-2">
                  ⚡ AngelList Fields
                </h4>
                <p className="text-sm text-gray-400 mb-4">
                  These fields can be auto-populated from AngelList investment memos
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 1. Company Name */}
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

                  {/* 2. Investment Date */}
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

                  {/* 3. Investment Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Investment Amount ($) *
                    </label>
                    <CurrencyInput
                      name="investment_amount"
                      prefix="$"
                      value={investmentAmount || ''}
                      onValueChange={(value, name, values) => {
                        setValue('investment_amount', values?.float ?? 0, { shouldValidate: true })
                      }}
                      decimalsLimit={2}
                      className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                        validationErrors.investment_amount ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="e.g. $50,000"
                    />
                    <ErrorDisplay fieldName="investment_amount" />
                  </div>

                  {/* 4. Investment Instrument */}
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

                  {/* 5. Round/Stage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Stage at Investment
                    </label>
                    <select
                      {...register('stage_at_investment')}
                      className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                    >
                      <option value="pre_seed">Pre-Seed</option>
                      <option value="seed">Seed</option>
                      <option value="series_a">Series A</option>
                      <option value="series_b">Series B</option>
                      <option value="series_c">Series C</option>
                    </select>
                  </div>

                  {/* 6. Round Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Round Size (USD) *
                    </label>
                    <CurrencyInput
                      name="round_size_usd"
                      prefix="$"
                      value={roundSize || ''}
                      onValueChange={(value, name, values) => {
                        setValue('round_size_usd', values?.float ?? 0, { shouldValidate: true })
                      }}
                      decimalsLimit={2}
                      className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                        validationErrors.round_size_usd ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="e.g. $1,000,000"
                    />
                    <ErrorDisplay fieldName="round_size_usd" />
                  </div>

                  {/* 7. Conversion Cap (SAFE/Note) OR Post-Money Valuation (Equity) */}
                  {/* SAFE and Convertible Note fields */}
                  {isSafeOrNote && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Conversion Cap (USD)
                        </label>
                        <CurrencyInput
                          name="conversion_cap_usd"
                          prefix="$"
                          value={conversionCap || ''}
                          onValueChange={(value, name, values) => {
                            setValue('conversion_cap_usd', values?.float ?? undefined, { shouldValidate: true })
                          }}
                          decimalsLimit={2}
                          className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                          placeholder="e.g. $5,000,000"
                        />
                        <ErrorDisplay fieldName="conversion_cap_usd" />
                      </div>

                      {/* 8. Discount (SAFE/Note) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Discount (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            {...register('discount_percent', { valueAsNumber: true })}
                            className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                            placeholder="e.g. 20"
                            min="0"
                            max="100"
                          />
                          <span className="absolute right-3 top-2 text-gray-400">%</span>
                        </div>
                        <ErrorDisplay fieldName="discount_percent" />
                      </div>
                    </>
                  )}

                  {/* 7. Post-Money Valuation (Equity) */}
                  {isEquity && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Post-Money Valuation (USD)
                      </label>
                      <CurrencyInput
                        name="post_money_valuation"
                        prefix="$"
                        value={postMoneyValuation || ''}
                        onValueChange={(value, name, values) => {
                          setValue('post_money_valuation', values?.float ?? undefined, { shouldValidate: true })
                        }}
                        decimalsLimit={2}
                        className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                        placeholder="e.g. $10,000,000"
                      />
                      <ErrorDisplay fieldName="post_money_valuation" />
                    </div>
                  )}

                  {/* 9. Pro-rata Rights */}
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
                        Pro-rata rights included
                      </label>
                    </div>
                    <ErrorDisplay fieldName="has_pro_rata_rights" />
                  </div>

                  {/* 10. Co-Investors */}
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

                  {/* 12. Country of Incorporation */}
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

                  {/* 13. Incorporation Type */}
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
                      <option value="C-Corp">C Corporation</option>
                      <option value="S-Corp">S Corporation</option>
                      <option value="LLC">Limited Liability Company</option>
                      <option value="PBC">Public Benefit Corporation</option>
                      <option value="Non-Profit">Non-Profit</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Sole-Proprietorship">Sole Proprietorship</option>
                      <option value="Other">Other</option>
                    </select>
                    <ErrorDisplay fieldName="incorporation_type" />
                  </div>

                  {/* 14. Founder Name */}
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

                  {/* 15. Fund */}
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
                    <ErrorDisplay fieldName="fund" />
                  </div>

                  {/* 16. Status (only shown for existing companies) */}
                  {company && (
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
                      <ErrorDisplay fieldName="status" />
                    </div>
                  )}
                </div>

                {/* 11. Reason for Investing */}
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

                {/* 15. Company Description */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Company Description
                  </label>
                  <textarea
                    {...register('description_raw')}
                    className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                    rows={4}
                    placeholder="Detailed description of what the company does, their product/service, target market, and business model..."
                  />
                  <ErrorDisplay fieldName="description_raw" />
                </div>
              </div>

              {/* Additional Information Section (Not in AngelList) */}
              <div className="border border-gray-600 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-platinum-mist mb-4 flex items-center gap-2">
                  📋 Additional Information
                </h4>
                <p className="text-sm text-gray-400 mb-4">
                  These fields are not auto-populated and must be filled manually
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Slug field removed from UI but kept in form state for auto-generation */}
                  
                  {/* Tagline */}
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

                  {/* Website URL */}
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

                  {/* Industry Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Industry Tags
                    </label>
                    <TagSelector
                      tagType="industry"
                      value={watch('industry_tags') ? watch('industry_tags').split(',').map(tag => tag.trim()).filter(Boolean) : []}
                      onChange={(selectedTags: string[]) => {
                        setValue('industry_tags', selectedTags.join(', '))
                      }}
                      placeholder="Select industry tags..."
                      maxTags={10}
                      showCount={true}
                    />
                    <ErrorDisplay fieldName="industry_tags" />
                  </div>

                  {/* Pitch Episode URL */}
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
              </div>

              {/* Founder Information Section (Additional Fields) */}
              <div className="border border-gray-600 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-platinum-mist mb-4 flex items-center gap-2">
                  👤 Additional Founder Information
                </h4>
                <p className="text-sm text-gray-400 mb-4">
                  Additional founder details not included in AngelList memos
                </p>
                
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
                      <option value="founder">Founder</option>
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

          {/* Right side: Quick-Paste Panel */}
          <div className="space-y-6">
            <div className="border border-gray-600 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-platinum-mist mb-4 flex items-center gap-2">
                ⚡ Quick-Paste
              </h4>
              <p className="text-sm text-gray-400 mb-4">
                Paste AngelList investment text to auto-populate form fields
              </p>
              <QuickPastePanel />
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  )
} 