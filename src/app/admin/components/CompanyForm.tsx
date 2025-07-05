'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { companySchema, type CompanyFormValues, prepareFormDataForValidation } from '../schemas/companySchema'
import { countries } from '../../../lib/countries'
import { useState, useEffect } from 'react'
import CurrencyInput from 'react-currency-input-field'

interface CompanyFormProps {
  company?: CompanyFormValues | null
  onSave: (data: CompanyFormValues) => void
  onCancel: () => void
  title?: string
  submitLabel?: string
  showActions?: boolean
}

export default function CompanyForm({ 
  company, 
  onSave, 
  onCancel,
  title,
  submitLabel = 'Save Company',
  showActions = true
}: CompanyFormProps) {
  const [saving, setSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})
  
  // Local state for currency fields to handle TypeScript types properly
  const [roundSizeValue, setRoundSizeValue] = useState<number>(0)
  const [conversionCapValue, setConversionCapValue] = useState<number>(0)
  const [postMoneyValue, setPostMoneyValue] = useState<number>(0)

  const { register, watch, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(companySchema),
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
  const isSafeOrNote = ['safe_pre', 'safe_post', 'convertible_note'].includes(instrument ?? '')
  const isEquity = instrument === 'equity'

  // Sync local state with form values
  useEffect(() => {
    const formRoundSize = watch('round_size_usd')
    if (typeof formRoundSize === 'number') {
      setRoundSizeValue(formRoundSize)
    }
  }, [watch('round_size_usd')])

  useEffect(() => {
    const formConversionCap = watch('conversion_cap_usd')
    if (typeof formConversionCap === 'number') {
      setConversionCapValue(formConversionCap)
    }
  }, [watch('conversion_cap_usd')])

  useEffect(() => {
    const formPostMoney = watch('post_money_valuation')
    if (typeof formPostMoney === 'number') {
      setPostMoneyValue(formPostMoney)
    }
  }, [watch('post_money_valuation')])

  const onSubmit = async (data: any) => {
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

      await onSave(validationResult.data)
    } catch (error) {
      console.error('Error saving company:', error)
    } finally {
      setSaving(false)
    }
  }

  const ErrorDisplay = ({ fieldName }: { fieldName: string }) => {
    if (!validationErrors[fieldName]) return null
    
    return (
      <div className="text-red-400 text-xs mt-1">
        {validationErrors[fieldName].map((error: string, index: number) => (
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
                className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
                  validationErrors.slug ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="e.g. your-company"
              />
              <ErrorDisplay fieldName="slug" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Website URL
              </label>
              <input
                type="url"
                {...register('website_url')}
                className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                placeholder="https://example.com"
              />
              <ErrorDisplay fieldName="website_url" />
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
          </div>
        </div>

        {/* ≡≡≡ NEW FIELDS SECTION ≡≡≡ */}
        <div className="border border-gray-600 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-platinum-mist mb-4 flex items-center gap-2">
            🚀 New Investment Fields
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* NEW FIELD: Round Size */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Round Size (USD)
              </label>
              <CurrencyInput
                name="round_size_usd"
                prefix="$"
                value={roundSizeValue}
                onValueChange={(value, name, values) => {
                  const numValue = values?.float ?? 0
                  setRoundSizeValue(numValue)
                  setValue('round_size_usd', (numValue > 0 ? numValue : undefined) as any, { shouldValidate: true })
                }}
                decimalsLimit={2}
                className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                placeholder="e.g. $1,000,000"
              />
              <ErrorDisplay fieldName="round_size_usd" />
            </div>

            {/* NEW FIELD: Pro-rata Rights */}
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

            {/* Conditional fields based on instrument */}
            {isSafeOrNote && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Conversion Cap (USD)
                  </label>
                  <CurrencyInput
                    name="conversion_cap_usd"
                    prefix="$"
                    value={conversionCapValue}
                                         onValueChange={(value, name, values) => {
                       const numValue = values?.float ?? 0
                       setConversionCapValue(numValue)
                       setValue('conversion_cap_usd', (numValue > 0 ? numValue : undefined) as any, { shouldValidate: true })
                     }}
                    decimalsLimit={2}
                    className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                    placeholder="e.g. $10,000,000"
                  />
                  <ErrorDisplay fieldName="conversion_cap_usd" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Discount %
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

            {isEquity && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Post-Money Valuation ($)
                </label>
                <CurrencyInput
                  name="post_money_valuation"
                  prefix="$"
                  value={postMoneyValue}
                                     onValueChange={(value, name, values) => {
                     const numValue = values?.float ?? 0
                     setPostMoneyValue(numValue)
                     setValue('post_money_valuation', (numValue > 0 ? numValue : undefined) as any, { shouldValidate: true })
                   }}
                  decimalsLimit={2}
                  className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
                  placeholder="e.g. $5,000,000"
                />
                <ErrorDisplay fieldName="post_money_valuation" />
              </div>
            )}

            {/* NEW FIELD: Country of Incorporation */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Country of Incorporation
              </label>
              <select
                {...register('country_of_incorp')}
                className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
              >
                <option value="">— Select country —</option>
                {countries.map((c: { code: string; name: string }) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ErrorDisplay fieldName="country_of_incorp" />
            </div>

            {/* NEW FIELD: Incorporation Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Incorporation Type
              </label>
              <select
                {...register('incorporation_type')}
                className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
              >
                <option value="">— Select type —</option>
                <option value="c_corp">C Corp</option>
                <option value="s_corp">S Corp</option>
                <option value="llc">LLC</option>
                <option value="bcorp">B-Corp (PBC)</option>
                <option value="gmbh">GmbH</option>
                <option value="ltd">Ltd</option>
                <option value="plc">PLC</option>
                <option value="other">Other</option>
              </select>
              <ErrorDisplay fieldName="incorporation_type" />
            </div>
          </div>

          {/* NEW FIELD: Reason for Investing */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Reason for Investing
            </label>
            <textarea
              {...register('reason_for_investing')}
              className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
              rows={6}
              placeholder="Why this deal fits the thesis..."
            />
            <ErrorDisplay fieldName="reason_for_investing" />
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