'use client'

import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { type CompanyFormValues, getConditionalRequirements } from '../../../schemas/companySchema'
import { countries } from '@/lib/countries'
import CurrencyInput from 'react-currency-input-field'
import QuickPastePanel from '@/components/QuickPastePanel'

interface AngelListStepProps {
  customErrors?: Record<string, any>
  fieldsNeedingManualInput?: Set<string>
  onQuickPasteComplete?: (failedFields: Set<string>) => void
}

export default function AngelListStep({ customErrors = {}, fieldsNeedingManualInput = new Set(), onQuickPasteComplete }: AngelListStepProps) {
  const { 
    register, 
    watch, 
    setValue,
    formState: { errors, touchedFields }
  } = useFormContext<CompanyFormValues>()

  // Watch currency fields for controlled components
  const investmentAmount = watch('investment_amount')
  const roundSize = watch('round_size_usd')
  const conversionCap = watch('conversion_cap_usd')
  const postMoneyValuation = watch('post_money_valuation')

  // Watch instrument to determine conditional requirements
  const currentInstrument = watch('instrument')
  const isSafeOrNote = ['safe_post', 'safe_pre', 'convertible_note'].includes(currentInstrument)
  const isEquity = currentInstrument === 'equity'
  
  // Get conditional requirements using helper function
  const conditionalReqs = getConditionalRequirements(currentInstrument || 'safe_post')

  // Helper function to determine field styling based on validation status
  const getFieldClasses = (fieldName: string, baseClasses: string = 'w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none') => {
    // Helper function to safely access nested error paths (same as ErrorDisplay)
    const getNestedError = (errors: any, path: string) => {
      return path.split('.').reduce((obj, key) => {
        if (obj && typeof obj === 'object') {
          return obj[key]
        }
        return undefined
      }, errors)
    }

    const formError = getNestedError(errors, fieldName)
    const customError = customErrors[fieldName]
    const hasError = formError || customError
    const needsManualInput = fieldsNeedingManualInput.has(fieldName)
    
    let borderClass = 'border-gray-600' // default
    
    if (hasError) {
      borderClass = 'border-red-500' // error (highest priority)
    } else if (needsManualInput) {
      borderClass = 'border-orange-400 bg-orange-50/5' // needs manual input
    }
    
    return `${baseClasses} ${borderClass}`
  }

  const companyName = watch('name')
  const currentSlug = watch('slug')

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

  const ErrorDisplay = ({ fieldName }: { fieldName: string }) => {
    // Helper function to safely access nested error paths
    const getNestedError = (errors: any, path: string) => {
      return path.split('.').reduce((obj, key) => {
        if (obj && typeof obj === 'object') {
          return obj[key]
        }
        return undefined
      }, errors)
    }

    // Prioritize custom errors from step validation
    const customError = customErrors[fieldName]
    const formError = getNestedError(errors, fieldName)
    const isTouched = getNestedError(touchedFields, fieldName)
    

    
    // Show custom error if it exists, otherwise show form error (real-time validation with Zod)
    const error = customError || formError
    if (!error) return null
    
    // Handle different error types from React Hook Form or custom validation
    let message: string = ''
    if (typeof error === 'string') {
      message = error
    } else if (Array.isArray(error) && error.length > 0) {
      message = error[0] // Take first error message from array
    } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      message = error.message
    } else {
      message = 'Invalid value'
    }
    
    return (
      <div className="text-red-400 text-xs mt-1 flex items-center gap-1">
        <span className="text-red-400">⚠</span>
        {message}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left side: AngelList Fields */}
      <div className="space-y-6">
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
                className={getFieldClasses('name')}
                placeholder="Enter company name"
              />
              <ErrorDisplay fieldName="name" />
            </div>

            {/* 1.5. Company Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Company Slug
                <span className="text-xs text-gray-500 ml-1">(Auto-generated)</span>
              </label>
              <input
                type="text"
                {...register('slug')}
                disabled={true}
                className={`w-full px-3 py-2 bg-gray-800 border rounded text-platinum-mist cursor-not-allowed ${
                  errors.slug || customErrors.slug ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="company-slug"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL-friendly identifier generated from company name
              </p>
            </div>

            {/* 2. Investment Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Investment Date *
              </label>
              <input
                type="date"
                {...register('investment_date')}
                className={getFieldClasses('investment_date')}
                max={new Date().toISOString().split('T')[0]}
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
                value={investmentAmount || ''}
                className={getFieldClasses('investment_amount')}
                placeholder="e.g. 50,000"
                decimalsLimit={0}
                prefix="$"
                allowNegativeValue={false}
                onValueChange={(value, name) => {
                  setValue('investment_amount', value ? Number(value) : 0, { shouldValidate: true })
                }}
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
                className={getFieldClasses('instrument')}
              >
                <option value="">Select instrument...</option>
                <option value="safe_post">SAFE (Post-Money)</option>
                <option value="safe_pre">SAFE (Pre-Money)</option>
                <option value="convertible_note">Convertible Note</option>
                <option value="equity">Priced Equity</option>
              </select>
              <ErrorDisplay fieldName="instrument" />
            </div>

            {/* 5. Round/Stage */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Stage at Investment *
              </label>
              <select
                {...register('stage_at_investment')}
                className={getFieldClasses('stage_at_investment')}
              >
                <option value="">Select stage...</option>
                <option value="pre_seed">Pre-Seed</option>
                <option value="seed">Seed</option>
              </select>
              <ErrorDisplay fieldName="stage_at_investment" />
            </div>

            {/* 6. Round Size */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Round Size (USD) *
              </label>
              <CurrencyInput
                name="round_size_usd"
                value={roundSize || ''}
                className={getFieldClasses('round_size_usd')}
                placeholder="e.g. 1,000,000"
                decimalsLimit={0}
                prefix="$"
                allowNegativeValue={false}
                onValueChange={(value, name) => {
                  setValue('round_size_usd', value ? Number(value) : 0, { shouldValidate: true })
                }}
              />
              <ErrorDisplay fieldName="round_size_usd" />
            </div>

            {/* 7. Conversion Cap (SAFE/Note) OR Post-Money Valuation (Equity) */}
            {isSafeOrNote && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Conversion Cap (USD){conditionalReqs.isConversionCapRequired ? ' *' : ''}
                  </label>
                  <CurrencyInput
                    name="conversion_cap_usd"
                    value={conversionCap || ''}
                    className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                      errors.conversion_cap_usd || customErrors.conversion_cap_usd ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="e.g. 5,000,000"
                    decimalsLimit={0}
                    prefix="$"
                    allowNegativeValue={false}
                    onValueChange={(value, name) => {
                      setValue('conversion_cap_usd', value ? Number(value) : 0, { shouldValidate: true })
                    }}
                  />
                  <ErrorDisplay fieldName="conversion_cap_usd" />
                </div>

                {/* 8. Discount (SAFE/Note) */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Discount (%){conditionalReqs.isDiscountRequired ? ' *' : ''}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      {...register('discount_percent', { valueAsNumber: true })}
                      className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                        errors.discount_percent || customErrors.discount_percent ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="e.g. 20"
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
                  Post-Money Valuation (USD){conditionalReqs.isPostMoneyRequired ? ' *' : ''}
                </label>
                <CurrencyInput
                  name="post_money_valuation"
                  value={postMoneyValuation || ''}
                  className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                    errors.post_money_valuation || customErrors.post_money_valuation ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="e.g. 10,000,000"
                  decimalsLimit={0}
                  prefix="$"
                  allowNegativeValue={false}
                  onValueChange={(value, name) => {
                    setValue('post_money_valuation', value ? Number(value) : 0, { shouldValidate: true })
                  }}
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
                className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                  errors.co_investors || customErrors.co_investors ? 'border-red-500' : 'border-gray-600'
                }`}
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
                  errors.country_of_incorp || customErrors.country_of_incorp ? 'border-red-500' : 'border-gray-600'
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
                  errors.incorporation_type || customErrors.incorporation_type ? 'border-red-500' : 'border-gray-600'
                }`}
              >
                <option value="">Select type...</option>
                <option value="c_corp">C Corporation</option>
                <option value="s_corp">S Corporation</option>
                <option value="llc">Limited Liability Company</option>
                <option value="bcorp">Public Benefit Corporation</option>
                <option value="gmbh">GmbH</option>
                <option value="ltd">Limited Company</option>
                <option value="plc">Public Limited Company</option>
                <option value="other">Other</option>
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
                className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                  errors.founder_name || customErrors.founder_name ? 'border-red-500' : 'border-gray-600'
                }`}
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
                className={getFieldClasses('fund')}
              >
                <option value="fund_i">Fund I</option>
                <option value="fund_ii">Fund II</option>
                <option value="fund_iii">Fund III</option>
              </select>
              <ErrorDisplay fieldName="fund" />
            </div>

            {/* 16. Company Status */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Company Status
                <span className="text-xs text-gray-500 ml-1">(Auto-set)</span>
              </label>
              <select
                {...register('status')}
                disabled={true}
                className={`w-full px-3 py-2 bg-gray-800 border rounded text-platinum-mist cursor-not-allowed ${
                  errors.status || customErrors.status ? 'border-red-500' : 'border-gray-600'
                }`}
              >
                <option value="active">Active</option>
                <option value="acquihired">Acquihired</option>
                <option value="exited">Exited</option>
                <option value="dead">Dead</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                New investments are automatically set to "Active"
              </p>
            </div>
          </div>

          {/* 11. Reason for Investing */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Reason for Investing *
            </label>
                          <textarea
              {...register('reason_for_investing')}
              className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                errors.reason_for_investing || customErrors.reason_for_investing ? 'border-red-500' : 'border-gray-600'
              }`}
              rows={4}
              placeholder="Why this investment fits our thesis and strategy..."
            />
            <ErrorDisplay fieldName="reason_for_investing" />
          </div>

          {/* 15. Company Description */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Company Description *
            </label>
                          <textarea
              {...register('description_raw')}
              className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                errors.description_raw || customErrors.description_raw ? 'border-red-500' : 'border-gray-600'
              }`}
              rows={4}
              placeholder="Detailed description of what the company does, their product/service, target market, and business model..."
            />
            <ErrorDisplay fieldName="description_raw" />
          </div>
        </div>
      </div>

      {/* Right side: Quick-Paste Panel */}
      <div className="space-y-6">
        <QuickPastePanel onParseComplete={onQuickPasteComplete} />
      </div>
    </div>
  )
} 